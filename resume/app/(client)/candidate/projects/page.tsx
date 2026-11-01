"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ============================================================
// TYPES
// ============================================================

interface Keyword {
    id: number;
    projectId: number;
    keyword: string;
    weight: number;
}

interface ProjectModule {
    id: number;
    projectId: number;
    name: string;
}

interface Project {
    id: number;
    title: string;
    description: string;
    targetType:
        | "SINGLE_JOB_SEEKER"
        | "SINGLE_INTERN"
        | "BATCH_INTERN";
    createdAt: string;
    keywords: Keyword[];
    modules: ProjectModule[];
}

// ============================================================
// HELPER: APPLICANT TYPE LABEL
// ============================================================

function getApplicantTypeLabel(applicantType: string) {
    switch (applicantType) {
        case "SINGLE_JOB_SEEKER":
            return "Single Job Seeker";

        case "SINGLE_INTERN":
            return "Single Intern";

        case "BATCH_INTERN":
            return "Batch Intern";

        default:
            return applicantType?.replace(/_/g, " ") || "";
    }
}

// ============================================================
// HELPER: APPLICANT TYPE STYLE
// ============================================================

function getApplicantTypeStyle(applicantType: string) {
    switch (applicantType) {
        case "SINGLE_JOB_SEEKER":
            return {
                badge: "border-blue-200 bg-blue-50 text-blue-700",
                icon: "bg-blue-100 text-blue-600",
                dot: "bg-blue-500",
            };

        case "SINGLE_INTERN":
            return {
                badge: "border-violet-200 bg-violet-50 text-violet-700",
                icon: "bg-violet-100 text-violet-600",
                dot: "bg-violet-500",
            };

        case "BATCH_INTERN":
            return {
                badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
                icon: "bg-emerald-100 text-emerald-600",
                dot: "bg-emerald-500",
            };

        default:
            return {
                badge: "border-slate-200 bg-slate-50 text-slate-700",
                icon: "bg-slate-100 text-slate-600",
                dot: "bg-slate-500",
            };
    }
}

// ============================================================
// ICONS
// ============================================================

function BriefcaseIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
        </svg>
    );
}

function ArrowRightIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
        >
            <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
        </svg>
    );
}

function SparklesIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" />
            <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
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
            className="h-6 w-6"
        >
            <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
        </svg>
    );
}

function LayersIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-4 w-4"
        >
            <path d="m12 3 9 5-9 5-9-5 9-5Z" />
            <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
        </svg>
    );
}

