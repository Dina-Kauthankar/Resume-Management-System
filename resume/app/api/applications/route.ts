import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import { db } from "@/server/database/connection";
import { calculateKeywordMatch } from "@/server/matching/keywordMatcher";
import { extractResumeText } from "@/server/extraction/extractor";
import { getCompanySettings } from "@/server/repositories/settingsRepository";
import { notifyHRNewApplication } from "@/server/services/notificationService";

import fs from "fs/promises";
import path from "path";

import type { ResultSetHeader } from "mysql2";

// This route uses Node.js APIs such as Buffer and filesystem access.
export const runtime = "nodejs";

// ============================================================
// TYPES
// ============================================================

interface CandidateRow {
    id: number;
    full_name: string;
    applicant_type:
        | "SINGLE_JOB_SEEKER"
        | "SINGLE_INTERN"
        | "BATCH_INTERN";
}

interface ProjectRow {
    id: number;
    title: string;
    target_type:
        | "SINGLE_JOB_SEEKER"
        | "SINGLE_INTERN"
        | "BATCH_INTERN";
    status: "ACTIVE" | "CLOSED" | "DRAFT";
}

interface ProjectKeywordRow {
    keyword: string;
    weight: number;
}

interface ApplicationRow {
    id: number;
    status:
        | "APPLIED"
        | "SHORTLISTED"
        | "INTERVIEW_SCHEDULED"
        | "SELECTED"
        | "REJECTED";
    score: number;
    matched_keywords: number;
    confidence_percentage: number;
    created_at: Date;
}

// ============================================================
// POST /api/applications
// ============================================================

