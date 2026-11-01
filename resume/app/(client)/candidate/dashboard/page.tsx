import { redirect } from "next/navigation";
import Link from "next/link";

interface Candidate {
    id: number;
    fullName: string;
    email: string;
    phone: string | null;
    collegeDetails: string | null;
    applicantType:
        | "SINGLE_JOB_SEEKER"
        | "SINGLE_INTERN"
        | "BATCH_INTERN";
}

interface DashboardStatistics {
    totalApplications: number;
    pendingApplications: number;
    scheduledInterviews: number;
    selectedApplications: number;
    availableProjects: number;
}

interface RecentApplication {
    id: number;
    projectId: number;
    applicantType:
        | "SINGLE_JOB_SEEKER"
        | "SINGLE_INTERN"
        | "BATCH_INTERN";

    status:
        | "APPLIED"
        | "SHORTLISTED"
        | "INTERVIEW_SCHEDULED"
        | "SELECTED"
        | "REJECTED";

    score: number;
    matchedKeywords: number;
    confidencePercentage: number;

    createdAt: string;

    projectTitle: string;
    projectTargetType:
        | "SINGLE_JOB_SEEKER"
        | "SINGLE_INTERN"
        | "BATCH_INTERN";

    projectStatus:
        | "ACTIVE"
        | "CLOSED"
        | "DRAFT";
}

interface DashboardResponse {
    success: boolean;
    candidate: Candidate;
    statistics: DashboardStatistics;
    recentApplications: RecentApplication[];
    error?: string;
}

// ============================================================
// HELPERS
// ============================================================

function applicantTypeLabel(type: string) {
    switch (type) {
        case "SINGLE_JOB_SEEKER":
            return "Single Job Seeker";

        case "SINGLE_INTERN":
            return "Single Intern";

        case "BATCH_INTERN":
            return "Batch Intern";

        default:
            return type;
    }
}

