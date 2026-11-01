
import { NextResponse } from "next/server";
import type {
    ResultSetHeader,
    RowDataPacket,
} from "mysql2";

import { getAuthSession } from "@/server/auth";
import { db } from "@/server/database/connection";


// ============================================================
// TYPES
// ============================================================

interface ProjectRow extends RowDataPacket {
    id: number;
    title: string;
    description: string;
    target_type: string;
    status: string;
    created_by_id: number;
    created_at: Date;
    updated_at: Date;
}

interface KeywordInput {
    keyword: string;
    weight: number;
}

interface ModuleInput {
    name: string;
    description?: string;
    required_skills?: string;
}


// ============================================================
// GET /api/hr/projects
// ============================================================

export async function GET() {

    try {

        // ====================================================
        // AUTHENTICATION
        // ====================================================

        const session = await getAuthSession();


        if (!session) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Authentication required.",
                },
                {
                    status: 401,
                }
            );
        }


        // ====================================================
        // HR AUTHORIZATION
        // ====================================================

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


        // ====================================================
        // FETCH PROJECTS
        // ====================================================

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

                ORDER BY created_at DESC
                `
            );


        // ====================================================
        // RETURN RESPONSE
        // ====================================================

        return NextResponse.json(
            {
                success: true,
                data: projects,
            },
            {
                status: 200,
            }
        );

    } catch (error) {

        console.error(
            "HR projects API error:",
            error
        );


        return NextResponse.json(
            {
                success: false,
                message: "Failed to load projects.",
            },
            {
                status: 500,
            }
        );
    }
}


// ============================================================
// POST /api/hr/projects
//
// Creates:
// - Project
// - Project Keywords
// - Project Modules
//
// Everything is executed inside one transaction.
// ============================================================

export async function POST(request: Request) {

    try {

        // ====================================================
        // AUTHENTICATION
        // ====================================================

        const session = await getAuthSession();


        if (!session) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Authentication required.",
                },
                {
                    status: 401,
                }
            );
        }


        // ====================================================
        // HR AUTHORIZATION
        // ====================================================

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


        // ====================================================
        // READ REQUEST BODY
        // ====================================================

        const body = await request.json();


        const {
            title,
            description,
            target_type,
            status,
            keywords,
            modules,
        } = body;


        // ====================================================
        // PROJECT TITLE VALIDATION
        // ====================================================

        if (
            typeof title !== "string" ||
            !title.trim()
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


        // ====================================================
        // PROJECT DESCRIPTION VALIDATION
        // ====================================================

        if (
            typeof description !== "string" ||
            !description.trim()
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Project description is required.",
                },
                {
                    status: 400,
                }
            );
        }


        // ====================================================
        // TARGET TYPE VALIDATION
        // ====================================================

        const allowedTargetTypes = [
            "SINGLE_JOB_SEEKER",
            "SINGLE_INTERN",
            "BATCH_INTERN",
        ];


        if (
            typeof target_type !== "string" ||
            !allowedTargetTypes.includes(
                target_type
            )
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid target applicant type.",
                },
                {
                    status: 400,
                }
            );
        }


        // ====================================================
        // STATUS VALIDATION
        // ====================================================

        const allowedStatuses = [
            "DRAFT",
            "ACTIVE",
            "CLOSED",
        ];


        if (
            typeof status !== "string" ||
            !allowedStatuses.includes(status)
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid project status.",
                },
                {
                    status: 400,
                }
            );
        }


        // ====================================================
        // KEYWORDS VALIDATION
        // ====================================================

        if (!Array.isArray(keywords)) {

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


        // ====================================================
        // MODULES VALIDATION
        // ====================================================

        if (!Array.isArray(modules)) {

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


        // ====================================================
        // CLEAN KEYWORDS
        // ====================================================

        const cleanedKeywords: KeywordInput[] = [];


        for (const item of keywords) {

            // -----------------------------------------------
            // Ignore completely empty keyword rows
            // -----------------------------------------------

            if (
                !item ||
                typeof item.keyword !== "string" ||
                !item.keyword.trim()
            ) {
                continue;
            }


            let weight =
                Number(item.weight);


            // -----------------------------------------------
            // Validate weight
            // -----------------------------------------------

            if (
                !Number.isInteger(weight) ||
                weight < 1 ||
                weight > 10
            ) {

                return NextResponse.json(
                    {
                        success: false,
                        message:
                            `Invalid weight for keyword "${item.keyword}". Weight must be between 1 and 10.`,
                    },
                    {
                        status: 400,
                    }
                );
            }


            cleanedKeywords.push({
                keyword:
                    item.keyword.trim(),

                weight,
            });
        }


        // ====================================================
        // CLEAN MODULES
        // ====================================================

        const cleanedModules: ModuleInput[] = [];


        for (const item of modules) {

            // -----------------------------------------------
            // Ignore completely empty module rows
            // -----------------------------------------------

            if (
                !item ||
                typeof item.name !== "string" ||
                !item.name.trim()
            ) {
                continue;
            }


            cleanedModules.push({
                name:
                    item.name.trim(),

                description:
                    typeof item.description === "string"
                        ? item.description.trim()
                        : "",

                required_skills:
                    typeof item.required_skills === "string"
                        ? item.required_skills.trim()
                        : "",
            });
        }


        // ====================================================
        // GET DATABASE CONNECTION
        // ====================================================

        const connection =
            await db.getConnection();


        try {

            // ==================================================
            // START TRANSACTION
            // ==================================================

            await connection.beginTransaction();


            // ==================================================
            // INSERT PROJECT
            // ==================================================

            const [projectResult] =
                await connection.execute<ResultSetHeader>(
                    `
                    INSERT INTO projects
                    (
                        title,
                        description,
                        target_type,
                        status,
                        created_by_id
                    )

                    VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        title.trim(),
                        description.trim(),
                        target_type,
                        status,
                        session.userId,
                    ]
                );


            const projectId =
                projectResult.insertId;


            // ==================================================
            // INSERT KEYWORDS
            // ==================================================

            for (const keyword of cleanedKeywords) {

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
                        keyword.keyword,
                        keyword.weight,
                    ]
                );
            }


            // ==================================================
            // INSERT MODULES
            // ==================================================

            for (const module of cleanedModules) {

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

                        module.name,

                        module.description || null,

                        module.required_skills || null,
                    ]
                );
            }


            // ==================================================
            // COMMIT TRANSACTION
            // ==================================================

            await connection.commit();


            // ==================================================
            // RETURN SUCCESS
            // ==================================================

            return NextResponse.json(
                {
                    success: true,

                    message:
                        "Project created successfully.",

                    projectId,

                    keywordCount:
                        cleanedKeywords.length,

                    moduleCount:
                        cleanedModules.length,
                },
                {
                    status: 201,
                }
            );

        } catch (error) {

            // ==================================================
            // ROLLBACK
            // ==================================================

            await connection.rollback();

            throw error;

        } finally {

            // ==================================================
            // RELEASE CONNECTION
            // ==================================================

            connection.release();
        }

    } catch (error) {

        console.error(
            "HR create project API error:",
            error
        );


        return NextResponse.json(
            {
                success: false,
                message:
                    "Failed to create project.",
            },
            {
                status: 500,
            }
        );
    }
}