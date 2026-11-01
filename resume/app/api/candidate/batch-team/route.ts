import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import { getCandidateBatchTeamAssignment } from "@/server/repositories/batchAllocationRepository";

export const runtime = "nodejs";

export async function GET() {
    try {
        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authenticated." },
                { status: 401 }
            );
        }

        const assignment = await getCandidateBatchTeamAssignment(session.userId);

        return NextResponse.json(
            {
                success: true,
                hasAssignment: !!assignment,
                data: assignment,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("GET /api/candidate/batch-team error:", error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to load candidate team assignment.",
            },
            { status: 500 }
        );
    }
}
