import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "@/server/database/connection";
import { ApplicantType } from "@/server/auth";

// ============================================================
// TYPES
// ============================================================

export interface BatchProjectInfo {
    id: number;
    title: string;
    description: string;
    targetType: ApplicantType;
    status: "ACTIVE" | "CLOSED" | "DRAFT";
}

export interface ModuleRecord {
    id: number;
    projectId: number;
    name: string;
    description: string | null;
    requiredSkills: string | null;
}

export interface EligibleCandidateRecord {
    applicationId: number;
    userId: number;
    fullName: string;
    email: string;
    phone: string | null;
    collegeDetails: string | null;
    score: number;
    confidencePercentage: number;
    resumeText: string;
}

export interface ConfirmedMemberInput {
    userId: number;
    applicationId: number;
    moduleId: number;
}

export interface ConfirmedTeamInput {
    name: string;
    members: ConfirmedMemberInput[];
}

export interface TeamMemberDetails {
    id: number;
    userId: number;
    applicationId: number;
    fullName: string;
    email: string;
    moduleId: number;
    moduleName: string;
    assignedAt: string;
}

export interface ConfirmedTeamDetails {
    id: number;
    projectId: number;
    name: string;
    createdAt: string;
    members: TeamMemberDetails[];
}

export interface CandidateBatchAssignmentResult {
    projectId: number;
    projectTitle: string;
    projectDescription: string;
    teamId: number;
    teamName: string;
    module: {
        id: number;
        name: string;
        description: string | null;
        requiredSkills: string | null;
    };
    teammates: {
        userId: number;
        fullName: string;
        moduleName: string;
    }[];
}

// ============================================================
// GET PROJECT INFO & MODULES
// ============================================================

export async function getBatchProjectWithModules(projectId: number): Promise<{
    project: BatchProjectInfo | null;
    modules: ModuleRecord[];
}> {
    const [projectRows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            id,
            title,
            description,
            target_type,
            status
        FROM projects
        WHERE id = ?
        LIMIT 1
        `,
        [projectId]
    );

    if (!Array.isArray(projectRows) || projectRows.length === 0) {
        return { project: null, modules: [] };
    }

    const row = projectRows[0] as {
        id: number;
        title: string;
        description: string;
        target_type: ApplicantType;
        status: "ACTIVE" | "CLOSED" | "DRAFT";
    };

    const project: BatchProjectInfo = {
        id: row.id,
        title: row.title,
        description: row.description,
        targetType: row.target_type,
        status: row.status,
    };

    const [moduleRows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            id,
            project_id,
            name,
            description,
            required_skills
        FROM project_modules
        WHERE project_id = ?
        ORDER BY id ASC
        `,
        [projectId]
    );

    const modules: ModuleRecord[] = (moduleRows as any[]).map((m) => ({
        id: m.id,
        projectId: m.project_id,
        name: m.name,
        description: m.description,
        requiredSkills: m.required_skills,
    }));

    return { project, modules };
}

// ============================================================
// GET ELIGIBLE BATCH CANDIDATES
//
// ONLY returns candidates who meet ALL criteria:
// - project_id = target project
// - applicant_type = 'BATCH_INTERN'
// - status = 'SELECTED'
//
// APPLIED, SHORTLISTED, INTERVIEW_SCHEDULED, REJECTED candidates
// are strictly excluded.
// ============================================================

