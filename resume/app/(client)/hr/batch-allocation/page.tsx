"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BatchProjectItem {
    id: number;
    title: string;
    description: string;
    status: string;
    target_type: string;
    totalCandidates: number;
    selectedCandidates: number;
    modulesCount: number;
    teamsCount: number;
    isAllocated: boolean;
}

export default function HRBatchAllocationHubPage() {
    const [projects, setProjects] = useState<BatchProjectItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchBatchProjects() {
            try {
                setLoading(true);
                const res = await fetch("/api/hr/projects");
                const result = await res.json();

                if (!res.ok || !result.success) {
                    throw new Error(result.message || "Failed to load projects.");
                }

                // Filter for BATCH_INTERN projects
                const batchProjects = (result.data || []).filter(
                    (p: any) => p.target_type === "BATCH_INTERN"
                );

                // Fetch extra stats for each project
                const enriched = await Promise.all(
                    batchProjects.map(async (p: any) => {
                        try {
                            const allocRes = await fetch(`/api/hr/projects/${p.id}/batch-allocation`);
                            const allocData = await allocRes.json();
                            if (allocData.success) {
                                return {
                                    ...p,
                                    selectedCandidates: allocData.data.totalSelectedCandidates,
                                    modulesCount: allocData.data.modules.length,
                                    teamsCount: allocData.data.recommendedTeams.length,
                                    isAllocated: allocData.data.isConfirmed,
                                };
                            }
                        } catch {
                            // Fallback
                        }
                        return {
                            ...p,
                            selectedCandidates: 0,
                            modulesCount: 0,
                            teamsCount: 0,
                            isAllocated: false,
                        };
                    })
                );

                setProjects(enriched);
            } catch (err: any) {
                setError(err.message || "Failed to load batch projects.");
            } finally {
                setLoading(false);
            }
        }

        fetchBatchProjects();
    }, []);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Batch Intern Allocation Hub
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                    Manage team formation, Candidate × Module compatibility, and smart allocation across all Batch Intern programs.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-75">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm">
                    {error}
                </div>
            ) : projects.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
                    <p className="text-base font-semibold text-gray-800">No Batch Intern projects found</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Create a project with target type &quot;Batch Intern&quot; to use the smart team allocation system.
                    </p>
                    <Link
                        href="/hr/projects/create"
                        className="inline-flex items-center justify-center mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                    >
                        Create Batch Project
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs hover:border-gray-300 transition flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="text-base font-bold text-gray-900 truncate">
                                        {project.title}
                                    </h2>
                                    {project.isAllocated ? (
                                        <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                            Allocated
                                        </span>
                                    ) : (
                                        <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                            Pending Allocation
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2 mt-2">
                                    {project.description || "No description provided."}
                                </p>

                                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 text-center">
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{project.selectedCandidates}</p>
                                        <p className="text-[10px] uppercase font-semibold text-gray-400">Selected</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{project.modulesCount}</p>
                                        <p className="text-[10px] uppercase font-semibold text-gray-400">Modules</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{project.teamsCount}</p>
                                        <p className="text-[10px] uppercase font-semibold text-gray-400">Teams</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 pt-3">
                                <Link
                                    href={`/hr/projects/${project.id}/teams`}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold text-center block transition shadow-xs"
                                >
                                    Manage Teams & Allocation →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
