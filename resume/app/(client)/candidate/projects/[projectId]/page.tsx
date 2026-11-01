import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

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
    description?: string | null;
    requiredSkills?: string | null;
    createdAt?: string;
}

interface ExistingApplication {
    id: number;
    status: string;
}

interface Project {
    id: number;
    title: string;
    description: string;
    targetType:
        | "SINGLE_JOB_SEEKER"
        | "SINGLE_INTERN"
        | "BATCH_INTERN";
    status: string;
    createdAt: string;
    keywords: Keyword[];
    modules: ProjectModule[];
    existingApplication: ExistingApplication | null;
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
            return applicantType;
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
// HELPER: APPLICATION STATUS
// ============================================================

function getApplicationStatusStyle(status: string) {
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

// ============================================================
// HELPER: FORMAT APPLICATION STATUS
// ============================================================

function formatApplicationStatus(status: string) {
    return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char: string) => char.toUpperCase());
}

// ============================================================
// ICONS
// ============================================================

function ArrowLeftIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
        >
            <path d="M19 12H5M11 18l-6-6 6-6" />
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

function LayersIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-5 w-5"
        >
            <path d="m12 3 9 5-9 5-9-5 9-5Z" />
            <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
        >
            <path d="m5 12 4 4L19 6" />
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
            className="h-4 w-4"
        >
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    );
}

// ============================================================
// PROJECT DETAILS PAGE
// ============================================================

