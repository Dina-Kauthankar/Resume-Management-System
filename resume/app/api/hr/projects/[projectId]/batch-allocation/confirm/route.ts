import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import {
    validateProjectId,
    validateConfirmedTeamsPayload,
} from "@/server/validation/batchAllocationValidation";
import { confirmBatchAllocation } from "@/server/services/batchAllocationService";
import { notifyHRBatchAllocation } from "@/server/services/notificationService";
import { db } from "@/server/database/connection";

export const runtime = "nodejs";

export async function POST(
    request: NextRequest,
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

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: "Invalid JSON body." },
                { status: 400 }
            );
        }

        const payloadValidation = validateConfirmedTeamsPayload(body);
        if (!payloadValidation.isValid || !payloadValidation.data) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Validation failed.",
                    details: payloadValidation.errors,
                },
                { status: 400 }
            );
        }

        const result = await confirmBatchAllocation(
            validation.projectId,
            payloadValidation.data
        );

        // Dispatch HR in-app notification
        try {
            const [projRows] = await db.execute(
                "SELECT title FROM projects WHERE id = ? LIMIT 1",
                [validation.projectId]
            );
            const projTitle = (projRows as any[])?.[0]?.title || `Project #${validation.projectId}`;
            await notifyHRBatchAllocation(
                projTitle,
                validation.projectId,
                result.createdTeamsCount,
                result.assignedMembersCount
            );
        } catch (notifErr) {
            console.error("Failed to dispatch HR batch allocation notification:", notifErr);
        }

        return NextResponse.json(
            {
                success: true,
                message: "Batch allocation confirmed and saved successfully.",
                data: result,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("POST /api/hr/projects/[projectId]/batch-allocation/confirm error:", error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to confirm batch allocation.",
            },
            { status: 500 }
        );
    }
}
