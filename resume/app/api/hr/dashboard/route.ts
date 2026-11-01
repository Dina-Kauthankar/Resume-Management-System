import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { getAuthSession } from "@/server/auth";
import { db } from "@/server/database/connection";


// ============================================================
// TYPES
// ============================================================

interface CountRow extends RowDataPacket {
    count: number;
}

interface RecentApplicationRow extends RowDataPacket {
    id: number;
    candidate_name: string;
    email: string;
    project_title: string;
    applicant_type: string;
    status: string;
    score: number;
    matched_keywords: number;
    confidence_percentage: number;
    created_at: Date;
}


// ============================================================
// GET HR DASHBOARD DATA
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
        // TOTAL APPLICATIONS
        // ====================================================

        const [totalApplicationRows] =
            await db.query<CountRow[]>(
                `
                SELECT COUNT(*) AS count
                FROM applications
                `
            );


        const totalApplications =
            Number(totalApplicationRows[0]?.count ?? 0);


        // ====================================================
        // PENDING REVIEWS
        //
        // Currently, newly submitted applications have:
        // status = 'APPLIED'
        //
        // We treat APPLIED applications as pending review.
        // ====================================================

        const [pendingReviewRows] =
            await db.query<CountRow[]>(
                `
                SELECT COUNT(*) AS count
                FROM applications
                WHERE status = 'APPLIED'
                `
            );


        const pendingReviews =
            Number(pendingReviewRows[0]?.count ?? 0);


        // ====================================================
        // SHORTLISTED APPLICATIONS
        // ====================================================

        const [shortlistedRows] =
            await db.query<CountRow[]>(
                `
                SELECT COUNT(*) AS count
                FROM applications
                WHERE status = 'SHORTLISTED'
                `
            );


        const shortlisted =
            Number(shortlistedRows[0]?.count ?? 0);


        // ====================================================
        // ACTIVE PROJECTS
        // ====================================================

        const [activeProjectRows] =
            await db.query<CountRow[]>(
                `
                SELECT COUNT(*) AS count
                FROM projects
                WHERE status = 'ACTIVE'
                `
            );


        const activeProjects =
            Number(activeProjectRows[0]?.count ?? 0);


        // ====================================================
        // RECENT APPLICATIONS
        // ====================================================

        const [recentApplications] =
            await db.query<RecentApplicationRow[]>(
                `
                SELECT
                    a.id,
                    u.full_name AS candidate_name,
                    u.email,
                    p.title AS project_title,
                    a.applicant_type,
                    a.status,
                    a.score,
                    a.matched_keywords,
                    a.confidence_percentage,
                    a.created_at

                FROM applications a

                INNER JOIN users u
                    ON a.user_id = u.id

                INNER JOIN projects p
                    ON a.project_id = p.id

                ORDER BY a.created_at DESC

                LIMIT 5
                `
            );


        // ====================================================
        // UPCOMING INTERVIEWS
        //
        // There is currently NO appointments table.
        //
        // This will be implemented later when the interview
        // management module and appointments table are created.
        // ====================================================

        const upcomingInterviews = 0;


        // ====================================================
        // RESPONSE
        // ====================================================

        return NextResponse.json(
            {
                success: true,

                data: {
                    totalApplications,

                    pendingReviews,

                    shortlisted,

                    upcomingInterviews,

                    activeProjects,

                    recentApplications,
                },
            },
            {
                status: 200,
            }
        );

    } catch (error) {

        console.error(
            "HR dashboard API error:",
            error
        );


        return NextResponse.json(
            {
                success: false,
                message: "Failed to load HR dashboard data.",
            },
            {
                status: 500,
            }
        );
    }
}