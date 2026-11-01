import { NextRequest, NextResponse } from "next/server";

import { getAuthSession } from "@/server/auth";

import {
    getResumeByApplicationId,
} from "@/server/repositories/resumeRepository";

import {
    getResumeFile,
} from "@/server/services/resumeService";

export const runtime = "nodejs";


// ============================================================
// GET /api/hr/application/:applicationId/resume
//
// Returns the resume belonging to an application.
//
// Query parameter:
//
// ?download=true
//
// downloads the resume.
//
// Without ?download=true:
//
// the browser attempts to display the file inline.
//
// ============================================================

export async function GET(
    request: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            applicationId: string;
        }>;
    }
) {

    try {

        // ====================================================
        // 1. AUTHENTICATION
        // ====================================================

        const session =
            await getAuthSession();


        if (!session) {

            return NextResponse.json(
                {
                    success: false,
                    error: "Not authenticated.",
                },
                {
                    status: 401,
                }
            );
        }


        // ====================================================
        // 2. HR AUTHORIZATION
        // ====================================================

        if (session.role !== "HR") {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Only HR users can access resumes.",
                },
                {
                    status: 403,
                }
            );
        }


        // ====================================================
        // 3. GET APPLICATION ID
        // ====================================================

        const resolvedParams =
            await params;


        const applicationId =
            Number(
                resolvedParams.applicationId
            );


        if (
            !Number.isInteger(applicationId) ||
            applicationId <= 0
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Invalid application ID.",
                },
                {
                    status: 400,
                }
            );
        }


        // ====================================================
        // 4. GET RESUME FROM DATABASE
        // ====================================================

        const resume =
            await getResumeByApplicationId(
                applicationId
            );


        if (!resume) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "No resume is associated with this application.",
                },
                {
                    status: 404,
                }
            );
        }


        // ====================================================
        // 5. READ RESUME FILE
        // ====================================================

        let resumeFile;

        try {

            resumeFile =
                await getResumeFile(
                    resume
                );

        } catch (error) {

            console.error(
                "Read resume file error:",
                error
            );


            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Resume file could not be found.",
                },
                {
                    status: 404,
                }
            );
        }


        // ====================================================
        // 6. DETERMINE VIEW / DOWNLOAD MODE
        // ====================================================

        const download =
            request.nextUrl.searchParams.get(
                "download"
            ) === "true";


        const disposition =
            download
                ? "attachment"
                : "inline";


        // ====================================================
        // 7. RETURN FILE
        // ====================================================

        return new NextResponse(
            new Uint8Array(resumeFile.buffer),
            {
                status: 200,

                headers: {
                    "Content-Type":
                        resumeFile.contentType,

                    "Content-Disposition":
                        `${disposition}; filename="${encodeURIComponent(
                            resumeFile.fileName
                        )}"`,

                    "Cache-Control":
                        "private, no-store",
                },
            }
        );

    } catch (error) {

        console.error(
            "Get HR resume error:",
            error
        );


        return NextResponse.json(
            {
                success: false,
                error:
                    "Failed to retrieve resume.",
            },
            {
                status: 500,
            }
        );
    }
}