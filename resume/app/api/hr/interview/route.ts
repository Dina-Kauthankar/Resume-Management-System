import { NextRequest, NextResponse } from "next/server";

import { getAuthSession } from "@/server/auth";
import {
    getAllInterviews,
} from "@/server/services/interviewService";

export const runtime = "nodejs";

// ============================================================
// GET /api/hr/interview
//
// Returns all interviews for HR.
//
// Responsibilities of this route:
// - Authentication
// - HR authorization
// - HTTP response handling
//
// Database logic belongs to:
// interviewRepository.ts
//
// Business logic belongs to:
// interviewService.ts
// ============================================================

export async function GET(
    _request: NextRequest
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
                        "Only HR users can view interviews.",
                },
                {
                    status: 403,
                }
            );
        }


        // ====================================================
        // 3. GET INTERVIEWS
        //
        // The route does NOT query MySQL directly.
        //
        // The service layer handles the application logic.
        // ====================================================

        const interviews =
            await getAllInterviews();


        // ====================================================
        // 4. RETURN SUCCESS
        // ====================================================

        return NextResponse.json(
            {
                success: true,
                interviews,
            },
            {
                status: 200,
            }
        );

    } catch (error) {

        console.error(
            "Get HR interviews error:",
            error
        );


        // ====================================================
        // 5. ERROR RESPONSE
        // ====================================================

        return NextResponse.json(
            {
                success: false,
                error:
                    "Failed to retrieve interviews.",
            },
            {
                status: 500,
            }
        );
    }
}