export async function getEligibleBatchCandidates(
    projectId: number
): Promise<EligibleCandidateRecord[]> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            a.id AS application_id,
            a.user_id,
            a.score,
            a.confidence_percentage,
            u.full_name,
            u.email,
            u.phone,
            u.college_details,
            COALESCE(r.extracted_text, '') AS resume_text
        FROM applications a
        INNER JOIN users u ON a.user_id = u.id
        LEFT JOIN resumes r ON a.id = r.application_id
        WHERE a.project_id = ?
          AND a.applicant_type = 'BATCH_INTERN'
          AND a.status = 'SELECTED'
        ORDER BY a.score DESC, a.confidence_percentage DESC, a.id ASC
        `,
        [projectId]
    );

    return (rows as any[]).map((row) => ({
        applicationId: Number(row.application_id),
        userId: Number(row.user_id),
        fullName: row.full_name,
        email: row.email,
        phone: row.phone ?? null,
        collegeDetails: row.college_details ?? null,
        score: Number(row.score || 0),
        confidencePercentage: Number(row.confidence_percentage || 0),
        resumeText: row.resume_text || "",
    }));
}

// ============================================================
// GET EXISTING TEAMS WITH MEMBERS
// ============================================================

export async function getExistingTeamsWithMembers(
    projectId: number
): Promise<ConfirmedTeamDetails[]> {
    const [teamRows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            id,
            project_id,
            name,
            created_at
        FROM teams
        WHERE project_id = ?
        ORDER BY id ASC
        `,
        [projectId]
    );

    if (!Array.isArray(teamRows) || teamRows.length === 0) {
        return [];
    }

    const teamIds = teamRows.map((t: any) => t.id);

    const [memberRows] = await db.query<RowDataPacket[]>(
        `
        SELECT
            tm.id,
            tm.team_id,
            tm.user_id,
            tm.application_id,
            tm.project_module_id,
            tm.assigned_at,
            u.full_name,
            u.email,
            pm.name AS module_name
        FROM team_members tm
        INNER JOIN users u ON tm.user_id = u.id
        INNER JOIN project_modules pm ON tm.project_module_id = pm.id
        WHERE tm.team_id IN (?)
        ORDER BY tm.id ASC
        `,
        [teamIds]
    );

    const membersByTeam: Record<number, TeamMemberDetails[]> = {};
    for (const row of memberRows as any[]) {
        if (!membersByTeam[row.team_id]) {
            membersByTeam[row.team_id] = [];
        }
        membersByTeam[row.team_id].push({
            id: Number(row.id),
            userId: Number(row.user_id),
            applicationId: Number(row.application_id),
            fullName: row.full_name,
            email: row.email,
            moduleId: Number(row.project_module_id),
            moduleName: row.module_name,
            assignedAt: row.assigned_at instanceof Date ? row.assigned_at.toISOString() : String(row.assigned_at),
        });
    }

    return (teamRows as any[]).map((t) => ({
        id: Number(t.id),
        projectId: Number(t.project_id),
        name: t.name,
        createdAt: t.created_at instanceof Date ? t.created_at.toISOString() : String(t.created_at),
        members: membersByTeam[t.id] || [],
    }));
}

// ============================================================
// SAVE CONFIRMED ALLOCATION (TRANSACTIONAL)
// ============================================================

