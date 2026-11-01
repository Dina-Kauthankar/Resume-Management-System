"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { EvaluationDetails } from "@/components/ui/ScoreDetailsPopover";

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
    candidate_name: string;
    candidate_email: string;
    candidate_phone: string | null;
    candidate_college_details: string | null;
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
    changed_by_name: string | null;
    changed_by_email: string | null;
}

interface InterviewAppointment {
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
    evaluationDetails?: EvaluationDetails;
    history?: StatusHistory[];
    interview?: InterviewAppointment | null;
    error?: string;
}

// ============================================================
// STATUS HELPERS
// ============================================================

function getStatusLabel(status: ApplicationStatus | null) {
    if (!status) return "N/A";


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
            return "border-blue-200 bg-blue-50 text-blue-700";
        case "SHORTLISTED":
            return "border-violet-200 bg-violet-50 text-violet-700";
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

function getInterviewStatusStyle(status: InterviewStatus) {
    switch (status) {
        case "SCHEDULED":
            return "border-amber-200 bg-amber-50 text-amber-700";
        case "COMPLETED":
            return "border-emerald-200 bg-emerald-50 text-emerald-700";
        case "CANCELLED":
            return "border-red-200 bg-red-50 text-red-700";
        default:
            return "border-gray-200 bg-gray-50 text-gray-700";
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
// SMALL UI ICONS
// ============================================================

function Icon({
    name,
    className = "h-5 w-5",
}: {
    name:
    | "arrow-left"
    | "calendar"
    | "clock"
    | "user"
    | "mail"
    | "phone"
    | "briefcase"
    | "document"
    | "download"
    | "external"
    | "check"
    | "x"
    | "sparkles"
    | "building"
    | "info"
    | "chevron";
    className?: string;
}) {
    const common = {
        className,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        viewBox: "0 0 24 24",
    };


    switch (name) {
        case "arrow-left":
            return (
                <svg {...common}>
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 12H5m7 7-7-7 7-7"
                    />
                </svg>
            );

        case "calendar":
            return (
                <svg {...common}>
                    <rect
                        x="3"
                        y="4.5"
                        width="18"
                        height="17"
                        rx="2"
                    />
                    <path d="M16 2.5v4M8 2.5v4M3 9h18" />
                </svg>
            );

        case "clock":
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="9" />
                    <path
                        strokeLinecap="round"
                        d="M12 7v5l3 2"
                    />
                </svg>
            );

        case "user":
            return (
                <svg {...common}>
                    <circle cx="12" cy="8" r="3.5" />
                    <path
                        strokeLinecap="round"
                        d="M5 20c.8-3.1 3.2-5 7-5s6.2 1.9 7 5"
                    />
                </svg>
            );

        case "mail":
            return (
                <svg {...common}>
                    <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                    />
                    <path d="m4 7 8 6 8-6" />
                </svg>
            );

        case "phone":
            return (
                <svg {...common}>
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.5 3.5h3l1.5 4-2 1.5a15 15 0 0 0 6 6l1.5-2 4 1.5v3c0 1-1 2-2 2C10 19.5 4.5 14 4.5 5.5c0-1 1-2 2-2Z"
                    />
                </svg>
            );

        case "briefcase":
            return (
                <svg {...common}>
                    <rect
                        x="3"
                        y="7"
                        width="18"
                        height="13"
                        rx="2"
                    />
                    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
                </svg>
            );

        case "document":
            return (
                <svg {...common}>
                    <path d="M6 3h8l4 4v14H6z" />
                    <path d="M14 3v5h4M9 13h6M9 17h6" />
                </svg>
            );

        case "download":
            return (
                <svg {...common}>
                    <path d="M12 3v11" />
                    <path d="m8 10 4 4 4-4" />
                    <path d="M5 21h14" />
                </svg>
            );

        case "external":
            return (
                <svg {...common}>
                    <path d="M14 4h6v6" />
                    <path d="M20 4 11 13" />
                    <path d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                </svg>
            );

        case "check":
            return (
                <svg {...common}>
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m5 12 4 4L19 6"
                    />
                </svg>
            );

        case "x":
            return (
                <svg {...common}>
                    <path
                        strokeLinecap="round"
                        d="M6 6l12 12M18 6 6 18"
                    />
                </svg>
            );

        case "sparkles":
            return (
                <svg {...common}>
                    <path d="m12 3 1.2 5.8L19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2z" />
                    <path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6z" />
                </svg>
            );

        case "building":
            return (
                <svg {...common}>
                    <path d="M4 21V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v17" />
                    <path d="M8 6h2M14 6h2M8 10h2M14 10h2M8 14h2M14 14h2M10 21v-3h4v3" />
                </svg>
            );

        case "info":
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 10v6M12 7h.01" />
                </svg>
            );

        case "chevron":
            return (
                <svg {...common}>
                    <path d="m9 18 6-6-6-6" />
                </svg>
            );

        default:
            return null;
    }


}

// ============================================================
// PAGE
// ============================================================

export default function HRApplicationDetailsPage() {
    const params = useParams();
    const router = useRouter();


    const applicationId = params.applicationId as string;

    const [application, setApplication] =
        useState<Application | null>(null);

    const [evaluationDetails, setEvaluationDetails] =
        useState<EvaluationDetails | null>(null);

    const [history, setHistory] =
        useState<StatusHistory[]>([]);

    const [interview, setInterview] =
        useState<InterviewAppointment | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedStatus, setSelectedStatus] =
        useState<ApplicationStatus | "">("");

    const [decisionNote, setDecisionNote] = useState("");

    const [updatingStatus, setUpdatingStatus] =
        useState(false);

    const [updateMessage, setUpdateMessage] =
        useState<string | null>(null);

    const [updateError, setUpdateError] =
        useState<string | null>(null);

    const [isResumeModalOpen, setIsResumeModalOpen] =
        useState(false);

    // ========================================================
    // LOAD APPLICATION
    // ========================================================

    async function loadApplication() {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `/api/hr/application/${applicationId}`,
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
            setEvaluationDetails(
                result.evaluationDetails || null
            );
            setHistory(result.history || []);
            setInterview(result.interview || null);
            setSelectedStatus(result.application.status);
        } catch (err) {
            console.error(
                "Load HR application details error:",
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

    useEffect(() => {
        if (applicationId) {
            loadApplication();
        }
    }, [applicationId]);

    // ========================================================
    // STATUS CONDITIONS
    // ========================================================

    const isTerminal =
        application?.status === "SELECTED" ||
        application?.status === "REJECTED";

    const isInterviewScheduledStatus =
        application?.status === "INTERVIEW_SCHEDULED";

    const isInterviewActiveScheduled =
        isInterviewScheduledStatus &&
        interview?.status === "SCHEDULED";

    const isInterviewCompleted =
        isInterviewScheduledStatus &&
        interview?.status === "COMPLETED";

    // // ========================================================
    // // STATUS SELECTION
    // // ========================================================

    // function handleStatusSelection(
    //     newStatus: ApplicationStatus
    // ) {
    //     if (newStatus === "INTERVIEW_SCHEDULED") {
    //         router.push(
    //             `/hr/interview/${applicationId}`
    //         );
    //         return;
    //     }

    //     setSelectedStatus(newStatus);
    //     setUpdateError(null);
    //     setUpdateMessage(null);
    // }

    // // ========================================================
    // // STATUS UPDATE
    // // ========================================================

    // async function handleStatusUpdate() {
    //     if (!application) return;

    //     if (!selectedStatus) {
    //         setUpdateError("Please select a status.");
    //         return;
    //     }

    //     if (selectedStatus === application.status) {
    //         setUpdateError(
    //             "Please select a different status."
    //         );
    //         return;
    //     }

    //     if (selectedStatus === "INTERVIEW_SCHEDULED") {
    //         router.push(
    //             `/hr/interview/${application.id}`
    //         );
    //         return;
    //     }

    //     try {
    //         setUpdatingStatus(true);
    //         setUpdateError(null);
    //         setUpdateMessage(null);

    //         const response = await fetch(
    //             `/api/hr/application/${application.id}`,
    //             {
    //                 method: "PUT",
    //                 headers: {
    //                     "Content-Type":
    //                         "application/json",
    //                 },
    //                 credentials: "include",
    //                 body: JSON.stringify({
    //                     status: selectedStatus,
    //                     decisionNote:
    //                         decisionNote.trim() || null,
    //                 }),
    //             }
    //         );

    //         const result = await response.json();

    //         if (!response.ok || !result.success) {
    //             throw new Error(
    //                 result.error ||
    //                 "Failed to update application status."
    //             );
    //         }

    //         setUpdateMessage(
    //             "Application status updated successfully."
    //         );

    //         setDecisionNote("");

    //         await loadApplication();
    //     } catch (err) {
    //         console.error(
    //             "Update application status error:",
    //             err
    //         );

    //         setUpdateError(
    //             err instanceof Error
    //                 ? err.message
    //                 : "Failed to update application status."
    //         );
    //     } finally {
    //         setUpdatingStatus(false);
    //     }
    // }

    // function closeResumeModal() {
    //     setIsResumeModalOpen(false);
    // }

    // ========================================================
    // STATUS SELECTION
    // ========================================================

    function handleStatusSelection(
        newStatus: ApplicationStatus
    ) {
        // ====================================================
        // INTERVIEW SCHEDULING
        // ====================================================

        if (newStatus === "INTERVIEW_SCHEDULED") {
            // The candidate MUST be shortlisted before
            // an interview can be scheduled.
            if (application?.status !== "SHORTLISTED") {
                setSelectedStatus(
                    application?.status || ""
                );

                setUpdateMessage(null);

                setUpdateError(
                    "Candidate needs to be shortlisted first before scheduling an interview."
                );

                return;
            }

            // Candidate is shortlisted, so HR can proceed
            // to the interview scheduling page.
            router.push(
                `/hr/interview/${applicationId}`
            );

            return;
        }

        setSelectedStatus(newStatus);
        setUpdateError(null);
        setUpdateMessage(null);
    }


    // ========================================================
    // STATUS UPDATE
    // ========================================================

    async function handleStatusUpdate() {
        if (!application) return;

        if (!selectedStatus) {
            setUpdateError("Please select a status.");
            return;
        }

        if (selectedStatus === application.status) {
            setUpdateError(
                "Please select a different status."
            );
            return;
        }

        if (selectedStatus === "INTERVIEW_SCHEDULED") {
            if (application.status !== "SHORTLISTED") {
                setSelectedStatus(application.status);

                setUpdateMessage(null);

                setUpdateError(
                    "Candidate needs to be shortlisted first before scheduling an interview."
                );

                return;
            }

            router.push(
                `/hr/interview/${application.id}`
            );

            return;
        }

        try {
            setUpdatingStatus(true);
            setUpdateError(null);
            setUpdateMessage(null);

            const response = await fetch(
                `/api/hr/application/${application.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        status: selectedStatus,
                        decisionNote:
                            decisionNote.trim() || null,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error ||
                    "Failed to update application status."
                );
            }

            setUpdateMessage(
                "Application status updated successfully."
            );

            setDecisionNote("");

            await loadApplication();
        } catch (err) {
            console.error(
                "Update application status error:",
                err
            );

            setUpdateError(
                err instanceof Error
                    ? err.message
                    : "Failed to update application status."
            );
        } finally {
            setUpdatingStatus(false);
        }
    }

    // ========================================================
    // RESUME MODAL
    // ========================================================

    function closeResumeModal() {
        setIsResumeModalOpen(false);
    }

    // ========================================================
    // LOADING
    // ========================================================
    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {
        return (
            <div className="min-h-full space-y-6 pb-10">
                <div className="h-5 w-36 animate-pulse rounded-lg bg-gray-200" />

                <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-3">
                            <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />
                            <div className="h-4 w-80 max-w-full animate-pulse rounded bg-gray-100" />
                        </div>

                        <div className="h-10 w-40 animate-pulse rounded-xl bg-gray-200" />
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
                    <div className="space-y-5">
                        <div className="h-48 animate-pulse rounded-2xl bg-gray-200" />
                        <div className="h-72 animate-pulse rounded-2xl bg-gray-200" />
                    </div>

                    <div className="h-72 animate-pulse rounded-2xl bg-gray-200" />
                </div>
            </div>
        );
    }

    // ========================================================
    // ERROR
    // ========================================================

    if (error || !application) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center px-4">
                <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm sm:p-8">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <Icon
                            name="info"
                            className="h-7 w-7"
                        />
                    </div>

                    <h1 className="mt-5 text-xl font-bold text-gray-900">
                        Unable to load application
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                        {error ||
                            "Application not found."}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/hr/application"
                            )
                        }
                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 sm:w-auto"
                    >
                        <Icon
                            name="arrow-left"
                            className="h-4 w-4"
                        />
                        Back to Applications
                    </button>
                </div>
            </div>
        );
    }

    // ========================================================
    // PAGE
    // ========================================================

    return (
        <div className="min-h-full bg-transparent pb-10 text-gray-900">
            <div className="space-y-5 sm:space-y-6">
                {/* ================================================== */}
                {/* TOP NAVIGATION */}
                {/* ================================================== */}

                <button
                    type="button"
                    onClick={() =>
                        router.push("/hr/application")
                    }
                    className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
                >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition group-hover:border-gray-300 group-hover:bg-gray-50">
                        <Icon
                            name="arrow-left"
                            className="h-4 w-4"
                        />
                    </span>

                    <span>Back to Applications</span>
                </button>

                {/* ================================================== */}
                {/* HERO HEADER */}
                {/* ================================================== */}

                <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-violet-500 via-indigo-500 to-blue-500" />

                    <div className="p-5 sm:p-7">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                        Application #{application.id}
                                    </span>

                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(
                                            application.status
                                        )}`}
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                        {getStatusLabel(
                                            application.status
                                        )}
                                    </span>
                                </div>

                                <h1 className="mt-3 wrap-break-word text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                                    {application.candidate_name}
                                </h1>

                                <div className="mt-2 flex flex-col gap-1.5 text-sm text-gray-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Icon
                                            name="briefcase"
                                            className="h-4 w-4"
                                        />

                                        Applying for{" "}
                                        <span className="font-semibold text-gray-800">
                                            {
                                                application.project_title
                                            }
                                        </span>
                                    </span>

                                    <span className="hidden text-gray-300 sm:inline">
                                        •
                                    </span>

                                    <span>
                                        Applied{" "}
                                        {formatDate(
                                            application.created_at
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                {application.status ===
                                    "SHORTLISTED" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.push(
                                                    `/hr/interview/${application.id}`
                                                )
                                            }
                                            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 hover:shadow-md active:scale-[0.98] sm:flex-none"
                                        >
                                            <Icon
                                                name="calendar"
                                                className="h-4 w-4"
                                            />
                                            Schedule Interview
                                        </button>
                                    )}

                                {application.status ===
                                    "INTERVIEW_SCHEDULED" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.push(
                                                    `/hr/interview/${application.id}`
                                                )
                                            }
                                            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 hover:shadow-md active:scale-[0.98] sm:flex-none"
                                        >
                                            <Icon
                                                name="calendar"
                                                className="h-4 w-4"
                                            />
                                            View / Edit Interview
                                        </button>
                                    )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================================================== */}
                {/* INTERVIEW BANNER */}
                {/* ================================================== */}

                {interview && (
                    <section className="overflow-hidden rounded-2xl border border-violet-200 bg-linear-to-br from-violet-50 via-white to-indigo-50 shadow-sm">
                        <div className="p-5 sm:p-6">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex min-w-0 gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                        <Icon
                                            name="calendar"
                                            className="h-5 w-5"
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-sm font-bold text-violet-950">
                                                Associated Interview
                                            </h2>

                                            <span
                                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getInterviewStatusStyle(
                                                    interview.status
                                                )}`}
                                            >
                                                {
                                                    interview.status
                                                }
                                            </span>
                                        </div>

                                        <div className="mt-2 flex flex-col gap-1 text-sm text-violet-800 sm:flex-row sm:flex-wrap sm:gap-x-4">
                                            <span className="inline-flex items-center gap-1.5">
                                                <Icon
                                                    name="calendar"
                                                    className="h-4 w-4"
                                                />
                                                {formatDate(
                                                    interview.interview_date
                                                )}
                                            </span>

                                            <span className="inline-flex items-center gap-1.5">
                                                <Icon
                                                    name="clock"
                                                    className="h-4 w-4"
                                                />
                                                {formatTime(
                                                    interview.interview_time
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `/hr/interview/${application.id}`
                                        )
                                    }
                                    className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-violet-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-950 sm:w-auto"
                                >
                                    Open Interview
                                    <Icon
                                        name="chevron"
                                        className="h-4 w-4"
                                    />
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* ================================================== */}
                {/* MAIN GRID */}
                {/* ================================================== */}

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="min-w-0 space-y-5">
                        {/* ============================================== */}
                        {/* CANDIDATE INFORMATION */}
                        {/* ============================================== */}

                        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <Icon
                                            name="user"
                                            className="h-5 w-5"
                                        />
                                    </div>

                                    <div>
                                        <h2 className="text-base font-bold text-gray-900">
                                            Candidate Information
                                        </h2>

                                        <p className="text-xs text-gray-500">
                                            Personal and education details
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:grid-cols-2 sm:p-6">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                        Full Name
                                    </p>

                                    <p className="mt-1.5 wrap-break-word text-sm font-semibold text-gray-900">
                                        {
                                            application.candidate_name
                                        }
                                    </p>
                                </div>

                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                        Email
                                    </p>

                                    <p className="mt-1.5 flex items-center gap-2 break-all text-sm text-gray-700">
                                        <Icon
                                            name="mail"
                                            className="hidden h-4 w-4 shrink-0 text-gray-400 sm:block"
                                        />
                                        {
                                            application.candidate_email
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                        Phone
                                    </p>

                                    <p className="mt-1.5 flex items-center gap-2 text-sm text-gray-700">
                                        <Icon
                                            name="phone"
                                            className="hidden h-4 w-4 shrink-0 text-gray-400 sm:block"
                                        />
                                        {application.candidate_phone ||
                                            "Not provided"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                        Applicant Type
                                    </p>

                                    <span className="mt-1.5 inline-flex rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                        {getApplicantTypeLabel(
                                            application.applicant_type
                                        )}
                                    </span>
                                </div>

                                <div className="sm:col-span-2">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                        College / Education
                                    </p>

                                    <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-gray-700">
                                        {application.candidate_college_details ||
                                            "Not provided"}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* ============================================== */}
                        {/* EVALUATION */}
                        {/* ============================================== */}

                        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                            <Icon
                                                name="sparkles"
                                                className="h-5 w-5"
                                            />
                                        </div>

                                        <div>
                                            <h2 className="text-base font-bold text-gray-900">
                                                Application Evaluation
                                            </h2>

                                            <p className="text-xs text-gray-500">
                                                Deterministic resume matching breakdown
                                            </p>
                                        </div>
                                    </div>

                                    {evaluationDetails && (
                                        <span className="inline-flex w-fit rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                                            {
                                                evaluationDetails.confidencePercentage
                                            }
                                            % Match Confidence
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-5 sm:p-6">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="rounded-xl border border-gray-200 bg-linear-to-br from-gray-50 to-white p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            Match Score
                                        </p>

                                        <p className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
                                            {
                                                application.score
                                            }

                                            {evaluationDetails && (
                                                <span className="ml-1 text-xs font-medium text-gray-400">
                                                    /
                                                    {
                                                        evaluationDetails.maxScore
                                                    }{" "}
                                                    pts
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-gray-200 bg-linear-to-br from-gray-50 to-white p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            Keywords Matched
                                        </p>

                                        <p className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
                                            {
                                                application.matched_keywords
                                            }

                                            {evaluationDetails && (
                                                <span className="ml-1 text-xs font-medium text-gray-400">
                                                    /
                                                    {
                                                        evaluationDetails.totalKeywordsCount
                                                    }
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-indigo-100 bg-linear-to-br from-indigo-50 to-white p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">
                                            Confidence
                                        </p>

                                        <p className="mt-2 text-2xl font-bold tracking-tight text-indigo-700">
                                            {
                                                application.confidence_percentage
                                            }
                                            %
                                        </p>
                                    </div>
                                </div>

                                {evaluationDetails && (
                                    <div className="mt-6 space-y-6 border-t border-gray-100 pt-6">
                                        {/* MATCHED */}

                                        <div>
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                                                    Matched Keywords
                                                </h3>

                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                    {
                                                        evaluationDetails.matchedCount
                                                    }
                                                </span>
                                            </div>

                                            {evaluationDetails
                                                .matchedKeywordsWithWeights
                                                .length === 0 ? (
                                                <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs italic text-gray-400">
                                                    No matching keywords found in submitted resume.
                                                </p>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {evaluationDetails.matchedKeywordsWithWeights.map(
                                                        (
                                                            kw,
                                                            idx
                                                        ) => (
                                                            <span
                                                                key={
                                                                    idx
                                                                }
                                                                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800"
                                                            >
                                                                <span className="break-all">
                                                                    {
                                                                        kw.keyword
                                                                    }
                                                                </span>

                                                                <span className="shrink-0 font-bold text-emerald-600">
                                                                    +{" "}
                                                                    {
                                                                        kw.weight
                                                                    }
                                                                </span>
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* MISSING */}

                                        {evaluationDetails
                                            .missingKeywordsWithWeights
                                            .length >
                                            0 && (
                                                <div>
                                                    <div className="mb-3 flex items-center justify-between gap-3">
                                                        <h3 className="text-xs font-bold uppercase tracking-wider text-red-700">
                                                            Missing Keywords
                                                        </h3>

                                                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                                            {
                                                                evaluationDetails.missingCount
                                                            }
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        {evaluationDetails.missingKeywordsWithWeights.map(
                                                            (
                                                                kw,
                                                                idx
                                                            ) => (
                                                                <span
                                                                    key={
                                                                        idx
                                                                    }
                                                                    className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-800"
                                                                >
                                                                    <span className="break-all">
                                                                        {
                                                                            kw.keyword
                                                                        }
                                                                    </span>

                                                                    <span className="shrink-0 text-red-500">
                                                                        {
                                                                            kw.weight
                                                                        }{" "}
                                                                        pts
                                                                    </span>
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* ============================================== */}
                        {/* STATUS HISTORY */}
                        {/* ============================================== */}

                        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                                <h2 className="text-base font-bold text-gray-900">
                                    Application Status History
                                </h2>

                                <p className="mt-0.5 text-xs text-gray-500">
                                    Complete recruitment activity timeline
                                </p>
                            </div>

                            <div className="p-5 sm:p-6">
                                {history.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                                        <p className="text-sm text-gray-500">
                                            No status history is available for this application yet.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-0">
                                        {history.map(
                                            (
                                                item,
                                                index
                                            ) => {
                                                const isLast =
                                                    index ===
                                                    history.length -
                                                    1;

                                                const isSelected =
                                                    item.new_status ===
                                                    "SELECTED";

                                                const isRejected =
                                                    item.new_status ===
                                                    "REJECTED";

                                                const isInterview =
                                                    item.new_status ===
                                                    "INTERVIEW_SCHEDULED";

                                                return (
                                                    <div
                                                        key={
                                                            item.id
                                                        }
                                                        className="flex gap-3 sm:gap-4"
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            <div
                                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white ${isSelected
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : isRejected
                                                                        ? "bg-red-100 text-red-700"
                                                                        : isInterview
                                                                            ? "bg-violet-100 text-violet-700"
                                                                            : "bg-gray-100 text-gray-600"
                                                                    }`}
                                                            >
                                                                {isSelected ? (
                                                                    <Icon
                                                                        name="check"
                                                                        className="h-4 w-4"
                                                                    />
                                                                ) : isRejected ? (
                                                                    <Icon
                                                                        name="x"
                                                                        className="h-4 w-4"
                                                                    />
                                                                ) : (
                                                                    index +
                                                                    1
                                                                )}
                                                            </div>

                                                            {!isLast && (
                                                                <div className="mt-1 min-h-8 w-px flex-1 bg-gray-200" />
                                                            )}
                                                        </div>

                                                        <div
                                                            className={`min-w-0 flex-1 ${isLast
                                                                ? "pb-0"
                                                                : "pb-6"
                                                                }`}
                                                        >
                                                            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 sm:p-4">
                                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                                    <div className="min-w-0">
                                                                        <p className="wrap-break-word text-sm font-bold text-gray-900">
                                                                            {item.old_status
                                                                                ? `${getStatusLabel(
                                                                                    item.old_status
                                                                                )} → ${getStatusLabel(
                                                                                    item.new_status
                                                                                )}`
                                                                                : getStatusLabel(
                                                                                    item.new_status
                                                                                )}
                                                                        </p>

                                                                        <p className="mt-1 text-xs text-gray-500">
                                                                            {item.changed_by_name
                                                                                ? `Changed by ${item.changed_by_name}`
                                                                                : "System"}
                                                                        </p>
                                                                    </div>

                                                                    <p className="shrink-0 text-xs text-gray-400 sm:text-right">
                                                                        {formatDateTime(
                                                                            item.changed_at
                                                                        )}
                                                                    </p>
                                                                </div>

                                                                {item.decision_note && (
                                                                    <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
                                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                                            Decision Note
                                                                        </p>

                                                                        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-700">
                                                                            {
                                                                                item.decision_note
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
                            </div>
                        </section>

                        {/* ============================================== */}
                        {/* PROJECT INFORMATION */}
                        {/* ============================================== */}

                        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                        <Icon
                                            name="briefcase"
                                            className="h-5 w-5"
                                        />
                                    </div>

                                    <div>
                                        <h2 className="text-base font-bold text-gray-900">
                                            Project Information
                                        </h2>

                                        <p className="text-xs text-gray-500">
                                            Recruitment project details
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5 p-5 sm:p-6">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                        Project
                                    </p>

                                    <p className="mt-1.5 text-sm font-semibold text-gray-900">
                                        {
                                            application.project_title
                                        }
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                            Target Type
                                        </p>

                                        <p className="mt-1.5 text-sm text-gray-700">
                                            {
                                                application.project_target_type
                                            }
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                            Project Status
                                        </p>

                                        <span className="mt-1.5 inline-flex rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                            {
                                                application.project_status
                                            }
                                        </span>
                                    </div>
                                </div>

                                {application.project_description && (
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                            Description
                                        </p>

                                        <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-gray-700">
                                            {
                                                application.project_description
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* ============================================== */}
                        {/* RESUME */}
                        {/* ============================================== */}

                        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                        <Icon
                                            name="document"
                                            className="h-5 w-5"
                                        />
                                    </div>

                                    <div>
                                        <h2 className="text-base font-bold text-gray-900">
                                            Submitted Resume
                                        </h2>

                                        <p className="text-xs text-gray-500">
                                            Resume attached to this application
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 sm:p-6">
                                {application.resume_file_name ? (
                                    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm ring-1 ring-gray-200">
                                                    <Icon
                                                        name="document"
                                                        className="h-5 w-5"
                                                    />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-gray-900">
                                                        {
                                                            application.resume_file_name
                                                        }
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-gray-500">
                                                        Resume submitted with this application
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 sm:flex">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setIsResumeModalOpen(
                                                            true
                                                        )
                                                    }
                                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
                                                >
                                                    <Icon
                                                        name="document"
                                                        className="h-4 w-4"
                                                    />
                                                    View Resume
                                                </button>

                                                <a
                                                    href={`/api/hr/application/${application.id}/resume?download=true`}
                                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gray-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                                                >
                                                    <Icon
                                                        name="download"
                                                        className="h-4 w-4"
                                                    />
                                                    Download
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                                        <p className="text-sm text-gray-500">
                                            No resume is associated with this application.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* ================================================== */}
                    {/* RIGHT SIDEBAR */}
                    {/* ================================================== */}

                    <aside className="min-w-0 space-y-5">
                        {/* ============================================== */}
                        {/* CURRENT STATUS */}
                        {/* ============================================== */}

                        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="p-5 sm:p-6">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                                    Current Status
                                </p>

                                <div className="mt-3">
                                    <span
                                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${getStatusStyle(
                                            application.status
                                        )}`}
                                    >
                                        <span className="h-2 w-2 rounded-full bg-current" />
                                        {getStatusLabel(
                                            application.status
                                        )}
                                    </span>
                                </div>

                                {interview && (
                                    <div className="mt-4 border-t border-gray-100 pt-4">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                            Interview
                                        </p>

                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${getInterviewStatusStyle(
                                                    interview.status
                                                )}`}
                                            >
                                                {
                                                    interview.status
                                                }
                                            </span>

                                            <span className="text-xs text-gray-500">
                                                {
                                                    formatDate(
                                                        interview.interview_date
                                                    )
                                                }
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-5 border-t border-gray-100 pt-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                        Applied On
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {formatDate(
                                            application.created_at
                                        )}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* ============================================== */}
                        {/* STATUS MANAGEMENT */}
                        {/* ============================================== */}

                        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 p-5 sm:p-6">
                                <h2 className="text-base font-bold text-gray-900">
                                    Recruitment Decision
                                </h2>

                                <p className="mt-1 text-xs leading-5 text-gray-500">
                                    Update the candidate's current recruitment status.
                                </p>
                            </div>

                            <div className="p-5 sm:p-6">
                                {isTerminal ? (
                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                        <div className="flex gap-3">
                                            <div className="mt-0.5 text-gray-500">
                                                <Icon
                                                    name="info"
                                                    className="h-4 w-4"
                                                />
                                            </div>

                                            <p className="text-xs leading-5 text-gray-600">
                                                This application has reached a terminal recruitment decision (
                                                <span className="font-bold text-gray-800">
                                                    {getStatusLabel(
                                                        application.status
                                                    )}
                                                </span>
                                                ). Further status changes are disabled.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {isInterviewActiveScheduled && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                                                <div className="flex gap-2.5">
                                                    <Icon
                                                        name="clock"
                                                        className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                                                    />

                                                    <p className="text-xs leading-5 text-amber-800">
                                                        An interview is currently scheduled. Selection or rejection is disabled until the interview is completed.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {isInterviewCompleted && (
                                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                                                <div className="flex gap-2.5">
                                                    <Icon
                                                        name="check"
                                                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                                                    />

                                                    <p className="text-xs leading-5 text-emerald-800">
                                                        Interview completed. You can now make the final recruitment decision.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label
                                                htmlFor="application-status"
                                                className="text-[11px] font-bold uppercase tracking-wider text-gray-500"
                                            >
                                                Application Status
                                            </label>

                                            <select
                                                id="application-status"
                                                value={
                                                    selectedStatus
                                                }
                                                onChange={(e) =>
                                                    handleStatusSelection(
                                                        e.target
                                                            .value as ApplicationStatus
                                                    )
                                                }
                                                disabled={
                                                    updatingStatus ||
                                                    isTerminal
                                                }
                                                className="mt-2 h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                                            >
                                                <option value="APPLIED">
                                                    Applied
                                                </option>

                                                <option value="SHORTLISTED">
                                                    Shortlisted
                                                </option>

                                                <option value="INTERVIEW_SCHEDULED">
                                                    Schedule / View Interview...
                                                </option>

                                                <option
                                                    value="SELECTED"
                                                    disabled={
                                                        isInterviewActiveScheduled
                                                    }
                                                >
                                                    Selected{" "}
                                                    {isInterviewActiveScheduled
                                                        ? "(Interview Pending)"
                                                        : ""}
                                                </option>

                                                <option
                                                    value="REJECTED"
                                                    disabled={
                                                        isInterviewActiveScheduled
                                                    }
                                                >
                                                    Rejected{" "}
                                                    {isInterviewActiveScheduled
                                                        ? "(Interview Pending)"
                                                        : ""}
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="decision-note"
                                                className="text-[11px] font-bold uppercase tracking-wider text-gray-500"
                                            >
                                                Decision Note{" "}
                                                <span className="font-normal normal-case tracking-normal text-gray-400">
                                                    optional
                                                </span>
                                            </label>

                                            <textarea
                                                id="decision-note"
                                                value={
                                                    decisionNote
                                                }
                                                onChange={(e) =>
                                                    setDecisionNote(
                                                        e.target
                                                            .value
                                                    )
                                                }
                                                disabled={
                                                    updatingStatus ||
                                                    isTerminal
                                                }
                                                rows={5}
                                                placeholder="Add a note about this recruitment decision..."
                                                className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-gray-100"
                                            />
                                        </div>

                                        {updateMessage && (
                                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                                <p className="text-xs font-medium leading-5 text-emerald-700">
                                                    {
                                                        updateMessage
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        {updateError && (
                                            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                                                <p className="text-xs font-medium leading-5 text-red-700">
                                                    {
                                                        updateError
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={
                                                handleStatusUpdate
                                            }
                                            disabled={
                                                updatingStatus ||
                                                isTerminal ||
                                                selectedStatus ===
                                                application.status
                                            }
                                            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                                        >
                                            {updatingStatus
                                                ? "Updating..."
                                                : "Update Status"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* ============================================== */}
                        {/* LAST UPDATED */}
                        {/* ============================================== */}

                        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Last Updated
                            </p>

                            <p className="mt-1 text-xs font-medium text-gray-600">
                                {formatDateTime(
                                    application.updated_at
                                )}
                            </p>
                        </div>
                    </aside>
                </div>
            </div>

            {/* ================================================== */}
            {/* RESUME PREVIEW MODAL */}
            {/* ================================================== */}

            {isResumeModalOpen &&
                application.resume_file_name && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 p-0 backdrop-blur-sm sm:p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="resume-preview-title"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeResumeModal();
                            }
                        }}
                    >
                        <div className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[94vh] sm:max-w-6xl sm:rounded-2xl">
                            {/* HEADER */}

                            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 sm:flex">
                                        <Icon
                                            name="document"
                                            className="h-4 w-4"
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <h2
                                            id="resume-preview-title"
                                            className="text-sm font-bold text-gray-900 sm:text-base"
                                        >
                                            Resume Preview
                                        </h2>

                                        <p className="mt-0.5 max-w-[60vw] truncate text-[10px] text-gray-500 sm:max-w-[50vw] sm:text-xs">
                                            {
                                                application.resume_file_name
                                            }
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeResumeModal
                                    }
                                    className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                                    aria-label="Close resume preview"
                                >
                                    <Icon
                                        name="x"
                                        className="h-5 w-5"
                                    />
                                </button>
                            </div>

                            {/* PREVIEW */}

                            <div className="min-h-0 flex-1 bg-gray-100">
                                <iframe
                                    src={`/api/hr/application/${application.id}/resume`}
                                    title={`Resume preview - ${application.resume_file_name}`}
                                    className="h-full w-full border-0"
                                />
                            </div>

                            {/* FOOTER */}

                            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:px-5">
                                <p className="hidden text-xs text-gray-500 sm:block">
                                    Resume submitted with this application
                                </p>

                                <div className="ml-auto grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                                    <a
                                        href={`/api/hr/application/${application.id}/resume?download=true`}
                                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                                    >
                                        <Icon
                                            name="download"
                                            className="h-4 w-4"
                                        />
                                        Download
                                    </a>

                                    <button
                                        type="button"
                                        onClick={
                                            closeResumeModal
                                        }
                                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );


}