function applicationStatusLabel(status: string) {
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

function applicationStatusClass(status: string) {
    switch (status) {
        case "APPLIED":
            return "border-slate-200 bg-slate-50 text-slate-700";

        case "SHORTLISTED":
            return "border-blue-200 bg-blue-50 text-blue-700";

        case "INTERVIEW_SCHEDULED":
            return "border-violet-200 bg-violet-50 text-violet-700";

        case "SELECTED":
            return "border-emerald-200 bg-emerald-50 text-emerald-700";

        case "REJECTED":
            return "border-red-200 bg-red-50 text-red-700";

        default:
            return "border-slate-200 bg-slate-50 text-slate-700";
    }
}

function formatDate(dateValue: string) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return date.toLocaleDateString("en-IN", {
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
            <path d="M8 7h8M8 11h8M8 15h5" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
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
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <path d="m5 12 4 4L19 6" />
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

function UserIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
    );
}

// ============================================================
// CANDIDATE DASHBOARD PAGE
// ============================================================

export default async function CandidateDashboardPage() {
    // ========================================================
    // 1. GET CURRENT COOKIES
    // ========================================================

    const { cookies } = await import("next/headers");

    const cookieStore = await cookies();

    const cookieHeader = cookieStore
        .getAll()
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");

    // ========================================================
    // 2. API BASE URL
    // ========================================================

    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        "http://localhost:3000";

    // ========================================================
    // 3. CALL DASHBOARD API
    // ========================================================

    const response = await fetch(
        `${baseUrl}/api/candidate/dashboard`,
        {
            method: "GET",

            headers: {
                Cookie: cookieHeader,
            },

            cache: "no-store",
        }
    );

    // ========================================================
    // 4. AUTHENTICATION
    // ========================================================

    if (response.status === 401) {
        redirect("/login");
    }

    // ========================================================
    // 5. CANDIDATE NOT FOUND
    // ========================================================

    if (response.status === 404) {
        redirect("/login");
    }

    // ========================================================
    // 6. READ API RESPONSE
    // ========================================================

    const data =
        (await response.json()) as DashboardResponse;

    if (!response.ok || !data.success) {
        throw new Error(
            data.error ??
                "Failed to load candidate dashboard"
        );
    }

    // ========================================================
    // 7. EXTRACT DATA
    // ========================================================

    const {
        candidate,
        statistics,
        recentApplications,
    } = data;

    // ========================================================
    // 8. RENDER
    // ========================================================

    return (
        <div className="relative min-h-full overflow-hidden bg-slate-50 text-slate-900">
            {/* ==================================================
                BACKGROUND
            ================================================== */}

            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
                <div className="absolute -left-40 top-[30%] h-96 w-96 rounded-full bg-sky-100/40 blur-3xl" />

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
                    HEADER
                ================================================== */}

                <section className="overflow-hidden rounded-2xl border border-blue-100 bg-linear-to-br from-white via-white to-blue-50/80 shadow-sm">
                    <div className="relative px-5 py-7 sm:px-7 sm:py-8 lg:px-9 lg:py-9">
                        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-100/40 blur-3xl" />

                        <div className="relative">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />

                                <span className="text-xs font-semibold text-blue-700 sm:text-sm">
                                    Candidate Portal
                                </span>
                            </div>

                            <h1 className="max-w-3xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                                Welcome,{" "}
                                <span className="text-blue-500">
                                    {candidate.fullName}
                                </span>
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                Track your applications, interviews,
                                and recruitment progress from one
                                place.
                            </p>

                            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/candidate/projects"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25"
                                >
                                    Explore Opportunities
                                    <ArrowRightIcon />
                                </Link>

                                <Link
                                    href="/candidate/profile"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                >
                                    <UserIcon />
                                    Manage Profile
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ==================================================
                    APPLICANT TYPE
                ================================================== */}

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <UserIcon />
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Applicant Type
                                </p>

                                <p className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                                    {applicantTypeLabel(
                                        candidate.applicantType
                                    )}
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/candidate/profile"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:w-auto"
                        >
                            Edit Profile
                            <ArrowRightIcon />
                        </Link>
                    </div>
                </section>

                {/* ==================================================
                    STATISTICS
                ================================================== */}

                <section>
                    <div className="mb-4 flex items-end justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                                Overview
                            </p>

                            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                                Your recruitment activity
                            </h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {/* TOTAL APPLICATIONS */}

                        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50">
                            <div className="flex items-start justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                                    <ApplicationsIcon />
                                </div>

                                <span className="text-xs font-semibold text-slate-400">
                                    TOTAL
                                </span>
                            </div>

                            <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                                {statistics.totalApplications}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Total Applications
                            </p>
                        </div>

                        {/* PENDING */}

                        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/50">
                            <div className="flex items-start justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
                                    <ClockIcon />
                                </div>

                                <span className="text-xs font-semibold text-slate-400">
                                    PENDING
                                </span>
                            </div>

                            <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                                {statistics.pendingApplications}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Pending Reviews
                            </p>
                        </div>

                        {/* INTERVIEWS */}

                        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/50">
                            <div className="flex items-start justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-100">
                                    <CalendarIcon />
                                </div>

                                <span className="text-xs font-semibold text-slate-400">
                                    UPCOMING
                                </span>
                            </div>

                            <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                                {statistics.scheduledInterviews}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Scheduled Interviews
                            </p>
                        </div>

                        {/* SELECTED */}

                        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/50">
                            <div className="flex items-start justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                                    <CheckIcon />
                                </div>

                                <span className="text-xs font-semibold text-slate-400">
                                    SUCCESS
                                </span>
                            </div>

                            <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                                {statistics.selectedApplications}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Selected Applications
                            </p>
                        </div>
                    </div>
                </section>

                {/* ==================================================
                    QUICK ACTIONS
                ================================================== */}

                <section>
                    <div className="mb-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                            Get Started
                        </p>

                        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            Quick Actions
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {/* PROJECTS */}

                        <Link
                            href="/candidate/projects"
                            className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50 to-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/60 sm:p-6"
                        >
                            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-100/70 transition-transform duration-300 group-hover:scale-125" />

                            <div className="relative">
                                <div className="flex items-center justify-between">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                                        <BriefcaseIcon />
                                    </div>

                                    <ArrowRightIcon />
                                </div>

                                <h3 className="mt-5 text-base font-bold text-slate-900">
                                    Browse Projects
                                </h3>

                                <p className="mt-1 text-sm leading-5 text-slate-600">
                                    View available recruitment
                                    opportunities.
                                </p>

                                <p className="mt-5 text-sm font-bold text-blue-600">
                                    {statistics.availableProjects} active
                                    projects
                                </p>
                            </div>
                        </Link>

                        {/* APPLICATIONS */}

                        <Link
                            href="/candidate/application"
                            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg sm:p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                                    <ApplicationsIcon />
                                </div>

                                <ArrowRightIcon />
                            </div>

                            <h3 className="mt-5 text-base font-bold text-slate-900">
                                My Applications
                            </h3>

                            <p className="mt-1 text-sm leading-5 text-slate-600">
                                Track the status of your submitted
                                applications.
                            </p>

                            <p className="mt-5 text-sm font-bold text-slate-700 group-hover:text-blue-600">
                                View applications
                            </p>
                        </Link>

                        {/* INTERVIEWS */}

                        <Link
                            href="/candidate/interview"
                            className="group relative overflow-hidden rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50/70 to-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100/50 sm:p-6"
                        >
                            <div className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-violet-100/60 transition-transform duration-300 group-hover:scale-125" />

                            <div className="relative">
                                <div className="flex items-center justify-between">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                                        <CalendarIcon />
                                    </div>

                                    <ArrowRightIcon />
                                </div>

                                <h3 className="mt-5 text-base font-bold text-slate-900">
                                    Interview Schedule
                                </h3>

                                <p className="mt-1 text-sm leading-5 text-slate-600">
                                    View your scheduled interviews
                                    and meeting details.
                                </p>

                                <p className="mt-5 text-sm font-bold text-violet-600">
                                    {statistics.scheduledInterviews} scheduled
                                </p>
                            </div>
                        </Link>
                    </div>
                </section>

                {/* ==================================================
                    RECENT APPLICATIONS
                ================================================== */}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* HEADER */}

                    <div className="flex flex-col gap-4 border-b border-slate-100 bg-linear-to-r from-white to-blue-50/40 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />

                                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                                    Activity
                                </p>
                            </div>

                            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                                Recent Applications
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Your latest recruitment applications.
                            </p>
                        </div>

                        <Link
                            href="/candidate/application"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
                        >
                            View all
                            <ArrowRightIcon />
                        </Link>
                    </div>

                    {/* APPLICATION LIST */}

                    {recentApplications.length === 0 ? (
                        <div className="px-5 py-14 text-center sm:px-6">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <ApplicationsIcon />
                            </div>

                            <p className="mt-4 text-base font-bold text-slate-900">
                                No applications yet
                            </p>

                            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
                                Browse available projects and
                                submit your first application.
                            </p>

                            <Link
                                href="/candidate/projects"
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-lg"
                            >
                                Browse Projects
                                <ArrowRightIcon />
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {recentApplications.map(
                                (application) => (
                                    <div
                                        key={application.id}
                                        className="group p-5 transition-colors duration-200 hover:bg-slate-50/70 sm:p-6"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            {/* PROJECT */}

                                            <div className="min-w-0">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                                        <BriefcaseIcon />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-base font-bold text-slate-900">
                                                            {
                                                                application.projectTitle
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            Applied on{" "}
                                                            {formatDate(
                                                                application.createdAt
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* STATUS */}

                                            <div className="shrink-0">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold ${applicationStatusClass(
                                                        application.status
                                                    )}`}
                                                >
                                                    <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />

                                                    {applicationStatusLabel(
                                                        application.status
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {/* DETAILS */}

                                        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-4">
                                            <div>
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                                    Score
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-slate-900">
                                                    {
                                                        application.score
                                                    }
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                                    Matched Keywords
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-slate-900">
                                                    {
                                                        application.matchedKeywords
                                                    }
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                                    Confidence
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-blue-600">
                                                    {Number(
                                                        application.confidencePercentage
                                                    ).toFixed(2)}
                                                    %
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                                    Applicant Type
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-slate-900">
                                                    {applicantTypeLabel(
                                                        application.applicantType
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}