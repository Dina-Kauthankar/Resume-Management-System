"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

    created_at: string;
    updated_at: string;

    project_title: string;

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
// STATUS STYLE
// ============================================================

function getStatusStyle(status: string) {
    switch (status) {
        case "APPLIED":
            return "border-blue-200 bg-blue-50 text-blue-700";

        case "SHORTLISTED":
            return "border-purple-200 bg-purple-50 text-purple-700";

        case "INTERVIEW_SCHEDULED":
            return "border-amber-200 bg-amber-50 text-amber-700";

        case "SELECTED":
            return "border-emerald-200 bg-emerald-50 text-emerald-700";

        case "REJECTED":
            return "border-red-200 bg-red-50 text-red-700";

        default:
            return "border-gray-200 bg-gray-50 text-gray-700";
    }
}

// ============================================================
// STATUS LABEL
// ============================================================

function getStatusLabel(status: string) {
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
// APPLICANT TYPE LABEL
// ============================================================

function getApplicantTypeLabel(applicantType: string) {
    return applicantType
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

// ============================================================
// DATE FORMATTER
// ============================================================

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// ============================================================
// PAGE
// ============================================================

export default function ApplicationsPage() {
    const router = useRouter();

    // ========================================================
    // STATE
    // ========================================================

    const [applications, setApplications] = useState<Application[]>([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    // ========================================================
    // FETCH APPLICATIONS
    // ========================================================

    useEffect(() => {
        async function fetchApplications() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(
                    "/api/candidate/application",
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        cache: "no-store",
                    }
                );

                const result =
                    (await response.json()) as ApplicationsResponse;

                if (!response.ok) {
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
                    "Failed to fetch applications:",
                    error
                );

                setError(
                    error instanceof Error
                        ? error.message
                        : "Something went wrong."
                );
            } finally {
                setLoading(false);
            }
        }

        fetchApplications();
    }, []);

    // ========================================================
    // LOADING STATE
    // ========================================================

    if (loading) {
        return (
            <div className="space-y-6 text-gray-900">

                {/* HEADER SKELETON */}

                <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-purple-50 px-5 py-7 sm:px-8 sm:py-9">
                    <div className="animate-pulse space-y-3">
                        <div className="h-6 w-32 rounded-full bg-indigo-100" />
                        <div className="h-9 w-72 rounded-lg bg-gray-200" />
                        <div className="h-4 w-full max-w-xl rounded bg-gray-200" />
                    </div>
                </div>

                {/* STAT SKELETON */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white" />
                    <div className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white" />
                </div>

                {/* TABLE SKELETON */}

                <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 p-5 sm:p-6">
                        <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
                    </div>

                    <div className="space-y-4 p-5 sm:p-6">
                        <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
                        <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
                        <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================
    // ERROR STATE
    // ========================================================

    if (error) {
        return (
            <div className="space-y-6 text-gray-900">

                {/* HEADER */}

                <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-purple-50 px-5 py-7 sm:px-8 sm:py-9">

                    <div className="relative">

                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            Applications
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                            My Applications
                        </h1>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
                            Track the recruitment projects you
                            have applied for.
                        </p>

                    </div>
                </div>

                {/* ERROR CARD */}

                <div className="rounded-3xl border border-red-200 bg-linear-to-br from-red-50 to-white p-6 shadow-sm sm:p-8">

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-white text-xl shadow-sm">
                            !
                        </div>

                        <div className="flex-1">

                            <h2 className="font-semibold text-red-900">
                                Unable to load applications
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-red-700">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    window.location.reload()
                                }
                                className="mt-5 inline-flex items-center justify-center rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 hover:shadow-md"
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
    // MAIN UI
    // ========================================================

    return (
        <div className="space-y-6 text-gray-900">

            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-purple-50 px-5 py-7 shadow-sm sm:px-8 sm:py-9 lg:px-10">

                {/* Decorative background */}

                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-200/30 blur-3xl" />

                <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-purple-200/30 blur-3xl" />

                <div className="relative">

                    {/* Label */}

                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur-sm">

                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />

                        Applications

                    </div>

                    {/* Heading */}

                    <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl lg:text-4xl">
                        My Applications
                    </h1>

                    {/* Description */}

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
                        Track your recruitment applications,
                        monitor their progress, and stay updated
                        throughout the selection process.
                    </p>

                    {/* Application count */}

                    <div className="mt-6 flex flex-wrap gap-2.5">

                        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3.5 py-2 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">

                            <span className="h-2 w-2 rounded-full bg-indigo-500" />

                            {applications.length}{" "}
                            {applications.length === 1
                                ? "Application"
                                : "Applications"}

                        </div>

                    </div>

                </div>
            </div>

            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* TOTAL APPLICATIONS */}

                <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-6">

                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-50 transition group-hover:bg-indigo-100" />

                    <div className="relative">

                        <div className="flex items-center justify-between">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 12h6m-6 4h4M7 4h10a2 2 0 0 1 2 2v14H5V6a2 2 0 0 1 2-2Z"
                                    />
                                </svg>
                            </div>

                            <span className="text-xs font-medium text-gray-400">
                                Overview
                            </span>

                        </div>

                        <p className="mt-5 text-sm font-medium text-gray-500">
                            Total Applications
                        </p>

                        <p className="mt-1 text-3xl font-bold tracking-tight text-gray-950">
                            {applications.length}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                            Recruitment projects applied for
                        </p>

                    </div>
                </div>

                {/* ACTIVE APPLICATIONS */}

                <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md sm:p-6">

                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-purple-50 transition group-hover:bg-purple-100" />

                    <div className="relative">

                        <div className="flex items-center justify-between">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 6v6l4 2"
                                    />
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="8.5"
                                    />
                                </svg>
                            </div>

                            <span className="text-xs font-medium text-gray-400">
                                Status
                            </span>

                        </div>

                        <p className="mt-5 text-sm font-medium text-gray-500">
                            Applications in Progress
                        </p>

                        <p className="mt-1 text-3xl font-bold tracking-tight text-gray-950">
                            {
                                applications.filter(
                                    (application) =>
                                        application.status !==
                                            "SELECTED" &&
                                        application.status !==
                                            "REJECTED"
                                ).length
                            }
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                            Awaiting final outcome
                        </p>

                    </div>
                </div>

            </div>

            {/* ==================================================
                APPLICATIONS CARD
            ================================================== */}

            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

                {/* CARD HEADER */}

                <div className="border-b border-gray-100 bg-linear-to-r from-white to-gray-50/70 px-5 py-5 sm:px-6">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            <h2 className="text-lg font-bold tracking-tight text-gray-950">
                                Applications
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                A detailed overview of your submitted
                                applications.
                            </p>

                        </div>

                        {applications.length > 0 && (
                            <div className="w-fit rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600">
                                {applications.length} total
                            </div>
                        )}

                    </div>

                </div>

                {/* ==================================================
                    EMPTY STATE
                ================================================== */}

                {applications.length === 0 ? (

                    <div className="px-5 py-16 text-center sm:px-6">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50 to-purple-50 text-indigo-600">

                            <svg
                                className="h-7 w-7"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12h6m-6 4h4M7 4h10a2 2 0 0 1 2 2v14H5V6a2 2 0 0 1 2-2Z"
                                />
                            </svg>

                        </div>

                        <h3 className="mt-5 text-lg font-bold text-gray-950">
                            No applications yet
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                            You have not applied to any recruitment
                            projects yet. Once you submit an application,
                            it will appear here.
                        </p>

                    </div>

                ) : (

                    <>
                        {/* ==================================================
                            DESKTOP / TABLET TABLE
                        ================================================== */}

                        <div className="hidden overflow-x-auto md:block">

                            <table className="w-full">

                                <thead className="border-b border-gray-100 bg-gray-50/70">

                                    <tr>

                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                                            Project
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                                            Applicant Type
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                                            Status
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                                            Score
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                                            Applied On
                                        </th>

                                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                                            Action
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-gray-100">

                                    {applications.map(
                                        (application) => (

                                            <tr
                                                key={application.id}
                                                className="group transition-colors hover:bg-indigo-50/30"
                                            >

                                                {/* PROJECT */}

                                                <td className="px-6 py-5">

                                                    <div className="flex min-w-47.5 items-start gap-3">

                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-50 to-purple-50 text-sm font-bold text-indigo-600 ring-1 ring-indigo-100">

                                                            {application.project_title
                                                                .charAt(
                                                                    0
                                                                )
                                                                .toUpperCase()}

                                                        </div>

                                                        <div className="min-w-0">

                                                            <p className="font-semibold text-gray-950">
                                                                {
                                                                    application.project_title
                                                                }
                                                            </p>

                                                            {application.resume_file_name && (

                                                                <p className="mt-1 max-w-55 truncate text-xs text-gray-500">
                                                                    {
                                                                        application.resume_file_name
                                                                    }
                                                                </p>

                                                            )}

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* APPLICANT TYPE */}

                                                <td className="px-6 py-5">

                                                    <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600">

                                                        {getApplicantTypeLabel(
                                                            application.applicant_type
                                                        )}

                                                    </span>

                                                </td>

                                                {/* STATUS */}

                                                <td className="px-6 py-5">

                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                                                            application.status
                                                        )}`}
                                                    >

                                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />

                                                        {getStatusLabel(
                                                            application.status
                                                        )}

                                                    </span>

                                                </td>

                                                {/* SCORE */}

                                                <td className="px-6 py-5">

                                                    <div>

                                                        <p className="text-sm font-bold text-gray-950">
                                                            {
                                                                application.score
                                                            }
                                                        </p>

                                                        <div className="mt-1.5 h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">

                                                            <div
                                                                className="h-full rounded-full bg-linear-to-r from-indigo-500 to-purple-500"
                                                                style={{
                                                                    width: `${Math.min(
                                                                        Math.max(
                                                                            Number(
                                                                                application.confidence_percentage
                                                                            ),
                                                                            0
                                                                        ),
                                                                        100
                                                                    )}%`,
                                                                }}
                                                            />

                                                        </div>

                                                        <p className="mt-1 text-[11px] text-gray-400">
                                                            {
                                                                application.confidence_percentage
                                                            }
                                                            % confidence
                                                        </p>

                                                    </div>

                                                </td>

                                                {/* DATE */}

                                                <td className="px-6 py-5 text-sm text-gray-600">

                                                    {formatDate(
                                                        application.created_at
                                                    )}

                                                </td>

                                                {/* ACTION */}

                                                <td className="px-6 py-5 text-right">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            router.push(
                                                                `/candidate/application/${application.id}`
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                                    >
                                                        View Details

                                                        <svg
                                                            className="h-3.5 w-3.5"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="m9 18 6-6-6-6"
                                                            />
                                                        </svg>

                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                        {/* ==================================================
                            MOBILE APPLICATION CARDS
                        ================================================== */}

                        <div className="divide-y divide-gray-100 md:hidden">

                            {applications.map(
                                (application) => (

                                    <div
                                        key={application.id}
                                        className="p-5 transition-colors hover:bg-gray-50/70 sm:p-6"
                                    >

                                        {/* PROJECT HEADER */}

                                        <div className="flex items-start gap-3">

                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-50 to-purple-50 text-sm font-bold text-indigo-600 ring-1 ring-indigo-100">

                                                {application.project_title
                                                    .charAt(
                                                        0
                                                    )
                                                    .toUpperCase()}

                                            </div>

                                            <div className="min-w-0 flex-1">

                                                <h3 className="font-bold text-gray-950">
                                                    {
                                                        application.project_title
                                                    }
                                                </h3>

                                                {application.resume_file_name && (

                                                    <p className="mt-1 truncate text-xs text-gray-500">
                                                        {
                                                            application.resume_file_name
                                                        }
                                                    </p>

                                                )}

                                            </div>

                                            <span
                                                className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusStyle(
                                                    application.status
                                                )}`}
                                            >
                                                {getStatusLabel(
                                                    application.status
                                                )}
                                            </span>

                                        </div>

                                        {/* DETAILS */}

                                        <div className="mt-5 grid grid-cols-2 gap-3">

                                            <div className="rounded-xl bg-gray-50 p-3">

                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                    Applicant Type
                                                </p>

                                                <p className="mt-1 text-xs font-semibold text-gray-700">
                                                    {getApplicantTypeLabel(
                                                        application.applicant_type
                                                    )}
                                                </p>

                                            </div>

                                            <div className="rounded-xl bg-gray-50 p-3">

                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                    Applied On
                                                </p>

                                                <p className="mt-1 text-xs font-semibold text-gray-700">
                                                    {formatDate(
                                                        application.created_at
                                                    )}
                                                </p>

                                            </div>

                                            <div className="rounded-xl bg-gray-50 p-3">

                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                    Score
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-gray-950">
                                                    {
                                                        application.score
                                                    }
                                                </p>

                                            </div>

                                            <div className="rounded-xl bg-gray-50 p-3">

                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                    Confidence
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-indigo-600">
                                                    {
                                                        application.confidence_percentage
                                                    }
                                                    %
                                                </p>

                                            </div>

                                        </div>

                                        {/* MOBILE ACTION */}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.push(
                                                    `/candidate/application/${application.id}`
                                                )
                                            }
                                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                                        >
                                            View Application Details

                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="m9 18 6-6-6-6"
                                                />
                                            </svg>

                                        </button>

                                    </div>
                                )
                            )}

                        </div>
                    </>
                )}

            </div>
        </div>
    );
}