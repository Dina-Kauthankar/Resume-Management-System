
import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { getAuthSession } from "@/server/auth";
import { db } from "@/server/database/connection";

export const runtime = "nodejs";

/* ============================================================
   TYPES
============================================================ */

interface ProjectRow extends RowDataPacket {
    id: number;
    title: string;
    description: string | null;
    target_type: string;
    status: string;
    created_by_id: number;
    created_at: Date;
    updated_at: Date;
}

interface KeywordRow extends RowDataPacket {
    id: number;
    project_id: number;
    keyword: string;
    weight: number;
    created_at: Date;
}

interface ModuleRow extends RowDataPacket {
    id: number;
    project_id: number;
    name: string;
    description: string | null;
    required_skills: string | null;
    created_at: Date;
    updated_at: Date;
}


/* ============================================================
   HELPER
============================================================ */

function getProjectId(
    params: { projectId: string }
): number | null {

    const projectId = Number(params.projectId);

    if (
        !Number.isInteger(projectId) ||
        projectId <= 0
    ) {
        return null;
    }

    return projectId;
}


/* ============================================================
   GET
   GET /api/hr/projects/:projectId

   Fetch:
   - Project
   - Project Keywords
   - Project Modules
============================================================ */

export async function GET(
    _request: NextRequest,
    {
        params,
    }: {
        params: Promise<{ projectId: string }>;
    }
) {
    try {

        console.log("====================================");
        console.log("HR PROJECT GET API");
        console.log("====================================");


        /* ====================================================
           AUTHENTICATION
        ==================================================== */

        const session = await getAuthSession();

        console.log("AUTH SESSION:", session);

        if (!session) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized.",
                },
                {
                    status: 401,
                }
            );
        }


        /* ====================================================
           ROLE CHECK
        ==================================================== */

        if (session.role !== "HR") {

            return NextResponse.json(
                {
                    success: false,
                    message: "Access denied. HR access required.",
                },
                {
                    status: 403,
                }
            );
        }


        /* ====================================================
           PROJECT ID
        ==================================================== */

        const resolvedParams = await params;

        const projectId = getProjectId(resolvedParams);

        if (!projectId) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid project ID.",
                },
                {
                    status: 400,
                }
            );
        }


        /* ====================================================
           GET PROJECT
        ==================================================== */

        const [projects] =
            await db.query<ProjectRow[]>(
                `
                SELECT
                    id,
                    title,
                    description,
                    target_type,
                    status,
                    created_by_id,
                    created_at,
                    updated_at

                FROM projects

                WHERE id = ?

                LIMIT 1
                `,
                [projectId]
            );


        if (projects.length === 0) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Project not found.",
                },
                {
                    status: 404,
                }
            );
        }


        const project = projects[0];


        /* ====================================================
           GET KEYWORDS
        ==================================================== */

        const [keywords] =
            await db.query<KeywordRow[]>(
                `
                SELECT
                    id,
                    project_id,
                    keyword,
                    weight,
                    created_at

                FROM project_keywords

                WHERE project_id = ?

                ORDER BY id ASC
                `,
                [projectId]
            );


        /* ====================================================
           GET MODULES
        ==================================================== */

        const [modules] =
            await db.query<ModuleRow[]>(
                `
                SELECT
                    id,
                    project_id,
                    name,
                    description,
                    required_skills,
                    created_at,
                    updated_at

                FROM project_modules

                WHERE project_id = ?

                ORDER BY id ASC
                `,
                [projectId]
            );


        /* ====================================================
           RESPONSE
        ==================================================== */

        return NextResponse.json(
            {
                success: true,

                project: {
                    id: project.id,
                    title: project.title,
                    description: project.description,
                    target_type: project.target_type,
                    status: project.status,
                    created_by_id: project.created_by_id,
                    created_at: project.created_at,
                    updated_at: project.updated_at,

                    keywords: keywords.map((keyword) => ({
                        id: keyword.id,
                        keyword: keyword.keyword,
                        weight: keyword.weight,
                    })),

                    modules: modules.map((module) => ({
                        id: module.id,
                        name: module.name,
                        description: module.description,
                        required_skills:
                            module.required_skills,
                    })),
                },
            },
            {
                status: 200,
            }
        );

    } catch (error) {

        console.error(
            "HR project GET API error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message: "Failed to load project.",
            },
            {
                status: 500,
            }
        );
    }
}


