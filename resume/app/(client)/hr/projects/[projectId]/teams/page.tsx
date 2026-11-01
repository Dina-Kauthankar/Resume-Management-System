"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ============================================================
// TYPES
// ============================================================

interface ModuleSkillScore {
    moduleId: number;
    moduleName: string;
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    totalSkillsCount: number;
}

interface HeatmapRow {
    applicationId: number;
    userId: number;
    candidateName: string;
    email: string;
    bestModuleName: string;
    bestScore: number;
    moduleScores: Record<number, ModuleSkillScore>;
}

interface DraftMember {
    userId: number;
    applicationId: number;
    candidateName: string;
    email: string;
    assignedModuleId: number;
    assignedModuleName: string;
    compatibilityScore: number;
    isLowCompatibility: boolean;
    matchedSkills: string[];
    missingSkills: string[];
}

interface DraftTeamItem {
    tempId: string;
    name: string;
    members: DraftMember[];
    averageCompatibility: number;
    coveredModuleIds: number[];
    missingModuleNames: string[];
}

interface ProjectModuleItem {
    id: number;
    name: string;
    description: string | null;
    requiredSkills: string[];
}

interface AllocationWarningItem {
    type: string;
    message: string;
    candidateName?: string;
    teamName?: string;
    moduleName?: string;
}

interface AllocationOverviewData {
    projectId: number;
    projectTitle: string;
    isConfirmed: boolean;
    confirmedAt?: string;
    totalSelectedCandidates: number;
    modules: ProjectModuleItem[];
    heatmap: HeatmapRow[];
    recommendedTeams: DraftTeamItem[];
    warnings: AllocationWarningItem[];
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getScoreBadgeColor(score: number): string {
    if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score >= 60) return "bg-blue-50 text-blue-700 border-blue-200";
    if (score >= 40) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
}

function getScoreBgStyle(score: number): string {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-rose-500";
}

// ============================================================
// COMPONENT
// ============================================================