export default async function ProjectDetailsPage({
    params,
}: {
    params: Promise<{ projectId: string }>;
}) {
    // ========================================================
    // 1. GET PROJECT ID FROM URL
    // ========================================================

    const { projectId } = await params;

    const projectIdNumber = Number(projectId);

    // ========================================================
    // 2. VALIDATE PROJECT ID
    // ========================================================

    if (
        !Number.isInteger(projectIdNumber) ||
        projectIdNumber <= 0
    ) {
        notFound();
    }

    // ========================================================
    // 3. GET AUTH COOKIE
    // ========================================================

    const cookieStore = await cookies();

    // ========================================================
    // 4. FETCH PROJECT THROUGH API
    // ========================================================

    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        "http://localhost:3000";

    const response = await fetch(
        `${baseUrl}/api/candidate/projects/${projectIdNumber}`,
        {
            method: "GET",

            headers: {
                Cookie: cookieStore.toString(),
            },

            cache: "no-store",
        }
    );

    // ========================================================
    // 5. HANDLE API RESPONSE
    // ========================================================

    if (response.status === 401) {
        notFound();
    }

    if (response.status === 404) {
        notFound();
    }

    if (!response.ok) {
        throw new Error("Failed to fetch project details");
    }

    const data = await response.json();

    if (!data.success || !data.project) {
        notFound();
    }

    const project: Project = data.project;

    const typeStyle = getApplicantTypeStyle(
        project.targetType
    );

    // ========================================================
    // 6. RENDER PROJECT DETAILS
    // ========================================================

    return (
        <div className="relative min-h-full overflow-hidden bg-slate-50 text-slate-900">
            {/* ==================================================
                BACKGROUND
            ================================================== */}

            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />

                <div className="absolute -left-40 top-[45%] h-96 w-96 rounded-full bg-sky-100/40 blur-3xl" />

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
                    BACK BUTTON
                ================================================== */}

                <Link
                    href="/candidate/projects"
                    className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                    <ArrowLeftIcon />

                    <span>Back to Available Projects</span>
                </Link>

                {/* ==================================================
                    PROJECT HERO
                ================================================== */}

                <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-linear-to-br from-white via-white to-blue-50/80 shadow-sm">
                    {/* Decorative elements */}

                    <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />

                    <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-sky-100/40 blur-3xl" />

                    <div className="relative px-5 py-7 sm:px-7 sm:py-9 lg:px-9 lg:py-10">
                        {/* Top badge */}

                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />

                            <span className="text-xs font-semibold text-blue-700 sm:text-sm">
                                Recruitment Opportunity
                            </span>
                        </div>

                        {/* Main hero */}

                        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex min-w-0 gap-4 sm:gap-5">
                                {/* Project icon */}

                                <div
                                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold shadow-sm sm:h-16 sm:w-16 sm:text-2xl ${typeStyle.icon}`}
                                >
                                    {project.title
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                    <h1 className="wrap-break-word text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                                        {project.title}
                                    </h1>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Recruitment Project
                                    </p>
                                </div>
                            </div>

                            {/* Target type */}

                            <span
                                className={`w-fit shrink-0 rounded-full border px-4 py-2 text-xs font-bold sm:text-sm ${typeStyle.badge}`}
                            >
                                {getApplicantTypeLabel(
                                    project.targetType
                                )}
                            </span>
                        </div>

                        {/* Meta */}

                        <div className="mt-7 flex flex-wrap gap-2.5">
                            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm">
                                <BriefcaseIcon />

                                <span>
                                    {project.modules.length}{" "}
                                    {project.modules.length === 1
                                        ? "Module"
                                        : "Modules"}
                                </span>
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm">
                                <SparklesIcon />

                                <span>
                                    {project.keywords.length}{" "}
                                    Required Skills
                                </span>
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm">
                                <CalendarIcon />

                                <span>
                                    Posted{" "}
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
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 shadow-sm">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                                <span>
                                    {project.status ===
                                    "ACTIVE"
                                        ? "Active"
                                        : project.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ==================================================
                    MAIN CONTENT
                ================================================== */}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* ==================================================
                        LEFT / MAIN CONTENT
                    ================================================== */}

                    <div className="space-y-6 lg:col-span-2">
                        {/* ==================================================
                            PROJECT DESCRIPTION
                        ================================================== */}

                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <BriefcaseIcon />
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">
                                            About This Project
                                        </h2>

                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Learn more about this
                                            opportunity.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 py-6 sm:px-6">
                                <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                                    {project.description}
                                </p>
                            </div>
                        </section>

                        {/* ==================================================
                            REQUIRED SKILLS
                        ================================================== */}

                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <SparklesIcon />
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">
                                            Required Core Skills
                                        </h2>

                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Skills considered during resume
                                            evaluation.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 py-6 sm:px-6">
                                {project.keywords.length ===
                                0 ? (
                                    <p className="text-sm text-slate-500">
                                        No specific skills have
                                        been defined for this
                                        project.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {project.keywords.map(
                                            (keyword) => (
                                                <div
                                                    key={
                                                        keyword.id
                                                    }
                                                    className="group rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/40"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex min-w-0 items-center gap-2.5">
                                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                                                                <CheckIcon />
                                                            </span>

                                                            <p className="truncate text-sm font-semibold text-slate-800">
                                                                {
                                                                    keyword.keyword
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex items-center justify-between">
                                                        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                                            Skill
                                                            {/* Weight */}
                                                        </span>

                                                        {/* <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                                                            {
                                                                keyword.weight
                                                            }
                                                        </span> */}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* ==================================================
                            PROJECT MODULES
                        ================================================== */}

                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                        <LayersIcon />
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">
                                            Project Modules
                                        </h2>

                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Available modules within
                                            this recruitment project.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {project.modules.length ===
                                0 ? (
                                    <div className="px-5 py-6 sm:px-6">
                                        <p className="text-sm text-slate-500">
                                            No modules have been
                                            defined for this
                                            project yet.
                                        </p>
                                    </div>
                                ) : (
                                    project.modules.map(
                                        (module, index) => (
                                            <div
                                                key={module.id}
                                                className="px-5 py-5 transition-colors hover:bg-slate-50/70 sm:px-6"
                                            >
                                                <div className="flex gap-4">
                                                    {/* Number */}

                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                                                        {String(
                                                            index + 1
                                                        ).padStart(
                                                            2,
                                                            "0"
                                                        )}
                                                    </div>

                                                    {/* Content */}

                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-semibold text-slate-900">
                                                            {
                                                                module.name
                                                            }
                                                        </h3>

                                                        {module.description && (
                                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                                {
                                                                    module.description
                                                                }
                                                            </p>
                                                        )}

                                                        {module.requiredSkills && (
                                                            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                                                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                                    Required
                                                                    Skills
                                                                </p>

                                                                <p className="mt-1.5 text-sm leading-6 text-slate-700">
                                                                    {
                                                                        module.requiredSkills
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )
                                )}
                            </div>
                        </section>
                    </div>

                    {/* ==================================================
                        RIGHT SIDEBAR
                    ================================================== */}

                    <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                        {/* ==================================================
                            APPLICATION CARD
                        ================================================== */}

                        <section className="relative overflow-hidden rounded-2xl border border-blue-200 bg-linear-to-br from-blue-50 via-white to-white shadow-sm">
                            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-100/60 blur-2xl" />

                            <div className="relative p-5 sm:p-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                                    <BriefcaseIcon />
                                </div>

                                <h2 className="mt-4 text-lg font-bold text-slate-900">
                                    Apply for this Project
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Interested in this opportunity?
                                    Start your application by
                                    confirming your candidate
                                    details and uploading your
                                    resume.
                                </p>

                                {/* Already applied */}

                                {project.existingApplication ? (
                                    <div className="mt-5">
                                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-sm font-bold text-slate-900">
                                                    Application
                                                    submitted
                                                </p>

                                                <span
                                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${getApplicationStatusStyle(
                                                        project
                                                            .existingApplication
                                                            .status
                                                    )}`}
                                                >
                                                    {formatApplicationStatus(
                                                        project
                                                            .existingApplication
                                                            .status
                                                    )}
                                                </span>
                                            </div>

                                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                                You have already applied
                                                for this project.
                                            </p>
                                        </div>

                                        <Link
                                            href="/candidate/application"
                                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                        >
                                            View My Applications
                                            <ArrowRightIcon />
                                        </Link>
                                    </div>
                                ) : (
                                    <Link
                                        href={`/candidate/projects/${project.id}/apply`}
                                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200"
                                    >
                                        Start Application
                                        <ArrowRightIcon />
                                    </Link>
                                )}
                            </div>
                        </section>

                        {/* ==================================================
                            APPLICATION PROCESS
                        ================================================== */}

                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                                <h2 className="font-bold text-slate-900">
                                    Application Process
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Three simple steps to apply.
                                </p>
                            </div>

                            <div className="px-5 py-6 sm:px-6">
                                <div className="relative space-y-6">
                                    {/* Vertical line */}

                                    <div className="absolute left-4 top-8 h-[calc(100%-40px)] w-px bg-slate-200" />

                                    {/* Step 1 */}

                                    <div className="relative flex gap-3">
                                        <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
                                            1
                                        </div>

                                        <div className="pt-0.5">
                                            <p className="text-sm font-bold text-slate-900">
                                                Confirm Details
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                Verify your candidate
                                                information.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Step 2 */}

                                    <div className="relative flex gap-3">
                                        <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600">
                                            2
                                        </div>

                                        <div className="pt-0.5">
                                            <p className="text-sm font-bold text-slate-900">
                                                Upload Resume
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                Upload a supported resume
                                                file.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Step 3 */}

                                    <div className="relative flex gap-3">
                                        <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600">
                                            3
                                        </div>

                                        <div className="pt-0.5">
                                            <p className="text-sm font-bold text-slate-900">
                                                Review & Submit
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                Review your application
                                                before submitting.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ==================================================
                            IMPORTANT INFORMATION
                        ================================================== */}

                        <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6">
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
                                    !
                                </div>

                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Important Information
                                    </h2>

                                    <ul className="mt-3 space-y-2.5 text-xs leading-5 text-slate-600">
                                        <li>
                                            • Make sure your resume
                                            contains accurate information.
                                        </li>

                                        <li>
                                            • Your resume will be
                                            evaluated against the
                                            project's required skills.
                                        </li>

                                        <li>
                                            • Only one application is
                                            allowed for this project.
                                        </li>

                                        <li>
                                            • Your applicant type will be
                                            recorded with the application.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}