import { ConfirmedTeamInput } from "@/server/repositories/batchAllocationRepository";

export interface ValidationResult<T> {
    isValid: boolean;
    errors: string[];
    data?: T;
}

export function validateProjectId(id: unknown): { isValid: boolean; projectId?: number; error?: string } {
    const num = Number(id);
    if (!Number.isInteger(num) || num <= 0) {
        return { isValid: false, error: "Invalid project ID. Must be a positive integer." };
    }
    return { isValid: true, projectId: num };
}

export function validateTargetTeamSize(size: unknown): number {
    const num = Number(size);
    if (!Number.isInteger(num) || num < 2 || num > 20) {
        return 4; // fallback to sensible default
    }
    return num;
}

export function validateConfirmedTeamsPayload(body: unknown): ValidationResult<ConfirmedTeamInput[]> {
    const errors: string[] = [];

    if (!body || typeof body !== "object") {
        return { isValid: false, errors: ["Request body must be a valid JSON object."] };
    }

    const { teams } = body as { teams?: unknown };

    if (!Array.isArray(teams) || teams.length === 0) {
        return { isValid: false, errors: ["'teams' must be a non-empty array of teams."] };
    }

    const validatedTeams: ConfirmedTeamInput[] = [];
    const seenUserIds = new Set<number>();
    const seenApplicationIds = new Set<number>();

    for (let t = 0; t < teams.length; t++) {
        const team = teams[t];
        if (!team || typeof team !== "object") {
            errors.push(`Team at index ${t} is invalid.`);
            continue;
        }

        const teamName = typeof team.name === "string" ? team.name.trim() : "";
        if (!teamName) {
            errors.push(`Team at index ${t} must have a non-empty name.`);
        }

        if (!Array.isArray(team.members) || team.members.length === 0) {
            errors.push(`Team '${teamName || `#${t + 1}`}' must have at least one member.`);
            continue;
        }

        const validatedMembers: ConfirmedTeamInput["members"] = [];

        for (let m = 0; m < team.members.length; m++) {
            const member = team.members[m];
            if (!member || typeof member !== "object") {
                errors.push(`Member at index ${m} in team '${teamName}' is invalid.`);
                continue;
            }

            const userId = Number(member.userId);
            const applicationId = Number(member.applicationId);
            const moduleId = Number(member.moduleId);

            if (!Number.isInteger(userId) || userId <= 0) {
                errors.push(`Invalid userId '${member.userId}' in team '${teamName}'.`);
            }
            if (!Number.isInteger(applicationId) || applicationId <= 0) {
                errors.push(`Invalid applicationId '${member.applicationId}' in team '${teamName}'.`);
            }
            if (!Number.isInteger(moduleId) || moduleId <= 0) {
                errors.push(`Invalid moduleId '${member.moduleId}' in team '${teamName}'.`);
            }

            if (seenUserIds.has(userId)) {
                errors.push(`Candidate with userId ${userId} is assigned to multiple teams.`);
            } else {
                seenUserIds.add(userId);
            }

            if (seenApplicationIds.has(applicationId)) {
                errors.push(`Application #${applicationId} is assigned to multiple teams.`);
            } else {
                seenApplicationIds.add(applicationId);
            }

            validatedMembers.push({ userId, applicationId, moduleId });
        }

        validatedTeams.push({
            name: teamName || `Team ${t + 1}`,
            members: validatedMembers,
        });
    }

    if (errors.length > 0) {
        return { isValid: false, errors };
    }

    return { isValid: true, errors: [], data: validatedTeams };
}