export default function HRBatchAllocationPage({
    params,
}: {
    params: Promise<{ projectId: string }>;
}) {
    const router = useRouter();
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [overview, setOverview] = useState<AllocationOverviewData | null>(null);
    const [teams, setTeams] = useState<DraftTeamItem[]>([]);
    const [targetTeamSize, setTargetTeamSize] = useState<number>(4);
    const [activeTab, setActiveTab] = useState<"allocation" | "heatmap">("allocation");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [hoveredScore, setHoveredScore] = useState<ModuleSkillScore | null>(null);

    // Load Overview Data
    const loadOverview = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`/api/hr/projects/${projectId}/batch-allocation`, {
                cache: "no-store",
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to load allocation data.");
            }

            setOverview(data.data);
            setTeams(data.data.recommendedTeams || []);
        } catch (err: any) {
            setError(err.message || "Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOverview();
    }, [projectId]);

    // Handle Recommendation Generation (Draft only, no DB writes)
    const handleGenerate = async () => {
        try {
            setGenerating(true);
            setError(null);
            setSuccessMessage(null);

            const res = await fetch(`/api/hr/projects/${projectId}/batch-allocation/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetTeamSize }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to generate recommendation.");
            }

            setTeams(data.data.teams || []);
            if (overview) {
                setOverview({
                    ...overview,
                    isConfirmed: false,
                    recommendedTeams: data.data.teams || [],
                    warnings: data.data.warnings || [],
                });
            }
            setSuccessMessage("Generated balanced draft allocation. Review and customize before confirming.");
        } catch (err: any) {
            setError(err.message || "Failed to generate allocation.");
        } finally {
            setGenerating(false);
        }
    };

    // Manual Override: Change Member's Module
    const handleModuleChange = (teamIndex: number, memberIndex: number, newModuleId: number) => {
        if (!overview) return;

        const updatedTeams = [...teams];
        const team = { ...updatedTeams[teamIndex] };
        const member = { ...team.members[memberIndex] };

        const targetMod = overview.modules.find((m) => m.id === newModuleId);
        if (!targetMod) return;

        // Lookup candidate compatibility from heatmap
        const candidateHeatmap = overview.heatmap.find((h) => h.userId === member.userId);
        const comp = candidateHeatmap?.moduleScores[newModuleId] || {
            score: 0,
            matchedSkills: [],
            missingSkills: targetMod.requiredSkills,
        };

        member.assignedModuleId = targetMod.id;
        member.assignedModuleName = targetMod.name;
        member.compatibilityScore = comp.score;
        member.isLowCompatibility = comp.score < 60;
        member.matchedSkills = comp.matchedSkills;
        member.missingSkills = comp.missingSkills;

        team.members = [...team.members];
        team.members[memberIndex] = member;

        // Recalculate covered modules and avg compatibility
        const covered = Array.from(new Set(team.members.map((m) => m.assignedModuleId)));
        team.coveredModuleIds = covered;
        team.missingModuleNames = overview.modules
            .filter((m) => !covered.includes(m.id))
            .map((m) => m.name);
        team.averageCompatibility =
            team.members.length === 0
                ? 0
                : Math.round(team.members.reduce((sum, m) => sum + m.compatibilityScore, 0) / team.members.length);

        updatedTeams[teamIndex] = team;
        setTeams(updatedTeams);
    };

    // Manual Override: Move Member to Another Team
    const handleTeamChange = (fromTeamIdx: number, memberIdx: number, toTeamIdx: number) => {
        if (fromTeamIdx === toTeamIdx || !overview) return;

        const updatedTeams = [...teams];
        const sourceTeam = { ...updatedTeams[fromTeamIdx] };
        const destTeam = { ...updatedTeams[toTeamIdx] };

        const [movedMember] = sourceTeam.members.splice(memberIdx, 1);
        destTeam.members.push(movedMember);

        // Recalculate source team stats
        const srcCovered = Array.from(new Set(sourceTeam.members.map((m) => m.assignedModuleId)));
        sourceTeam.coveredModuleIds = srcCovered;
        sourceTeam.missingModuleNames = overview.modules
            .filter((m) => !srcCovered.includes(m.id))
            .map((m) => m.name);
        sourceTeam.averageCompatibility =
            sourceTeam.members.length === 0
                ? 0
                : Math.round(sourceTeam.members.reduce((sum, m) => sum + m.compatibilityScore, 0) / sourceTeam.members.length);

        // Recalculate dest team stats
        const destCovered = Array.from(new Set(destTeam.members.map((m) => m.assignedModuleId)));
        destTeam.coveredModuleIds = destCovered;
        destTeam.missingModuleNames = overview.modules
            .filter((m) => !destCovered.includes(m.id))
            .map((m) => m.name);
        destTeam.averageCompatibility =
            destTeam.members.length === 0
                ? 0
                : Math.round(destTeam.members.reduce((sum, m) => sum + m.compatibilityScore, 0) / destTeam.members.length);

        updatedTeams[fromTeamIdx] = sourceTeam;
        updatedTeams[toTeamIdx] = destTeam;
        setTeams(updatedTeams);
    };

    // Add New Empty Team
    const handleAddTeam = () => {
        const teamNumber = teams.length + 1;
        const newTeam: DraftTeamItem = {
            tempId: `custom-team-${Date.now()}`,
            name: `Team ${String.fromCharCode(64 + teamNumber)}`, // e.g. Team C, Team D
            members: [],
            averageCompatibility: 0,
            coveredModuleIds: [],
            missingModuleNames: overview?.modules.map((m) => m.name) || [],
        };
        setTeams([...teams, newTeam]);
    };

    // Confirm Final Allocation
    const handleConfirmAllocation = async () => {
        try {
            setConfirming(true);
            setError(null);

            const payload = {
                teams: teams
                    .filter((t) => t.members.length > 0)
                    .map((t) => ({
                        name: t.name,
                        members: t.members.map((m) => ({
                            userId: m.userId,
                            applicationId: m.applicationId,
                            moduleId: m.assignedModuleId,
                        })),
                    })),
            };

            const res = await fetch(`/api/hr/projects/${projectId}/batch-allocation/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to confirm allocation.");
            }

            setShowConfirmModal(false);
            setSuccessMessage("Batch Intern team allocation confirmed! Candidates have been notified.");
            await loadOverview();
        } catch (err: any) {
            setError(err.message || "Failed to confirm allocation.");
        } finally {
            setConfirming(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-125">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium text-gray-600">Loading Batch Allocation System...</p>
                </div>
            </div>
        );
    }

    if (error && !overview) {
        return (
            <div className="max-w-4xl mx-auto py-10">
                <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800">
                    <h3 className="text-lg font-semibold mb-2">Error Loading Batch Project</h3>
                    <p className="text-sm mb-4">{error}</p>
                    <Link
                        href="/hr/projects"
                        className="inline-flex items-center px-4 py-2 bg-red-800 text-white rounded-lg text-sm font-medium hover:bg-red-900 transition"
                    >
                        Return to Projects
                    </Link>
                </div>
            </div>
        );
    }

    const totalAssignedCandidates = teams.reduce((acc, t) => acc + t.members.length, 0);
    const lowCompatibilityCount = teams.reduce(
        (acc, t) => acc + t.members.filter((m) => m.isLowCompatibility).length,
        0
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Breadcrumbs & Title */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                        <Link href="/hr/projects" className="hover:text-gray-700">Projects</Link>
                        <span>/</span>
                        <Link href={`/hr/projects/${projectId}`} className="hover:text-gray-700">{overview?.projectTitle}</Link>
                        <span>/</span>
                        <span className="text-gray-900">Batch Allocation</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Batch Intern Team Formation & Smart Allocation
                        </h1>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                            Batch Intern
                        </span>
                        {overview?.isConfirmed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Confirmed
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                Draft Recommendation
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href={`/hr/projects/${projectId}`}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                        Project Details
                    </Link>
                    {!overview?.isConfirmed ? (
                        <button
                            type="button"
                            onClick={() => setShowConfirmModal(true)}
                            disabled={totalAssignedCandidates === 0}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-xs transition inline-flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Confirm Allocation
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                if (overview) {
                                    setOverview({ ...overview, isConfirmed: false });
                                }
                            }}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
                        >
                            Re-allocate / Edit Teams
                        </button>
                    )}
                </div>
            </div>

            {/* Notification messages */}
            {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium">{successMessage}</p>
                    </div>
                    <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 text-sm font-bold">×</button>
                </div>
            )}

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between">
                    <p className="text-sm">{error}</p>
                    <button type="button" onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 text-sm font-bold">×</button>
                </div>
            )}

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
                    <p className="text-xs font-semibold uppercase text-gray-500">Selected Candidates</p>
                    <div className="mt-2 flex items-baseline justify-between">
                        <p className="text-3xl font-bold text-gray-900">{overview?.totalSelectedCandidates ?? 0}</p>
                        <span className="text-xs font-medium text-emerald-600">Eligible Pool</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">status = SELECTED</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
                    <p className="text-xs font-semibold uppercase text-gray-500">Project Modules</p>
                    <div className="mt-2 flex items-baseline justify-between">
                        <p className="text-3xl font-bold text-gray-900">{overview?.modules.length ?? 0}</p>
                        <span className="text-xs font-medium text-indigo-600">Required Tracks</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {overview?.modules.map((m) => m.name).slice(0, 3).join(", ")}
                        {(overview?.modules.length ?? 0) > 3 ? "..." : ""}
                    </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
                    <p className="text-xs font-semibold uppercase text-gray-500">Teams Formed</p>
                    <div className="mt-2 flex items-baseline justify-between">
                        <p className="text-3xl font-bold text-gray-900">{teams.length}</p>
                        <span className="text-xs font-medium text-purple-600">
                            ~{teams.length > 0 ? Math.round(totalAssignedCandidates / teams.length) : 0} per team
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{totalAssignedCandidates} candidates placed</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
                    <p className="text-xs font-semibold uppercase text-gray-500">Allocation Quality</p>
                    <div className="mt-2 flex items-baseline justify-between">
                        <p className="text-3xl font-bold text-gray-900">
                            {teams.length > 0
                                ? Math.round(teams.reduce((s, t) => s + t.averageCompatibility, 0) / teams.length)
                                : 0}
                            %
                        </p>
                        {lowCompatibilityCount > 0 ? (
                            <span className="text-xs font-medium text-amber-600">
                                {lowCompatibilityCount} low match
                            </span>
                        ) : (
                            <span className="text-xs font-medium text-emerald-600">Optimal</span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Avg compatibility score</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 flex items-center justify-between">
                <nav className="flex space-x-6">
                    <button
                        type="button"
                        onClick={() => setActiveTab("allocation")}
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition flex items-center gap-2 ${
                            activeTab === "allocation"
                                ? "border-indigo-600 text-indigo-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Team Allocation & Review
                        <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                            {teams.length} Teams
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("heatmap")}
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition flex items-center gap-2 ${
                            activeTab === "heatmap"
                                ? "border-indigo-600 text-indigo-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Skill Heatmap Matrix
                        <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                            {overview?.heatmap.length ?? 0}
                        </span>
                    </button>
                </nav>

                {activeTab === "allocation" && !overview?.isConfirmed && (
                    <div className="flex items-center gap-3 py-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <label htmlFor="targetSize" className="font-medium text-xs uppercase text-gray-500">
                                Target Team Size:
                            </label>
                            <select
                                id="targetSize"
                                value={targetTeamSize}
                                onChange={(e) => setTargetTeamSize(Number(e.target.value))}
                                className="px-2.5 py-1 text-sm border border-gray-300 rounded-lg bg-white"
                            >
                                <option value={3}>3 members</option>
                                <option value={4}>4 members</option>
                                <option value={5}>5 members</option>
                                <option value={6}>6 members</option>
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-2xs transition inline-flex items-center gap-1.5"
                        >
                            {generating ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Calculating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Re-generate Recommendation
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* TAB 1: ALLOCATION & REVIEW */}
            {activeTab === "allocation" && (
                <div className="space-y-6">
                    {/* Status & Warning Notice */}
                    {!overview?.isConfirmed && (
                        <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">💡</span>
                                <div>
                                    <p className="text-sm font-semibold">Allocation Recommendation Engine</p>
                                    <p className="text-xs text-indigo-700 mt-0.5">
                                        The 2-stage allocation algorithm recommended the balanced teams below based on candidate compatibility, capacity limits, and broad skill coverage. You can manually adjust any team or module assignment before confirming.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddTeam}
                                className="shrink-0 px-3 py-1.5 border border-indigo-300 hover:bg-indigo-100/60 text-indigo-800 rounded-lg text-xs font-semibold transition"
                            >
                                + Add Empty Team
                            </button>
                        </div>
                    )}

                    {/* Warnings List */}
                    {overview?.warnings && overview.warnings.length > 0 && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                            <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wide text-amber-800 mb-1">
                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Allocation Alerts ({overview.warnings.length})
                            </div>
                            <ul className="text-xs space-y-1 list-disc list-inside text-amber-800">
                                {overview.warnings.map((w, idx) => (
                                    <li key={idx}>{w.message}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Teams Display */}
                    {teams.length === 0 ? (
                        <div className="p-12 text-center bg-white border border-gray-200 rounded-xl">
                            <p className="text-base font-semibold text-gray-800">No teams generated yet</p>
                            <p className="text-sm text-gray-500 mt-1">Click below to run the two-stage allocation algorithm.</p>
                            <button
                                type="button"
                                onClick={handleGenerate}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                            >
                                Generate Allocation
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {teams.map((team, teamIdx) => (
                                <div
                                    key={team.tempId || teamIdx}
                                    className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden flex flex-col"
                                >
                                    {/* Team Header */}
                                    <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-bold text-gray-900">{team.name}</h3>
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
                                                    {team.members.length} members
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-500">
                                                    Avg Fit: <strong className="text-gray-900">{team.averageCompatibility}%</strong>
                                                </span>
                                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${getScoreBgStyle(team.averageCompatibility)}`}
                                                        style={{ width: `${team.averageCompatibility}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Module Coverage Badges */}
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex flex-wrap gap-1 justify-end max-w-55">
                                                {team.coveredModuleIds.map((modId) => {
                                                    const m = overview?.modules.find((mod) => mod.id === modId);
                                                    return (
                                                        <span
                                                            key={modId}
                                                            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        >
                                                            ✓ {m?.name || "Module"}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                            {team.missingModuleNames.length > 0 && (
                                                <span className="text-[10px] text-amber-700">
                                                    Missing: {team.missingModuleNames.join(", ")}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Team Members List */}
                                    <div className="p-4 divide-y divide-gray-100 flex-1">
                                        {team.members.length === 0 ? (
                                            <div className="py-8 text-center text-xs text-gray-400">
                                                No members assigned to this team yet. Use the dropdown below to move candidates here.
                                            </div>
                                        ) : (
                                            team.members.map((member, memberIdx) => (
                                                <div key={member.userId} className="py-3 flex flex-col gap-2">
                                                    <div className="flex items-center justify-between gap-3">
                                                        {/* Candidate Info */}
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                                {member.candidateName}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {member.email}
                                                            </p>
                                                        </div>

                                                        {/* Compatibility Score */}
                                                        <div className="shrink-0 flex items-center gap-1.5">
                                                            <span
                                                                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getScoreBadgeColor(
                                                                    member.compatibilityScore
                                                                )}`}
                                                            >
                                                                {member.compatibilityScore}% fit
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Controls (Team & Module Dropdowns) */}
                                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                                        <div>
                                                            <label className="text-[10px] font-semibold uppercase text-gray-400 block mb-0.5">
                                                                Primary Module
                                                            </label>
                                                            <select
                                                                disabled={overview?.isConfirmed}
                                                                value={member.assignedModuleId}
                                                                onChange={(e) =>
                                                                    handleModuleChange(teamIdx, memberIdx, Number(e.target.value))
                                                                }
                                                                className="w-full text-xs py-1.5 px-2 border border-gray-300 rounded-md bg-white text-gray-800 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden disabled:bg-gray-50"
                                                            >
                                                                {overview?.modules.map((mod) => (
                                                                    <option key={mod.id} value={mod.id}>
                                                                        {mod.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="text-[10px] font-semibold uppercase text-gray-400 block mb-0.5">
                                                                Assigned Team
                                                            </label>
                                                            <select
                                                                disabled={overview?.isConfirmed}
                                                                value={teamIdx}
                                                                onChange={(e) =>
                                                                    handleTeamChange(teamIdx, memberIdx, Number(e.target.value))
                                                                }
                                                                className="w-full text-xs py-1.5 px-2 border border-gray-300 rounded-md bg-white text-gray-800 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden disabled:bg-gray-50"
                                                            >
                                                                {teams.map((t, idx) => (
                                                                    <option key={idx} value={idx}>
                                                                        {t.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Low Compatibility Warning */}
                                                    {member.isLowCompatibility && (
                                                        <div className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 flex items-center gap-1.5">
                                                            <span>⚠️</span>
                                                            <span>
                                                                {member.assignedModuleName} compatibility ({member.compatibilityScore}%) is below recommended 60% threshold.
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: SKILL HEATMAP MATRIX */}
            {activeTab === "heatmap" && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
                    <div className="p-5 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-gray-900">
                                Candidate × Module Skill Heatmap
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Computed from candidate resume skill extraction vs each module's required skills:{" "}
                                {/* <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono">
                                    C(c, m) = [Σ Match(c, k) × W(k)] / [Σ W(k)] × 100
                                </code> */}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> ≥80% High</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500" /> 60-79% Good</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> 40-59% Moderate</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500" /> &lt;40% Low</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                            <thead className="bg-gray-100 text-gray-700 font-semibold text-xs uppercase tracking-wider">
                                <tr>
                                    <th scope="col" className="px-5 py-3 sticky left-0 bg-gray-100 z-10">
                                        Candidate
                                    </th>
                                    {overview?.modules.map((mod) => (
                                        <th key={mod.id} scope="col" className="px-4 py-3 text-center min-w-32.5">
                                            <div>{mod.name}</div>
                                            <span className="text-[10px] font-normal lowercase text-gray-500">
                                                {mod.requiredSkills.length} skills
                                            </span>
                                        </th>
                                    ))}
                                    <th scope="col" className="px-5 py-3 text-center">
                                        Best Fit
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {overview?.heatmap.map((row) => (
                                    <tr key={row.userId} className="hover:bg-gray-50 transition">
                                        {/* Candidate Info */}
                                        <td className="px-5 py-3.5 sticky left-0 bg-white group-hover:bg-gray-50 z-10">
                                            <div className="font-semibold text-gray-900">{row.candidateName}</div>
                                            <div className="text-xs text-gray-500">{row.email}</div>
                                        </td>

                                        {/* Module Compatibility Cells */}
                                        {overview.modules.map((mod) => {
                                            const scoreObj = row.moduleScores[mod.id];
                                            const score = scoreObj?.score ?? 0;
                                            return (
                                                <td
                                                    key={mod.id}
                                                    onMouseEnter={() => setHoveredScore(scoreObj || null)}
                                                    onMouseLeave={() => setHoveredScore(null)}
                                                    className="px-4 py-3.5 text-center cursor-pointer relative"
                                                >
                                                    <span
                                                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getScoreBadgeColor(
                                                            score
                                                        )}`}
                                                    >
                                                        {score}%
                                                    </span>
                                                </td>
                                            );
                                        })}

                                        {/* Best Fit Column */}
                                        <td className="px-5 py-3.5 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                                {row.bestModuleName} ({row.bestScore}%)
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Skill Breakdown Tooltip Card */}
                    {hoveredScore && (
                        <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs flex items-center justify-between">
                            <div>
                                <span className="font-semibold text-gray-900">
                                    {hoveredScore.moduleName} compatibility ({hoveredScore.score}%):
                                </span>{" "}
                                <span className="text-emerald-700">
                                    Matched ({hoveredScore.matchedSkills.length}):{" "}
                                    {hoveredScore.matchedSkills.join(", ") || "None"}
                                </span>
                                {" | "}
                                <span className="text-rose-700">
                                    Missing ({hoveredScore.missingSkills.length}):{" "}
                                    {hoveredScore.missingSkills.join(", ") || "None"}
                                </span>
                            </div>
                            <span className="text-gray-400">Total {hoveredScore.totalSkillsCount} required skills</span>
                        </div>
                    )}
                </div>
            )}

            {/* CONFIRMATION MODAL */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">
                                Confirm Batch Team Allocation
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-sm text-gray-600">
                            You are about to finalize team assignments for <strong>{totalAssignedCandidates} candidates</strong> across <strong>{teams.length} teams</strong>.
                        </p>

                        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1.5">
                            <p className="font-semibold text-gray-800">Transactional Persistence Actions:</p>
                            <ul className="list-disc list-inside text-gray-600 space-y-1">
                                <li>Atomic database transaction saves teams and member assignments.</li>
                                <li>All previous draft records for this project are replaced cleanly.</li>
                                <li>Notifications are instantly dispatched to all assigned batch interns.</li>
                                <li>Finalized team views unlock on each candidate's dashboard.</li>
                            </ul>
                        </div>

                        {lowCompatibilityCount > 0 && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                                ⚠️ Note: {lowCompatibilityCount} candidate(s) have compatibility under 60% with their assigned module.
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmAllocation}
                                disabled={confirming}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-xs transition inline-flex items-center gap-2"
                            >
                                {confirming ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Yes, Confirm & Notify"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
