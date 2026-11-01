
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// ============================================================
// TYPES
// ============================================================

interface Project {
    id: number;
    title: string;
    description: string;
    target_type: string;
    status: string;
    created_by: number;
    created_at: string;
    updated_at: string;
}

interface ProjectsResponse {
    success: boolean;
    message?: string;
    data?: Project[];
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatTargetType(type: string) {
    return type
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatStatus(status: string) {
    return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusClass(status: string) {
    switch (status) {
        case "ACTIVE":
            return "border-emerald-200 bg-emerald-50 text-emerald-700";

        case "DRAFT":
            return "border-amber-200 bg-amber-50 text-amber-700";

        case "CLOSED":
            return "border-slate-200 bg-slate-100 text-slate-600";

        default:
            return "border-slate-200 bg-slate-100 text-slate-600";
    }
}

function getTargetTypeClass(type: string) {
    switch (type) {
        case "SINGLE_JOB_SEEKER":
            return "bg-blue-50 text-blue-700 border-blue-100";

        case "SINGLE_INTERN":
            return "bg-violet-50 text-violet-700 border-violet-100";

        case "BATCH_INTERN":
            return "bg-cyan-50 text-cyan-700 border-cyan-100";

        default:
            return "bg-slate-50 text-slate-700 border-slate-100";
    }
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// ============================================================
// ICONS
// ============================================================

function SearchIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
        >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
        >
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

function FolderIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-5 w-5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2h6a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9Z"
            />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-4 w-4"
        >
            <rect x="3.5" y="5" width="17" height="16" rx="2" />
            <path d="M7.5 3v4M16.5 3v4M3.5 10h17" />
        </svg>
    );
}

function ChevronRightIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m9 18 6-6-6-6"
            />
        </svg>
    );
}

function SlidersIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-4 w-4"
        >
            <path d="M4 6h16M4 12h16M4 18h16" />
            <circle cx="8" cy="6" r="1.5" fill="currentColor" />
            <circle cx="15" cy="12" r="1.5" fill="currentColor" />
            <circle cx="10" cy="18" r="1.5" fill="currentColor" />
        </svg>
    );
}

// ============================================================
// HR PROJECTS PAGE
// ============================================================

