// app/api/candidate/projects/[projectId]/route.ts

import { NextResponse } from "next/server";

import { getAuthSession } from "@/server/auth";
import { db } from "@/server/database/connection";


// GET /api/candidate/projects/[projectId]

export async function GET(
    request: Request,
    {
        params,
    }: {
        params: Promise<{ projectId: string }>;
    }
) {
    try {
        // ----------------------------------------
        // 1. Check authentication
        // ----------------------------------------

        const session = await getAuthSession();

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


        // ----------------------------------------
        // 2. Get project ID from URL
        // ----------------------------------------

        const { projectId } = await params;

        const projectIdNumber = Number(projectId);


        // ----------------------------------------
        // 3. Validate project ID
        // ----------------------------------------

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


        // ----------------------------------------
        // 4. Fetch project
        // ----------------------------------------

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
            WHERE id = ?
            LIMIT 1
            `,
            [projectIdNumber]
        );

        const projectResult = (projectRows as any[])[0];


        // ----------------------------------------
        // 5. Project not found
        // ----------------------------------------

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


        // ----------------------------------------
        // 6. Only ACTIVE projects
        // ----------------------------------------

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

        // ----------------------------------------
        // 6B. Check candidate role / applicant type
        // ----------------------------------------

        const [userRows] = await db.query(
            `SELECT applicant_type FROM users WHERE id = ? LIMIT 1`,
            [session.userId]
        );

        const candidateUser = (userRows as any[])[0];

        if (!candidateUser || candidateUser.applicant_type !== projectResult.targetType) {
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


        // ----------------------------------------
        // 7. Fetch project keywords
        // ----------------------------------------

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


        // ----------------------------------------
        // 8. Fetch project modules
        // ----------------------------------------

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


        // ----------------------------------------
        // 9. Check whether candidate already applied
        // ----------------------------------------

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


        // ----------------------------------------
        // 10. Build response
        // ----------------------------------------

        const project = {
            id: projectResult.id,
            title: projectResult.title,
            description: projectResult.description,
            targetType: projectResult.targetType,
            status: projectResult.status,
            createdAt: projectResult.createdAt,

            keywords: keywordRows as any[],

            modules: moduleRows as any[],

            existingApplication,
        };


        // ----------------------------------------
        // 11. Return project
        // ----------------------------------------

        return NextResponse.json(
            {
                success: true,
                project,
            },
            {
                status: 200,
            }
        );

    } catch (error) {

        console.error(
            "GET /api/candidate/projects/[projectId] error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch project",
            },
            {
                status: 500,
            }
        );
    }
}