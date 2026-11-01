"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ============================================================
// TYPES
// ============================================================

type InterviewStatus =
    | "SCHEDULED"
    | "COMPLETED"
    | "CANCELLED";

interface Interview {
    id: number;
    application_id: number;
    interview_date: string;
    interview_time: string;
    meeting_link: string | null;
    physical_location: string | null;
    status: InterviewStatus;
    notes: string | null;
    created_by: number | null;
    created_at: string;
    updated_at: string;
    candidate_name: string;
    candidate_email: string;
    project_title: string;
}

interface InterviewResponse {
    success: boolean;
    interviews?: Interview[];
    error?: string;
}

// ============================================================
// STATUS HELPERS
// ============================================================

function getStatusLabel(status: InterviewStatus) {
    switch (status) {
        case "SCHEDULED":
            return "Scheduled";

        case "COMPLETED":
            return "Completed";

        case "CANCELLED":
            return "Cancelled";

        default:
            return status;
    }
}

function getStatusStyle(status: InterviewStatus) {
    switch (status) {
        case "SCHEDULED":
            return "bg-blue-50 text-blue-700 border border-blue-200";

        case "COMPLETED":
            return "bg-emerald-50 text-emerald-700 border border-emerald-200";

        case "CANCELLED":
            return "bg-rose-50 text-rose-700 border border-rose-200";

        default:
            return "bg-gray-50 text-gray-700 border border-gray-200";
    }
}

// ============================================================
// DATE & TIME FORMATTERS
// NO TIMEZONE OFFSETS
// ============================================================

function formatDate(dateString: string) {
    if (!dateString) return "N/A";

    const cleanDate = dateString.includes("T")
        ? dateString.split("T")[0]
        : dateString;

    const parts = cleanDate.split("-");

    if (parts.length === 3) {
        const year = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const day = Number(parts[2]);

        const d = new Date(year, month, day);

        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        }
    }

    return dateString;
}

function formatTime(timeString: string) {
    if (!timeString) return "N/A";

    const parts = timeString.split(":");

    if (parts.length >= 2) {
        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);

        if (!isNaN(hours) && !isNaN(minutes)) {
            const date = new Date();

            date.setHours(hours, minutes, 0, 0);

            return date.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        }
    }

    return timeString;
}

// ============================================================
// PAGE
// ============================================================

