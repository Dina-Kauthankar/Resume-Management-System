import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import { validateProjectId } from "@/server/validation/batchAllocationValidation";
import { getBatchAllocationOverview } from "@/server/services/batchAllocationService";

export const runtime = "nodejs";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
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
                { success: false, error: "Access denied. HR role required." },
                { status: 403 }
            );
        }

        const { projectId: rawProjectId } = await params;
        const validation = validateProjectId(rawProjectId);

        if (!validation.isValid || !validation.projectId) {
            return NextResponse.json(
                { success: false, error: validation.error || "Invalid project ID." },
                { status: 400 }
            );
        }

        const overview = await getBatchAllocationOverview(validation.projectId);

        return NextResponse.json(
            {
                success: true,
                data: overview,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("GET /api/hr/projects/[projectId]/batch-allocation error:", error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to load batch allocation overview.",
            },
            { status: 500 }
        );
    }
}
