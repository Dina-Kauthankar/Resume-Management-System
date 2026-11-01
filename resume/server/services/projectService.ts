import {
    findPublicProjects,
    findPublicProjectById,
    PublicProject,
} from "@/server/repositories/projectRepository";
import { ApplicantType } from "@/server/auth";

// ============================================================
// PUBLIC PROJECT SERVICE
// ============================================================

export interface PublicProjectsResponse {
    success: boolean;
    projects: PublicProject[];
    error?: string;
}

export interface PublicProjectDetailsResponse {
    success: boolean;
    project: PublicProject | null;
    error?: string;
}

export async function fetchPublicProjects(
    category?: string
): Promise<PublicProjectsResponse> {
    try {
        let validCategory: ApplicantType | "ALL" | undefined = undefined;

        if (
            category === "SINGLE_JOB_SEEKER" ||
            category === "SINGLE_INTERN" ||
            category === "BATCH_INTERN"
        ) {
            validCategory = category;
        } else if (category === "ALL" || !category) {
            validCategory = "ALL";
        }

        const projects = await findPublicProjects(validCategory);

        return {
            success: true,
            projects,
        };
    } catch (error) {
        console.error("fetchPublicProjects service error:", error);
        return {
            success: false,
            projects: [],
            error: "Failed to retrieve public recruitment projects.",
        };
    }
}

export async function fetchPublicProjectDetails(
    id: number
): Promise<PublicProjectDetailsResponse> {
    try {
        if (!Number.isInteger(id) || id <= 0) {
            return {
                success: false,
                project: null,
                error: "Invalid project ID.",
            };
        }

        const project = await findPublicProjectById(id);

        if (!project) {
            return {
                success: false,
                project: null,
                error: "Project not found or is not currently active.",
            };
        }

        return {
            success: true,
            project,
        };
    } catch (error) {
        console.error("fetchPublicProjectDetails service error:", error);
        return {
            success: false,
            project: null,
            error: "Failed to retrieve project details.",
        };
    }
}
