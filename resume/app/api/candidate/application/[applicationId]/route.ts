import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import { db } from "@/server/database/connection";
import { findInterviewByApplicationId } from "@/server/repositories/interviewRepository";

export const runtime = "nodejs";

// ============================================================
// GET /api/candidate/application/:applicationId
//
// Returns one application belonging to the logged-in candidate,
// together with its complete status history and scheduled interview.
// ============================================================

export async function GET(
    _request: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            applicationId: string;
        }>;
    }
) {
    try {
        // 1. AUTHENTICATION
        const session = await getAuthSession();

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

        // 2. CANDIDATE AUTHORIZATION
        if (session.role !== "CANDIDATE") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Only candidates can view applications.",
                },
                {
                    status: 403,
                }
            );
        }

        // 3. GET APPLICATION ID
        const resolvedParams = await params;
        const applicationId = Number(resolvedParams.applicationId);

        if (!Number.isInteger(applicationId) || applicationId <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid application ID.",
                },
                {
                    status: 400,
                }
            );
        }

        // 4. GET APPLICATION
        const [applicationRows] = await db.execute(
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
                p.description AS project_description,
                p.target_type AS project_target_type,
                p.status AS project_status,
                r.id AS resume_id,
                r.file_name AS resume_file_name
            FROM applications AS a
            INNER JOIN projects AS p ON a.project_id = p.id
            LEFT JOIN resumes AS r ON a.id = r.application_id
            WHERE a.id = ? AND a.user_id = ?
            LIMIT 1
            `,
            [applicationId, session.userId]
        );

        if (!Array.isArray(applicationRows) || applicationRows.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Application not found.",
                },
                {
                    status: 404,
                }
            );
        }

        const application = applicationRows[0] as Record<string, unknown>;

        // 5. GET STATUS HISTORY
        const [historyRows] = await db.execute(
            `
            SELECT
                ash.id,
                ash.application_id,
                ash.old_status,
                ash.new_status,
                ash.changed_by,
                ash.decision_note,
                ash.changed_at
            FROM application_status_history AS ash
            WHERE ash.application_id = ?
            ORDER BY ash.changed_at ASC, ash.id ASC
            `,
            [applicationId]
        );

        const statusHistory = Array.isArray(historyRows) ? historyRows : [];

        // 6. GET ASSOCIATED INTERVIEW
        const interview = await findInterviewByApplicationId(applicationId);

        // 7. RETURN COMBINED DATA
        return NextResponse.json(
            {
                success: true,
                application,
                status_history: statusHistory,
                interview,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.error("Get candidate application details error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to retrieve application details.",
            },
            {
                status: 500,
            }
        );
    }
}