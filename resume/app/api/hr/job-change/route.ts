import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import { getAllJobChangeRequests } from "@/server/services/jobChangeService";

export const runtime = "nodejs";

// GET /api/hr/job-change -> get all job change requests
export async function GET(_request: NextRequest) {
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
                { success: false, error: "Only HR can view job change requests." },
                { status: 403 }
            );
        }

        const requests = await getAllJobChangeRequests();

        return NextResponse.json(
            {
                success: true,
                requests,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/hr/job-change error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to retrieve job change requests." },
            { status: 500 }
        );
    }
}
