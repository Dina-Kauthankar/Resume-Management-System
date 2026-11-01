"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { ColumnDef } from "@tanstack/react-table";

import ScoreDetailsPopover, {
    EvaluationDetails,
} from "@/components/ui/ScoreDetailsPopover";

import DataTable from "@/components/data-table/DataTable";
import { rmsTableFeatures } from "@/components/data-table/table-config";

// ============================================================
// TYPES
// ============================================================

type ApplicantType =
    | "SINGLE_JOB_SEEKER"
    | "SINGLE_INTERN"
    | "BATCH_INTERN";

type ApplicationStatus =
    | "APPLIED"
    | "SHORTLISTED"
    | "INTERVIEW_SCHEDULED"
    | "SELECTED"
    | "REJECTED";

interface Application {
    id: number;

    user_id: number;
    project_id: number;

    applicant_type: ApplicantType;

    status: ApplicationStatus;

    score: number;
    matched_keywords: number;
    confidence_percentage: number;
    evaluationDetails?: EvaluationDetails;

    created_at: string;
    updated_at: string;

    project_title: string;

    candidate_name: string;
    candidate_email: string;

    resume_id: number | null;
    resume_file_name: string | null;
}

// ============================================================
// API RESPONSE
// ============================================================

interface ApplicationsResponse {
    success: boolean;
    applications?: Application[];
    error?: string;
}

// ============================================================
// STATUS LABEL
// ============================================================

function getStatusLabel(status: ApplicationStatus) {
    switch (status) {
        case "APPLIED":
            return "Applied";

        case "SHORTLISTED":
            return "Shortlisted";

        case "INTERVIEW_SCHEDULED":
            return "Interview Scheduled";

        case "SELECTED":
            return "Selected";

        case "REJECTED":
            return "Rejected";

        default:
            return status;
    }
}

// ============================================================
// STATUS STYLE
// ============================================================

function getStatusStyle(status: ApplicationStatus) {
    switch (status) {
        case "APPLIED":
            return {
                badge: "border-blue-200 bg-blue-50 text-blue-700",
                dot: "bg-blue-500",
            };

        case "SHORTLISTED":
            return {
                badge: "border-violet-200 bg-violet-50 text-violet-700",
                dot: "bg-violet-500",
            };

        case "INTERVIEW_SCHEDULED":
            return {
                badge: "border-amber-200 bg-amber-50 text-amber-700",
                dot: "bg-amber-500",
            };

        case "SELECTED":
            return {
                badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
                dot: "bg-emerald-500",
            };

        case "REJECTED":
            return {
                badge: "border-red-200 bg-red-50 text-red-700",
                dot: "bg-red-500",
            };

        default:
            return {
                badge: "border-gray-200 bg-gray-50 text-gray-700",
                dot: "bg-gray-400",
            };
    }
}

// ============================================================
// APPLICANT TYPE LABEL
// ============================================================

function getApplicantTypeLabel(
    applicantType: ApplicantType
) {
    return applicantType
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
}

// ============================================================
// APPLICANT TYPE STYLE
// ============================================================

function getApplicantTypeStyle(
    type: ApplicantType
) {
    switch (type) {
        case "SINGLE_JOB_SEEKER":
            return "border-sky-200 bg-sky-50 text-sky-700";

        case "SINGLE_INTERN":
            return "border-indigo-200 bg-indigo-50 text-indigo-700";

        case "BATCH_INTERN":
            return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";

        default:
            return "border-gray-200 bg-gray-50 text-gray-700";
    }
}

// ============================================================
// DATE FORMATTER
// ============================================================

function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}

// ============================================================
// INITIALS
// ============================================================

