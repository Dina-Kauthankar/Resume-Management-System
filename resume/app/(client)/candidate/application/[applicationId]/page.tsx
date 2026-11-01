"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

type InterviewStatus =
    | "SCHEDULED"
    | "COMPLETED"
    | "CANCELLED";

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
    project_description: string | null;
    project_target_type: string;
    project_status: string;
    resume_id: number | null;
    resume_file_name: string | null;
}

interface StatusHistory {
    id: number;
    application_id: number;
    old_status: ApplicationStatus | null;
    new_status: ApplicationStatus;
    changed_by: number | null;
    decision_note: string | null;
    changed_at: string;
}

interface CandidateInterview {
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
}

interface ApplicationResponse {
    success: boolean;
    application?: Application;
    status_history?: StatusHistory[];
    interview?: CandidateInterview | null;
    error?: string;
}

// ============================================================
// FORMATTERS
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

function getStatusStyle(status: ApplicationStatus) {
    switch (status) {
        case "APPLIED":
            return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";
        case "SHORTLISTED":
            return "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200";
        case "INTERVIEW_SCHEDULED":
            return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
        case "SELECTED":
            return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
        case "REJECTED":
            return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
        default:
            return "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200";
    }
}

function getApplicantTypeLabel(applicantType: string) {
    return applicantType
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

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

function formatDateTime(dateString: string) {
    if (!dateString) return "N/A";

    const d = new Date(dateString);

    if (isNaN(d.getTime())) return dateString;

    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getDecisionInformation(status: ApplicationStatus) {
    switch (status) {
        case "SELECTED":
            return {
                title: "Selected",
                message:
                    "Congratulations! Your application has been selected for this recruitment project.",
                container:
                    "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white",
                titleStyle: "text-emerald-950",
                messageStyle: "text-emerald-800",
                iconBg: "bg-emerald-100",
                iconText: "text-emerald-700",
                icon: "✓",
            };

        case "REJECTED":
            return {
                title: "Application Not Selected",
                message:
                    "Your application was not selected for this recruitment project.",
                container:
                    "border-red-200/80 bg-gradient-to-br from-red-50 to-white",
                titleStyle: "text-red-950",
                messageStyle: "text-red-800",
                iconBg: "bg-red-100",
                iconText: "text-red-700",
                icon: "×",
            };

        case "SHORTLISTED":
            return {
                title: "You're Shortlisted",
                message:
                    "Your application has been shortlisted and is currently under consideration.",
                container:
                    "border-purple-200/80 bg-gradient-to-br from-purple-50 to-white",
                titleStyle: "text-purple-950",
                messageStyle: "text-purple-800",
                iconBg: "bg-purple-100",
                iconText: "text-purple-700",
                icon: "★",
            };

        case "INTERVIEW_SCHEDULED":
            return {
                title: "Interview Scheduled",
                message:
                    "An interview has been scheduled for your application. Please check the interview details below.",
                container:
                    "border-amber-200/80 bg-gradient-to-br from-amber-50 to-white",
                titleStyle: "text-amber-950",
                messageStyle: "text-amber-800",
                iconBg: "bg-amber-100",
                iconText: "text-amber-700",
                icon: "●",
            };

        case "APPLIED":
        default:
            return {
                title: "Application Under Review",
                message:
                    "Your application has been submitted and is currently under review.",
                container:
                    "border-blue-200/80 bg-gradient-to-br from-blue-50 to-white",
                titleStyle: "text-blue-950",
                messageStyle: "text-blue-800",
                iconBg: "bg-blue-100",
                iconText: "text-blue-700",
                icon: "→",
            };
    }
}

function getHistoryStatusStyle(status: ApplicationStatus) {
    switch (status) {
        case "SELECTED":
            return "bg-emerald-500 text-white ring-4 ring-emerald-50";

        case "REJECTED":
            return "bg-red-500 text-white ring-4 ring-red-50";

        case "SHORTLISTED":
            return "bg-purple-500 text-white ring-4 ring-purple-50";

        case "INTERVIEW_SCHEDULED":
            return "bg-amber-500 text-white ring-4 ring-amber-50";

        case "APPLIED":
        default:
            return "bg-blue-500 text-white ring-4 ring-blue-50";
    }
}

const statusSteps = [
    { value: "APPLIED", label: "Applied" },
    { value: "SHORTLISTED", label: "Shortlisted" },
    { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
    { value: "SELECTED", label: "Selected" },
];

// ============================================================
// PAGE
// ============================================================

export default function ApplicationDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const applicationId = params.applicationId as string;

    const [application, setApplication] =
        useState<Application | null>(null);

    const [statusHistory, setStatusHistory] =
        useState<StatusHistory[]>([]);

    const [interview, setInterview] =
        useState<CandidateInterview | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadApplication() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(
                    `/api/candidate/application/${applicationId}`,
                    {
                        method: "GET",
                        credentials: "include",
                        cache: "no-store",
                    }
                );

                const result =
                    (await response.json()) as ApplicationResponse;

                if (
                    !response.ok ||
                    !result.success ||
                    !result.application
                ) {
                    throw new Error(
                        result.error ||
                            "Failed to load application."
                    );
                }

                setApplication(result.application);
                setStatusHistory(result.status_history || []);
                setInterview(result.interview || null);
            } catch (err) {
                console.error(
                    "Load candidate application details error:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load application."
                );
            } finally {
                setLoading(false);
            }
        }

        if (applicationId) {
            loadApplication();
        }
    }, [applicationId]);

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <div className="min-h-full bg-slate-50/50 text-gray-900">
                <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
                    <div className="h-5 w-40 animate-pulse rounded-lg bg-gray-200" />

                    <div className="space-y-3">
                        <div className="h-8 w-3/4 max-w-md animate-pulse rounded-xl bg-gray-200" />
                        <div className="h-4 w-36 animate-pulse rounded-lg bg-gray-200" />
                    </div>

                    <div className="h-36 animate-pulse rounded-2xl bg-gray-200" />

                    <div className="h-48 animate-pulse rounded-2xl bg-gray-200" />

                    <div className="h-72 animate-pulse rounded-2xl bg-gray-200" />
                </div>
            </div>
        );
    }

    // ============================================================
    // ERROR
    // ============================================================

    if (error || !application) {
        return (
            <div className="min-h-full bg-slate-50/50 text-gray-900">
                <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
                    <button
                        type="button"
                        onClick={() =>
                            router.push("/candidate/application")
                        }
                        className="group inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-gray-600 transition hover:bg-white hover:text-gray-950 hover:shadow-sm"
                    >
                        <span className="text-lg transition-transform group-hover:-translate-x-0.5">
                            ←
                        </span>
                        Back to My Applications
                    </button>

                    <div className="mt-6 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
                        <div className="border-b border-red-100 bg-red-50 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-lg font-bold text-red-700">
                                    !
                                </div>

                                <div>
                                    <h1 className="text-base font-semibold text-red-950 sm:text-lg">
                                        Unable to load application
                                    </h1>

                                    <p className="mt-0.5 text-xs text-red-700 sm:text-sm">
                                        Something went wrong while loading the application details.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-5 sm:px-6">
                            <p className="text-sm leading-6 text-gray-600">
                                {error ||
                                    "Application not found."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const decision = getDecisionInformation(
        application.status
    );

    const currentStatusIndex = statusSteps.findIndex(
        (step) => step.value === application.status
    );

    return (
        <div className="min-h-full bg-slate-50/50 text-gray-900">
            <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:px-6 lg:space-y-6 lg:px-8 lg:py-8">
                {/* ========================================================
                    BACK BUTTON
                ======================================================== */}

                <button
                    type="button"
                    onClick={() =>
                        router.push("/candidate/application")
                    }
                    className="group inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-gray-600 transition-all hover:bg-white hover:text-gray-950 hover:shadow-sm"
                >
                    <span className="text-lg transition-transform duration-200 group-hover:-translate-x-0.5">
                        ←
                    </span>

                    <span>Back to My Applications</span>
                </button>

                {/* ========================================================
                    PAGE HEADER
                ======================================================== */}

                <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
                    <div className="relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7 lg:px-8">
                        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-linear-to-br from-purple-100 to-purple-400  blur-3xl" />
                        <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-linear-to-br from-purple-100 to-purple-400 blur-3xl" />

                        <div className="relative">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                <div className="min-w-0">
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                                            Application
                                        </span>

                                        <span className="text-xs text-gray-400">
                                            #{application.id}
                                        </span>
                                    </div>

                                    <h1 className="max-w-3xl wrap-break-word text-2xl font-bold tracking-tight text-blue-400 sm:text-3xl">
                                        {application.project_title}
                                    </h1>

                                    <p className="mt-2 text-sm text-gray-500 sm:text-base">
                                        Application Details
                                    </p>
                                </div>

                                <div className="shrink-0">
                                    <div
                                        className={`inline-flex max-w-full items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold ${getStatusStyle(
                                            application.status
                                        )}`}
                                    >
                                        <span className="h-2 w-2 rounded-full bg-current" />
                                        <span>
                                            {getStatusLabel(
                                                application.status
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid border-t border-gray-100 bg-gray-50/60 sm:grid-cols-2">
                        <div className="px-5 py-4 sm:px-7">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Applied On
                            </p>

                            <p className="mt-1.5 text-sm font-semibold text-gray-800">
                                {formatDate(
                                    application.created_at
                                )}
                            </p>
                        </div>

                        <div className="border-t border-gray-100 px-5 py-4 sm:border-l sm:border-t-0 sm:px-7">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Applicant Type
                            </p>

                            <p className="mt-1.5 text-sm font-semibold text-gray-800">
                                {getApplicantTypeLabel(
                                    application.applicant_type
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ========================================================
                    CURRENT STATUS
                ======================================================== */}

                <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Current Status
                            </p>

                            <div className="mt-2.5 flex flex-wrap items-center gap-3">
                                <span
                                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold ${getStatusStyle(
                                        application.status
                                    )}`}
                                >
                                    <span className="h-2 w-2 rounded-full bg-current" />
                                    {getStatusLabel(
                                        application.status
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 sm:min-w-44 sm:text-right">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Last Updated
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-700">
                                {formatDate(
                                    application.updated_at
                                )}
                            </p>
                        </div>
                    </div>
                </section>

                {/* ========================================================
                    HR DECISION BANNER
                ======================================================== */}

                <section
                    className={`overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-6 lg:p-7 ${decision.container}`}
                >
                    <div className="flex items-start gap-4">
                        <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${decision.iconBg} ${decision.iconText}`}
                        >
                            {decision.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                                Application Update
                            </p>

                            <h2
                                className={`mt-1 text-xl font-bold tracking-tight sm:text-2xl ${decision.titleStyle}`}
                            >
                                {decision.title}
                            </h2>

                            <p
                                className={`mt-2 max-w-3xl text-sm leading-6 ${decision.messageStyle}`}
                            >
                                {decision.message}
                            </p>
                        </div>
                    </div>

                    {application.status === "REJECTED" &&
                        (() => {
                            const rejection = [
                                ...statusHistory,
                            ]
                                .reverse()
                                .find(
                                    (h) =>
                                        h.new_status ===
                                        "REJECTED"
                                );

                            if (!rejection?.decision_note)
                                return null;

                            return (
                                <div className="mt-5 rounded-xl border border-red-200/80 bg-white/70 p-4 backdrop-blur-sm sm:p-5">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-red-700">
                                        Decision Note
                                    </p>

                                    <p className="mt-1.5 text-sm leading-6 text-red-950">
                                        {rejection.decision_note}
                                    </p>
                                </div>
                            );
                        })()}
                </section>

                {/* ========================================================
                    INTERVIEW DETAILS
                ======================================================== */}

                {interview && (
                    <section className="overflow-hidden rounded-2xl border border-purple-200/80 bg-white shadow-sm">
                        <div className="bg-linear-to-r from-purple-950 via-purple-900 to-indigo-900 px-5 py-5 text-white sm:px-6 lg:px-7">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg ring-1 ring-white/10">
                                        ◷
                                    </div>

                                    <div className="min-w-0">
                                        <h2 className="text-lg font-bold tracking-tight sm:text-xl">
                                            Your Interview Details
                                        </h2>

                                        <p className="mt-1 text-xs leading-5 text-purple-200 sm:text-sm">
                                            Official scheduled appointment details from HR.
                                        </p>
                                    </div>
                                </div>

                                <span
                                    className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                                        interview.status ===
                                        "COMPLETED"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : interview.status ===
                                              "CANCELLED"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-blue-100 text-blue-800"
                                    }`}
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                    {interview.status}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-5 p-5 sm:p-6 lg:p-7">
                            {/* DATE & TIME */}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="group rounded-xl border border-gray-200 bg-gray-50/80 p-4 transition hover:border-purple-200 hover:bg-purple-50/30 sm:p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-purple-700 shadow-sm ring-1 ring-gray-100">
                                            📅
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                Interview Date
                                            </p>

                                            <p className="mt-1 wrap-break-word text-sm font-semibold text-gray-900 sm:text-base">
                                                {formatInterviewDate(
                                                    interview.interview_date
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="group rounded-xl border border-gray-200 bg-gray-50/80 p-4 transition hover:border-purple-200 hover:bg-purple-50/30 sm:p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-purple-700 shadow-sm ring-1 ring-gray-100">
                                            🕐
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                Interview Time
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-gray-900 sm:text-base">
                                                {formatInterviewTime(
                                                    interview.interview_time
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* LOCATION / MEETING */}

                            {(interview.meeting_link ||
                                interview.physical_location) && (
                                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 sm:p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-purple-700 shadow-sm ring-1 ring-gray-100">
                                            📍
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                Interview Location & Venue
                                            </p>

                                            {interview.meeting_link && (
                                                <div className="mt-3">
                                                    <p className="text-xs font-medium text-gray-500">
                                                        Online Meeting
                                                    </p>

                                                    <a
                                                        href={
                                                            interview.meeting_link
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-purple-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-950 hover:shadow-md sm:w-auto"
                                                    >
                                                        <span>
                                                            Join Online Meeting
                                                        </span>
                                                        <span className="text-base">
                                                            ↗
                                                        </span>
                                                    </a>
                                                </div>
                                            )}

                                            {interview.physical_location && (
                                                <div className="mt-4">
                                                    <p className="text-xs font-medium text-gray-500">
                                                        In-Person Address / Room
                                                    </p>

                                                    <p className="mt-1.5 whitespace-pre-wrap wrap-break-word text-sm font-medium leading-6 text-gray-900">
                                                        {
                                                            interview.physical_location
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* NOTES */}

                            {interview.notes && (
                                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 sm:p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-purple-700 shadow-sm ring-1 ring-gray-100">
                                            📝
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                HR Notes & Instructions
                                            </p>

                                            <p className="mt-1.5 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-gray-700">
                                                {interview.notes}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ========================================================
                    APPLICATION PROGRESS
                ======================================================== */}

                <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-gray-950 sm:text-xl">
                            Application Progress
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Track the current stage of your application.
                        </p>
                    </div>

                    {/* DESKTOP / TABLET TIMELINE */}

                    <div className="mt-8 hidden md:block">
                        <div className="relative">
                            <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200" />

                            <div
                                className="absolute left-0 top-5 h-0.5 bg-gray-900 transition-all duration-500"
                                style={{
                                    width:
                                        currentStatusIndex <= 0
                                            ? "0%"
                                            : `${Math.min(
                                                  currentStatusIndex /
                                                      (statusSteps.length -
                                                          1),
                                                  1
                                              ) * 100}%`,
                                }}
                            />

                            <div className="relative grid grid-cols-4 gap-3">
                                {statusSteps.map(
                                    (step, index) => {
                                        const completed =
                                            currentStatusIndex >=
                                            index;

                                        const isCurrent =
                                            step.value ===
                                            application.status;

                                        return (
                                            <div
                                                key={step.value}
                                                className="flex flex-col items-center text-center"
                                            >
                                                <div
                                                    className={`flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-xs font-bold shadow-sm transition ${
                                                        completed
                                                            ? "bg-gray-950 text-white"
                                                            : "bg-gray-100 text-gray-400"
                                                    } ${
                                                        isCurrent
                                                            ? "ring-4 ring-gray-100"
                                                            : ""
                                                    }`}
                                                >
                                                    {completed &&
                                                    index <
                                                        currentStatusIndex
                                                        ? "✓"
                                                        : index + 1}
                                                </div>

                                                <p
                                                    className={`mt-3 max-w-32 text-xs font-semibold leading-5 ${
                                                        isCurrent
                                                            ? "text-gray-950"
                                                            : completed
                                                            ? "text-gray-700"
                                                            : "text-gray-400"
                                                    }`}
                                                >
                                                    {step.label}
                                                </p>

                                                {isCurrent && (
                                                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                                                        Current
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </div>
                    </div>

                    {/* MOBILE TIMELINE */}

                    <div className="mt-7 space-y-0 md:hidden">
                        {statusSteps.map((step, index) => {
                            const completed =
                                currentStatusIndex >= index;

                            const isCurrent =
                                step.value ===
                                application.status;

                            return (
                                <div
                                    key={step.value}
                                    className="flex gap-3"
                                >
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
                                                completed
                                                    ? "bg-gray-950 text-white"
                                                    : "bg-gray-100 text-gray-400"
                                            } ${
                                                isCurrent
                                                    ? "ring-4 ring-gray-100"
                                                    : ""
                                            }`}
                                        >
                                            {completed &&
                                            index <
                                                currentStatusIndex
                                                ? "✓"
                                                : index + 1}
                                        </div>

                                        {index <
                                            statusSteps.length - 1 && (
                                            <div
                                                className={`my-1 min-h-9 w-px ${
                                                    currentStatusIndex >
                                                    index
                                                        ? "bg-gray-950"
                                                        : "bg-gray-200"
                                                }`}
                                            />
                                        )}
                                    </div>

                                    <div className="pb-5 pt-1">
                                        <p
                                            className={`text-sm font-semibold ${
                                                isCurrent
                                                    ? "text-gray-950"
                                                    : completed
                                                    ? "text-gray-700"
                                                    : "text-gray-400"
                                            }`}
                                        >
                                            {step.label}
                                        </p>

                                        {isCurrent && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                Current application stage
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {application.status === "REJECTED" && (
                        <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-sm font-bold text-red-700">
                                !
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-red-900">
                                    Application Rejected
                                </p>

                                <p className="mt-1 text-xs leading-5 text-red-700">
                                    Your application was not selected for this recruitment project.
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* ========================================================
                    APPLICATION HISTORY
                ======================================================== */}

                <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-gray-950 sm:text-xl">
                            Application History
                        </h2>

                        <p className="mt-1 text-sm leading-5 text-gray-500">
                            A record of how your application status has changed over time.
                        </p>
                    </div>

                    {statusHistory.length === 0 ? (
                        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50/70 p-6 text-center">
                            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm ring-1 ring-gray-200">
                                ○
                            </div>

                            <p className="mt-3 text-sm font-medium text-gray-600">
                                No status history is available yet.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-7">
                            {statusHistory.map(
                                (h, index) => {
                                    const isLast =
                                        index ===
                                        statusHistory.length - 1;

                                    return (
                                        <div
                                            key={h.id}
                                            className="flex gap-3 sm:gap-4"
                                        >
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getHistoryStatusStyle(
                                                        h.new_status
                                                    )}`}
                                                >
                                                    {index + 1}
                                                </div>

                                                {!isLast && (
                                                    <div className="my-1 min-h-14 w-px flex-1 bg-gray-200" />
                                                )}
                                            </div>

                                            <div
                                                className={`min-w-0 flex-1 ${
                                                    isLast
                                                        ? "pb-1"
                                                        : "pb-7"
                                                }`}
                                            >
                                                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 transition hover:border-gray-300 hover:bg-gray-50 sm:p-5">
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-gray-950">
                                                                {getStatusLabel(
                                                                    h.new_status
                                                                )}
                                                            </p>

                                                            {h.old_status && (
                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    Changed from{" "}
                                                                    <span className="font-semibold text-gray-700">
                                                                        {getStatusLabel(
                                                                            h.old_status
                                                                        )}
                                                                    </span>
                                                                </p>
                                                            )}
                                                        </div>

                                                        <span className="w-fit shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-500 ring-1 ring-gray-200">
                                                            {formatDateTime(
                                                                h.changed_at
                                                            )}
                                                        </span>
                                                    </div>

                                                    {h.decision_note && (
                                                        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3.5">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                                Note
                                                            </p>

                                                            <p className="mt-1.5 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-gray-700">
                                                                {
                                                                    h.decision_note
                                                                }
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}
                </section>

                {/* ========================================================
                    PROJECT INFORMATION
                ======================================================== */}

                <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
                    <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-5 sm:px-6 lg:px-7">
                        <h2 className="text-lg font-bold tracking-tight text-gray-950">
                            Project Information
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Details about the project you applied for.
                        </p>
                    </div>

                    <div className="grid gap-px bg-gray-100 sm:grid-cols-2">
                        <div className="bg-white p-5 sm:p-6">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                Project
                            </p>

                            <p className="mt-2 wrap-break-word text-sm font-semibold leading-6 text-gray-900">
                                {application.project_title}
                            </p>
                        </div>

                        <div className="bg-white p-5 sm:p-6">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                Applicant Type
                            </p>

                            <p className="mt-2 text-sm font-semibold leading-6 text-gray-900">
                                {getApplicantTypeLabel(
                                    application.applicant_type
                                )}
                            </p>
                        </div>

                        {application.project_description && (
                            <div className="bg-white p-5 sm:col-span-2 sm:p-6">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                    Description
                                </p>

                                <p className="mt-2 whitespace-pre-line wrap-break-word text-sm leading-7 text-gray-700">
                                    {
                                        application.project_description
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ========================================================
                    SUBMITTED RESUME
                ======================================================== */}

                <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                            📄
                        </div>

                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-gray-950">
                                Submitted Resume
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Resume associated with this application.
                            </p>
                        </div>
                    </div>

                    {application.resume_file_name ? (
                        <div className="mt-5 flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold uppercase text-gray-600 shadow-sm ring-1 ring-gray-200">
                                    PDF
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-gray-900">
                                        {application.resume_file_name}
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                        Resume submitted with this application
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50/70 p-5">
                            <p className="text-sm text-gray-500">
                                No resume is associated with this application.
                            </p>
                        </div>
                    )}
                </section>

                {/* ========================================================
                    LAST UPDATED
                ======================================================== */}

                <div className="flex flex-col gap-1 border-t border-gray-200/80 px-1 pb-4 pt-2 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        Application last updated on{" "}
                        <span className="font-medium text-gray-500">
                            {formatDate(
                                application.updated_at
                            )}
                        </span>
                    </span>

                    <span className="text-gray-300">
                        Application #{application.id}
                    </span>
                </div>
            </div>
        </div>
    );
}