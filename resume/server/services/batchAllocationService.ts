import { normalizeText } from "@/server/matching/normalize";
import {
    getBatchProjectWithModules,
    getEligibleBatchCandidates,
    getExistingTeamsWithMembers,
    saveConfirmedAllocation,
    ConfirmedTeamInput,
    EligibleCandidateRecord,
    ModuleRecord,
    ConfirmedTeamDetails,
} from "@/server/repositories/batchAllocationRepository";

// ============================================================
// TYPES
// ============================================================

export interface ModuleCompatibilityScore {
    moduleId: number;
    moduleName: string;
    score: number; // 0 to 100 percentage
    matchedSkills: string[];
    missingSkills: string[];
    totalSkillsCount: number;
}

export interface CandidateHeatmapRow {
    applicationId: number;
    userId: number;
    candidateName: string;
    email: string;
    bestModuleName: string;
    bestScore: number;
    moduleScores: Record<number, ModuleCompatibilityScore>; // keyed by moduleId
}

export interface DraftTeamMember {
    userId: number;
    applicationId: number;
    candidateName: string;
    email: string;
    assignedModuleId: number;
    assignedModuleName: string;
    compatibilityScore: number;
    isLowCompatibility: boolean; // < 60%
    matchedSkills: string[];
    missingSkills: string[];
}

export interface DraftTeam {
    tempId: string;
    name: string;
    members: DraftTeamMember[];
    averageCompatibility: number;
    coveredModuleIds: number[];
    missingModuleNames: string[];
}

export interface AllocationWarning {
    type: "LOW_COMPATIBILITY" | "UNCOVERED_MODULE" | "CAPACITY_IMBALANCE" | "INSUFFICIENT_POOL";
    message: string;
    candidateName?: string;
    teamName?: string;
    moduleName?: string;
}

export interface BatchAllocationDraftResult {
    projectId: number;
    projectTitle: string;
    isConfirmed: boolean;
    confirmedAt?: string;
    totalSelectedCandidates: number;
    modules: {
        id: number;
        name: string;
        description: string | null;
        requiredSkills: string[];
    }[];
    heatmap: CandidateHeatmapRow[];
    recommendedTeams: DraftTeam[];
    warnings: AllocationWarning[];
}

// Default team naming convention
const TEAM_NAMES = [
    "Team Alpha",
    "Team Beta",
    "Team Gamma",
    "Team Delta",
    "Team Epsilon",
    "Team Zeta",
    "Team Eta",
    "Team Theta",
    "Team Iota",
    "Team Kappa",
    "Team Lambda",
    "Team Mu",
];

// ============================================================
// PARSE MODULE SKILLS
// ============================================================