function getInitials(name: string) {
    if (!name) return "C";

    const parts = name
        .trim()
        .split(/\s+/);

    if (parts.length === 1) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

// ============================================================
// PAGE
// ============================================================

export default function HRApplicationsPage() {
    const router = useRouter();

    // ========================================================
    // STATE
    // ========================================================

    const [applications, setApplications] =
        useState<Application[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [statusFilter, setStatusFilter] =
        useState<
            ApplicationStatus | "ALL"
        >("ALL");

    // ========================================================
    // FETCH APPLICATIONS
    // ========================================================

    useEffect(() => {
        async function loadApplications() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(
                    "/api/hr/application",
                    {
                        method: "GET",
                        credentials: "include",
                        cache: "no-store",
                    }
                );

                const result =
                    (await response.json()) as ApplicationsResponse;

                if (
                    !response.ok ||
                    !result.success
                ) {
                    throw new Error(
                        result.error ||
                            "Failed to load applications."
                    );
                }

                setApplications(
                    result.applications || []
                );
            } catch (error) {
                console.error(
                    "Load HR applications error:",
                    error
                );

                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load applications."
                );
            } finally {
                setLoading(false);
            }
        }

        loadApplications();
    }, []);

    // ========================================================
    // FILTER BY STATUS
    // ========================================================
    //
    // Search is intentionally handled by DataTable.
    //
    // Status filtering remains here because it is a dedicated
    // business-level filter for the HR Applications page.
    // ========================================================

    const filteredApplications = useMemo(() => {
        if (statusFilter === "ALL") {
            return applications;
        }

        return applications.filter(
            (application) =>
                application.status ===
                statusFilter
        );
    }, [
        applications,
        statusFilter,
    ]);

    // ========================================================
    // COUNTS
    // ========================================================

    const totalApplications =
        applications.length;

    const appliedCount =
        applications.filter(
            (application) =>
                application.status ===
                "APPLIED"
        ).length;

    const shortlistedCount =
        applications.filter(
            (application) =>
                application.status ===
                "SHORTLISTED"
        ).length;

    const rejectedCount =
        applications.filter(
            (application) =>
                application.status ===
                "REJECTED"
        ).length;

    // ========================================================
    // DATA TABLE COLUMNS
    // ========================================================

    const columns = useMemo<
        ColumnDef<
            typeof rmsTableFeatures,
            Application
        >[]
    >(
        () => [
            // ------------------------------------------------
            // CANDIDATE
            // ------------------------------------------------

            {
                accessorKey: "candidate_name",

                header: "Candidate",

                cell: ({ row }) => {
                    const application =
                        row.original;

                    return (
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-100 to-blue-100 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100">
                                {getInitials(
                                    application.candidate_name
                                )}
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                    {
                                        application.candidate_name
                                    }
                                </p>

                                <p className="mt-0.5 max-w-47.5 truncate text-xs text-gray-500">
                                    {
                                        application.candidate_email
                                    }
                                </p>
                            </div>
                        </div>
                    );
                },
            },

            // ------------------------------------------------
            // PROJECT
            // ------------------------------------------------

            {
                accessorKey: "project_title",

                header: "Project",

                cell: ({ row }) => {
                    const application =
                        row.original;

                    return (
                        <div className="max-w-55">
                            <p className="truncate text-sm font-semibold text-gray-800">
                                {
                                    application.project_title
                                }
                            </p>

                            {application.resume_file_name && (
                                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                                    <svg
                                        className="h-3.5 w-3.5 shrink-0"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                                        <path d="M14 2v6h6" />
                                    </svg>

                                    <span className="truncate">
                                        {
                                            application.resume_file_name
                                        }
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                },
            },

            // ------------------------------------------------
            // APPLICANT TYPE
            // ------------------------------------------------

            {
                accessorKey:
                    "applicant_type",

                header: "Applicant Type",

                cell: ({ row }) => {
                    const application =
                        row.original;

                    return (
                        <span
                            className={`inline-flex whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${getApplicantTypeStyle(
                                application.applicant_type
                            )}`}
                        >
                            {getApplicantTypeLabel(
                                application.applicant_type
                            )}
                        </span>
                    );
                },
            },

            // ------------------------------------------------
            // SCORE
            // ------------------------------------------------

            {
                accessorKey: "score",

                header: "Score",

                cell: ({ row }) => {
                    const application =
                        row.original;

                    return (
                        <ScoreDetailsPopover
                            score={
                                application.score
                            }
                            confidence={
                                application.confidence_percentage
                            }
                            evaluation={
                                application.evaluationDetails
                            }
                        />
                    );
                },
            },

            // ------------------------------------------------
            // STATUS
            // ------------------------------------------------

            {
                accessorKey: "status",

                header: "Status",

                cell: ({ row }) => {
                    const application =
                        row.original;

                    const statusStyle =
                        getStatusStyle(
                            application.status
                        );

                    return (
                        <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-semibold ${statusStyle.badge}`}
                        >
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                            />

                            {getStatusLabel(
                                application.status
                            )}
                        </span>
                    );
                },
            },

            // ------------------------------------------------
            // APPLIED DATE
            // ------------------------------------------------

            {
                accessorKey: "created_at",

                header: "Applied",

                cell: ({ row }) => {
                    return (
                        <span className="whitespace-nowrap text-sm font-medium text-gray-500">
                            {formatDate(
                                row.original.created_at
                            )}
                        </span>
                    );
                },
            },

            // ------------------------------------------------
            // ACTION
            // ------------------------------------------------

            {
                id: "actions",

                header: "Action",

                enableSorting: false,

                cell: ({ row }) => {
                    const application =
                        row.original;

                    return (
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        `/hr/application/${application.id}`
                                    )
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md"
                            >
                                View

                                <svg
                                    className="h-3.5 w-3.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </button>
                        </div>
                    );
                },
            },
        ],
        [router]
    );

    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {
        return (
            <div className="min-h-full space-y-6 text-gray-900">
                {/* HEADER SKELETON */}

                <div className="space-y-3">
                    <div className="h-8 w-44 animate-pulse rounded-xl bg-gray-200" />

                    <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-gray-100" />
                </div>

                {/* SUMMARY SKELETON */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({
                        length: 4,
                    }).map((_, index) => (
                        <div
                            key={index}
                            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100" />

                                <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                            </div>

                            <div className="mt-5 h-8 w-16 animate-pulse rounded-lg bg-gray-200" />

                            <div className="mt-2 h-3 w-28 animate-pulse rounded bg-gray-100" />
                        </div>
                    ))}
                </div>

                {/* TABLE SKELETON */}

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 p-5">
                        <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />

                        <div className="mt-2 h-3 w-64 animate-pulse rounded bg-gray-100" />
                    </div>

                    <div className="space-y-4 p-5">
                        {Array.from({
                            length: 5,
                        }).map((_, index) => (
                            <div
                                key={index}
                                className="h-14 animate-pulse rounded-xl bg-gray-100"
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================
    // ERROR
    // ========================================================

    if (error) {
        return (
            <div className="space-y-6 text-gray-900">
                {/* HEADER */}

                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path d="M12 9v4" />
                                <path d="M12 17h.01" />
                                <path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                            </svg>
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Applications
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                Review and manage candidate applications.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ERROR CARD */}

                <div className="overflow-hidden rounded-2xl border border-red-200 bg-linear-to-br from-red-50 to-white shadow-sm">
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                                <svg
                                    className="h-6 w-6"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <path d="M12 9v4" />
                                    <path d="M12 17h.01" />
                                    <path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                                </svg>
                            </div>

                            <div className="flex-1">
                                <h2 className="font-semibold text-red-900">
                                    Unable to load applications
                                </h2>

                                <p className="mt-1 text-sm text-red-700">
                                    {error}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    window.location.reload()
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md"
                            >
                                Try Again

                                <svg
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
                                    <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================
    // MAIN UI
    // ========================================================

    return (
        <div className="space-y-6 text-gray-900">
            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-200">
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle
                                    cx="9"
                                    cy="7"
                                    r="4"
                                />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                                Applications
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                Review and manage candidate applications.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 sm:self-auto">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />

                    Recruitment Overview
                </div>
            </div>

            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {/* TOTAL */}

                <div className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-100">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-100/60 blur-2xl transition-transform duration-500 group-hover:scale-150" />

                    <div className="relative flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="17"
                                    rx="2"
                                />
                                <path d="M8 2v4M16 2v4M3 10h18" />
                            </svg>
                        </div>

                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500 shadow-sm ring-1 ring-indigo-100">
                            Overall
                        </span>
                    </div>

                    <p className="relative mt-5 text-3xl font-bold tracking-tight text-gray-900">
                        {totalApplications}
                    </p>

                    <p className="relative mt-1 text-sm font-medium text-gray-500">
                        Total Applications
                    </p>
                </div>

                {/* APPLIED */}

                <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50 via-white to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-100">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-100/60 blur-2xl transition-transform duration-500 group-hover:scale-150" />

                    <div className="relative flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <path d="m7 10 5 5 5-5" />
                                <path d="M12 15V3" />
                            </svg>
                        </div>

                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-500 shadow-sm ring-1 ring-blue-100">
                            New
                        </span>
                    </div>

                    <p className="relative mt-5 text-3xl font-bold tracking-tight text-gray-900">
                        {appliedCount}
                    </p>

                    <p className="relative mt-1 text-sm font-medium text-gray-500">
                        Awaiting Review
                    </p>
                </div>

                {/* SHORTLISTED */}

                <div className="group relative overflow-hidden rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50 via-white to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-100">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-100/60 blur-2xl transition-transform duration-500 group-hover:scale-150" />

                    <div className="relative flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
                            </svg>
                        </div>

                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-500 shadow-sm ring-1 ring-violet-100">
                            Progress
                        </span>
                    </div>

                    <p className="relative mt-5 text-3xl font-bold tracking-tight text-gray-900">
                        {shortlistedCount}
                    </p>

                    <p className="relative mt-1 text-sm font-medium text-gray-500">
                        Shortlisted Candidates
                    </p>
                </div>

                {/* REJECTED */}

                <div className="group relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-red-50 via-white to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-100">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-100/60 blur-2xl transition-transform duration-500 group-hover:scale-150" />

                    <div className="relative flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="9"
                                />
                                <path d="m9 9 6 6M15 9l-6 6" />
                            </svg>
                        </div>

                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-500 shadow-sm ring-1 ring-red-100">
                            Closed
                        </span>
                    </div>

                    <p className="relative mt-5 text-3xl font-bold tracking-tight text-gray-900">
                        {rejectedCount}
                    </p>

                    <p className="relative mt-1 text-sm font-medium text-gray-500">
                        Rejected Applications
                    </p>
                </div>
            </div>

            {/* ==================================================
                APPLICATION MANAGEMENT
            ================================================== */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {/* ==================================================
                    SECTION HEADER
                ================================================== */}

                <div className="border-b border-gray-100 bg-linear-to-r from-white via-white to-indigo-50/40 p-5 sm:p-6">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight text-gray-900">
                                    Candidate Applications
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    {filteredApplications.length}{" "}
                                    {filteredApplications.length ===
                                    1
                                        ? "application"
                                        : "applications"}{" "}
                                    currently matching the selected status.
                                </p>
                            </div>

                            <div className="hidden rounded-xl bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 sm:block">
                                {applications.length} total records
                            </div>
                        </div>

                        {/* ==================================================
                            STATUS FILTER
                        ================================================== */}

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative w-full sm:w-64">
                                <label
                                    htmlFor="application-status-filter"
                                    className="sr-only"
                                >
                                    Filter by status
                                </label>

                                <select
                                    id="application-status-filter"
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(
                                            event.target
                                                .value as
                                                | ApplicationStatus
                                                | "ALL"
                                        )
                                    }
                                    className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 pr-10 text-sm font-medium text-gray-700 outline-none transition-all hover:border-gray-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                >
                                    <option value="ALL">
                                        All Statuses
                                    </option>

                                    <option value="APPLIED">
                                        Applied
                                    </option>

                                    <option value="SHORTLISTED">
                                        Shortlisted
                                    </option>

                                    <option value="INTERVIEW_SCHEDULED">
                                        Interview Scheduled
                                    </option>

                                    <option value="SELECTED">
                                        Selected
                                    </option>

                                    <option value="REJECTED">
                                        Rejected
                                    </option>
                                </select>

                                <svg
                                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </div>

                            {statusFilter !==
                                "ALL" && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setStatusFilter(
                                            "ALL"
                                        )
                                    }
                                    className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                >
                                    Clear Status
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ==================================================
                    DATA TABLE
                ================================================== */}

                <DataTable
                    key={statusFilter}
                    columns={columns}
                    data={
                        filteredApplications
                    }
                    initialPageSize={10}
                    emptyMessage={
                        statusFilter ===
                        "ALL"
                            ? "No applications found."
                            : `No ${getStatusLabel(
                                  statusFilter
                              ).toLowerCase()} applications found.`
                    }
                    globalFilterFn={(
                        application,
                        searchValue
                    ) => {
                        const query =
                            searchValue
                                .trim()
                                .toLowerCase();

                        if (!query) {
                            return true;
                        }

                        return (
                            application.candidate_name
                                .toLowerCase()
                                .includes(
                                    query
                                ) ||
                            application.candidate_email
                                .toLowerCase()
                                .includes(
                                    query
                                ) ||
                            application.project_title
                                .toLowerCase()
                                .includes(
                                    query
                                )
                        );
                    }}
                />
            </div>
        </div>
    );
}