import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import {
    JobChangeError,
    reviewJobChangeRequest,
} from "@/server/services/jobChangeService";

export const runtime = "nodejs";

// PATCH /api/hr/job-change/[requestId] -> approve or reject a job change request
export async function PATCH(
    request: NextRequest,
    context: {
        params: Promise<{
            requestId: string;
        }>;
    }
) {
    try {
        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authenticated." },
                { status: 401 }
            );
        }

        if (session.role !== "HR") {
            return NextResponse.json(
                { success: false, error: "Only HR can review job change requests." },
                { status: 403 }
            );
        }

        const { requestId: requestIdParam } = await context.params;
        const requestId = Number(requestIdParam);

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return NextResponse.json(
                { success: false, error: "Invalid request ID." },
                { status: 400 }
            );
        }

        let body: { action?: unknown; decisionNote?: unknown };

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: "Invalid JSON request body." },
                { status: 400 }
            );
        }

        if (body.action !== "APPROVE" && body.action !== "REJECT") {
            return NextResponse.json(
                { success: false, error: "Action must be either APPROVE or REJECT." },
                { status: 400 }
            );
        }

        const decisionNote =
            typeof body.decisionNote === "string" ? body.decisionNote.trim() : null;

        const result = await reviewJobChangeRequest(
            requestId,
            session.userId,
            body.action,
            decisionNote
        );

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        if (error instanceof JobChangeError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        console.error("PATCH /api/hr/job-change/[requestId] error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to review job change request." },
            { status: 500 }
        );
    }
}
