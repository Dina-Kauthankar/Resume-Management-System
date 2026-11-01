import { notFound, redirect } from "next/navigation";

import ApplicationForm from "./ApplicationForm";

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
    description: string | null;
    requiredSkills: string | null;
    createdAt?: string;
}

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

interface Project {
    id: number;
    title: string;
    targetType:
        | "SINGLE_JOB_SEEKER"
        | "SINGLE_INTERN"
        | "BATCH_INTERN";
    keywords: Keyword[];
    modules: ProjectModule[];
}

// ============================================================
// APPLICATION PAGE
// ============================================================

export default async function ApplicationPage({
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
    // 3. GET CURRENT REQUEST COOKIES
    // ========================================================

    const { cookies } = await import("next/headers");

    const cookieStore = await cookies();

    const cookieHeader = cookieStore
        .getAll()
        .map(
            (cookie) =>
                `${cookie.name}=${cookie.value}`
        )
        .join("; ");

    // ========================================================
    // 4. APPLICATION API URL
    // ========================================================

    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        "http://localhost:3000";

    const apiUrl =
        `${baseUrl}/api/candidate/projects/${projectIdNumber}/apply`;

    // ========================================================
    // 5. CALL APPLICATION API
    // ========================================================

    const response = await fetch(
        apiUrl,
        {
            method: "GET",

            headers: {
                Cookie: cookieHeader,
            },

            cache: "no-store",
        }
    );

    // ========================================================
    // 6. HANDLE AUTHENTICATION
    // ========================================================

    if (response.status === 401) {
        redirect("/login");
    }

    // ========================================================
    // 7. HANDLE PROJECT NOT FOUND / INACTIVE
    // ========================================================

    if (response.status === 404) {
        notFound();
    }

    // ========================================================
    // 8. READ API RESPONSE
    // ========================================================

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(
            data.error ||
                "Failed to load application page"
        );
    }

    // ========================================================
    // 9. EXTRACT PROJECT
    // ========================================================

    const project: Project = {
        id: data.project.id,
        title: data.project.title,
        targetType: data.project.targetType,

        keywords: Array.isArray(
            data.project.keywords
        )
            ? data.project.keywords.map(
                  (keyword: any) => ({
                      id: keyword.id,
                      projectId:
                          keyword.projectId,
                      keyword:
                          keyword.keyword,
                      weight:
                          keyword.weight,
                  })
              )
            : [],

        modules: Array.isArray(
            data.project.modules
        )
            ? data.project.modules.map(
                  (module: any) => ({
                      id: module.id,
                      projectId:
                          module.projectId,
                      name: module.name,

                      description:
                          module.description ??
                          null,

                      requiredSkills:
                          module.requiredSkills ??
                          null,

                      createdAt:
                          module.createdAt,
                  })
              )
            : [],
    };

    // ========================================================
    // 10. EXTRACT CANDIDATE
    // ========================================================

    const candidate: Candidate = {
        id: data.candidate.id,

        fullName:
            data.candidate.fullName,

        email:
            data.candidate.email,

        phone:
            data.candidate.phone ?? null,

        collegeDetails:
            data.candidate.collegeDetails ??
            null,

        applicantType:
            data.candidate.applicantType,
    };

    // ========================================================
    // 11. CHECK EXISTING APPLICATION
    // ========================================================

    if (data.existingApplication) {
        redirect("/candidate/application");
    }

    // ========================================================
    // 12. RENDER APPLICATION PAGE
    // ========================================================

    return (
        <div className="min-h-full bg-transparent text-gray-900">
            <div className="mx-auto w-full max-w-5xl px-0 py-2 sm:py-4 lg:py-6">

                {/* ==================================================
                    PAGE HEADER
                ================================================== */}

                <div className="relative mb-6 overflow-hidden rounded-3xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-purple-50 px-5 py-7 shadow-sm sm:px-8 sm:py-9 lg:px-10 lg:py-10">

                    {/* Decorative background shapes */}

                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-200/30 blur-3xl" />

                    <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-purple-200/30 blur-3xl" />

                    <div className="relative">

                        {/* Small label */}

                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur-sm">

                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />

                            Application

                        </div>

                        {/* Heading */}

                        <h1 className="max-w-3xl text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl lg:text-4xl">

                            Apply for{" "}

                            <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                {project.title}
                            </span>

                        </h1>

                        {/* Description */}

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">

                            Complete the steps below to submit
                            your application and start your
                            recruitment journey.

                        </p>

                        {/* Project information */}

                        <div className="mt-6 flex flex-wrap gap-2.5">

                            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3.5 py-2 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">

                                <span className="h-2 w-2 rounded-full bg-indigo-500" />

                                {project.targetType
                                    .replaceAll(
                                        "_",
                                        " "
                                    )
                                    .toLowerCase()
                                    .replace(
                                        /\b\w/g,
                                        (char: string) =>
                                            char.toUpperCase()
                                    )}

                            </div>

                            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3.5 py-2 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">

                                <span className="text-indigo-500">
                                    {project.keywords.length}
                                </span>

                                Required Skills

                            </div>

                            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3.5 py-2 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">

                                <span className="text-purple-500">
                                    {project.modules.length}
                                </span>

                                Modules

                            </div>

                        </div>

                    </div>
                </div>

                {/* ==================================================
                    APPLICATION FORM
                ================================================== */}

                <ApplicationForm
                    candidate={candidate}
                    project={{
                        id: project.id,
                        title: project.title,
                        targetType:
                            project.targetType,
                        keywords:
                            project.keywords,
                        modules:
                            project.modules,
                    }}
                />

            </div>
        </div>
    );
}