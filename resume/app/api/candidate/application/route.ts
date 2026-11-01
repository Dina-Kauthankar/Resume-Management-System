
// ============================================================
// GET /api/candidate/applications
//
// Returns applications belonging to the logged-in candidate.
// ============================================================

import { getAuthSession } from "@/server/auth";
import { db } from "@/server/database/connection";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // --------------------------------------------------------
        // 1. Authenticate candidate
        // --------------------------------------------------------

        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Not authenticated.",
                },
                { status: 401 }
            );
        }

        // --------------------------------------------------------
        // 2. Only candidates can access this endpoint
        // --------------------------------------------------------

        if (session.role !== "CANDIDATE") {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Only candidates can view applications.",
                },
                { status: 403 }
            );
        }

        // --------------------------------------------------------
        // 3. Get applications belonging to logged-in candidate
        // --------------------------------------------------------

        const [rows] = await db.execute(
            `
                SELECT
                    a.id,
                    a.user_id,
                    a.project_id,
                    a.applicant_type,
                    a.status,
                    a.score,
                    a.matched_keywords,
                    a.confidence_percentage,
                    a.created_at,
                    a.updated_at,

                    p.title AS project_title,

                    r.id AS resume_id,
                    r.file_name AS resume_file_name

                FROM applications AS a

                INNER JOIN projects AS p
                    ON a.project_id = p.id

                LEFT JOIN resumes AS r
                    ON a.id = r.application_id

                WHERE a.user_id = ?

                ORDER BY a.created_at DESC
            `,
            [session.userId]
        );

        // --------------------------------------------------------
        // 4. Return applications
        // --------------------------------------------------------

        return NextResponse.json(
            {
                success: true,
                applications: rows,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error(
            "Get applications error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    "Failed to retrieve applications.",
            },
            { status: 500 }
        );
    }
}