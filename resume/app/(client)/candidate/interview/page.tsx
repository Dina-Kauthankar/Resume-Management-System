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

type ApplicationStatus =
    | "APPLIED"
    | "SHORTLISTED"
    | "INTERVIEW_SCHEDULED"
    | "SELECTED"
    | "REJECTED";

interface CandidateInterview {
    id: number;
    application_id: number;
    interview_date: string;
    interview_time: string;
    meeting_link: string | null;
    physical_location: string | null;
    status: InterviewStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
    project_id: number;
    project_title: string;
    application_status: ApplicationStatus;
}

interface InterviewResponse {
    success: boolean;
    interviews?: CandidateInterview[];
    error?: string;
}

// ============================================================
// STATUS HELPERS
// ============================================================

function getInterviewStatusLabel(status: InterviewStatus) {
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

function getInterviewStatusStyle(status: InterviewStatus) {
    switch (status) {
        case "SCHEDULED":
            return "border-blue-200 bg-blue-50 text-blue-700";
        case "COMPLETED":
            return "border-emerald-200 bg-emerald-50 text-emerald-700";
        case "CANCELLED":
            return "border-red-200 bg-red-50 text-red-700";
        default:
            return "border-gray-200 bg-gray-50 text-gray-700";
    }
}

function getApplicationStatusLabel(status: ApplicationStatus) {
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
// FORMATTERS
// ============================================================

function formatInterviewDate(dateString: string) {
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
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
            });
        }
    }

    return dateString;
}

