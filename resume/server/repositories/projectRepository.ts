import { RowDataPacket } from "mysql2/promise";
import { db } from "@/server/database/connection";
import { ApplicantType } from "@/server/auth";

// ============================================================
// TYPES
// ============================================================

export type ProjectStatus = "ACTIVE" | "CLOSED" | "DRAFT";

export interface PublicProjectKeyword {
    id: number;
    projectId: number;
    keyword: string;
    weight: number;
}

export interface PublicProjectModule {
    id: number;
    projectId: number;
    name: string;
    description: string | null;
    requiredSkills: string | null;
}

export interface PublicProject {
    id: number;
    title: string;
    description: string;
    targetType: ApplicantType;
    status: ProjectStatus;
    createdAt: string;
    keywords: PublicProjectKeyword[];
    modules: PublicProjectModule[];
}

interface ProjectDbRow extends RowDataPacket {
    id: number;
    title: string;
    description: string;
    target_type: ApplicantType;
    status: ProjectStatus;
    created_at: Date | string;
}

interface KeywordDbRow extends RowDataPacket {
    id: number;
    project_id: number;
    keyword: string;
    weight: number;
}

interface ModuleDbRow extends RowDataPacket {
    id: number;
    project_id: number;
    name: string;
    description: string | null;
    required_skills: string | null;
}

// ============================================================
// FETCH ALL ACTIVE PUBLIC PROJECTS
// ============================================================

export async function findPublicProjects(
    targetType?: ApplicantType | "ALL"
): Promise<PublicProject[]> {
    const values: string[] = [];
    let query = `
        SELECT
            id,
            title,
            description,
            target_type,
            status,
            created_at
        FROM projects
        WHERE status = 'ACTIVE'
    `;

    if (targetType && targetType !== "ALL") {
        query += " AND (target_type = ? OR UPPER(TRIM(target_type)) = UPPER(TRIM(?)))";
        values.push(targetType, targetType);
    }

    query += " ORDER BY created_at DESC";

    const [projectRows] = values.length > 0
        ? await db.execute<ProjectDbRow[]>(query, values)
        : await db.execute<ProjectDbRow[]>(query);

    if (projectRows.length === 0) {
        return [];
    }

    const projectIds = projectRows.map((p) => p.id);

    // Fetch associated keywords
    const [keywordRows] = await db.query<KeywordDbRow[]>(
        `
        SELECT
            id,
            project_id,
            keyword,
            weight
        FROM project_keywords
        WHERE project_id IN (?)
        ORDER BY weight DESC, id ASC
        `,
        [projectIds]
    );

    // Fetch associated modules
    const [moduleRows] = await db.query<ModuleDbRow[]>(
        `
        SELECT
            id,
            project_id,
            name,
            description,
            required_skills
        FROM project_modules
        WHERE project_id IN (?)
        ORDER BY id ASC
        `,
        [projectIds]
    );

    return projectRows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        targetType: row.target_type,
        status: row.status,
        createdAt:
            row.created_at instanceof Date
                ? row.created_at.toISOString()
                : String(row.created_at),
        keywords: keywordRows
            .filter((k) => k.project_id === row.id)
            .map((k) => ({
                id: k.id,
                projectId: k.project_id,
                keyword: k.keyword,
                weight: k.weight,
            })),
        modules: moduleRows
            .filter((m) => m.project_id === row.id)
            .map((m) => ({
                id: m.id,
                projectId: m.project_id,
                name: m.name,
                description: m.description,
                requiredSkills: m.required_skills,
            })),
    }));
}

// ============================================================
// FETCH SINGLE ACTIVE PUBLIC PROJECT BY ID
// ============================================================

export async function findPublicProjectById(
    id: number
): Promise<PublicProject | null> {
    const [projectRows] = await db.execute<ProjectDbRow[]>(
        `
        SELECT
            id,
            title,
            description,
            target_type,
            status,
            created_at
        FROM projects
        WHERE id = ? AND status = 'ACTIVE'
        LIMIT 1
        `,
        [id]
    );

    if (projectRows.length === 0) {
        return null;
    }

    const row = projectRows[0];

    const [keywordRows] = await db.execute<KeywordDbRow[]>(
        `
        SELECT
            id,
            project_id,
            keyword,
            weight
        FROM project_keywords
        WHERE project_id = ?
        ORDER BY weight DESC, id ASC
        `,
        [id]
    );

    const [moduleRows] = await db.execute<ModuleDbRow[]>(
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
        [id]
    );

    return {
        id: row.id,
        title: row.title,
        description: row.description,
        targetType: row.target_type,
        status: row.status,
        createdAt:
            row.created_at instanceof Date
                ? row.created_at.toISOString()
                : String(row.created_at),
        keywords: keywordRows.map((k) => ({
            id: k.id,
            projectId: k.project_id,
            keyword: k.keyword,
            weight: k.weight,
        })),
        modules: moduleRows.map((m) => ({
            id: m.id,
            projectId: m.project_id,
            name: m.name,
            description: m.description,
            requiredSkills: m.required_skills,
        })),
    };
}
