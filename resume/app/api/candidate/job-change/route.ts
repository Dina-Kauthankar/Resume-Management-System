import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import {
    getCandidateLatestJobChangeRequest,
    JobChangeError,
    requestJobRoleChange,
} from "@/server/services/jobChangeService";

export const runtime = "nodejs";

// GET /api/candidate/job-change -> fetch candidate's latest request
export async function GET(_request: NextRequest) {
    try {
        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authenticated." },
                { status: 401 }
            );
        }

        if (session.role !== "CANDIDATE") {
            return NextResponse.json(
                { success: false, error: "Only candidates can access this endpoint." },
                { status: 403 }
            );
        }

        const latestRequest = await getCandidateLatestJobChangeRequest(session.userId);

        return NextResponse.json(
            {
                success: true,
                request: latestRequest,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/candidate/job-change error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to retrieve job change request." },
            { status: 500 }
        );
    }
}

// POST /api/candidate/job-change -> submit a new job role change request
export async function POST(request: NextRequest) {
    try {
        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authenticated." },
                { status: 401 }
            );
        }

        if (session.role !== "CANDIDATE") {
            return NextResponse.json(
                { success: false, error: "Only candidates can request a job role change." },
                { status: 403 }
            );
        }

        let body: { requestedType?: unknown };

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: "Invalid JSON request body." },
                { status: 400 }
            );
        }

        if (typeof body.requestedType !== "string" || !body.requestedType) {
            return NextResponse.json(
                { success: false, error: "Requested applicant type is required." },
                { status: 400 }
            );
        }

        const result = await requestJobRoleChange(
            session.userId,
            body.requestedType as any
        );

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        if (error instanceof JobChangeError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        console.error("POST /api/candidate/job-change error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to submit job change request." },
            { status: 500 }
        );
    }
}
