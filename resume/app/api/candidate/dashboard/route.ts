import { NextResponse } from "next/server";

import { getAuthSession } from "@/server/auth";
import { db } from "@/server/database/connection";

// ============================================================
// GET CANDIDATE DASHBOARD DATA
// ============================================================

export async function GET() {
    try {
        // ====================================================
        // 1. CHECK AUTHENTICATION
        // ====================================================

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

        // ====================================================
        // 2. FETCH CANDIDATE INFORMATION
        // ====================================================

        const [candidateRows] = await db.query(
            `
            SELECT
                id,
                full_name AS fullName,
                email,
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
        // 3. CANDIDATE NOT FOUND
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
        // 4. TOTAL APPLICATIONS
        // ====================================================

        const [totalApplicationRows] =
            await db.query(
                `
                SELECT
                    COUNT(*) AS totalApplications
                FROM applications
                WHERE user_id = ?
                `,
                [session.userId]
            );

        const totalApplications =
            Number(
                (
                    totalApplicationRows as any[]
                )[0]?.totalApplications ?? 0
            );

        // ====================================================
        // 5. PENDING REVIEWS
        //
        // Applications which are still under recruitment
        // review.
        //
        // APPLIED and SHORTLISTED are considered pending
        // from the candidate's dashboard perspective.
        // ====================================================

        const [pendingApplicationRows] =
            await db.query(
                `
                SELECT
                    COUNT(*) AS pendingApplications
                FROM applications
                WHERE user_id = ?
                  AND status IN (
                      'APPLIED',
                      'SHORTLISTED'
                  )
                `,
                [session.userId]
            );

        const pendingApplications =
            Number(
                (
                    pendingApplicationRows as any[]
                )[0]?.pendingApplications ?? 0
            );

        // ====================================================
        // 6. SCHEDULED INTERVIEWS
        //
        // For now we use the application status.
        //
        // The future Appointments table can later be used
        // for exact interview records.
        // ====================================================

        const [interviewRows] =
            await db.query(
                `
                SELECT
                    COUNT(*) AS scheduledInterviews
                FROM applications
                WHERE user_id = ?
                  AND status = 'INTERVIEW_SCHEDULED'
                `,
                [session.userId]
            );

        const scheduledInterviews =
            Number(
                (
                    interviewRows as any[]
                )[0]?.scheduledInterviews ?? 0
            );

        // ====================================================
        // 7. AVAILABLE PROJECTS
        //
        // Only ACTIVE projects are available for candidates.
        // ====================================================

        const [availableProjectRows] =
            await db.query(
                `
                SELECT
                    COUNT(*) AS availableProjects
                FROM projects
                WHERE status = 'ACTIVE'
                `
            );

        const availableProjects =
            Number(
                (
                    availableProjectRows as any[]
                )[0]?.availableProjects ?? 0
            );

        // ====================================================
        // 8. RECENT APPLICATIONS
        //
        // Show the candidate's latest applications.
        // ====================================================

        const [recentApplicationRows] =
            await db.query(
                `
                SELECT
                    a.id,
                    a.project_id AS projectId,
                    a.applicant_type AS applicantType,
                    a.status,
                    a.score,
                    a.matched_keywords AS matchedKeywords,
                    a.confidence_percentage AS confidencePercentage,
                    a.created_at AS createdAt,

                    p.title AS projectTitle,
                    p.target_type AS projectTargetType

                FROM applications a

                INNER JOIN projects p
                    ON p.id = a.project_id

                WHERE a.user_id = ?

                ORDER BY a.created_at DESC

                LIMIT 5
                `,
                [session.userId]
            );

        const recentApplications =
            (recentApplicationRows as any[]).map(
                (application) => ({
                    id: application.id,
                    projectId: application.projectId,
                    applicantType:
                        application.applicantType,
                    status: application.status,
                    score: Number(
                        application.score ?? 0
                    ),
                    matchedKeywords:
                        Number(
                            application.matchedKeywords ??
                                0
                        ),
                    confidencePercentage:
                        Number(
                            application.confidencePercentage ??
                                0
                        ),
                    createdAt:
                        application.createdAt,

                    project: {
                        id: application.projectId,
                        title:
                            application.projectTitle,
                        targetType:
                            application.projectTargetType,
                    },
                })
            );

        // ====================================================
        // 9. RETURN DASHBOARD DATA
        // ====================================================

        return NextResponse.json(
            {
                success: true,

                candidate: {
                    id: candidateResult.id,
                    fullName:
                        candidateResult.fullName,
                    email:
                        candidateResult.email,
                    applicantType:
                        candidateResult.applicantType,
                },

                statistics: {
                    totalApplications,
                    pendingApplications,
                    scheduledInterviews,
                    availableProjects,
                },

                recentApplications,
            },
            {
                status: 200,
            }
        );

    } catch (error) {

        // ====================================================
        // 10. ERROR HANDLING
        // ====================================================

        console.error(
            "GET /api/candidate/dashboard error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    "Failed to load dashboard data",
            },
            {
                status: 500,
            }
        );
    }
}