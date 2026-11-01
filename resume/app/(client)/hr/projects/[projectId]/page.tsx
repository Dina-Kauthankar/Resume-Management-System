
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/* ============================================================
   TYPES
============================================================ */

interface Keyword {
    id: number;
    keyword: string;
    weight: number;
}

interface ProjectModule {
    id: number;
    name: string;
    description: string | null;
    required_skills: string | null;
}

interface Project {
    id: number;
    title: string;
    description: string | null;
    target_type: string;
    status: string;
    created_by_id: number;
    created_at: string;
    updated_at: string;
    keywords: Keyword[];
    modules: ProjectModule[];
}

/* ============================================================
   HELPER FUNCTIONS
============================================================ */

function formatTargetType(targetType: string) {
    return targetType
        .toLowerCase()
        .split("_")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");
}

function formatStatus(status: string) {
    return status
        .toLowerCase()
        .split("_")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");
}

function formatDate(dateString: string) {
    if (!dateString) {
        return "-";
    }

    return new Date(dateString).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}

function formatDateTime(dateString: string) {
    if (!dateString) {
        return "-";
    }

    return new Date(dateString).toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}

/* ============================================================
   STATUS STYLING
============================================================ */

function getStatusStyles(status: string) {
    switch (status) {
        case "ACTIVE":
            return {
                badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
                dot: "bg-emerald-500",
            };

        case "CLOSED":
            return {
                badge: "bg-red-50 text-red-700 border-red-200",
                dot: "bg-red-500",
            };

        case "DRAFT":
            return {
                badge: "bg-amber-50 text-amber-700 border-amber-200",
                dot: "bg-amber-500",
            };

        default:
            return {
                badge: "bg-slate-50 text-slate-700 border-slate-200",
                dot: "bg-slate-400",
            };
    }
}

/* ============================================================
   PAGE
============================================================ */

