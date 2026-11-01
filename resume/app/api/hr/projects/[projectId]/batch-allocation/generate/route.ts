import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import { validateProjectId, validateTargetTeamSize } from "@/server/validation/batchAllocationValidation";
import {
    getBatchProjectWithModules,
    getEligibleBatchCandidates,
} from "@/server/repositories/batchAllocationRepository";
import { generateAllocationDraft } from "@/server/services/batchAllocationService";

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

        let body: any = {};
        try {
            body = await request.json();
        } catch {
            body = {};
        }

        const targetTeamSize = validateTargetTeamSize(body.targetTeamSize);

        const { project, modules } = await getBatchProjectWithModules(validation.projectId);

        if (!project) {
            return NextResponse.json(
                { success: false, error: `Project #${validation.projectId} not found.` },
                { status: 404 }
            );
        }

        if (project.targetType !== "BATCH_INTERN") {
            return NextResponse.json(
                { success: false, error: `Project #${validation.projectId} is not a BATCH_INTERN project.` },
                { status: 400 }
            );
        }

        const eligibleCandidates = await getEligibleBatchCandidates(validation.projectId);

        // Run the 2-stage allocation recommendation (does NOT touch database)
        const { teams, warnings } = generateAllocationDraft(
            eligibleCandidates,
            modules,
            targetTeamSize
        );

        return NextResponse.json(
            {
                success: true,
                data: {
                    teams,
                    warnings,
                    targetTeamSize,
                    candidateCount: eligibleCandidates.length,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("POST /api/hr/projects/[projectId]/batch-allocation/generate error:", error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to generate allocation recommendation.",
            },
            { status: 500 }
        );
    }
}
