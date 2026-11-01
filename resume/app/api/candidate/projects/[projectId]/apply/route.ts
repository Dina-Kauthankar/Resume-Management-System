import { NextResponse } from "next/server";

import { getAuthSession } from "@/server/auth";
import { db } from "@/server/database/connection";

// ============================================================
// GET APPLICATION DATA
// GET /api/candidate/projects/[projectId]/apply
// ============================================================

export async function GET(
    request: Request,
    {
        params,
    }: {
        params: Promise<{ projectId: string }>;
    }
) {
    try {
        // ====================================================
        // 1. CHECK AUTHENTICATION
        // ====================================================

        const session = await getAuthSession();

        console.log("====================================");
        console.log(
            "API: /api/candidate/projects/[projectId]/apply"
        );
        console.log("AUTH SESSION:", session);
        console.log("====================================");

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Not authenticated",
                },
                {
                    status: 401,
                }
            );
        }

        // ====================================================
        // 2. GET PROJECT ID
        // ====================================================

        const { projectId } = await params;

        const projectIdNumber = Number(projectId);

        // ====================================================
        // 3. VALIDATE PROJECT ID
        // ====================================================

        if (
            !Number.isInteger(projectIdNumber) ||
            projectIdNumber <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid project ID",
                },
                {
                    status: 400,
                }
            );
        }

        // ====================================================
        // 4. FETCH PROJECT
        // ====================================================

        const [projectRows] = await db.query(
            `
            SELECT
                id,
                title,
                target_type AS targetType,
                status
            FROM projects
            WHERE id = ?
            LIMIT 1
            `,
            [projectIdNumber]
        );

        const projectResult =
            (projectRows as any[])[0];

        // ====================================================
        // 5. PROJECT NOT FOUND
        // ====================================================

        if (!projectResult) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Project not found",
                },
                {
                    status: 404,
                }
            );
        }

        // ====================================================
        // 6. ONLY ACTIVE PROJECTS
        // ====================================================

        if (projectResult.status !== "ACTIVE") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Project is not active",
                },
                {
                    status: 404,
                }
            );
        }

        // ====================================================
        // 7. FETCH PROJECT KEYWORDS
        // ====================================================

        const [keywordRows] = await db.query(
            `
            SELECT
                id,
                project_id AS projectId,
                keyword,
                weight
            FROM project_keywords
            WHERE project_id = ?
            ORDER BY weight DESC
            `,
            [projectIdNumber]
        );

        // ====================================================
        // 8. FETCH PROJECT MODULES
        // ====================================================

        const [moduleRows] = await db.query(
            `
            SELECT
                id,
                project_id AS projectId,
                name,
                description,
                required_skills AS requiredSkills,
                created_at AS createdAt
            FROM project_modules
            WHERE project_id = ?
            ORDER BY created_at ASC
            `,
            [projectIdNumber]
        );

        // ====================================================
        // 9. NORMALIZE MODULE DATA
        //
        // ApplicationForm expects:
        //
        // description: string | null
        // requiredSkills: string | null
        //
        // So convert undefined to null.
        // ====================================================

        const modules = (moduleRows as any[]).map(
            (module) => ({
                id: module.id,
                projectId: module.projectId,
                name: module.name,
                description:
                    module.description ?? null,
                requiredSkills:
                    module.requiredSkills ?? null,
                createdAt:
                    module.createdAt ?? null,
            })
        );

        // ====================================================
        // 10. FETCH CANDIDATE
        // ====================================================

        const [candidateRows] = await db.query(
            `
            SELECT
                id,
                full_name AS fullName,
                email,
                phone,
                college_details AS collegeDetails,
                applicant_type AS applicantType
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [session.userId]
        );

        const candidateResult =
            (candidateRows as any[])[0];

        // ====================================================
        // 11. CANDIDATE NOT FOUND
        // ====================================================

        if (!candidateResult) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Candidate not found",
                },
                {
                    status: 404,
                }
            );
        }

        // ====================================================
        // 11B. CHECK APPLICANT TYPE
        // ====================================================

        if (candidateResult.applicantType !== projectResult.targetType) {
            return NextResponse.json(
                {
                    success: false,
                    error: `This project is only available for ${projectResult.targetType.replaceAll("_", " ")} applicants.`,
                },
                {
                    status: 403,
                }
            );
        }

        // ====================================================
        // 12. CHECK EXISTING APPLICATION
        // ====================================================

        const [applicationRows] = await db.query(
            `
            SELECT
                id,
                status
            FROM applications
            WHERE user_id = ?
              AND project_id = ?
            LIMIT 1
            `,
            [
                session.userId,
                projectIdNumber,
            ]
        );

        const applicationResult =
            (applicationRows as any[])[0];

        const existingApplication =
            applicationResult
                ? {
                      id: applicationResult.id,
                      status: applicationResult.status,
                  }
                : null;

        // ====================================================
        // 13. BUILD PROJECT
        // ====================================================

        const project = {
            id: projectResult.id,
            title: projectResult.title,
            targetType: projectResult.targetType,

            keywords:
                keywordRows as any[],

            modules,
        };

        // ====================================================
        // 14. BUILD CANDIDATE
        // ====================================================

        const candidate = {
            id: candidateResult.id,

            fullName:
                candidateResult.fullName,

            email:
                candidateResult.email,

            phone:
                candidateResult.phone ?? null,

            collegeDetails:
                candidateResult.collegeDetails ?? null,

            applicantType:
                candidateResult.applicantType,
        };

        // ====================================================
        // 15. RETURN RESPONSE
        // ====================================================

        return NextResponse.json(
            {
                success: true,

                project,

                candidate,

                existingApplication,
            },
            {
                status: 200,
            }
        );

    } catch (error) {

        // ====================================================
        // 16. ERROR HANDLING
        // ====================================================

        console.error(
            "GET /api/candidate/projects/[projectId]/apply error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    "Failed to load application data",
            },
            {
                status: 500,
            }
        );
    }
}