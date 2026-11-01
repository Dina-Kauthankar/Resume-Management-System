import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    getAuthSession,
} from "@/server/auth";

import {
    getCandidateInterviews,
} from "@/server/services/interviewService";

export const runtime = "nodejs";


// ============================================================
// GET /api/candidate/interview
//
// Returns interviews belonging to the currently authenticated
// candidate.
//
// Candidate permissions:
// - READ ONLY
//
// Candidate cannot:
// - create interviews
// - update interviews
// - cancel interviews
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
                    error:
                        "Not authenticated.",
                },
                {
                    status: 401,
                }
            );
        }


        // ====================================================
        // 2. AUTHORIZATION
        // ====================================================

        if (
            session.role !== "CANDIDATE"
        ) {

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Only candidates can view interviews.",
                },
                {
                    status: 403,
                }
            );
        }


        // ====================================================
        // 3. GET CANDIDATE INTERVIEWS
        // ====================================================

        const interviews =
            await getCandidateInterviews(
                session.userId
            );


        // ====================================================
        // 4. RETURN RESPONSE
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
            "Get candidate interviews error:",
            error
        );


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