
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// ============================================================
// TYPES
// ============================================================

interface RecentApplication {
    id: number;
    candidate_name: string;
    email: string;
    project_title: string;
    applicant_type: string;
    status: string;
    score: number;
    matched_keywords: number;
    confidence_percentage: number;
    created_at: string;
}

interface DashboardData {
    totalApplications: number;
    pendingReviews: number;
    shortlisted: number;
    upcomingInterviews: number;
    activeProjects: number;
    recentApplications: RecentApplication[];
}

interface DashboardResponse {
    success: boolean;
    message?: string;
    data?: DashboardData;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatApplicantType(type: string) {
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
        case "APPLIED":
            return "bg-slate-100 text-slate-700 ring-slate-200";

        case "SHORTLISTED":
            return "bg-violet-50 text-violet-700 ring-violet-200";

        case "INTERVIEW_SCHEDULED":
            return "bg-sky-50 text-sky-700 ring-sky-200";

        case "SELECTED":
            return "bg-emerald-50 text-emerald-700 ring-emerald-200";

        case "REJECTED":
            return "bg-rose-50 text-rose-700 ring-rose-200";

        case "UNDER_REVIEW":
            return "bg-amber-50 text-amber-700 ring-amber-200";

        default:
            return "bg-slate-100 text-slate-700 ring-slate-200";
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

function ApplicationsIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M8 7h8" />
            <path d="M8 11h8" />
            <path d="M8 15h5" />
        </svg>
    );
}

function ReviewIcon() {
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
            <path d="M8.5 11h5" />
            <path d="M11 8.5v5" />
        </svg>
    );
}

function ShortlistIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M16 2v4" />
            <path d="M8 2v4" />
            <path d="M3 10h18" />
        </svg>
    );
}

function ProjectIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M8 4V2h8v2" />
            <path d="M8 10h8" />
            <path d="M8 14h5" />
        </svg>
    );
}

function ArrowUpRightIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
        >
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
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
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
        </svg>
    );
}

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
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M3 12h18" />
        </svg>
    );
}

// ============================================================
// STAT CARD
// ============================================================

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    iconBackground: string;
    iconColor: string;
    accent: string;
    description?: string;
}