// ============================================================
// AVAILABLE PROJECTS PAGE
// ============================================================

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [applicantType, setApplicantType] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function loadProjects() {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch("/api/candidate/projects", {
                method: "GET",
                cache: "no-store",
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(
                    data.error || "Failed to load projects."
                );
            }

            setProjects(data.projects || []);
            setApplicantType(data.applicantType || "");
        } catch (err) {
            console.error(
                "Fetch candidate projects error:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load projects."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProjects();
    }, []);

    // ========================================================
    // LOADING STATE
    // ========================================================

    if (loading) {
        return (
            <div className="relative min-h-full overflow-hidden bg-slate-50">
                {/* Background */}

                <div className="pointer-events-none absolute inset-0">
                    <div
                        className="absolute inset-0 opacity-[0.45]"
                        style={{
                            backgroundImage:
                                "linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)",
                            backgroundSize: "52px 52px",
                        }}
                    />

                    <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
                </div>

                <div className="relative mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
                    {/* Header skeleton */}

                    <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
                        <div className="animate-pulse space-y-4">
                            <div className="h-7 w-36 rounded-full bg-blue-100" />
                            <div className="h-10 w-3/4 max-w-xl rounded-lg bg-slate-200" />
                            <div className="h-4 w-full max-w-2xl rounded bg-slate-100" />
                            <div className="h-4 w-2/3 max-w-xl rounded bg-slate-100" />
                        </div>
                    </div>

                    {/* Cards skeleton */}

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map(
                            (_, index) => (
                                <div
                                    key={index}
                                    className="h-97.5 animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                >
                                    <div className="flex justify-between">
                                        <div className="h-12 w-12 rounded-xl bg-slate-200" />
                                        <div className="h-7 w-28 rounded-full bg-slate-100" />
                                    </div>

                                    <div className="mt-6 h-6 w-2/3 rounded bg-slate-200" />

                                    <div className="mt-3 space-y-2">
                                        <div className="h-3 rounded bg-slate-100" />
                                        <div className="h-3 rounded bg-slate-100" />
                                        <div className="h-3 w-4/5 rounded bg-slate-100" />
                                    </div>

                                    <div className="mt-7 h-3 w-28 rounded bg-slate-100" />

                                    <div className="mt-3 flex gap-2">
                                        <div className="h-7 w-16 rounded-lg bg-slate-100" />
                                        <div className="h-7 w-20 rounded-lg bg-slate-100" />
                                        <div className="h-7 w-14 rounded-lg bg-slate-100" />
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================
    // PAGE
    // ========================================================

    return (
        <div className="relative min-h-full overflow-hidden bg-slate-50 text-slate-900">
            {/* ==================================================
                BACKGROUND
            ================================================== */}

            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />

                <div className="absolute -left-40 top-[40%] h-96 w-96 rounded-full bg-sky-100/40 blur-3xl" />

                <div
                    className="absolute inset-0 opacity-[0.45]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)",
                        backgroundSize: "52px 52px",
                    }}
                />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
                {/* ==================================================
                    PAGE HEADER
                ================================================== */}

                <section className="overflow-hidden rounded-2xl border border-blue-100 bg-linear-to-br from-white via-white to-blue-50/80 shadow-sm">
                    <div className="relative px-5 py-7 sm:px-7 sm:py-8 lg:px-9 lg:py-9">
                        <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full bg-blue-100/50 blur-3xl" />

                        <div className="relative">
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />

                                <span className="text-xs font-semibold text-blue-700 sm:text-sm">
                                    Career Opportunities
                                </span>
                            </div>

                            <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-3xl">
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                                        Find Your Next{" "}
                                        <span className="text-blue-500">
                                            Opportunity
                                        </span>
                                    </h1>

                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                        Explore active recruitment
                                        opportunities matched to your
                                        applicant track and technical
                                        skill set.
                                    </p>
                                </div>

                                {applicantType && (
                                    <div className="shrink-0 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                            Your Track
                                        </p>

                                        <div className="mt-2 flex items-center gap-2">
                                            <span
                                                className={`h-2 w-2 rounded-full ${
                                                    getApplicantTypeStyle(
                                                        applicantType
                                                    ).dot
                                                }`}
                                            />

                                            <span
                                                className={`rounded-full border px-3 py-1 text-xs font-bold ${
                                                    getApplicantTypeStyle(
                                                        applicantType
                                                    ).badge
                                                }`}
                                            >
                                                {getApplicantTypeLabel(
                                                    applicantType
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Header metrics */}

                            <div className="mt-7 flex flex-wrap gap-3">
                                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 shadow-sm">
                                    <BriefcaseIcon />

                                    <span className="text-sm font-semibold text-slate-700">
                                        {projects.length}{" "}
                                        {projects.length === 1
                                            ? "Opportunity"
                                            : "Opportunities"}
                                    </span>
                                </div>

                                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 shadow-sm">
                                    <SparklesIcon />

                                    <span className="text-sm font-semibold text-slate-700">
                                        Skill-based matching
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-bold text-red-800">
                                    Unable to load opportunities
                                </p>

                                <p className="mt-1 text-sm text-red-700">
                                    {error}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={loadProjects}
                                className="inline-flex w-fit items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* ==================================================
                    PROJECT COUNT
                ================================================== */}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                            Available Opportunities
                        </p>

                        <div className="mt-1 flex items-baseline gap-2">
                            <p className="text-2xl font-bold tracking-tight text-slate-900">
                                {projects.length}
                            </p>

                            <span className="text-sm text-slate-500">
                                active vacancies
                            </span>
                        </div>
                    </div>

                    <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
                        <SearchIcon />

                        <span>
                            Select an opportunity to view details
                        </span>
                    </div>
                </div>

                {/* ==================================================
                    NO PROJECTS
                ================================================== */}

                {projects.length === 0 ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm sm:px-6">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <FolderIcon />
                        </div>

                        <h2 className="mt-5 text-lg font-bold text-slate-900">
                            No projects available for your track
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                            There are currently no active vacancies
                            targeted for{" "}
                            <strong className="font-semibold text-slate-700">
                                {getApplicantTypeLabel(
                                    applicantType
                                )}
                            </strong>
                            . Please check back later or request a
                            track change from your profile.
                        </p>

                        <Link
                            href="/candidate/profile"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                            Manage Profile
                            <ArrowRightIcon />
                        </Link>
                    </div>
                ) : (
                    /* ==================================================
                       PROJECT CARDS
                    ================================================== */

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {projects.map((project) => {
                            const typeStyle =
                                getApplicantTypeStyle(
                                    project.targetType
                                );

                            return (
                                <Link
                                    key={project.id}
                                    href={`/candidate/projects/${project.id}`}
                                    className="group block h-full"
                                >
                                    <article className="relative flex h-full min-h-105 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40">
                                        {/* Decorative background */}

                                        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-50 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

                                        {/* ==================================================
                                            CARD HEADER
                                        ================================================== */}

                                        <div className="relative border-b border-slate-100 p-5 sm:p-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div
                                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold shadow-sm ${typeStyle.icon}`}
                                                >
                                                    {project.title
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <span
                                                    className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${typeStyle.badge}`}
                                                >
                                                    {getApplicantTypeLabel(
                                                        project.targetType
                                                    )}
                                                </span>
                                            </div>

                                            <h2 className="mt-5 line-clamp-1 text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                                                {project.title}
                                            </h2>

                                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                                                {project.description}
                                            </p>
                                        </div>

                                        {/* ==================================================
                                            CARD BODY
                                        ================================================== */}

                                        <div className="relative flex flex-1 flex-col p-5 sm:p-6">
                                            {/* CORE SKILLS */}

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                        <SparklesIcon />
                                                    </div>

                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                        Required Skills
                                                    </h3>
                                                </div>

                                                {project.keywords.length ===
                                                0 ? (
                                                    <p className="mt-3 text-xs italic text-slate-400">
                                                        No specific skills
                                                        listed.
                                                    </p>
                                                ) : (
                                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                                        {project.keywords
                                                            .slice(
                                                                0,
                                                                6
                                                            )
                                                            .map(
                                                                (
                                                                    keyword
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            keyword.id
                                                                        }
                                                                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors group-hover:border-blue-100 group-hover:bg-blue-50/60"
                                                                    >
                                                                        {
                                                                            keyword.keyword
                                                                        }
                                                                    </span>
                                                                )
                                                            )}

                                                        {project
                                                            .keywords
                                                            .length >
                                                            6 && (
                                                            <span className="rounded-lg border border-slate-100 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-600">
                                                                +
                                                                {project
                                                                    .keywords
                                                                    .length -
                                                                    6}{" "}
                                                                more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* MODULES */}

                                            <div className="mt-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                                        <LayersIcon />
                                                    </div>

                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                        Job Modules
                                                    </h3>
                                                </div>

                                                {project.modules.length ===
                                                0 ? (
                                                    <p className="mt-3 text-xs italic text-slate-400">
                                                        No modules listed.
                                                    </p>
                                                ) : (
                                                    <ul className="mt-3 space-y-2">
                                                        {project.modules
                                                            .slice(
                                                                0,
                                                                3
                                                            )
                                                            .map(
                                                                (
                                                                    module
                                                                ) => (
                                                                    <li
                                                                        key={
                                                                            module.id
                                                                        }
                                                                        className="flex items-center gap-2 text-xs text-slate-600"
                                                                    >
                                                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />

                                                                        <span className="truncate">
                                                                            {
                                                                                module.name
                                                                            }
                                                                        </span>
                                                                    </li>
                                                                )
                                                            )}

                                                        {project.modules
                                                            .length >
                                                            3 && (
                                                            <li className="pt-0.5 text-xs font-semibold text-blue-600">
                                                                +
                                                                {project
                                                                    .modules
                                                                    .length -
                                                                    3}{" "}
                                                                more
                                                                modules
                                                            </li>
                                                        )}
                                                    </ul>
                                                )}
                                            </div>

                                            {/* CARD FOOTER */}

                                            <div className="mt-auto pt-6">
                                                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                                    <span className="text-xs font-medium text-slate-400">
                                                        {new Date(
                                                            project.createdAt
                                                        ).toLocaleDateString(
                                                            "en-IN",
                                                            {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "numeric",
                                                            }
                                                        )}
                                                    </span>

                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 transition-all group-hover:gap-2.5">
                                                        View Details
                                                        <ArrowRightIcon />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}