function formatInterviewTime(timeString: string) {
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

export default function CandidateInterviewPage() {
    const router = useRouter();

    const [interviews, setInterviews] = useState<CandidateInterview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function loadInterviews() {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch("/api/candidate/interview", {
                method: "GET",
                credentials: "include",
                cache: "no-store",
            });

            const result = (await response.json()) as InterviewResponse;

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error || "Failed to load interviews."
                );
            }

            setInterviews(result.interviews || []);
        } catch (err) {
            console.error("Load candidate interviews error:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load interviews."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadInterviews();
    }, []);

    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {
        return (
            <div className="relative min-h-full overflow-hidden text-gray-900">
                <div className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full bg-indigo-200/25 blur-3xl" />

                <div className="relative mx-auto w-full max-w-6xl space-y-6">
                    {/* Header skeleton */}
                    <div>
                        <div className="h-7 w-40 animate-pulse rounded-lg bg-gray-200 sm:h-9 sm:w-52" />
                        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-gray-200 sm:w-96" />
                    </div>

                    {/* Summary skeleton */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                        <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                        <div className="col-span-2 h-24 animate-pulse rounded-2xl bg-gray-100 sm:col-span-1" />
                    </div>

                    {/* Interview skeletons */}
                    {[1, 2].map((item) => (
                        <div
                            key={item}
                            className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6"
                        >
                            <div className="flex justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                                    <div className="h-5 w-56 animate-pulse rounded bg-gray-200" />
                                </div>

                                <div className="h-7 w-24 animate-pulse rounded-full bg-gray-200" />
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                                <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ========================================================
    // ERROR
    // ========================================================

    if (error) {
        return (
            <div className="relative min-h-full overflow-hidden text-gray-900">
                <div className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full bg-red-200/20 blur-3xl" />

                <div className="relative mx-auto w-full max-w-6xl space-y-6">
                    {/* Header */}
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                                <svg
                                    className="h-3 w-3"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <rect
                                        x="3"
                                        y="4"
                                        width="18"
                                        height="17"
                                        rx="2"
                                    />
                                    <path d="M16 2v4M8 2v4M3 10h18" />
                                </svg>
                            </span>
                            Candidate Workspace
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                            My Interviews
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-gray-500 sm:text-base">
                            View your scheduled and completed interviews.
                        </p>
                    </div>

                    {/* Error card */}
                    <div className="overflow-hidden rounded-3xl border border-red-200 bg-white shadow-[0_20px_60px_-35px_rgba(239,68,68,0.35)]">
                        <div className="h-1.5 bg-linear-to-r from-red-500 to-rose-400" />

                        <div className="p-6 sm:p-8">
                            <div className="flex flex-col items-start gap-5 sm:flex-row">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                    <svg
                                        className="h-7 w-7"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <circle cx="12" cy="12" r="9" />
                                        <path d="M12 8v4M12 16h.01" />
                                    </svg>
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold text-red-950">
                                        Unable to load interviews
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-red-700">
                                        {error}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={loadInterviews}
                                        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-lg active:translate-y-0"
                                    >
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M20 11a8.1 8.1 0 00-15.5-2M4 5v4h4" />
                                            <path d="M4 13a8.1 8.1 0 0015.5 2M20 19v-4h-4" />
                                        </svg>
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================
    // MAIN UI
    // ========================================================

    const scheduledCount = interviews.filter(
        (interview) => interview.status === "SCHEDULED"
    ).length;

    const completedCount = interviews.filter(
        (interview) => interview.status === "COMPLETED"
    ).length;

    const cancelledCount = interviews.filter(
        (interview) => interview.status === "CANCELLED"
    ).length;

    return (
        <div className="relative min-h-full overflow-hidden text-gray-900">
            {/* ==================================================
                BACKGROUND DECORATION
            ================================================== */}

            <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-200/25 blur-3xl" />

            <div className="pointer-events-none absolute top-1/3 -right-48 h-96 w-96 rounded-full bg-blue-200/15 blur-3xl" />

            <div className="relative mx-auto w-full max-w-6xl space-y-6 pb-8 sm:space-y-8">
                {/* ==================================================
                    HEADER
                ================================================== */}

                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                            <svg
                                className="h-3 w-3"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="17"
                                    rx="2"
                                />
                                <path d="M16 2v4M8 2v4M3 10h18" />
                            </svg>
                        </span>
                        Candidate Workspace
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                        My Interviews
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
                        Keep track of your upcoming interviews, meeting
                        details, and completed appointments.
                    </p>
                </div>

                {/* ==================================================
                    SUMMARY CARDS
                ================================================== */}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                    {/* Scheduled */}
                    <div className="group rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50 to-white p-4 shadow-[0_12px_35px_-28px_rgba(37,99,235,0.4)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 7v5l3 2" />
                                </svg>
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                                    Scheduled
                                </p>

                                <p className="mt-1 text-2xl font-bold text-gray-950">
                                    {scheduledCount}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Completed */}
                    <div className="group rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-white p-4 shadow-[0_12px_35px_-28px_rgba(16,185,129,0.4)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                                    Completed
                                </p>

                                <p className="mt-1 text-2xl font-bold text-gray-950">
                                    {completedCount}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Cancelled */}
                    <div className="group col-span-2 rounded-2xl border border-red-100 bg-linear-to-br from-red-50 to-white p-4 shadow-[0_12px_35px_-28px_rgba(239,68,68,0.35)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:col-span-1 sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <path d="M6 6l12 12M18 6L6 18" />
                                </svg>
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                                    Cancelled
                                </p>

                                <p className="mt-1 text-2xl font-bold text-gray-950">
                                    {cancelledCount}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ==================================================
                    EMPTY STATE
                ================================================== */}

                {interviews.length === 0 ? (
                    <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-[0_20px_60px_-35px_rgba(79,70,229,0.3)]">
                        <div className="h-1.5 bg-linear-to-r from-indigo-500 via-violet-500 to-blue-500" />

                        <div className="px-5 py-10 text-center sm:px-10 sm:py-14">
                            <div className="relative mx-auto w-fit">
                                <div className="absolute inset-0 rounded-3xl bg-indigo-200/40 blur-2xl" />

                                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-100 bg-linear-to-br from-indigo-50 to-blue-50 text-indigo-600 shadow-sm">
                                    <svg
                                        className="h-9 w-9"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                    >
                                        <rect
                                            x="3"
                                            y="4"
                                            width="18"
                                            height="17"
                                            rx="2"
                                        />
                                        <path d="M16 2v4M8 2v4M3 10h18" />
                                        <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
                                    </svg>
                                </div>
                            </div>

                            <h2 className="mt-7 text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">
                                No interviews scheduled
                            </h2>

                            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-gray-500 sm:text-base">
                                You currently do not have any interviews
                                scheduled. If your application progresses to
                                the interview stage, the interview details
                                will appear here.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    router.push("/candidate/application")
                                }
                                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg active:translate-y-0"
                            >
                                View My Applications

                                <svg
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M5 12h14M13 6l6 6-6 6" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ==================================================
                       INTERVIEW LIST
                    ================================================== */

                    <div className="space-y-5">
                        {interviews.map((interview) => (
                            <div
                                key={interview.id}
                                className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-[0_18px_50px_-35px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_28px_65px_-35px_rgba(79,70,229,0.4)]"
                            >
                                {/* Top accent */}
                                <div
                                    className={`h-1.5 ${
                                        interview.status === "SCHEDULED"
                                            ? "bg-linear-to-r from-blue-500 via-indigo-500 to-violet-500"
                                            : interview.status === "COMPLETED"
                                            ? "bg-linear-to-r from-emerald-500 to-teal-400"
                                            : "bg-linear-to-r from-red-500 to-rose-400"
                                    }`}
                                />

                                <div className="p-5 sm:p-6 lg:p-7">
                                    {/* ==================================================
                                        CARD HEADER
                                    ================================================== */}

                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex min-w-0 gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-50 to-violet-100 text-indigo-600 transition-transform duration-300 group-hover:scale-105">
                                                <svg
                                                    className="h-6 w-6"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                >
                                                    <rect
                                                        x="3"
                                                        y="4"
                                                        width="18"
                                                        height="17"
                                                        rx="2"
                                                    />
                                                    <path d="M16 2v4M8 2v4M3 10h18" />
                                                    <path d="M8 14h.01M12 14h.01M16 14h.01" />
                                                </svg>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-500">
                                                    Interview Appointment
                                                </p>

                                                <h2 className="mt-1 wrap-break-word text-lg font-bold tracking-tight text-gray-950 sm:text-xl">
                                                    {interview.project_title}
                                                </h2>
                                            </div>
                                        </div>

                                        <span
                                            className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getInterviewStatusStyle(
                                                interview.status
                                            )}`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    interview.status ===
                                                    "SCHEDULED"
                                                        ? "bg-blue-500"
                                                        : interview.status ===
                                                          "COMPLETED"
                                                        ? "bg-emerald-500"
                                                        : "bg-red-500"
                                                }`}
                                            />

                                            {getInterviewStatusLabel(
                                                interview.status
                                            )}
                                        </span>
                                    </div>

                                    {/* ==================================================
                                        DATE + TIME
                                    ================================================== */}

                                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {/* Date */}
                                        <div className="group/info rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50/80 to-white p-4 transition-colors duration-200 hover:border-indigo-200">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                                                    <svg
                                                        className="h-5 w-5"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.7"
                                                    >
                                                        <rect
                                                            x="3"
                                                            y="4"
                                                            width="18"
                                                            height="17"
                                                            rx="2"
                                                        />
                                                        <path d="M16 2v4M8 2v4M3 10h18" />
                                                    </svg>
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                                                        Date
                                                    </p>

                                                    <p className="mt-1.5 text-sm font-bold leading-6 text-gray-950">
                                                        {formatInterviewDate(
                                                            interview.interview_date
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Time */}
                                        <div className="group/info rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50/80 to-white p-4 transition-colors duration-200 hover:border-violet-200">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                                                    <svg
                                                        className="h-5 w-5"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.7"
                                                    >
                                                        <circle
                                                            cx="12"
                                                            cy="12"
                                                            r="9"
                                                        />
                                                        <path d="M12 7v5l3 2" />
                                                    </svg>
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
                                                        Time
                                                    </p>

                                                    <p className="mt-1.5 text-sm font-bold leading-6 text-gray-950">
                                                        {formatInterviewTime(
                                                            interview.interview_time
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ==================================================
                                        MEETING INFORMATION
                                    ================================================== */}

                                    {(interview.meeting_link ||
                                        interview.physical_location) && (
                                        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/70">
                                            <div className="border-b border-gray-200 bg-white/70 px-4 py-3 sm:px-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                        <svg
                                                            className="h-4 w-4"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.8"
                                                        >
                                                            <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                                                            <path d="M8 12h8M12 8v8" />
                                                        </svg>
                                                    </div>

                                                    <p className="text-sm font-bold text-gray-900">
                                                        Interview Location
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-4 p-4 sm:p-5">
                                                {/* Meeting link */}
                                                {interview.meeting_link && (
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                            Online Meeting
                                                        </p>

                                                        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                            <p className="min-w-0 truncate text-sm text-gray-600">
                                                                Online meeting is available for this interview.
                                                            </p>

                                                            <a
                                                                href={
                                                                    interview.meeting_link
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg active:translate-y-0 sm:w-auto"
                                                            >
                                                                <svg
                                                                    className="h-4 w-4"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="1.8"
                                                                >
                                                                    <path d="M15 10l4.5-2.5v9L15 14" />
                                                                    <rect
                                                                        x="3"
                                                                        y="6"
                                                                        width="12"
                                                                        height="12"
                                                                        rx="2"
                                                                    />
                                                                </svg>

                                                                Join Meeting
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Physical location */}
                                                {interview.physical_location && (
                                                    <div
                                                        className={
                                                            interview.meeting_link
                                                                ? "border-t border-gray-200 pt-4"
                                                                : ""
                                                        }
                                                    >
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                            Physical Location
                                                        </p>

                                                        <div className="mt-2 flex items-start gap-2">
                                                            <svg
                                                                className="mt-0.5 h-4 w-4 shrink-0 text-gray-400"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="1.8"
                                                            >
                                                                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1116 0z" />
                                                                <circle
                                                                    cx="12"
                                                                    cy="10"
                                                                    r="2.5"
                                                                />
                                                            </svg>

                                                            <p className="text-sm leading-6 text-gray-700 whitespace-pre-wrap">
                                                                {
                                                                    interview.physical_location
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ==================================================
                                        HR NOTES
                                    ================================================== */}

                                    {interview.notes && (
                                        <div className="mt-4 rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50 to-yellow-50/50 p-4 sm:p-5">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                                                    <svg
                                                        className="h-4 w-4"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                    >
                                                        <path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
                                                        <path d="M8 8h8M8 12h8M8 16h5" />
                                                    </svg>
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                                                        HR Notes & Instructions
                                                    </p>

                                                    <p className="mt-1.5 text-sm leading-7 text-amber-950 whitespace-pre-wrap">
                                                        {interview.notes}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ==================================================
                                        APPLICATION STATUS
                                    ================================================== */}

                                    <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-600 shadow-sm">
                                                    <svg
                                                        className="h-4 w-4"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                    >
                                                        <path d="M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                                        <path d="M8 8h8M8 12h5M8 16h8" />
                                                    </svg>
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                        Application Status
                                                    </p>

                                                    <p className="mt-1 text-sm font-bold text-gray-900">
                                                        {getApplicationStatusLabel(
                                                            interview.application_status
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.push(
                                                        `/candidate/application/${interview.application_id}`
                                                    )
                                                }
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md active:translate-y-0 sm:w-auto"
                                            >
                                                View Application

                                                <svg
                                                    className="h-4 w-4"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path d="M5 12h14M13 6l6 6-6 6" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* ==================================================
                                        STATUS MESSAGE
                                    ================================================== */}

                                    {interview.status === "CANCELLED" && (
                                        <div className="mt-4 rounded-2xl border border-red-200 bg-linear-to-r from-red-50 to-rose-50 p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-500 shadow-sm">
                                                    <svg
                                                        className="h-4 w-4"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                    >
                                                        <path d="M6 6l12 12M18 6L6 18" />
                                                    </svg>
                                                </div>

                                                <div>
                                                    <p className="text-sm font-bold text-red-900">
                                                        This interview has been
                                                        cancelled.
                                                    </p>

                                                    <p className="mt-1 text-sm leading-6 text-red-700">
                                                        Please check your
                                                        application for any
                                                        further updates.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {interview.status === "COMPLETED" && (
                                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-linear-to-r from-emerald-50 to-teal-50 p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                                                    <svg
                                                        className="h-4 w-4"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                    >
                                                        <path d="M20 6L9 17l-5-5" />
                                                    </svg>
                                                </div>

                                                <div>
                                                    <p className="text-sm font-bold text-emerald-900">
                                                        Interview completed
                                                    </p>

                                                    <p className="mt-1 text-sm leading-6 text-emerald-700">
                                                        This interview has been
                                                        completed.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}