export async function saveConfirmedAllocation(
    projectId: number,
    teams: ConfirmedTeamInput[]
): Promise<{ success: boolean; createdTeamsCount: number; assignedMembersCount: number }> {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Fetch and verify project
        const [projRows] = await connection.execute<RowDataPacket[]>(
            `SELECT id, title, target_type, status FROM projects WHERE id = ? LIMIT 1`,
            [projectId]
        );

        if (!Array.isArray(projRows) || projRows.length === 0) {
            throw new Error(`Project #${projectId} not found.`);
        }
        const projectRecord = projRows[0] as { id: number; title: string; target_type: string; status: string };

        if (projectRecord.target_type !== "BATCH_INTERN") {
            throw new Error(`Project #${projectId} is not a BATCH_INTERN project.`);
        }

        // 2. Collect all candidates and modules to be assigned
        const allCandidates = teams.flatMap((t) => t.members);
        if (allCandidates.length === 0) {
            throw new Error("Cannot confirm an empty allocation with 0 candidates.");
        }

        const candidateUserIds = allCandidates.map((m) => m.userId);
        const applicationIds = allCandidates.map((m) => m.applicationId);
        const moduleIds = Array.from(new Set(allCandidates.map((m) => m.moduleId)));

        // Check for duplicate candidates in request
        const uniqueUserIds = new Set(candidateUserIds);
        if (uniqueUserIds.size !== candidateUserIds.length) {
            throw new Error("Duplicate candidate detected across team assignments.");
        }
        const uniqueAppIds = new Set(applicationIds);
        if (uniqueAppIds.size !== applicationIds.length) {
            throw new Error("Duplicate application detected across team assignments.");
        }

        // 3. Verify all candidates belong to this project, are BATCH_INTERN, and are SELECTED
        const [validApps] = await connection.query<RowDataPacket[]>(
            `
            SELECT id, user_id, status, applicant_type, project_id
            FROM applications
            WHERE id IN (?)
            `,
            [applicationIds]
        );

        const validAppMap = new Map<number, { id: number; user_id: number; status: string; applicant_type: string; project_id: number }>();
        for (const app of validApps as any[]) {
            validAppMap.set(Number(app.id), {
                id: Number(app.id),
                user_id: Number(app.user_id),
                status: app.status,
                applicant_type: app.applicant_type,
                project_id: Number(app.project_id),
            });
        }

        for (const m of allCandidates) {
            const app = validAppMap.get(m.applicationId);
            if (!app) {
                throw new Error(`Application #${m.applicationId} does not exist.`);
            }
            if (app.project_id !== projectId) {
                throw new Error(`Application #${m.applicationId} does not belong to project #${projectId}.`);
            }
            if (app.user_id !== m.userId) {
                throw new Error(`Application #${m.applicationId} user mismatch.`);
            }
            if (app.applicant_type !== "BATCH_INTERN") {
                throw new Error(`Application #${m.applicationId} is not for BATCH_INTERN.`);
            }
            if (app.status !== "SELECTED") {
                throw new Error(
                    `Application #${m.applicationId} has status '${app.status}'. Only SELECTED candidates can be allocated to teams.`
                );
            }
        }

        // 4. Verify all modules belong to this project
        const [validMods] = await connection.query<RowDataPacket[]>(
            `
            SELECT id, name, project_id
            FROM project_modules
            WHERE id IN (?)
            `,
            [moduleIds]
        );

        const validModMap = new Map<number, string>();
        for (const mod of validMods as any[]) {
            if (Number(mod.project_id) !== projectId) {
                throw new Error(`Module #${mod.id} does not belong to project #${projectId}.`);
            }
            validModMap.set(Number(mod.id), mod.name);
        }

        for (const m of allCandidates) {
            if (!validModMap.has(m.moduleId)) {
                throw new Error(`Module #${m.moduleId} is invalid for project #${projectId}.`);
            }
        }

        // 5. Remove existing teams & memberships for this project (atomic re-allocation)
        const [existingTeams] = await connection.execute<RowDataPacket[]>(
            `SELECT id FROM teams WHERE project_id = ?`,
            [projectId]
        );

        if (Array.isArray(existingTeams) && existingTeams.length > 0) {
            const existingTeamIds = existingTeams.map((t: any) => t.id);
            await connection.query(
                `DELETE FROM team_members WHERE team_id IN (?)`,
                [existingTeamIds]
            );
            await connection.execute(
                `DELETE FROM teams WHERE project_id = ?`,
                [projectId]
            );
        }

        // 6. Insert new teams and their members
        let totalAssignedMembers = 0;

        for (const teamInput of teams) {
            const [teamInsertResult] = await connection.execute<ResultSetHeader>(
                `
                INSERT INTO teams (project_id, name, created_at, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
                `,
                [projectId, teamInput.name.trim()]
            );

            const newTeamId = teamInsertResult.insertId;

            for (const member of teamInput.members) {
                await connection.execute(
                    `
                    INSERT INTO team_members
                    (team_id, user_id, application_id, project_module_id, assigned_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(3))
                    `,
                    [newTeamId, member.userId, member.applicationId, member.moduleId]
                );

                totalAssignedMembers++;

                // 7. Insert notification for candidate
                const moduleName = validModMap.get(member.moduleId) || "Primary Module";
                await connection.execute(
                    `
                    INSERT INTO notifications
                    (recipient_user_id, type, title, message, reference_id, reference_type, is_read, created_at)
                    VALUES (?, 'BATCH_TEAM_ASSIGNED', ?, ?, ?, 'TEAM', 0, CURRENT_TIMESTAMP(3))
                    `,
                    [
                        member.userId,
                        "Batch Team Assignment Finalized 🎉",
                        `You have been assigned to ${teamInput.name.trim()} for "${projectRecord.title}". Primary Module: ${moduleName}.`,
                        newTeamId,
                    ]
                );
            }
        }

        await connection.commit();

        return {
            success: true,
            createdTeamsCount: teams.length,
            assignedMembersCount: totalAssignedMembers,
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// ============================================================
// GET CANDIDATE BATCH TEAM ASSIGNMENT
// ============================================================

export async function getCandidateBatchTeamAssignment(
    userId: number
): Promise<CandidateBatchAssignmentResult | null> {
    const [membershipRows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            tm.team_id,
            t.name AS team_name,
            p.id AS project_id,
            p.title AS project_title,
            p.description AS project_description,
            pm.id AS module_id,
            pm.name AS module_name,
            pm.description AS module_description,
            pm.required_skills AS module_required_skills
        FROM team_members tm
        INNER JOIN teams t ON tm.team_id = t.id
        INNER JOIN projects p ON t.project_id = p.id
        INNER JOIN project_modules pm ON tm.project_module_id = pm.id
        WHERE tm.user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    if (!Array.isArray(membershipRows) || membershipRows.length === 0) {
        return null;
    }

    const row = membershipRows[0] as any;

    // Fetch teammates on the same team
    const [teammateRows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            tm.user_id,
            u.full_name,
            pm.name AS module_name
        FROM team_members tm
        INNER JOIN users u ON tm.user_id = u.id
        INNER JOIN project_modules pm ON tm.project_module_id = pm.id
        WHERE tm.team_id = ?
          AND tm.user_id != ?
        ORDER BY u.full_name ASC
        `,
        [row.team_id, userId]
    );

    return {
        projectId: Number(row.project_id),
        projectTitle: row.project_title,
        projectDescription: row.project_description,
        teamId: Number(row.team_id),
        teamName: row.team_name,
        module: {
            id: Number(row.module_id),
            name: row.module_name,
            description: row.module_description,
            requiredSkills: row.module_required_skills,
        },
        teammates: (teammateRows as any[]).map((t) => ({
            userId: Number(t.user_id),
            fullName: t.full_name,
            moduleName: t.module_name,
        })),
    };
}