export async function POST(request: Request) {
    let savedFilePath: string | null = null;

    try {
        // --------------------------------------------------------
        // 1. Authenticate candidate
        // --------------------------------------------------------

        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Not authenticated",
                },
                { status: 401 }
            );
        }

        // --------------------------------------------------------
        // 2. Make sure only candidates can apply
        // --------------------------------------------------------

        if (session.role !== "CANDIDATE") {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Only candidates can submit applications.",
                },
                { status: 403 }
            );
        }

        // --------------------------------------------------------
        // 3. Read multipart form data
        // --------------------------------------------------------

        const formData = await request.formData();

        const projectIdValue = formData.get("projectId");
        const resume = formData.get("resume");

        if (
            !projectIdValue ||
            typeof projectIdValue !== "string"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Project ID is required.",
                },
                { status: 400 }
            );
        }

        if (!(resume instanceof File)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Resume file is required.",
                },
                { status: 400 }
            );
        }

        const projectId = Number(projectIdValue);

        if (
            !Number.isInteger(projectId) ||
            projectId <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid project ID.",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------------
        // 4. Validate resume file against company recruitment settings
        // --------------------------------------------------------

        const companySettings = await getCompanySettings();
        const configuredFormats = (companySettings.allowed_formats || "pdf,docx,tex")
            .split(/[,;\s]+/)
            .map((f) => "." + f.toLowerCase().replace(/^\./, "").trim())
            .filter(Boolean);

        const allowedExtensions = configuredFormats.length > 0 ? configuredFormats : [".pdf", ".docx", ".tex"];

        const extension = path
            .extname(resume.name)
            .toLowerCase();

        if (!allowedExtensions.includes(extension)) {
            const readableFormats = allowedExtensions.map((e) => e.replace(".", "").toUpperCase()).join(", ");
            return NextResponse.json(
                {
                    success: false,
                    error:
                        `Unsupported resume format. Only ${readableFormats} files are allowed.`,
                },
                { status: 400 }
            );
        }

        const maxFileSizeMb = companySettings.max_file_size_mb || 5;
        const MAX_FILE_SIZE = maxFileSizeMb * 1024 * 1024;

        if (resume.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        `Resume file must be smaller than ${maxFileSizeMb} MB.`,
                },
                { status: 400 }
            );
        }

        if (resume.size === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Resume file is empty.",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------------
        // 5. Get candidate from MySQL
        // --------------------------------------------------------

        const [candidateRows] = await db.execute(
            `
                SELECT
                    id,
                    full_name,
                    applicant_type
                FROM users
                WHERE id = ?
                LIMIT 1
            `,
            [session.userId]
        );

        const candidates =
            candidateRows as CandidateRow[];

        const candidate = candidates[0];

        if (!candidate) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Candidate not found.",
                },
                { status: 404 }
            );
        }

        // --------------------------------------------------------
        // 6. Get project from MySQL
        // --------------------------------------------------------

        const [projectRows] = await db.execute(
            `
                SELECT
                    id,
                    title,
                    target_type,
                    status
                FROM projects
                WHERE id = ?
                LIMIT 1
            `,
            [projectId]
        );

        const projects =
            projectRows as ProjectRow[];

        const project = projects[0];

        if (!project) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Project not found.",
                },
                { status: 404 }
            );
        }

        // --------------------------------------------------------
        // 7. Only ACTIVE projects accept applications
        // --------------------------------------------------------

        if (project.status !== "ACTIVE") {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "This project is not currently accepting applications.",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------------
        // 8. Check applicant type
        // --------------------------------------------------------

        if (
            candidate.applicant_type !==
            project.target_type
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        `This project is intended for ${project.target_type}.`,
                },
                { status: 403 }
            );
        }

        // --------------------------------------------------------
        // 9. Prevent duplicate applications
        // --------------------------------------------------------

        const [existingApplicationRows] =
            await db.execute(
                `
                    SELECT id
                    FROM applications
                    WHERE user_id = ?
                      AND project_id = ?
                    LIMIT 1
                `,
                [
                    candidate.id,
                    project.id,
                ]
            );

        const existingApplications =
            existingApplicationRows as {
                id: number;
            }[];

        if (existingApplications.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "You have already applied for this project.",
                },
                { status: 409 }
            );
        }

        // --------------------------------------------------------
        // 10. Get project keywords
        // --------------------------------------------------------

        const [projectKeywordRows] =
            await db.execute(
                `
                    SELECT
                        keyword,
                        weight
                    FROM project_keywords
                    WHERE project_id = ?
                    ORDER BY id ASC
                `,
                [project.id]
            );

        const projectKeywords =
            projectKeywordRows as ProjectKeywordRow[];

        if (projectKeywords.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "This project does not have any configured keywords.",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------------
        // 11. Convert File → Buffer
        // --------------------------------------------------------

        const fileBuffer = Buffer.from(
            await resume.arrayBuffer()
        );

        // --------------------------------------------------------
        // 12. Extract resume text using TypeScript
        // --------------------------------------------------------

        let extractedText: string;

        try {
            extractedText = await extractResumeText(
                fileBuffer,
                extension
            );
        } catch (extractionError) {
            console.error(
                "RESUME EXTRACTION ERROR:",
                extractionError
            );

            return NextResponse.json(
                {
                    success: false,
                    error:
                        extractionError instanceof Error
                            ? extractionError.message
                            : "Resume extraction failed.",
                },
                { status: 422 }
            );
        }

        // --------------------------------------------------------
        // 13. Validate extracted text
        // --------------------------------------------------------

        if (
            !extractedText ||
            typeof extractedText !== "string"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Resume extraction returned empty text.",
                },
                { status: 422 }
            );
        }

        // --------------------------------------------------------
        // 14. Run weighted keyword matching
        // --------------------------------------------------------

        const matchingResult =
            calculateKeywordMatch(
                extractedText,
                projectKeywords
            );

        // --------------------------------------------------------
        // 15. Save original resume locally
        // --------------------------------------------------------

        const uploadDirectory =
            path.join(
                process.cwd(),
                "uploads",
                "resumes",
                `user-${candidate.id}`
            );

        await fs.mkdir(
            uploadDirectory,
            {
                recursive: true,
            }
        );

        const safeFileName =
            `${Date.now()}-${resume.name.replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            )}`;

        savedFilePath =
            path.join(
                uploadDirectory,
                safeFileName
            );

        await fs.writeFile(
            savedFilePath,
            fileBuffer
        );

        // --------------------------------------------------------
        // 16. Calculate resume statistics
        // --------------------------------------------------------

        const characterCount =
            extractedText.length;

        const wordCount =
            extractedText
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .length;

        // --------------------------------------------------------
        // 17. Create Application + Resume
        //
        // Both database inserts are performed inside
        // one MySQL transaction.
        // --------------------------------------------------------

        const connection =
            await db.getConnection();

        try {
            await connection.beginTransaction();

            // ----------------------------------------------------
            // 17A. Insert Application
            // ----------------------------------------------------

            const [
                applicationInsertResult,
            ] = await connection.execute(
                `
                    INSERT INTO applications
                    (
                        user_id,
                        project_id,
                        applicant_type,
                        status,
                        score,
                        matched_keywords,
                        confidence_percentage
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    candidate.id,
                    project.id,
                    candidate.applicant_type,
                    "APPLIED",
                    matchingResult.score,
                    matchingResult
                        .matchedKeywords
                        .length,
                    matchingResult
                        .confidencePercentage,
                ]
            );

            const applicationResult =
                applicationInsertResult as ResultSetHeader;

            const applicationId =
                applicationResult.insertId;

            // ----------------------------------------------------
            // 17B. Insert Resume
            // ----------------------------------------------------

            await connection.execute(
                `
                    INSERT INTO resumes
                    (
                        application_id,
                        file_name,
                        file_extension,
                        file_path,
                        extracted_text,
                        character_count,
                        word_count
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    applicationId,
                    resume.name,
                    extension,
                    savedFilePath,
                    extractedText,
                    characterCount,
                    wordCount,
                ]
            );

            // ----------------------------------------------------
            // 17C. Commit transaction
            // ----------------------------------------------------

            await connection.commit();

            // ----------------------------------------------------
            // Dispatch in-app notification to HR (server-side)
            // ----------------------------------------------------
            try {
                const candidateName = candidate.full_name || session.fullName || "A candidate";
                await notifyHRNewApplication(candidateName, project.title, applicationId);
            } catch (notifError) {
                console.error("Failed to dispatch HR in-app notification:", notifError);
            }

            // ----------------------------------------------------
            // 17D. Get newly created application
            // ----------------------------------------------------

            const [
                createdApplicationRows,
            ] = await connection.execute(
                `
                    SELECT
                        id,
                        status,
                        score,
                        matched_keywords,
                        confidence_percentage,
                        created_at
                    FROM applications
                    WHERE id = ?
                    LIMIT 1
                `,
                [applicationId]
            );

            const createdApplications =
                createdApplicationRows as ApplicationRow[];

            const createdApplication =
                createdApplications[0];

            if (!createdApplication) {
                throw new Error(
                    "Application was created but could not be retrieved."
                );
            }

            // ----------------------------------------------------
            // 17E. Return result
            // ----------------------------------------------------

            return NextResponse.json(
                {
                    success: true,

                    message:
                        "Application submitted successfully.",

                    application: {
                        id:
                            createdApplication.id,

                        status:
                            createdApplication.status,

                        score:
                            createdApplication.score,

                        matchedKeywords:
                            createdApplication
                                .matched_keywords,

                        confidencePercentage:
                            createdApplication
                                .confidence_percentage,

                        createdAt:
                            createdApplication
                                .created_at,
                    },

                    matching: {
                        score:
                            matchingResult.score,

                        matchedKeywords:
                            matchingResult
                                .matchedKeywords,

                        missingKeywords:
                            matchingResult
                                .missingKeywords,

                        confidencePercentage:
                            matchingResult
                                .confidencePercentage,
                    },
                },
                { status: 201 }
            );
        } catch (databaseError) {
            // ----------------------------------------------------
            // Rollback Application + Resume
            // ----------------------------------------------------

            await connection.rollback();

            throw databaseError;
        } finally {
            connection.release();
        }
    } catch (error) {
        // --------------------------------------------------------
        // Delete uploaded file if database operation failed
        // --------------------------------------------------------

        if (savedFilePath) {
            try {
                await fs.unlink(
                    savedFilePath
                );
            } catch {
                // File may already be missing.
            }
        }

        console.error(
            "Application submission error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    "Internal server error.",
            },
            { status: 500 }
        );
    }
}