/* ============================================================
   PUT
   PUT /api/hr/projects/:projectId

   Updates:
   - Project
   - Keywords
   - Modules
============================================================ */

export async function PUT(
    request: NextRequest,
    {
        params,
    }: {
        params: Promise<{ projectId: string }>;
    }
) {
    try {

        console.log("====================================");
        console.log("HR PROJECT UPDATE API");
        console.log("====================================");


        /* ====================================================
           AUTHENTICATION
        ==================================================== */

        const session = await getAuthSession();

        console.log("AUTH SESSION:", session);

        if (!session) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized.",
                },
                {
                    status: 401,
                }
            );
        }


        /* ====================================================
           ROLE CHECK
        ==================================================== */

        if (session.role !== "HR") {

            return NextResponse.json(
                {
                    success: false,
                    message: "Access denied. HR access required.",
                },
                {
                    status: 403,
                }
            );
        }


        /* ====================================================
           PROJECT ID
        ==================================================== */

        const resolvedParams = await params;

        const projectId = getProjectId(resolvedParams);

        if (!projectId) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid project ID.",
                },
                {
                    status: 400,
                }
            );
        }


        /* ====================================================
           REQUEST BODY
        ==================================================== */

        const body = await request.json();

        const {
            title,
            description,
            target_type,
            status,
            keywords,
            modules,
        } = body;


        /* ====================================================
           VALIDATION
        ==================================================== */

        if (
            typeof title !== "string" ||
            title.trim().length === 0
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Project title is required.",
                },
                {
                    status: 400,
                }
            );
        }


        if (
            typeof target_type !== "string" ||
            target_type.trim().length === 0
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Target type is required.",
                },
                {
                    status: 400,
                }
            );
        }


        if (
            !Array.isArray(keywords)
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Keywords must be an array.",
                },
                {
                    status: 400,
                }
            );
        }


        if (
            !Array.isArray(modules)
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Modules must be an array.",
                },
                {
                    status: 400,
                }
            );
        }


        /* ====================================================
           CHECK PROJECT EXISTS
        ==================================================== */

        const [existingProjects] =
            await db.query<ProjectRow[]>(
                `
                SELECT
                    id

                FROM projects

                WHERE id = ?

                LIMIT 1
                `,
                [projectId]
            );


        if (existingProjects.length === 0) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Project not found.",
                },
                {
                    status: 404,
                }
            );
        }


        /* ====================================================
           GET CONNECTION
        ==================================================== */

        const connection =
            await db.getConnection();


        try {

            /* ==================================================
               START TRANSACTION
            ================================================== */

            await connection.beginTransaction();


            /* ==================================================
               UPDATE PROJECT
            ================================================== */

            await connection.execute(
                `
                UPDATE projects

                SET
                    title = ?,
                    description = ?,
                    target_type = ?,
                    status = ?

                WHERE id = ?
                `,
                [
                    title.trim(),
                    description?.trim() || null,
                    target_type.trim(),
                    status || "ACTIVE",
                    projectId,
                ]
            );


            /* ==================================================
               DELETE EXISTING KEYWORDS
            ================================================== */

            await connection.execute(
                `
                DELETE FROM project_keywords

                WHERE project_id = ?
                `,
                [projectId]
            );


            /* ==================================================
               INSERT KEYWORDS
            ================================================== */

            for (const keyword of keywords) {

                if (
                    typeof keyword.keyword !== "string" ||
                    keyword.keyword.trim().length === 0
                ) {
                    continue;
                }


                let weight = Number(keyword.weight);


                if (
                    !Number.isInteger(weight) ||
                    weight < 1
                ) {
                    weight = 1;
                }


                if (weight > 5) {
                    weight = 5;
                }


                await connection.execute(
                    `
                    INSERT INTO project_keywords
                    (
                        project_id,
                        keyword,
                        weight
                    )

                    VALUES (?, ?, ?)
                    `,
                    [
                        projectId,
                        keyword.keyword.trim(),
                        weight,
                    ]
                );
            }


            /* ==================================================
               DELETE EXISTING MODULES
            ================================================== */

            await connection.execute(
                `
                DELETE FROM project_modules

                WHERE project_id = ?
                `,
                [projectId]
            );


            /* ==================================================
               INSERT MODULES
            ================================================== */

            for (const module of modules) {

                if (
                    typeof module.name !== "string" ||
                    module.name.trim().length === 0
                ) {
                    continue;
                }


                await connection.execute(
                    `
                    INSERT INTO project_modules
                    (
                        project_id,
                        name,
                        description,
                        required_skills
                    )

                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        projectId,
                        module.name.trim(),
                        typeof module.description === "string"
                            ? module.description.trim() || null
                            : null,

                        typeof module.required_skills === "string"
                            ? module.required_skills.trim() || null
                            : null,
                    ]
                );
            }


            /* ==================================================
               COMMIT
            ================================================== */

            await connection.commit();


        } catch (error) {

            /* ==================================================
               ROLLBACK
            ================================================== */

            await connection.rollback();

            throw error;

        } finally {

            connection.release();
        }


        /* ====================================================
           SUCCESS
        ==================================================== */

        return NextResponse.json(
            {
                success: true,
                message: "Project updated successfully.",
            },
            {
                status: 200,
            }
        );

    } catch (error) {

        console.error(
            "HR project UPDATE API error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message: "Failed to update project.",
            },
            {
                status: 500,
            }
        );
    }
}


/* ============================================================
   DELETE
   DELETE /api/hr/projects/:projectId

   Deletes:
   - Project keywords
   - Project modules
   - Project

   NOTE:
   We explicitly delete child records first rather than
   assuming ON DELETE CASCADE exists.
============================================================ */

export async function DELETE(
    _request: NextRequest,
    {
        params,
    }: {
        params: Promise<{ projectId: string }>;
    }
) {
    try {

        console.log("====================================");
        console.log("HR PROJECT DELETE API");
        console.log("====================================");


        /* ====================================================
           AUTHENTICATION
        ==================================================== */

        const session = await getAuthSession();

        console.log("AUTH SESSION:", session);

        if (!session) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized.",
                },
                {
                    status: 401,
                }
            );
        }


        /* ====================================================
           ROLE CHECK
        ==================================================== */

        if (session.role !== "HR") {

            return NextResponse.json(
                {
                    success: false,
                    message: "Access denied. HR access required.",
                },
                {
                    status: 403,
                }
            );
        }


        /* ====================================================
           PROJECT ID
        ==================================================== */

        const resolvedParams = await params;

        const projectId = getProjectId(resolvedParams);

        if (!projectId) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid project ID.",
                },
                {
                    status: 400,
                }
            );
        }


        /* ====================================================
           CHECK PROJECT EXISTS
        ==================================================== */

        const [existingProjects] =
            await db.query<ProjectRow[]>(
                `
                SELECT
                    id

                FROM projects

                WHERE id = ?

                LIMIT 1
                `,
                [projectId]
            );


        if (existingProjects.length === 0) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Project not found.",
                },
                {
                    status: 404,
                }
            );
        }


        /* ====================================================
           GET CONNECTION
        ==================================================== */

        const connection =
            await db.getConnection();


        try {

            /* ==================================================
               START TRANSACTION
            ================================================== */

            await connection.beginTransaction();


            /* ==================================================
               DELETE KEYWORDS
            ================================================== */

            await connection.execute(
                `
                DELETE FROM project_keywords

                WHERE project_id = ?
                `,
                [projectId]
            );


            /* ==================================================
               DELETE MODULES
            ================================================== */

            await connection.execute(
                `
                DELETE FROM project_modules

                WHERE project_id = ?
                `,
                [projectId]
            );


            /* ==================================================
               DELETE PROJECT
            ================================================== */

            const [result] =
                await connection.execute<ResultSetHeader>(
                    `
                    DELETE FROM projects

                    WHERE id = ?
                    `,
                    [projectId]
                );


            /* ==================================================
               COMMIT
            ================================================== */

            await connection.commit();


            /* ==================================================
               SUCCESS
            ================================================== */

            return NextResponse.json(
                {
                    success: true,
                    message: "Project deleted successfully.",
                    deletedProjectId: projectId,
                },
                {
                    status: 200,
                }
            );

        } catch (error) {

            await connection.rollback();

            throw error;

        } finally {

            connection.release();
        }

    } catch (error) {

        console.error(
            "HR project DELETE API error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message: "Failed to delete project.",
            },
            {
                status: 500,
            }
        );
    }
}