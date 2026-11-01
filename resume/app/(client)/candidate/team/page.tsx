import { redirect } from "next/navigation";

// ============================================================
// TYPES
// ============================================================

interface TeamModule {
    name: string;
    description: string | null;
    requiredSkills: string | null;
}

interface Teammate {
    userId: number;
    fullName: string;
    moduleName: string;
}

interface BatchTeamAssignment {
    projectTitle: string;
    teamName: string;
    module: TeamModule;
    teammates: Teammate[];
}

interface BatchTeamResponse {
    success: boolean;
    hasAssignment: boolean;
    data?: BatchTeamAssignment;
    error?: string;
}

// ============================================================
// TEAM PAGE
// ============================================================

export default async function CandidateTeamPage() {
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
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // ========================================================
    // 3. FETCH TEAM ASSIGNMENT
    // ========================================================

    let teamAssignment: BatchTeamAssignment | null = null;

    try {
        const response = await fetch(
            `${baseUrl}/api/candidate/batch-team`,
            {
                method: "GET",
                headers: {
                    Cookie: cookieHeader,
                },
                cache: "no-store",
            }
        );

        // ====================================================
        // AUTHENTICATION
        // ====================================================

        if (response.status === 401) {
            redirect("/login");
        }

        // ====================================================
        // READ RESPONSE
        // ====================================================

        const data = (await response.json()) as BatchTeamResponse;

        if (
            response.ok &&
            data.success &&
            data.hasAssignment &&
            data.data
        ) {
            teamAssignment = data.data;
        }
    } catch (error) {
        // Re-throw Next.js redirects.
        if (
            error &&
            typeof error === "object" &&
            "digest" in error &&
            typeof error.digest === "string" &&
            error.digest.startsWith("NEXT_REDIRECT")
        ) {
            throw error;
        }

        // Gracefully show the empty state if the
        // team endpoint cannot be reached.
        teamAssignment = null;
    }

    // ========================================================
    // 4. NO TEAM ASSIGNMENT
    // ========================================================

    if (!teamAssignment) {
        return (
            <div className="relative min-h-full overflow-hidden text-gray-900">
                {/* Decorative background */}
                <div className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />

                <div className="relative mx-auto w-full max-w-6xl space-y-7 px-1 py-2 sm:space-y-8">
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
                                    <path d="M17 20h5v-2a4 4 0 0 0-4-4h-1" />
                                    <path d="M9 20H4v-2a4 4 0 0 1 4-4h1" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>
                            Candidate Workspace
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                            My Team
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
                            View your batch project team, assigned module,
                            and teammates once your allocation is finalized.
                        </p>
                    </div>

                    {/* Empty state */}
                    <div className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(79,70,229,0.25)] sm:p-10 lg:p-14">
                        {/* Decorative gradient */}
                        <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-indigo-500 via-violet-500 to-blue-500" />

                        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-3xl bg-indigo-200/40 blur-2xl" />

                                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-100 bg-linear-to-br from-indigo-50 to-blue-50 shadow-sm">
                                    <svg
                                        className="h-9 w-9 text-indigo-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="1.6"
                                            d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-8a4 4 0 11-8 0 4 4 0 018 0zm6 2a3 3 0 10-6 0 3 3 0 006 0z"
                                        />
                                    </svg>
                                </div>
                            </div>

                            <h2 className="mt-7 text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">
                                Your team is not ready yet
                            </h2>

                            <p className="mt-3 text-sm leading-7 text-gray-500 sm:text-base">
                                Your batch team information will appear here
                                once the HR team finalizes the allocation.
                            </p>

                            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                                Waiting for team allocation
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================
    // RENDER TEAM
    // ========================================================

    return (
        <div className="relative min-h-full overflow-hidden text-gray-900">
            {/* ==================================================
                DECORATIVE BACKGROUND
            ================================================== */}

            <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-200/25 blur-3xl" />
            <div className="pointer-events-none absolute top-1/2 -left-48 h-96 w-96 rounded-full bg-blue-200/15 blur-3xl" />

            <div className="relative mx-auto w-full max-w-6xl space-y-6 px-1 pb-8 sm:space-y-8">
                {/* ==================================================
                    PAGE HEADER
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
                                <path d="M17 20h5v-2a4 4 0 0 0-4-4h-1" />
                                <path d="M9 20H4v-2a4 4 0 0 1 4-4h1" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </span>
                        Candidate Workspace
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                        My Team
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
                        Your assigned batch team, project module, and
                        teammates — all in one place.
                    </p>
                </div>

                {/* ==================================================
                    TEAM HERO
                ================================================== */}

                <div className="group relative overflow-hidden rounded-3xl border border-indigo-200/70 bg-linear-to-br from-blue-200 via-violet-600 to-blue-500 p-px shadow-[0_25px_70px_-30px_rgba(79,70,229,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_80px_-30px_rgba(79,70,229,0.75)]">
                    <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-linear-to-br from-blue-300  to-blue-600">
                        {/* Decorative circles */}
                        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl transition-transform duration-700 group-hover:scale-110" />
                        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />

                        <div className="relative p-5 sm:p-7 lg:p-8">
                            {/* Hero top */}
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                                            <svg
                                                className="h-3 w-3"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 20 12 16.5 6.5 20 8 13.5 3 9l6.5-.5L12 2z" />
                                            </svg>
                                        </span>
                                        Batch Allocation Finalized
                                    </div>

                                    <h2 className="mt-4 wrap-break-word text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                        {teamAssignment.projectTitle}
                                    </h2>

                                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-indigo-100">
                                        <span>Assigned Team</span>
                                        <span className="font-bold text-white">
                                            {teamAssignment.teamName}
                                        </span>
                                    </div>
                                </div>

                                {/* Module badge */}
                                <div className="shrink-0 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:min-w-55">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-100">
                                        Your Primary Track
                                    </p>

                                    <p className="mt-2 wrap-break-word text-lg font-bold leading-6 text-white">
                                        {teamAssignment.module.name}
                                    </p>
                                </div>
                            </div>

                            {/* Hero stats */}
                            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-100">
                                        Team
                                    </p>
                                    <p className="mt-1 truncate text-sm font-bold text-white">
                                        {teamAssignment.teamName}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-100">
                                        Members
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-white">
                                        {teamAssignment.teammates.length + 1}
                                    </p>
                                </div>

                                <div className="col-span-2 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm sm:col-span-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-100">
                                        Track
                                    </p>
                                    <p className="mt-1 truncate text-sm font-bold text-white">
                                        {teamAssignment.module.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ==================================================
                    CONTENT GRID
                ================================================== */}

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 lg:gap-6">
                    {/* ==================================================
                        MODULE CARD
                    ================================================== */}

                    <div className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-[0_15px_45px_-30px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_25px_55px_-30px_rgba(79,70,229,0.35)] lg:col-span-3">
                        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-indigo-500 to-violet-500" />

                        <div className="p-5 sm:p-6">
                            {/* Card heading */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-50 to-violet-100 text-indigo-600">
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.8"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M4 5a2 2 0 012-2h8a2 2 0 012 2v16H6a2 2 0 01-2-2V5z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8 7h4M8 11h4M8 15h2"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M16 7h2a2 2 0 012 2v10"
                                            />
                                        </svg>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-bold text-gray-950">
                                            Your Module
                                        </h3>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            Your assigned project responsibility
                                        </p>
                                    </div>
                                </div>

                                <span className="hidden rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700 sm:inline-flex">
                                    Assigned
                                </span>
                            </div>

                            {/* Module */}
                            <div className="mt-6 rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50/80 via-white to-violet-50/60 p-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-500">
                                    Module
                                </p>

                                <p className="mt-2 wrap-break-word text-xl font-bold text-gray-950 sm:text-2xl">
                                    {teamAssignment.module.name}
                                </p>

                                <p className="mt-3 text-sm leading-7 text-gray-600">
                                    {teamAssignment.module.description ||
                                        "No specific module description provided."}
                                </p>
                            </div>

                            {/* Required skills */}
                            {teamAssignment.module.requiredSkills && (
                                <div className="mt-6">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
                                            Required Skills
                                        </p>

                                        <span className="text-xs text-gray-400">
                                            {
                                                teamAssignment.module.requiredSkills
                                                    .split(/[,\n;]+/)
                                                    .filter((skill) => skill.trim())
                                                    .length
                                            }{" "}
                                            skills
                                        </span>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {teamAssignment.module.requiredSkills
                                            .split(/[,\n;]+/)
                                            .map((skill, index) => {
                                                const trimmedSkill =
                                                    skill.trim();

                                                if (!trimmedSkill) {
                                                    return null;
                                                }

                                                return (
                                                    <span
                                                        key={`${trimmedSkill}-${index}`}
                                                        className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-100"
                                                    >
                                                        {trimmedSkill}
                                                    </span>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ==================================================
                        TEAMMATES CARD
                    ================================================== */}

                    <div className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-[0_15px_45px_-30px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_25px_55px_-30px_rgba(37,99,235,0.3)] lg:col-span-2">
                        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-blue-500 to-cyan-400" />

                        <div className="p-5 sm:p-6">
                            {/* Card heading */}
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-blue-50 to-cyan-100 text-blue-600">
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.8"
                                    >
                                        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                                    </svg>
                                </div>

                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-gray-950">
                                        Your Teammates
                                    </h3>

                                    <p className="mt-0.5 truncate text-xs text-gray-500">
                                        Members of {teamAssignment.teamName}
                                    </p>
                                </div>
                            </div>

                            {/* Current user */}
                            <div className="mt-6 rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50 to-blue-50 p-3.5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-blue-600 text-sm font-bold text-white shadow-sm">
                                        Y
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900">
                                            You
                                        </p>
                                        <p className="mt-0.5 text-xs text-indigo-600">
                                            {teamAssignment.module.name}
                                        </p>
                                    </div>

                                    <span className="ml-auto shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-indigo-600 shadow-sm">
                                        YOU
                                    </span>
                                </div>
                            </div>

                            {/* Teammates */}
                            {teamAssignment.teammates.length === 0 ? (
                                <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-6 text-center">
                                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm">
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.7"
                                        >
                                            <circle cx="12" cy="12" r="9" />
                                            <path d="M8 12h8M12 8v8" />
                                        </svg>
                                    </div>

                                    <p className="mt-3 text-sm font-semibold text-gray-700">
                                        No other teammates yet
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-gray-500">
                                        You are currently the only member
                                        assigned to this team.
                                    </p>
                                </div>
                            ) : (
                                <ul className="mt-4 space-y-2">
                                    {teamAssignment.teammates.map(
                                        (teammate, index) => {
                                            const initials =
                                                teammate.fullName
                                                    .split(" ")
                                                    .map((part) =>
                                                        part.charAt(0)
                                                    )
                                                    .slice(0, 2)
                                                    .join("")
                                                    .toUpperCase();

                                            return (
                                                <li
                                                    key={teammate.userId}
                                                    className="group/member rounded-2xl border border-gray-100 bg-gray-50/70 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-50/60"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 text-xs font-bold text-white shadow-sm">
                                                            {initials}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-semibold text-gray-900">
                                                                {
                                                                    teammate.fullName
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 truncate text-xs text-gray-500">
                                                                {
                                                                    teammate.moduleName
                                                                }
                                                            </p>
                                                        </div>

                                                        <span className="hidden shrink-0 rounded-full border border-blue-100 bg-white px-2.5 py-1 text-[10px] font-semibold text-blue-600 sm:inline-flex">
                                                            Member
                                                        </span>
                                                    </div>
                                                </li>
                                            );
                                        }
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* ==================================================
                    TEAM SUMMARY
                ================================================== */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Project */}
                    <div className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_12px_35px_-28px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.8"
                                >
                                    <path d="M3 7h5l2 2h11v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                                    <path d="M3 7V5a2 2 0 012-2h5l2 2" />
                                </svg>
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Project
                                </p>
                                <p className="mt-1 truncate text-sm font-bold text-gray-900">
                                    {teamAssignment.projectTitle}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Team */}
                    <div className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_12px_35px_-28px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.8"
                                >
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M17 11a4 4 0 10-1-7.87M3 21v-2a6 6 0 016-6h1a6 6 0 016 6v2" />
                                </svg>
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Team
                                </p>
                                <p className="mt-1 truncate text-sm font-bold text-gray-900">
                                    {teamAssignment.teamName}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Module */}
                    <div className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_12px_35px_-28px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.8"
                                >
                                    <path d="M4 5a2 2 0 012-2h8a2 2 0 012 2v16H6a2 2 0 01-2-2V5z" />
                                    <path d="M8 7h4M8 11h4M8 15h2" />
                                </svg>
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Your Module
                                </p>
                                <p className="mt-1 truncate text-sm font-bold text-gray-900">
                                    {teamAssignment.module.name}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}