// // ============================================================
// // GET /api/applications
// //
// // Returns applications belonging to the logged-in candidate.
// // ============================================================

// export async function GET() {
//     try {
//         // --------------------------------------------------------
//         // 1. Authenticate candidate
//         // --------------------------------------------------------

//         const session = await getAuthSession();

//         if (!session) {
//             return NextResponse.json(
//                 {
//                     success: false,
//                     error: "Not authenticated.",
//                 },
//                 { status: 401 }
//             );
//         }

//         // --------------------------------------------------------
//         // 2. Only candidates can access this endpoint
//         // --------------------------------------------------------

//         if (session.role !== "CANDIDATE") {
//             return NextResponse.json(
//                 {
//                     success: false,
//                     error:
//                         "Only candidates can view applications.",
//                 },
//                 { status: 403 }
//             );
//         }

//         // --------------------------------------------------------
//         // 3. Get applications belonging to logged-in candidate
//         // --------------------------------------------------------

//         const [rows] = await db.execute(
//             `
//                 SELECT
//                     a.id,
//                     a.user_id,
//                     a.project_id,
//                     a.applicant_type,
//                     a.status,
//                     a.score,
//                     a.matched_keywords,
//                     a.confidence_percentage,
//                     a.created_at,
//                     a.updated_at,

//                     p.title AS project_title,

//                     r.id AS resume_id,
//                     r.file_name AS resume_file_name

//                 FROM applications AS a

//                 INNER JOIN projects AS p
//                     ON a.project_id = p.id

//                 LEFT JOIN resumes AS r
//                     ON a.id = r.application_id

//                 WHERE a.user_id = ?

//                 ORDER BY a.created_at DESC
//             `,
//             [session.userId]
//         );

//         // --------------------------------------------------------
//         // 4. Return applications
//         // --------------------------------------------------------

//         return NextResponse.json(
//             {
//                 success: true,
//                 applications: rows,
//             },
//             { status: 200 }
//         );

//     } catch (error) {
//         console.error(
//             "Get applications error:",
//             error
//         );

//         return NextResponse.json(
//             {
//                 success: false,
//                 error:
//                     "Failed to retrieve applications.",
//             },
//             { status: 500 }
//         );
//     }
// }