export default function HRInterviewPage() {
    const router = useRouter();

    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ========================================================
    // LOAD INTERVIEWS
    // ========================================================

    async function loadInterviews() {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch("/api/hr/interview", {
                method: "GET",
                credentials: "include",
                cache: "no-store",
            });

            const result =
                (await response.json()) as InterviewResponse;

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error ||
                    "Failed to load interviews."
                );
            }

            setInterviews(result.interviews || []);
        } catch (err) {
            console.error(
                "Load HR interviews error:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load interviews."
            );
        } finally {
            setLoading(false);
        }
    }

    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {
        loadInterviews();
    }, []);

    // ========================================================
    // LOADING STATE
    // ========================================================

    if (loading) {
        return (
            <div className="space-y-6 text-gray-900">

                {/* HEADER SKELETON */}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <div className="h-8 w-44 sm:w-48 rounded bg-gray-200 animate-pulse" />

                        <div className="h-4 w-64 sm:w-72 rounded bg-gray-200 animate-pulse" />
                    </div>
                </div>


                {/* SUMMARY SKELETON */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
                        <div className="mt-3 h-8 w-14 rounded bg-gray-200 animate-pulse" />
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
                        <div className="mt-3 h-8 w-14 rounded bg-gray-200 animate-pulse" />
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
                        <div className="mt-3 h-8 w-14 rounded bg-gray-200 animate-pulse" />
                    </div>

                </div>


                {/* TABLE SKELETON */}

                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">

                    <div className="border-b border-gray-200 p-5 sm:p-6">
                        <div className="h-5 w-40 rounded bg-gray-200 animate-pulse" />

                        <div className="mt-2 h-4 w-64 rounded bg-gray-200 animate-pulse" />
                    </div>

                    <div className="space-y-3 p-4 sm:p-6">

                        <div className="h-14 rounded bg-gray-100 animate-pulse" />
                        <div className="h-14 rounded bg-gray-100 animate-pulse" />
                        <div className="h-14 rounded bg-gray-100 animate-pulse" />

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

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Interviews
                    </h1>

                    <p className="mt-1 text-sm text-gray-600">
                        Manage candidate interviews.
                    </p>
                </div>


                <div className="rounded-xl border border-red-200 bg-red-50 p-5 sm:p-6">

                    <div className="flex items-start gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                            !
                        </div>

                        <div className="min-w-0">

                            <h2 className="text-base sm:text-lg font-semibold text-red-900">
                                Unable to load interviews
                            </h2>

                            <p className="mt-1.5 text-sm text-red-700 wrap-break-word">
                                {error}
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={loadInterviews}
                        className="mt-5 w-full sm:w-auto rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition"
                    >
                        Try Again
                    </button>

                </div>

            </div>
        );
    }

    // ========================================================
    // COUNTS
    // ========================================================

    const totalInterviews =
        interviews.length;

    const scheduledInterviews =
        interviews.filter(
            (interview) =>
                interview.status === "SCHEDULED"
        ).length;

    const completedInterviews =
        interviews.filter(
            (interview) =>
                interview.status === "COMPLETED"
        ).length;

    const cancelledInterviews =
        interviews.filter(
            (interview) =>
                interview.status === "CANCELLED"
        ).length;

    // ========================================================
    // PAGE
    // ========================================================

    return (
        <div className="space-y-6 text-gray-900 pb-8">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="min-w-0">

                    <div className="flex items-center gap-2">

                        <h1 className="text-2xl font-bold text-gray-900">
                            Interviews
                        </h1>

                        <span className="hidden sm:inline-flex items-center rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                            {totalInterviews} total
                        </span>

                    </div>

                    <p className="mt-1 text-sm text-gray-600">
                        Manage and monitor candidate interviews.
                    </p>

                </div>

            </div>


            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                {/* TOTAL */}

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between gap-3">

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Total Interviews
                            </p>

                            <p className="mt-2 text-2xl font-bold text-gray-900">
                                {totalInterviews}
                            </p>

                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>

                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                        All interview records
                    </p>

                </div>


                {/* SCHEDULED */}

                <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-5 shadow-sm">

                    <div className="flex items-center justify-between gap-3">

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                                Scheduled
                            </p>

                            <p className="mt-2 text-2xl font-bold text-blue-700">
                                {scheduledInterviews}
                            </p>

                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>

                    </div>

                    <p className="mt-2 text-xs text-blue-600">
                        Upcoming interviews
                    </p>

                </div>


                {/* COMPLETED */}

                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">

                    <div className="flex items-center justify-between gap-3">

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                                Completed
                            </p>

                            <p className="mt-2 text-2xl font-bold text-emerald-700">
                                {completedInterviews}
                            </p>

                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>

                    </div>

                    <p className="mt-2 text-xs text-emerald-600">
                        Interviews completed
                    </p>

                </div>


                {/* CANCELLED */}

                <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-5 shadow-sm">

                    <div className="flex items-center justify-between gap-3">

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                                Cancelled
                            </p>

                            <p className="mt-2 text-2xl font-bold text-rose-700">
                                {cancelledInterviews}
                            </p>

                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </div>

                    </div>

                    <p className="mt-2 text-xs text-rose-600">
                        Cancelled interview records
                    </p>

                </div>

            </div>


            {/* ==================================================
                INTERVIEW SCHEDULE
            ================================================== */}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

                {/* SECTION HEADER */}

                <div className="border-b border-gray-200 p-5 sm:p-6">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            <h2 className="text-lg font-semibold text-gray-900">
                                Interview Schedule
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                View all interviews scheduled for candidates.
                            </p>

                        </div>

                        {interviews.length > 0 && (
                            <span className="self-start sm:self-auto rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                {interviews.length}{" "}
                                {interviews.length === 1
                                    ? "interview"
                                    : "interviews"}
                            </span>
                        )}

                    </div>

                </div>


                {/* ==================================================
                    EMPTY STATE
                ================================================== */}

                {interviews.length === 0 ? (

                    <div className="p-10 sm:p-14 text-center">

                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">

                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>

                        </div>

                        <h3 className="mt-4 text-sm font-semibold text-gray-900">
                            No interviews found
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            There are currently no interviews scheduled.
                        </p>

                    </div>

                ) : (

                    <>
                        {/* ==================================================
                            DESKTOP TABLE
                            Visible from md+
                        ================================================== */}

                        <div className="hidden md:block overflow-x-auto">

                            <table className="min-w-full divide-y divide-gray-200">

                                <thead className="bg-gray-50">

                                    <tr>

                                        <th className="px-5 lg:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Candidate
                                        </th>

                                        <th className="px-5 lg:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Project
                                        </th>

                                        <th className="px-5 lg:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Date
                                        </th>

                                        <th className="px-5 lg:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Time
                                        </th>

                                        <th className="px-5 lg:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Location
                                        </th>

                                        <th className="px-5 lg:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Status
                                        </th>

                                        <th className="px-5 lg:px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Action
                                        </th>

                                    </tr>

                                </thead>


                                <tbody className="divide-y divide-gray-200 bg-white">

                                    {interviews.map((interview) => (

                                        <tr
                                            key={interview.id}
                                            className="hover:bg-gray-50/80 transition"
                                        >

                                            {/* CANDIDATE */}

                                            <td className="px-5 lg:px-6 py-4">

                                                <div className="min-w-42.5">

                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {interview.candidate_name}
                                                    </p>

                                                    <p className="mt-1 text-xs text-gray-500 truncate max-w-55">
                                                        {interview.candidate_email}
                                                    </p>

                                                </div>

                                            </td>


                                            {/* PROJECT */}

                                            <td className="px-5 lg:px-6 py-4">

                                                <div className="min-w-37.5">

                                                    <p className="text-sm font-medium text-indigo-700">
                                                        {interview.project_title}
                                                    </p>

                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Application #
                                                        {interview.application_id}
                                                    </p>

                                                </div>

                                            </td>


                                            {/* DATE */}

                                            <td className="px-5 lg:px-6 py-4 whitespace-nowrap">

                                                <p className="text-sm font-semibold text-gray-900">
                                                    {formatDate(
                                                        interview.interview_date
                                                    )}
                                                </p>

                                            </td>


                                            {/* TIME */}

                                            <td className="px-5 lg:px-6 py-4 whitespace-nowrap">

                                                <p className="text-sm font-semibold text-purple-700">
                                                    {formatTime(
                                                        interview.interview_time
                                                    )}
                                                </p>

                                            </td>


                                            {/* LOCATION */}

                                            <td className="px-5 lg:px-6 py-4">

                                                <div className="flex flex-col gap-1 max-w-55">

                                                    <span
                                                        className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                                            interview.meeting_link
                                                                ? "bg-sky-50 text-sky-700 border border-sky-200"
                                                                : "bg-orange-50 text-orange-700 border border-orange-200"
                                                        }`}
                                                    >
                                                        {interview.meeting_link
                                                            ? "🌐 Online"
                                                            : "🏢 Offline"}
                                                    </span>


                                                    {interview.meeting_link ? (

                                                        <a
                                                            href={
                                                                interview.meeting_link
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline truncate"
                                                            title={
                                                                interview.meeting_link
                                                            }
                                                        >
                                                            {interview.meeting_link}
                                                        </a>

                                                    ) : interview.physical_location ? (

                                                        <p
                                                            className="text-xs text-gray-700 truncate"
                                                            title={
                                                                interview.physical_location
                                                            }
                                                        >
                                                            {
                                                                interview.physical_location
                                                            }
                                                        </p>

                                                    ) : (

                                                        <p className="text-xs text-gray-400">
                                                            Not specified
                                                        </p>

                                                    )}

                                                </div>

                                            </td>


                                            {/* STATUS */}

                                            <td className="px-5 lg:px-6 py-4 whitespace-nowrap">

                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                                                        interview.status
                                                    )}`}
                                                >
                                                    {getStatusLabel(
                                                        interview.status
                                                    )}
                                                </span>

                                            </td>


                                            {/* ACTION */}

                                            <td className="px-5 lg:px-6 py-4 text-right whitespace-nowrap">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.push(
                                                            `/hr/interview/${interview.application_id}`
                                                        )
                                                    }
                                                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-700 hover:border-indigo-300 transition"
                                                >
                                                    View
                                                </button>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>


                        {/* ==================================================
                            MOBILE CARDS
                            Visible below md
                        ================================================== */}

                        <div className="md:hidden divide-y divide-gray-200">

                            {interviews.map((interview) => (

                                <div
                                    key={interview.id}
                                    className="p-4 sm:p-5"
                                >

                                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-4">

                                        {/* TOP ROW */}

                                        <div className="flex items-start justify-between gap-3">

                                            <div className="min-w-0">

                                                <p className="text-base font-semibold text-gray-900 truncate">
                                                    {interview.candidate_name}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-500 truncate">
                                                    {interview.candidate_email}
                                                </p>

                                            </div>


                                            <span
                                                className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(
                                                    interview.status
                                                )}`}
                                            >
                                                {getStatusLabel(
                                                    interview.status
                                                )}
                                            </span>

                                        </div>


                                        {/* PROJECT */}

                                        <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">

                                            <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">
                                                Project
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-indigo-800 wrap-break-word">
                                                {interview.project_title}
                                            </p>

                                            <p className="mt-1 text-xs text-indigo-600">
                                                Application #
                                                {interview.application_id}
                                            </p>

                                        </div>


                                        {/* DATE + TIME */}

                                        <div className="grid grid-cols-2 gap-3">

                                            <div className="rounded-lg border border-gray-200 bg-white p-3">

                                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                                    Interview Date
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-gray-900">
                                                    {formatDate(
                                                        interview.interview_date
                                                    )}
                                                </p>

                                            </div>


                                            <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-3">

                                                <p className="text-[10px] font-bold uppercase tracking-wide text-purple-500">
                                                    Interview Time
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-purple-700">
                                                    {formatTime(
                                                        interview.interview_time
                                                    )}
                                                </p>

                                            </div>

                                        </div>


                                        {/* LOCATION */}

                                        <div className="rounded-lg border border-gray-200 bg-white p-3">

                                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                                Location
                                            </p>


                                            <div className="mt-2">

                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                                        interview.meeting_link
                                                            ? "bg-sky-50 text-sky-700 border border-sky-200"
                                                            : "bg-orange-50 text-orange-700 border border-orange-200"
                                                    }`}
                                                >
                                                    {interview.meeting_link
                                                        ? "🌐 Online Interview"
                                                        : "🏢 Offline Interview"}
                                                </span>


                                                {interview.meeting_link ? (

                                                    <a
                                                        href={
                                                            interview.meeting_link
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-2 block text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline break-all"
                                                    >
                                                        {interview.meeting_link}
                                                    </a>

                                                ) : interview.physical_location ? (

                                                    <p className="mt-2 text-sm text-gray-700 wrap-break-word">
                                                        {
                                                            interview.physical_location
                                                        }
                                                    </p>

                                                ) : (

                                                    <p className="mt-2 text-sm text-gray-400">
                                                        Not specified
                                                    </p>

                                                )}

                                            </div>

                                        </div>


                                        {/* ACTION */}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.push(
                                                    `/hr/interview/${interview.application_id}`
                                                )
                                            }
                                            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition"
                                        >
                                            View Interview
                                        </button>

                                    </div>

                                </div>

                            ))}

                        </div>

                    </>

                )}

            </div>

        </div>
    );
}