function StatCard({
    title,
    value,
    icon,
    iconBackground,
    iconColor,
    accent,
    description,
}: StatCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg">
            {/* Decorative accent */}
            <div
                className={`absolute right-0 top-0 h-24 w-24 rounded-full ${accent} opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-20`}
            />

            <div className="relative">
                <div className="flex items-start justify-between gap-3">
                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBackground} ${iconColor} shadow-sm transition-transform duration-300 group-hover:scale-105`}
                    >
                        {icon}
                    </div>

                    <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Overview
                    </span>
                </div>

                <div className="mt-5">
                    <p className="text-sm font-medium text-slate-500">{title}</p>

                    <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>

                    {description && (
                        <p className="mt-2 text-[11px] leading-4 text-slate-400">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// HR DASHBOARD PAGE
// ============================================================

export default function HRDashboardPage() {
    const [dashboard, setDashboard] =
        useState<DashboardData | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    // ========================================================
    // FETCH DASHBOARD DATA
    // ========================================================

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(
                    "/api/hr/dashboard",
                    {
                        method: "GET",
                        credentials: "include",
                        cache: "no-store",
                    }
                );

                const result: DashboardResponse =
                    await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message ||
                            "Failed to load dashboard."
                    );
                }

                if (!result.data) {
                    throw new Error(
                        "Dashboard data was not returned."
                    );
                }

                setDashboard(result.data);
            } catch (error) {
                console.error(
                    "Failed to load HR dashboard:",
                    error
                );

                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load dashboard."
                );
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);

    // ========================================================
    // LOADING STATE
    // ========================================================

    if (loading) {
        return (
            <div className="min-h-full space-y-6 text-slate-900">
                {/* Header skeleton */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />

                    <div className="mt-3 h-8 w-48 animate-pulse rounded-lg bg-slate-200" />

                    <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
                </div>

                {/* Stats skeleton */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex justify-between">
                                <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-100" />
                                <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
                            </div>

                            <div className="mt-6 h-4 w-28 animate-pulse rounded bg-slate-100" />

                            <div className="mt-2 h-9 w-16 animate-pulse rounded bg-slate-200" />
                        </div>
                    ))}
                </div>

                {/* Content skeleton */}
                <div className="space-y-6">
                    <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />

                    <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                </div>
            </div>
        );
    }

    // ========================================================
    // ERROR STATE
    // ========================================================

    if (error) {
        return (
            <div className="space-y-6 text-slate-900">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">
                        Recruitment
                    </p>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Dashboard
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Overview of your recruitment activities.
                    </p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
                    <div className="h-1 bg-linear-to-r from-rose-500 to-orange-400" />

                    <div className="p-6 sm:p-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-6 w-6"
                            >
                                <path d="M12 9v4" />
                                <path d="M12 17h.01" />
                                <path d="M10.3 3.8 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
                            </svg>
                        </div>

                        <h2 className="mt-5 text-lg font-bold text-slate-900">
                            Unable to load dashboard
                        </h2>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:translate-y-0"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================
    // DASHBOARD
    // ========================================================

    return (
        <div className="min-h-full space-y-6 pb-6 text-slate-900">

            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-white via-white to-violet-50/60 p-5 shadow-sm sm:p-6">
                {/* Decorative background */}
                <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-300/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 right-24 h-40 w-40 rounded-full bg-sky-300/15 blur-3xl" />

                <div className="relative">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_0_4px_rgba(139,92,246,0.12)]" />

                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
                                    Recruitment Overview
                                </p>
                            </div>

                            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                Dashboard
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                Monitor applications, candidates, interviews,
                                and active recruitment projects from one place.
                            </p>
                        </div>

                        <Link
                            href="/hr/application"
                            className="group inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700 hover:shadow-md"
                        >
                            Applications

                            <ArrowUpRightIcon />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ==================================================
                OVERVIEW CARDS
            ================================================== */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">

                <StatCard
                    title="Total Applications"
                    value={dashboard?.totalApplications ?? 0}
                    icon={<ApplicationsIcon />}
                    iconBackground="bg-violet-50"
                    iconColor="text-violet-600"
                    accent="bg-violet-500"
                />

                <StatCard
                    title="Pending Reviews"
                    value={dashboard?.pendingReviews ?? 0}
                    icon={<ReviewIcon />}
                    iconBackground="bg-amber-50"
                    iconColor="text-amber-600"
                    accent="bg-amber-500"
                />

                <StatCard
                    title="Shortlisted"
                    value={dashboard?.shortlisted ?? 0}
                    icon={<ShortlistIcon />}
                    iconBackground="bg-emerald-50"
                    iconColor="text-emerald-600"
                    accent="bg-emerald-500"
                />

                <StatCard
                    title="Upcoming Interviews"
                    value={dashboard?.upcomingInterviews ?? 0}
                    icon={<CalendarIcon />}
                    iconBackground="bg-sky-50"
                    iconColor="text-sky-600"
                    accent="bg-sky-500"
                    description={
                        dashboard?.upcomingInterviews === 0
                            ? "No interviews scheduled currently."
                            : undefined
                    }
                />

                <StatCard
                    title="Active Projects"
                    value={dashboard?.activeProjects ?? 0}
                    icon={<ProjectIcon />}
                    iconBackground="bg-fuchsia-50"
                    iconColor="text-fuchsia-600"
                    accent="bg-fuchsia-500"
                />

            </div>

            {/* ==================================================
                RECENT APPLICATIONS
            ================================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">

                {/* Section header */}
                <div className="border-b border-slate-100 bg-linear-to-r from-white to-slate-50/70 p-5 sm:p-6">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                <ApplicationsIcon />
                            </div>

                            <div>
                                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                                    Recent Applications
                                </h2>

                                <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:text-sm">
                                    Latest candidate applications.
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/hr/application"
                            className="group inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-violet-600 transition-colors hover:text-violet-800"
                        >
                            View All

                            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                                <ArrowRightIcon />
                            </span>
                        </Link>

                    </div>

                </div>

                {/* Applications */}
                {dashboard?.recentApplications &&
                dashboard.recentApplications.length > 0 ? (

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-212.5 text-sm">

                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70">

                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Candidate
                                    </th>

                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Project
                                    </th>

                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Type
                                    </th>

                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Score
                                    </th>

                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Status
                                    </th>

                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Applied
                                    </th>

                                </tr>
                            </thead>

                            <tbody>

                                {dashboard.recentApplications.map(
                                    (application) => (

                                        <tr
                                            key={application.id}
                                            className="group border-b border-slate-100 last:border-b-0 transition-colors duration-200 hover:bg-violet-50/30"
                                        >

                                            {/* Candidate */}
                                            <td className="px-5 py-4">

                                                <div className="flex items-center gap-3">

                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-100 to-indigo-100 text-xs font-bold text-violet-700 ring-2 ring-white">
                                                        {application.candidate_name
                                                            .split(" ")
                                                            .map((part) => part[0])
                                                            .slice(0, 2)
                                                            .join("")
                                                            .toUpperCase()}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-slate-900">
                                                            {application.candidate_name}
                                                        </p>

                                                        <p className="mt-0.5 max-w-45 truncate text-xs text-slate-400">
                                                            {application.email}
                                                        </p>
                                                    </div>

                                                </div>

                                            </td>

                                            {/* Project */}
                                            <td className="max-w-47.5 px-5 py-4">
                                                <p className="truncate font-medium text-slate-700">
                                                    {application.project_title}
                                                </p>
                                            </td>

                                            {/* Applicant Type */}
                                            <td className="px-5 py-4">
                                                <span className="whitespace-nowrap text-slate-600">
                                                    {formatApplicantType(
                                                        application.applicant_type
                                                    )}
                                                </span>
                                            </td>

                                            {/* Score */}
                                            <td className="px-5 py-4">

                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900">
                                                        {application.score}
                                                    </span>

                                                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-linear-to-r from-violet-500 to-indigo-500"
                                                            style={{
                                                                width: `${Math.min(
                                                                    Math.max(
                                                                        application.score,
                                                                        0
                                                                    ),
                                                                    100
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">

                                                <span
                                                    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${getStatusClass(
                                                        application.status
                                                    )}`}
                                                >
                                                    {formatStatus(
                                                        application.status
                                                    )}
                                                </span>

                                            </td>

                                            {/* Date */}
                                            <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                                                {formatDate(
                                                    application.created_at
                                                )}
                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                ) : (

                    <div className="p-10 text-center sm:p-12">

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                            <ApplicationsIcon />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-slate-700">
                            No applications available
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            New candidate applications will appear here.
                        </p>

                    </div>

                )}

                {/* Mobile hint */}
                {dashboard?.recentApplications &&
                    dashboard.recentApplications.length > 0 && (
                        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-2.5 text-center sm:hidden">
                            <p className="text-[10px] font-medium text-slate-400">
                                Swipe horizontally to view all application details
                            </p>
                        </div>
                    )}

            </section>

            {/* ==================================================
                UPCOMING INTERVIEWS
            ================================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">

                <div className="border-b border-slate-100 bg-linear-to-r from-white to-sky-50/40 p-5 sm:p-6">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-start gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                                <CalendarIcon />
                            </div>

                            <div>
                                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                                    Upcoming Interviews
                                </h2>

                                <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:text-sm">
                                    Scheduled candidate interviews.
                                </p>
                            </div>

                        </div>

                        <Link
                            href="/hr/interviews"
                            className="group inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-sky-600 transition-colors hover:text-sky-800"
                        >
                            View All

                            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                                <ArrowRightIcon />
                            </span>
                        </Link>

                    </div>

                </div>

                {/* Interview Empty State */}

                <div className="p-10 text-center sm:p-12">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-sky-50 to-indigo-50 text-sky-500 shadow-sm">
                        <CalendarIcon />
                    </div>

                    <p className="mt-5 text-sm font-bold text-slate-800">
                        No upcoming interviews
                    </p>

                    <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-400 sm:text-sm">
                        Interview scheduling will be available once the
                        appointments module is implemented.
                    </p>

                </div>

            </section>

            {/* ==================================================
                QUICK ACTION STRIP
            ================================================== */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <Link
                    href="/hr/application"
                    className="group relative overflow-hidden rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50 via-white to-indigo-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg"
                >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-200/30 blur-2xl transition-transform duration-500 group-hover:scale-150" />

                    <div className="relative flex items-center justify-between gap-4">

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm ring-1 ring-violet-100">
                                <ApplicationsIcon />
                            </div>

                            <div>
                                <p className="text-sm font-bold text-slate-900">
                                    Manage Applications
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    Review and manage candidates
                                </p>
                            </div>

                        </div>

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-violet-500 shadow-sm transition-transform duration-300 group-hover:translate-x-1">
                            <ArrowRightIcon />
                        </div>

                    </div>
                </Link>

                <Link
                    href="/hr/interviews"
                    className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50 via-white to-indigo-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg"
                >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-200/30 blur-2xl transition-transform duration-500 group-hover:scale-150" />

                    <div className="relative flex items-center justify-between gap-4">

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-100">
                                <CalendarIcon />
                            </div>

                            <div>
                                <p className="text-sm font-bold text-slate-900">
                                    Manage Interviews
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    View scheduled appointments
                                </p>
                            </div>

                        </div>

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sky-500 shadow-sm transition-transform duration-300 group-hover:translate-x-1">
                            <ArrowRightIcon />
                        </div>

                    </div>
                </Link>

            </div>

        </div>
    );
}
