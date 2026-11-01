// app/api/candidate/projects/route.ts

import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import { db } from "@/server/database/connection";
import { findUserById } from "@/server/repositories/userRepository";

export const runtime = "nodejs";

// ============================================================
// GET AVAILABLE PROJECTS FOR CURRENT CANDIDATE APPLICANT TYPE
// ============================================================

export async function GET() {
    try {
        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authenticated." },
                { status: 401 }
            );
        }

        if (session.role !== "CANDIDATE") {
            return NextResponse.json(
                { success: false, error: "Only candidates can view candidate projects." },
                { status: 403 }
            );
        }

        // Get live candidate applicant_type from database
        const candidate = await findUserById(session.userId);

        if (!candidate) {
            return NextResponse.json(
                { success: false, error: "Candidate not found." },
                { status: 404 }
            );
        }

        const candidateApplicantType = candidate.applicant_type;

        // --------------------------------------------------------
        // 1. Fetch active projects matching candidate's current applicant type
        // --------------------------------------------------------

        const [projectRows] = await db.query(
            `
            SELECT
                id,
                title,
                description,
                target_type AS targetType,
                status,
                created_at AS createdAt
            FROM projects
            WHERE status = 'ACTIVE'
              AND (
                target_type = ?
                OR UPPER(TRIM(target_type)) = UPPER(TRIM(?))
              )
            ORDER BY created_at DESC
            `,
            [candidateApplicantType, candidateApplicantType]
        );

        const projectList = projectRows as {
            id: number;
            title: string;
            description: string;
            targetType: string;
            status: string;
            createdAt: string;
        }[];

        if (projectList.length === 0) {
            return NextResponse.json({
                success: true,
                projects: [],
                applicantType: candidateApplicantType,
            });
        }

        // --------------------------------------------------------
        // 2. Fetch keywords for active matching projects
        // --------------------------------------------------------

        const projectIds = projectList.map((p) => p.id);

        const [keywordRows] = await db.query(
            `
            SELECT
                id,
                project_id AS projectId,
                keyword,
                weight
            FROM project_keywords
            WHERE project_id IN (?)
            ORDER BY weight DESC
            `,
            [projectIds]
        );

        // --------------------------------------------------------
        // 3. Fetch modules for active matching projects
        // --------------------------------------------------------

        const [moduleRows] = await db.query(
            `
            SELECT
                id,
                project_id AS projectId,
                name
            FROM project_modules
            WHERE project_id IN (?)
            `,
            [projectIds]
        );

        // --------------------------------------------------------
        // 4. Build project response
        // --------------------------------------------------------

        const keywords = keywordRows as {
            id: number;
            projectId: number;
            keyword: string;
            weight: number;
        }[];

        const modules = moduleRows as {
            id: number;
            projectId: number;
            name: string;
        }[];

        const projects = projectList.map((project) => ({
            ...project,
            keywords: keywords.filter((k) => k.projectId === project.id),
            modules: modules.filter((m) => m.projectId === project.id),
        }));

        // --------------------------------------------------------
        // 5. Return JSON
        // --------------------------------------------------------

        return NextResponse.json({
            success: true,
            projects,
            applicantType: candidateApplicantType,
        });

    } catch (error) {
        console.error("GET /api/candidate/projects error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch available projects.",
            },
            {
                status: 500,
            }
        );
    }
}