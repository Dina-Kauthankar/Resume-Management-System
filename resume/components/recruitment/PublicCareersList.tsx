"use client";

import { useMemo, useState } from "react";
import { PublicProject } from "@/server/repositories/projectRepository";
import ProjectCard from "./ProjectCard";
import ProjectDetailsModal from "./ProjectDetailsModal";

interface PublicCareersListProps {
    initialProjects: PublicProject[];
}

type FilterCategory = "ALL" | "SINGLE_INTERN" | "BATCH_INTERN" | "SINGLE_JOB_SEEKER";

const CATEGORIES: { id: FilterCategory; label: string }[] = [
    { id: "ALL", label: "All Opportunities" },
    { id: "SINGLE_INTERN", label: "Single Intern" },
    { id: "BATCH_INTERN", label: "Batch Intern" },
    { id: "SINGLE_JOB_SEEKER", label: "Single Job Seeker" },
];

export default function PublicCareersList({
    initialProjects,
}: PublicCareersListProps) {
    const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);

    // Compute category counts
    const categoryCounts = useMemo(() => {
        const counts: Record<FilterCategory, number> = {
            ALL: initialProjects.length,
            SINGLE_INTERN: 0,
            BATCH_INTERN: 0,
            SINGLE_JOB_SEEKER: 0,
        };

        for (const p of initialProjects) {
            if (p.targetType in counts) {
                counts[p.targetType as FilterCategory]++;
            }
        }

        return counts;
    }, [initialProjects]);

    // Filtered projects
    const filteredProjects = useMemo(() => {
        return initialProjects.filter((project) => {
            // Category filter
            if (selectedCategory !== "ALL" && project.targetType !== selectedCategory) {
                return false;
            }

            // Search query filter (title, description, keywords, module names)
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const matchTitle = project.title.toLowerCase().includes(query);
                const matchDesc = project.description.toLowerCase().includes(query);
                const matchKeywords = project.keywords.some((k) =>
                    k.keyword.toLowerCase().includes(query)
                );
                const matchModules = project.modules.some((m) =>
                    m.name.toLowerCase().includes(query)
                );

                if (!matchTitle && !matchDesc && !matchKeywords && !matchModules) {
                    return false;
                }
            }

            return true;
        });
    }, [initialProjects, selectedCategory, searchQuery]);

    return (
        <section id="careers" className="relative scroll-mt-24 py-16 sm:py-24 bg-slate-50 text-slate-900">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b border-slate-200">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                            Current Openings
                        </span>
                        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            Open Opportunities
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                            Filter by candidate track or search for specific technical skills to discover the ideal project.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="w-full md:w-80">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by skill, title, role..."
                                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 shadow-xs"
                            />
                            <svg
                                className="absolute left-3.5 top-3 h-4 w-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                />
                            </svg>
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="mt-8 flex flex-wrap items-center gap-2">
                    {CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        const count = categoryCounts[cat.id];

                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                                    isSelected
                                        ? "bg-blue-700 text-white shadow-sm shadow-blue-500/20 ring-1 ring-blue-700"
                                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                            >
                                <span>{cat.label}</span>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                        isSelected
                                            ? "bg-blue-800 text-blue-100"
                                            : "bg-slate-100 text-slate-600"
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Results Count & Active Filters */}
                <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                    <p>
                        Showing{" "}
                        <span className="font-bold text-slate-900">
                            {filteredProjects.length}
                        </span>{" "}
                        of {initialProjects.length} opportunities
                    </p>
                    {(selectedCategory !== "ALL" || searchQuery) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedCategory("ALL");
                                setSearchQuery("");
                            }}
                            className="font-semibold text-blue-700 hover:underline"
                        >
                            Reset filters
                        </button>
                    )}
                </div>

                {/* Project Grid */}
                {filteredProjects.length === 0 ? (
                    <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                            🔍
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-slate-900">
                            No opportunities currently available
                        </h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 leading-relaxed">
                            {searchQuery
                                ? `No projects match "${searchQuery}". Try searching with another keyword or reset the filter.`
                                : "There are no active projects listed in this category right now. Please check back soon as new recruitment drives are added by HR."}
                        </p>
                        {(selectedCategory !== "ALL" || searchQuery) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCategory("ALL");
                                    setSearchQuery("");
                                }}
                                className="mt-6 inline-flex rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors"
                            >
                                View All Opportunities
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onViewDetails={(p) => setSelectedProject(p)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal for viewing project details */}
            <ProjectDetailsModal
                project={selectedProject}
                onClose={() => setSelectedProject(null)}
            />
        </section>
    );
}
