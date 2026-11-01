import { NextRequest, NextResponse } from "next/server";
import { fetchPublicProjects } from "@/server/services/projectService";

export const runtime = "nodejs";

// ============================================================
// GET /api/projects
// Public endpoint to retrieve active recruitment projects.
// Supports optional ?category=ALL | SINGLE_INTERN | BATCH_INTERN | SINGLE_JOB_SEEKER
// ============================================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category") || undefined;

        const result = await fetchPublicProjects(category);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || "Failed to load public projects.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            projects: result.projects,
            count: result.projects.length,
        });
    } catch (error) {
        console.error("GET /api/projects error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Internal server error loading projects.",
            },
            { status: 500 }
        );
    }
}