export default function HRProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [targetTypeFilter, setTargetTypeFilter] = useState("ALL");

    // ========================================================
    // LOAD PROJECTS
    // ========================================================

    useEffect(() => {
        async function loadProjects() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch("/api/hr/projects", {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                });

                const result: ProjectsResponse = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message || "Failed to load projects."
                    );
                }

                setProjects(result.data ?? []);
            } catch (error) {
                console.error("Failed to load HR projects:", error);

                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load projects."
                );
            } finally {
                setLoading(false);
            }
        }

        loadProjects();
    }, []);

    // ========================================================
    // FILTER PROJECTS
    // ========================================================

    const filteredProjects = projects.filter((project) => {
        const searchValue = search.trim().toLowerCase();

        const matchesSearch =
            searchValue === "" ||
            project.title.toLowerCase().includes(searchValue) ||
            project.description.toLowerCase().includes(searchValue);

        const matchesStatus =
            statusFilter === "ALL" || project.status === statusFilter;

        const matchesTargetType =
            targetTypeFilter === "ALL" ||
            project.target_type === targetTypeFilter;

        return matchesSearch && matchesStatus && matchesTargetType;
    });

    const hasFilters =
        search.trim() !== "" ||
        statusFilter !== "ALL" ||
        targetTypeFilter !== "ALL";

    function clearFilters() {
        setSearch("");
        setStatusFilter("ALL");
        setTargetTypeFilter("ALL");
    }

    // ========================================================
    // LOADING STATE
    // ========================================================

    if (loading) {
        return (
            <div className="min-h-full space-y-6 pb-8">
                {/* Header skeleton */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-3">
                        <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-200" />
                        <div className="h-4 w-64 max-w-full animate-pulse rounded bg-slate-200" />
                    </div>

                    <div className="h-11 w-full animate-pulse rounded-xl bg-slate-200 sm:w-40" />
                </div>

                {/* Filter skeleton */}

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-4 h-4 w-28 animate-pulse rounded bg-slate-200" />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-11 animate-pulse rounded-xl bg-slate-100"
                            />
                        ))}
                    </div>
                </div>

                {/* Cards */}

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                        >
                            <div className="flex justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
                                    <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                                </div>

                                <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
                            </div>

                            <div className="mt-6 space-y-2">
                                <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                                <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
                                <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                            </div>

                            <div className="mt-6 h-px bg-slate-100" />

                            <div className="mt-5 grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                                    <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                                </div>

                                <div className="space-y-2">
                                    <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                                    <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ========================================================
    // ERROR STATE
    // ========================================================

    if (error) {
        return (
            <div className="space-y-6 pb-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Recruitment
                        </p>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                            Projects
                        </h1>

                        <p className="mt-1.5 text-sm text-slate-500">
                            Manage recruitment projects and requirements.
                        </p>
                    </div>

                    <Link
                        href="/hr/projects/create"
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] sm:w-auto"
                    >
                        <PlusIcon />
                        Create Project
                    </Link>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5 shadow-sm sm:p-7">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                            !
                        </div>

                        <div className="min-w-0">
                            <h2 className="text-base font-semibold text-red-900">
                                Unable to load projects
                            </h2>

                            <p className="mt-1.5 text-sm leading-6 text-red-700">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-red-900 px-4 text-sm font-semibold text-white transition hover:bg-red-800"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================
    // MAIN PAGE
    // ========================================================

    return (
        <div className="min-h-full space-y-6 pb-8">
            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-50 blur-3xl" />
                <div className="absolute bottom-0 right-24 h-24 w-24 rounded-full bg-violet-50 blur-3xl" />

                <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                                <FolderIcon />
                            </div>

                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Recruitment
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                            Projects
                        </h1>

                        <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
                            Create and manage recruitment projects,
                            applicant requirements, and hiring opportunities.
                        </p>
                    </div>

                    <Link
                        href="/hr/projects/create"
                        className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition-all hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 sm:w-auto"
                    >
                        <PlusIcon />
                        Create Project
                    </Link>
                </div>
            </header>

            {/* ==================================================
                FILTERS
            ================================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <SlidersIcon />
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">
                                Filters
                            </h2>

                            <p className="hidden text-xs text-slate-400 sm:block">
                                Refine your project list
                            </p>
                        </div>
                    </div>

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Search */}

                    <div>
                        <label
                            htmlFor="project-search"
                            className="mb-1.5 block text-xs font-semibold text-slate-600"
                        >
                            Search projects
                        </label>

                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                <SearchIcon />
                            </div>

                            <input
                                id="project-search"
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search title or description..."
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                            />
                        </div>
                    </div>

                    {/* Status */}

                    <div>
                        <label
                            htmlFor="status-filter"
                            className="mb-1.5 block text-xs font-semibold text-slate-600"
                        >
                            Status
                        </label>

                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                            className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="DRAFT">Draft</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>

                    {/* Target Type */}

                    <div>
                        <label
                            htmlFor="target-type-filter"
                            className="mb-1.5 block text-xs font-semibold text-slate-600"
                        >
                            Applicant Type
                        </label>

                        <select
                            id="target-type-filter"
                            value={targetTypeFilter}
                            onChange={(event) =>
                                setTargetTypeFilter(event.target.value)
                            }
                            className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                        >
                            <option value="ALL">
                                All Applicant Types
                            </option>

                            <option value="SINGLE_JOB_SEEKER">
                                Single Job Seeker
                            </option>

                            <option value="SINGLE_INTERN">
                                Single Intern
                            </option>

                            <option value="BATCH_INTERN">
                                Batch Intern
                            </option>
                        </select>
                    </div>
                </div>
            </section>

            {/* ==================================================
                PROJECT SUMMARY
            ================================================== */}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-500">
                        Showing{" "}
                        <span className="font-bold text-slate-900">
                            {filteredProjects.length}
                        </span>{" "}
                        of{" "}
                        <span className="font-bold text-slate-900">
                            {projects.length}
                        </span>{" "}
                        projects
                    </p>

                    {hasFilters && (
                        <span className="hidden rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 sm:inline-flex">
                            Filtered
                        </span>
                    )}
                </div>

                {hasFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="self-start text-sm font-medium text-slate-500 transition hover:text-slate-900 sm:self-auto"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* ==================================================
                PROJECT LIST
            ================================================== */}

            {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {filteredProjects.map((project) => (
                        <article
                            key={project.id}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/60"
                        >
                            {/* Subtle top accent */}

                            <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-slate-900 via-blue-500 to-violet-500 opacity-0 transition-opacity group-hover:opacity-100" />

                            <div className="p-5 sm:p-6">
                                {/* Project Header */}

                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-2 flex items-center gap-2">
                                            <span className="text-[11px] font-medium text-slate-400">
                                                PROJECT #{project.id}
                                            </span>
                                        </div>

                                        <h2 className="wrap-break-word text-lg font-bold leading-6 text-slate-950 sm:text-xl">
                                            {project.title}
                                        </h2>
                                    </div>

                                    <span
                                        className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusClass(
                                            project.status
                                        )}`}
                                    >
                                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                                        {formatStatus(project.status)}
                                    </span>
                                </div>

                                {/* Description */}

                                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                                    {project.description ||
                                        "No project description available."}
                                </p>

                                {/* Information */}

                                <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
                                    <div className="min-w-0 rounded-xl bg-slate-50 p-3.5">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                            Applicant Type
                                        </p>

                                        <span
                                            className={`mt-2 inline-flex max-w-full rounded-lg border px-2.5 py-1 text-xs font-semibold ${getTargetTypeClass(
                                                project.target_type
                                            )}`}
                                        >
                                            <span className="truncate">
                                                {formatTargetType(
                                                    project.target_type
                                                )}
                                            </span>
                                        </span>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3.5">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                            Created
                                        </p>

                                        <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                                            <CalendarIcon />

                                            <span>
                                                {formatDate(
                                                    project.created_at
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}

                                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                                    <Link
                                        href={`/hr/projects/${project.id}`}
                                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                                    >
                                        View
                                        <ChevronRightIcon />
                                    </Link>

                                    <Link
                                        href={`/hr/projects/${project.id}/edit`}
                                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
                                    >
                                        Edit Project
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                /* ==================================================
                   EMPTY STATE
                ================================================== */

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col items-center px-5 py-14 text-center sm:px-8 sm:py-20">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <FolderIcon />
                        </div>

                        <h2 className="mt-5 text-lg font-bold text-slate-950">
                            No projects found
                        </h2>

                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                            {hasFilters
                                ? "No projects match your current search and filters. Try adjusting your criteria."
                                : "Create your first recruitment project to start accepting applications."}
                        </p>

                        {hasFilters ? (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Clear Filters
                            </button>
                        ) : (
                            <Link
                                href="/hr/projects/create"
                                className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                <PlusIcon />
                                Create Project
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