export function parseModuleSkills(requiredSkillsStr: string | null): string[] {
    if (!requiredSkillsStr || !requiredSkillsStr.trim()) {
        return [];
    }

    return requiredSkillsStr
        .split(/[,\n;]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

// ============================================================
// CALCULATE CANDIDATE × MODULE COMPATIBILITY
//
// Formula:
// C(c, m) = [ Σ Match(c, k) × W(k) ] / [ Σ W(k) ] × 100
//
// Where:
// - c = candidate
// - m = module
// - k = required skill
// - Match(c, k) = 1 if resume text contains skill, else 0
// - W(k) = skill importance (defaults to 1)
// ============================================================

export function calculateCandidateModuleCompatibility(
    resumeText: string,
    module: ModuleRecord
): ModuleCompatibilityScore {
    const skills = parseModuleSkills(module.requiredSkills);

    if (skills.length === 0) {
        return {
            moduleId: module.id,
            moduleName: module.name,
            score: 100,
            matchedSkills: [],
            missingSkills: [],
            totalSkillsCount: 0,
        };
    }

    const normalizedResume = normalizeText(resumeText);
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    let totalWeight = 0;
    let matchedWeight = 0;

    for (const skill of skills) {
        // Skill weight is 1 by default
        const weight = 1;
        totalWeight += weight;

        const normalizedSkill = normalizeText(skill);

        // Check if normalized resume contains normalized skill keyword
        if (normalizedResume.includes(normalizedSkill)) {
            matchedSkills.push(skill);
            matchedWeight += weight;
        } else {
            missingSkills.push(skill);
        }
    }

    const percentage = totalWeight === 0 ? 100 : Math.round((matchedWeight / totalWeight) * 100);

    return {
        moduleId: module.id,
        moduleName: module.name,
        score: percentage,
        matchedSkills,
        missingSkills,
        totalSkillsCount: skills.length,
    };
}

// ============================================================
// BUILD SKILL HEATMAP
// ============================================================

export function buildSkillHeatmap(
    candidates: EligibleCandidateRecord[],
    modules: ModuleRecord[]
): CandidateHeatmapRow[] {
    return candidates.map((candidate) => {
        const scoresMap: Record<number, ModuleCompatibilityScore> = {};
        let bestScore = -1;
        let bestModuleName = modules[0]?.name || "General";

        for (const module of modules) {
            const comp = calculateCandidateModuleCompatibility(candidate.resumeText, module);
            scoresMap[module.id] = comp;

            if (comp.score > bestScore) {
                bestScore = comp.score;
                bestModuleName = module.name;
            }
        }

        return {
            applicationId: candidate.applicationId,
            userId: candidate.userId,
            candidateName: candidate.fullName,
            email: candidate.email,
            bestModuleName,
            bestScore: Math.max(0, bestScore),
            moduleScores: scoresMap,
        };
    });
}

// ============================================================
// TWO-STAGE ALLOCATION ALGORITHM
//
// Deterministic, Explainable, Reproducible (NO LLM)
//
// Stage 1: Team Formation (Balance capacity & broad skill coverage)
// Stage 2: Module Assignment (Assign primary module to maximize match & coverage)
// ============================================================

export function generateAllocationDraft(
    candidates: EligibleCandidateRecord[],
    modules: ModuleRecord[],
    targetTeamSize: number = 4
): { teams: DraftTeam[]; warnings: AllocationWarning[] } {
    const warnings: AllocationWarning[] = [];

    if (candidates.length === 0) {
        warnings.push({
            type: "INSUFFICIENT_POOL",
            message: "There are no eligible SELECTED candidates to allocate for this project.",
        });
        return { teams: [], warnings };
    }

    if (modules.length === 0) {
        warnings.push({
            type: "UNCOVERED_MODULE",
            message: "Project has no modules configured. Please configure project modules first.",
        });
        return { teams: [], warnings };
    }

    // Determine number of teams
    const safeTargetSize = Math.max(2, Math.min(10, targetTeamSize));
    let numTeams = Math.max(1, Math.round(candidates.length / safeTargetSize));

    // Ensure we don't create teams with fewer than 2 members if candidates allow
    if (numTeams > 1 && candidates.length / numTeams < 2) {
        numTeams = Math.max(1, Math.floor(candidates.length / 2));
    }

    // Precalculate all candidate-module compatibility
    const heatmap = buildSkillHeatmap(candidates, modules);
    const candidateMap = new Map(candidates.map((c) => [c.userId, c]));
    const heatmapMap = new Map(heatmap.map((h) => [h.userId, h]));

    // ============================================================
    // STAGE 1: TEAM FORMATION
    //
    // Distribute candidates to teams ensuring skill diversity & balanced size.
    // Group candidates by their primary strength module, sort by score,
    // and distribute using balanced snake round-robin across teams.
    // ============================================================

    // Group candidates by their primary module
    const groupsByModule: Record<number, typeof heatmap> = {};
    for (const mod of modules) {
        groupsByModule[mod.id] = [];
    }

    for (const h of heatmap) {
        let bestModId = modules[0].id;
        let maxVal = -1;
        for (const mod of modules) {
            const score = h.moduleScores[mod.id]?.score ?? 0;
            if (score > maxVal) {
                maxVal = score;
                bestModId = mod.id;
            }
        }
        groupsByModule[bestModId].push(h);
    }

    // Initialize empty teams
    const teamCandidateUserIds: number[][] = Array.from({ length: numTeams }, () => []);

    // Distribute candidates across teams
    let teamIndex = 0;
    let forward = true;

    // Process each module group, sorted by descending bestScore
    for (const mod of modules) {
        const group = groupsByModule[mod.id];
        group.sort((a, b) => b.bestScore - a.bestScore);

        for (const cand of group) {
            // Pick team with fewest members, breaking ties with snake round-robin
            let chosenTeam = 0;
            let minSize = Infinity;

            for (let i = 0; i < numTeams; i++) {
                const idx = forward ? i : numTeams - 1 - i;
                if (teamCandidateUserIds[idx].length < minSize) {
                    minSize = teamCandidateUserIds[idx].length;
                    chosenTeam = idx;
                }
            }

            teamCandidateUserIds[chosenTeam].push(cand.userId);

            // Advance snake pointer
            if (forward) {
                teamIndex++;
                if (teamIndex >= numTeams) {
                    teamIndex = numTeams - 1;
                    forward = false;
                }
            } else {
                teamIndex--;
                if (teamIndex < 0) {
                    teamIndex = 0;
                    forward = true;
                }
            }
        }
    }

    // ============================================================
    // STAGE 2: MODULE ASSIGNMENT WITHIN EACH TEAM
    //
    // For each team:
    // 1. Cover each distinct project module with the best available candidate.
    // 2. Assign any surplus candidates to their highest-compatibility module.
    // ============================================================

    const draftTeams: DraftTeam[] = [];

    for (let t = 0; t < numTeams; t++) {
        const teamName = TEAM_NAMES[t] || `Team ${t + 1}`;
        const userIdsInTeam = teamCandidateUserIds[t];
        const teamHeatmaps = userIdsInTeam
            .map((uid) => heatmapMap.get(uid))
            .filter((h): h is CandidateHeatmapRow => !!h);

        const assignedMemberResults: DraftTeamMember[] = [];
        const assignedUserIds = new Set<number>();
        const coveredModuleIds = new Set<number>();

        // Step 2A: For each module, pick the best unassigned candidate on the team
        // Sort modules by average team score descending to place strong fits first
        const sortedModules = [...modules].sort((m1, m2) => {
            const avg1 = teamHeatmaps.reduce((acc, h) => acc + (h.moduleScores[m1.id]?.score ?? 0), 0);
            const avg2 = teamHeatmaps.reduce((acc, h) => acc + (h.moduleScores[m2.id]?.score ?? 0), 0);
            return avg2 - avg1;
        });

        for (const mod of sortedModules) {
            if (assignedUserIds.size >= teamHeatmaps.length) {
                break; // all team members assigned
            }

            // Find best unassigned candidate for this module
            let bestCand: CandidateHeatmapRow | null = null;
            let highestScore = -1;

            for (const h of teamHeatmaps) {
                if (assignedUserIds.has(h.userId)) continue;
                const s = h.moduleScores[mod.id]?.score ?? 0;
                if (s > highestScore) {
                    highestScore = s;
                    bestCand = h;
                }
            }

            if (bestCand) {
                assignedUserIds.add(bestCand.userId);
                coveredModuleIds.add(mod.id);

                const comp = bestCand.moduleScores[mod.id];
                const isLow = comp.score < 60;

                assignedMemberResults.push({
                    userId: bestCand.userId,
                    applicationId: bestCand.applicationId,
                    candidateName: bestCand.candidateName,
                    email: bestCand.email,
                    assignedModuleId: mod.id,
                    assignedModuleName: mod.name,
                    compatibilityScore: comp.score,
                    isLowCompatibility: isLow,
                    matchedSkills: comp.matchedSkills,
                    missingSkills: comp.missingSkills,
                });

                if (isLow) {
                    warnings.push({
                        type: "LOW_COMPATIBILITY",
                        message: `${bestCand.candidateName} assigned to '${mod.name}' in ${teamName} has compatibility of ${comp.score}%, which is below recommended level (60%).`,
                        candidateName: bestCand.candidateName,
                        teamName,
                        moduleName: mod.name,
                    });
                }
            }
        }

        // Step 2B: If any candidates remain unassigned (e.g. team size > module count)
        for (const h of teamHeatmaps) {
            if (!assignedUserIds.has(h.userId)) {
                // Assign to their highest scoring module
                let bestMod = modules[0];
                let highest = -1;

                for (const mod of modules) {
                    const s = h.moduleScores[mod.id]?.score ?? 0;
                    if (s > highest) {
                        highest = s;
                        bestMod = mod;
                    }
                }

                assignedUserIds.add(h.userId);
                coveredModuleIds.add(bestMod.id);

                const comp = h.moduleScores[bestMod.id];
                const isLow = comp.score < 60;

                assignedMemberResults.push({
                    userId: h.userId,
                    applicationId: h.applicationId,
                    candidateName: h.candidateName,
                    email: h.email,
                    assignedModuleId: bestMod.id,
                    assignedModuleName: bestMod.name,
                    compatibilityScore: comp.score,
                    isLowCompatibility: isLow,
                    matchedSkills: comp.matchedSkills,
                    missingSkills: comp.missingSkills,
                });

                if (isLow) {
                    warnings.push({
                        type: "LOW_COMPATIBILITY",
                        message: `${h.candidateName} assigned to '${bestMod.name}' in ${teamName} has compatibility of ${comp.score}%, which is below recommended level (60%).`,
                        candidateName: h.candidateName,
                        teamName,
                        moduleName: bestMod.name,
                    });
                }
            }
        }

        // Check uncovered modules for this team
        const missingModuleNames: string[] = [];
        for (const mod of modules) {
            if (!coveredModuleIds.has(mod.id)) {
                missingModuleNames.push(mod.name);
                warnings.push({
                    type: "UNCOVERED_MODULE",
                    message: `${teamName} has no member assigned to '${mod.name}'.`,
                    teamName,
                    moduleName: mod.name,
                });
            }
        }

        // Calculate team average compatibility
        const avgCompat =
            assignedMemberResults.length === 0
                ? 0
                : Math.round(
                      assignedMemberResults.reduce((sum, m) => sum + m.compatibilityScore, 0) /
                          assignedMemberResults.length
                  );

        draftTeams.push({
            tempId: `draft-team-${t + 1}`,
            name: teamName,
            members: assignedMemberResults,
            averageCompatibility: avgCompat,
            coveredModuleIds: Array.from(coveredModuleIds),
            missingModuleNames,
        });
    }

    return { teams: draftTeams, warnings };
}

// ============================================================
// GET BATCH ALLOCATION OVERVIEW (HEATMAP + CURRENT STATE)
// ============================================================

export async function getBatchAllocationOverview(projectId: number): Promise<BatchAllocationDraftResult> {
    const { project, modules } = await getBatchProjectWithModules(projectId);

    if (!project) {
        throw new Error(`Project #${projectId} not found.`);
    }

    if (project.targetType !== "BATCH_INTERN") {
        throw new Error(`Project #${projectId} is not a BATCH_INTERN project.`);
    }

    const eligibleCandidates = await getEligibleBatchCandidates(projectId);
    const heatmap = buildSkillHeatmap(eligibleCandidates, modules);
    const existingTeams = await getExistingTeamsWithMembers(projectId);

    const formattedModules = modules.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        requiredSkills: parseModuleSkills(m.requiredSkills),
    }));

    // If teams are already confirmed in the database, present the confirmed state
    if (existingTeams.length > 0) {
        const confirmedDraftTeams: DraftTeam[] = existingTeams.map((team, idx) => {
            const members: DraftTeamMember[] = team.members.map((m) => {
                const candidateInfo = eligibleCandidates.find((c) => c.userId === m.userId);
                const moduleRecord = modules.find((mod) => mod.id === m.moduleId);
                const comp =
                    candidateInfo && moduleRecord
                        ? calculateCandidateModuleCompatibility(candidateInfo.resumeText, moduleRecord)
                        : { score: 0, matchedSkills: [], missingSkills: [] };

                return {
                    userId: m.userId,
                    applicationId: m.applicationId,
                    candidateName: m.fullName,
                    email: m.email,
                    assignedModuleId: m.moduleId,
                    assignedModuleName: m.moduleName,
                    compatibilityScore: comp.score,
                    isLowCompatibility: comp.score < 60,
                    matchedSkills: comp.matchedSkills,
                    missingSkills: comp.missingSkills,
                };
            });

            const coveredModuleIds = Array.from(new Set(members.map((m) => m.assignedModuleId)));
            const missingModuleNames = modules
                .filter((mod) => !coveredModuleIds.includes(mod.id))
                .map((mod) => mod.name);

            const avg =
                members.length === 0
                    ? 0
                    : Math.round(members.reduce((acc, curr) => acc + curr.compatibilityScore, 0) / members.length);

            return {
                tempId: `confirmed-team-${team.id}`,
                name: team.name,
                members,
                averageCompatibility: avg,
                coveredModuleIds,
                missingModuleNames,
            };
        });

        return {
            projectId: project.id,
            projectTitle: project.title,
            isConfirmed: true,
            confirmedAt: existingTeams[0]?.createdAt,
            totalSelectedCandidates: eligibleCandidates.length,
            modules: formattedModules,
            heatmap,
            recommendedTeams: confirmedDraftTeams,
            warnings: [],
        };
    }

    // Otherwise, generate initial draft recommendation
    const { teams, warnings } = generateAllocationDraft(eligibleCandidates, modules);

    return {
        projectId: project.id,
        projectTitle: project.title,
        isConfirmed: false,
        totalSelectedCandidates: eligibleCandidates.length,
        modules: formattedModules,
        heatmap,
        recommendedTeams: teams,
        warnings,
    };
}

// ============================================================
// CONFIRM FINAL ALLOCATION
// ============================================================

export async function confirmBatchAllocation(
    projectId: number,
    teams: ConfirmedTeamInput[]
) {
    return saveConfirmedAllocation(projectId, teams);
}