export default function HRProjectViewPage() {
    const params = useParams();
    const router = useRouter();

    const projectId = params.projectId;

    /* ========================================================
       STATE
    ======================================================== */

    const [project, setProject] =
        useState<Project | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    /* ========================================================
       LOAD PROJECT
    ======================================================== */

    useEffect(() => {
        async function loadProject() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(
                    `/api/hr/projects/${projectId}`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                const result = await response.json();

                if (
                    !response.ok ||
                    !result.success
                ) {
                    throw new Error(
                        result.message ||
                        "Failed to load project."
                    );
                }

                setProject(result.project);
            } catch (error) {
                console.error(
                    "[browser] Failed to load HR project:",
                    error
                );

                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load project."
                );
            } finally {
                setLoading(false);
            }
        }

        if (projectId) {
            loadProject();
        }
    }, [projectId]);

    /* ========================================================
       LOADING STATE
    ======================================================== */

    if (loading) {
        return (
            <div className="space-y-5 sm:space-y-6">

                {/* Top skeleton */}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="h-5 w-36 rounded-lg bg-gray-200 animate-pulse" />

                    <div className="flex gap-2">
                        <div className="h-10 w-32 rounded-lg bg-gray-200 animate-pulse" />
                        <div className="h-10 w-28 rounded-lg bg-gray-200 animate-pulse" />
                    </div>
                </div>

                {/* Hero skeleton */}

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <div className="h-2 bg-gray-200 animate-pulse" />

                    <div className="p-5 sm:p-6 lg:p-8 space-y-5">
                        <div className="h-7 w-3/4 max-w-md rounded-lg bg-gray-200 animate-pulse" />

                        <div className="flex gap-2">
                            <div className="h-7 w-28 rounded-full bg-gray-200 animate-pulse" />
                            <div className="h-7 w-24 rounded-full bg-gray-200 animate-pulse" />
                        </div>

                        <div className="space-y-2">
                            <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
                            <div className="h-4 w-5/6 rounded bg-gray-200 animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Content skeleton */}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    <div className="h-64 rounded-2xl bg-gray-200 animate-pulse" />
                    <div className="h-64 rounded-2xl bg-gray-200 animate-pulse" />
                </div>

                <div className="h-72 rounded-2xl bg-gray-200 animate-pulse" />
            </div>
        );
    }

    /* ========================================================
       ERROR STATE
    ======================================================== */

    if (error) {
        return (
            <div className="space-y-5 sm:space-y-6">

                <Link
                    href="/hr/projects"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                    <span className="text-base">←</span>
                    Back to Projects
                </Link>

                <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
                    <div className="h-1.5 bg-red-500" />

                    <div className="p-7 sm:p-10 text-center">

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl">
                            ⚠️
                        </div>

                        <h2 className="mt-5 text-lg font-bold text-slate-900">
                            Unable to load project
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() => router.refresh()}
                            className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ========================================================
       PROJECT NOT FOUND
    ======================================================== */

    if (!project) {
        return (
            <div className="space-y-5 sm:space-y-6">

                <Link
                    href="/hr/projects"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                    <span className="text-base">←</span>
                    Back to Projects
                </Link>

                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                        📁
                    </div>

                    <h2 className="mt-5 text-lg font-bold text-slate-900">
                        Project not found
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                        The project you are looking for does not exist.
                    </p>
                </div>
            </div>
        );
    }

    const statusStyles =
        getStatusStyles(project.status);

    /* ========================================================
       MAIN UI
    ======================================================== */

    return (
        <div className="space-y-5 sm:space-y-6">

            {/* ==================================================
                TOP NAVIGATION
            ================================================== */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <Link
                    href="/hr/projects"
                    className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                    <span className="text-base">←</span>
                    Back to Projects
                </Link>

                <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">

                    {project.target_type === "BATCH_INTERN" && (
                        <Link
                            href={`/hr/projects/${project.id}/teams`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
                        >
                            <span>👥</span>
                            <span>Batch Allocation & Teams</span>
                        </Link>
                    )}

                    <Link
                        href={`/hr/projects/${project.id}/edit`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md"
                    >
                        <span>✎</span>
                        Edit Project
                    </Link>
                </div>
            </div>

            {/* ==================================================
                BATCH ALLOCATION BANNER
            ================================================== */}

            {project.target_type === "BATCH_INTERN" && (
                <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-linear-to-br from-indigo-50 via-white to-blue-50 shadow-sm">

                    <div className="p-5 sm:p-6">

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                            <div className="min-w-0">

                                <div className="flex items-start gap-3">

                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-lg">
                                        👥
                                    </div>

                                    <div>
                                        <h2 className="text-sm font-bold text-indigo-950 sm:text-base">
                                            Batch Intern Team Formation & Smart Allocation
                                        </h2>

                                        <p className="mt-1.5 max-w-3xl text-xs leading-5 text-indigo-700 sm:text-sm">
                                            Form balanced teams, view the Candidate × Module Skill Heatmap, and allocate primary modules for selected batch interns.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Link
                                href={`/hr/projects/${project.id}/teams`}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
                            >
                                Open Allocation Console
                                <span>→</span>
                            </Link>

                        </div>
                    </div>
                </div>
            )}

            {/* ==================================================
                PROJECT HERO
            ================================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="h-1.5 bg-linear-to-r from-indigo-500 via-blue-500 to-cyan-400" />

                <div className="p-5 sm:p-6 lg:p-8">

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

                        <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2.5">

                                <h1 className="wrap-break-word text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                                    {project.title}
                                </h1>

                                <span
                                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles.badge}`}
                                >
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${statusStyles.dot}`}
                                    />
                                    {formatStatus(project.status)}
                                </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">

                                <span className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 sm:text-sm">
                                    {formatTargetType(project.target_type)}
                                </span>

                                <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 sm:text-sm">
                                    Project #{project.id}
                                </span>

                            </div>
                        </div>

                        {/* Metadata */}

                        <div className="shrink-0 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left sm:px-5 lg:min-w-48 lg:text-right">

                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Timeline
                            </p>

                            <p className="mt-1.5 text-sm font-semibold text-slate-700">
                                Created {formatDate(project.created_at)}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Updated {formatDate(project.updated_at)}
                            </p>

                        </div>

                    </div>
                </div>
            </section>

            {/* ==================================================
                DESCRIPTION
            ================================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">

                    <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            ☰
                        </div>

                        <div>
                            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                                Project Description
                            </h2>

                            <p className="text-xs text-slate-500 sm:text-sm">
                                Overview and recruitment requirements
                            </p>
                        </div>

                    </div>
                </div>

                <div className="px-5 py-5 sm:px-6 sm:py-6">

                    {project.description ? (
                        <p className="whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-[15px]">
                            {project.description}
                        </p>
                    ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
                            <p className="text-sm italic text-slate-400">
                                No project description provided.
                            </p>
                        </div>
                    )}

                </div>
            </section>

            {/* ==================================================
                KEYWORDS
            ================================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-start gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                                #
                            </div>

                            <div>
                                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                                    Project Keywords
                                </h2>

                                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                                    Keywords used for candidate resume evaluation.
                                </p>
                            </div>

                        </div>

                        <span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                            {project.keywords.length} keyword
                            {project.keywords.length !== 1
                                ? "s"
                                : ""}
                        </span>

                    </div>
                </div>

                {project.keywords.length === 0 ? (

                    <div className="px-5 py-10 text-center sm:px-6">

                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                            #
                        </div>

                        <p className="mt-3 text-sm text-slate-500">
                            No keywords have been added to this project.
                        </p>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-105 text-sm">

                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80">

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 sm:px-6">
                                        Keyword
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 sm:px-6">
                                        Weight
                                    </th>

                                </tr>
                            </thead>

                            <tbody>

                                {project.keywords.map(
                                    (keyword) => (

                                        <tr
                                            key={keyword.id}
                                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
                                        >

                                            <td className="px-5 py-4 sm:px-6">

                                                <span className="inline-flex items-center rounded-lg border border-violet-100 bg-violet-50 px-3 py-1.5 font-semibold text-violet-700">
                                                    {keyword.keyword}
                                                </span>

                                            </td>

                                            <td className="px-5 py-4 sm:px-6">

                                                <span className="inline-flex min-w-11 items-center justify-center rounded-lg bg-slate-100 px-2.5 py-1.5 font-bold text-slate-700">
                                                    {keyword.weight}
                                                </span>

                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* ==================================================
                MODULES
            ================================================== */}

            <section>

                <div className="mb-4 flex flex-col gap-1 sm:mb-5">

                    <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            ▦
                        </div>

                        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                            Project Modules
                        </h2>

                    </div>

                    <p className="ml-0 text-xs leading-5 text-slate-500 sm:text-sm sm:ml-12">
                        Modules that candidates may be assigned to during batch internship allocation.
                    </p>

                </div>

                {project.modules.length === 0 ? (

                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">

                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                            ▦
                        </div>

                        <p className="mt-3 text-sm text-slate-500">
                            No modules have been added to this project.
                        </p>

                    </div>

                ) : (

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

                        {project.modules.map(
                            (module, index) => (

                                <div
                                    key={module.id}
                                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-6"
                                >

                                    {/* Module Header */}

                                    <div className="flex items-start gap-3 sm:gap-4">

                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-50 to-teal-50 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
                                            {String(index + 1).padStart(2, "0")}
                                        </div>

                                        <div className="min-w-0 flex-1">

                                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                                                Module {index + 1}
                                            </p>

                                            <h3 className="mt-0.5 wrap-break-word text-base font-bold text-slate-900 sm:text-lg">
                                                {module.name}
                                            </h3>

                                        </div>

                                    </div>

                                    {/* Description */}

                                    {module.description ? (

                                        <p className="mt-5 text-sm leading-6 text-slate-600">
                                            {module.description}
                                        </p>

                                    ) : (

                                        <p className="mt-5 text-sm italic text-slate-400">
                                            No description provided.
                                        </p>

                                    )}

                                    {/* Skills */}

                                    <div className="mt-5 border-t border-slate-100 pt-4">

                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Required Skills
                                        </p>

                                        {module.required_skills ? (

                                            <div className="mt-2.5 flex flex-wrap gap-2">

                                                {module.required_skills
                                                    .split(",")
                                                    .map(
                                                        (
                                                            skill,
                                                            skillIndex
                                                        ) => {

                                                            const trimmedSkill =
                                                                skill.trim();

                                                            if (
                                                                !trimmedSkill
                                                            ) {
                                                                return null;
                                                            }

                                                            return (
                                                                <span
                                                                    key={`${module.id}-${skillIndex}`}
                                                                    className="inline-flex items-center rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
                                                                >
                                                                    {
                                                                        trimmedSkill
                                                                    }
                                                                </span>
                                                            );
                                                        }
                                                    )}

                                            </div>

                                        ) : (

                                            <p className="mt-2 text-sm italic text-slate-400">
                                                No required skills specified.
                                            </p>

                                        )}

                                    </div>

                                </div>
                            )
                        )}

                    </div>
                )}
            </section>

            {/* ==================================================
                PROJECT INFORMATION
            ================================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

                    <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                            ℹ
                        </div>

                        <div>
                            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                                Project Information
                            </h2>

                            <p className="text-xs text-slate-500 sm:text-sm">
                                Important project metadata
                            </p>
                        </div>

                    </div>

                </div>

                <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 lg:divide-x">

                    {/* Project ID */}

                    <div className="p-5 sm:p-6">

                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Project ID
                        </p>

                        <p className="mt-2 text-base font-bold text-indigo-600">
                            #{project.id}
                        </p>

                    </div>

                    {/* Target Type */}

                    <div className="p-5 sm:p-6">

                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Target Type
                        </p>

                        <p className="mt-2 text-sm font-bold text-blue-700">
                            {formatTargetType(
                                project.target_type
                            )}
                        </p>

                    </div>

                    {/* Created */}

                    <div className="p-5 sm:p-6">

                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Created
                        </p>

                        <p className="mt-2 wrap-break-word text-sm font-semibold text-slate-700">
                            {formatDateTime(
                                project.created_at
                            )}
                        </p>

                    </div>

                    {/* Last Updated */}

                    <div className="p-5 sm:p-6">

                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Last Updated
                        </p>

                        <p className="mt-2 wrap-break-word text-sm font-semibold text-slate-700">
                            {formatDateTime(
                                project.updated_at
                            )}
                        </p>

                    </div>

                </div>
            </section>

            {/* ==================================================
                BOTTOM ACTIONS
            ================================================== */}

            <div className="flex flex-col gap-2.5 border-t border-slate-200 pt-5 pb-4 sm:flex-row sm:justify-end">

                <Link
                    href="/hr/projects"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                    Back to Projects
                </Link>

                <Link
                    href={`/hr/projects/${project.id}/edit`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md"
                >
                    <span>✎</span>
                    Edit Project
                </Link>

            </div>

        </div>
    );
}
