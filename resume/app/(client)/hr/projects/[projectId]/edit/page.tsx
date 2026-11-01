"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";


// ============================================================
// TYPES
// ============================================================

interface ProjectKeyword {
    id: number;
    keyword: string;
    weight: number;
}

interface ProjectModule {
    id: number;
    name: string;
    description: string | null;
    required_skills: string | null;
}

interface Project {
    id: number;
    title: string;
    description: string | null;
    target_type: string;
    status: string;
    created_by_id: number;
    created_at: string;
    updated_at: string;
    keywords: ProjectKeyword[];
    modules: ProjectModule[];
}

interface ProjectResponse {
    success: boolean;
    message?: string;
    project?: Project;
}


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatTargetType(targetType: string) {
    return targetType
        .toLowerCase()
        .split("_")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");
}


function formatStatus(status: string) {
    return status
        .toLowerCase()
        .split("_")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");
}


// ============================================================
// PAGE
// ============================================================

export default function EditProjectPage() {

    const params = useParams();

    const router = useRouter();

    const projectId =
        params.projectId as string;


    // ========================================================
    // FORM STATE
    // ========================================================

    const [title, setTitle] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [targetType, setTargetType] =
        useState("SINGLE_JOB_SEEKER");

    const [status, setStatus] =
        useState("DRAFT");


    // ========================================================
    // KEYWORDS
    // ========================================================

    const [keywords, setKeywords] =
        useState<ProjectKeyword[]>([]);


    // ========================================================
    // MODULES
    // ========================================================

    const [modules, setModules] =
        useState<ProjectModule[]>([]);


    // ========================================================
    // UI STATE
    // ========================================================

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);


    // ========================================================
    // LOAD PROJECT
    // ========================================================

    useEffect(() => {

        async function loadProject() {

            try {

                setLoading(true);
                setError(null);


                const response = await fetch(
                    `/api/hr/projects/${projectId}`,
                    {
                        method: "GET",
                        credentials: "include",
                        cache: "no-store",
                    }
                );


                const result: ProjectResponse =
                    await response.json();


                if (!response.ok || !result.success) {

                    throw new Error(
                        result.message ||
                        "Failed to load project."
                    );
                }


                if (!result.project) {

                    throw new Error(
                        "Project data was not returned."
                    );
                }


                const project =
                    result.project;


                setTitle(
                    project.title
                );

                setDescription(
                    project.description ?? ""
                );

                setTargetType(
                    project.target_type
                );

                setStatus(
                    project.status
                );

                setKeywords(
                    project.keywords ?? []
                );

                setModules(
                    project.modules ?? []
                );


            } catch (error) {

                console.error(
                    "Load project for editing error:",
                    error
                );


                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load project."
                );

            } finally {

                setLoading(false);

            }
        }


        if (projectId) {
            loadProject();
        }

    }, [projectId]);


    // ========================================================
    // ADD KEYWORD
    // ========================================================

    function addKeyword() {

        setKeywords((currentKeywords) => [

            ...currentKeywords,

            {
                id: Date.now(),
                keyword: "",
                weight: 1,
            },

        ]);
    }


    // ========================================================
    // REMOVE KEYWORD
    // ========================================================

    function removeKeyword(
        index: number
    ) {

        setKeywords((currentKeywords) =>
            currentKeywords.filter(
                (_, keywordIndex) =>
                    keywordIndex !== index
            )
        );
    }


    // ========================================================
    // UPDATE KEYWORD
    // ========================================================

    function updateKeyword(
        index: number,
        field: "keyword" | "weight",
        value: string
    ) {

        setKeywords((currentKeywords) => {

            const updated =
                [...currentKeywords];

            if (field === "keyword") {

                updated[index] = {
                    ...updated[index],
                    keyword: value,
                };

            } else {

                let weight =
                    Number(value);

                if (
                    !Number.isInteger(weight) ||
                    weight < 1
                ) {
                    weight = 1;
                }

                if (weight > 5) {
                    weight = 5;
                }

                updated[index] = {
                    ...updated[index],
                    weight,
                };
            }

            return updated;
        });
    }


    // ========================================================
    // ADD MODULE
    // ========================================================

    function addModule() {

        setModules((currentModules) => [

            ...currentModules,

            {
                id: Date.now(),
                name: "",
                description: "",
                required_skills: "",
            },

        ]);
    }


    // ========================================================
    // REMOVE MODULE
    // ========================================================

    function removeModule(
        index: number
    ) {

        setModules((currentModules) =>
            currentModules.filter(
                (_, moduleIndex) =>
                    moduleIndex !== index
            )
        );
    }


    // ========================================================
    // UPDATE MODULE
    // ========================================================

    function updateModule(
        index: number,
        field:
            | "name"
            | "description"
            | "required_skills",
        value: string
    ) {

        setModules((currentModules) => {

            const updated =
                [...currentModules];

            updated[index] = {
                ...updated[index],
                [field]: value,
            };

            return updated;
        });
    }


    // ========================================================
    // SUBMIT
    // ========================================================

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();

        setError(null);


        // ====================================================
        // BASIC VALIDATION
        // ====================================================

        if (!title.trim()) {

            setError(
                "Project title is required."
            );

            return;
        }


        if (!description.trim()) {

            setError(
                "Project description is required."
            );

            return;
        }


        // ====================================================
        // KEYWORD VALIDATION
        // ====================================================

        const invalidKeyword =
            keywords.some(
                (keyword) =>
                    !keyword.keyword.trim()
            );


        if (invalidKeyword) {

            setError(
                "Every keyword must have a value."
            );

            return;
        }


        // ====================================================
        // MODULE VALIDATION
        // ====================================================

        const invalidModule =
            modules.some(
                (module) =>
                    !module.name.trim()
            );


        if (invalidModule) {

            setError(
                "Every module must have a name."
            );

            return;
        }


        try {

            setSaving(true);


            // ====================================================
            // UPDATE PROJECT
            // ====================================================

            const response = await fetch(
                `/api/hr/projects/${projectId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    credentials: "include",

                    body: JSON.stringify({

                        title:
                            title.trim(),

                        description:
                            description.trim(),

                        target_type:
                            targetType,

                        status:
                            status,

                        keywords:
                            keywords.map(
                                (keyword) => ({
                                    keyword:
                                        keyword.keyword.trim(),

                                    weight:
                                        keyword.weight,
                                })
                            ),

                        modules:
                            modules.map(
                                (module) => ({
                                    name:
                                        module.name.trim(),

                                    description:
                                        module.description?.trim() ||
                                        null,

                                    required_skills:
                                        module.required_skills?.trim() ||
                                        null,
                                })
                            ),
                    }),
                }
            );


            const result =
                await response.json();


            // ====================================================
            // RESPONSE CHECK
            // ====================================================

            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Failed to update project."
                );
            }


            // ====================================================
            // SUCCESS
            // ====================================================

            router.push(
                `/hr/projects/${projectId}`
            );

            router.refresh();


        } catch (error) {

            console.error(
                "Update project error:",
                error
            );


            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to update project."
            );

        } finally {

            setSaving(false);

        }
    }


    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (
            <div className="w-full max-w-5xl mx-auto space-y-6">

                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />

                <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 lg:p-8 space-y-7 shadow-sm">

                    <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />

                    <div className="h-11 w-full bg-gray-200 rounded-xl animate-pulse" />

                    <div className="h-32 w-full bg-gray-200 rounded-xl animate-pulse" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        <div className="h-11 bg-gray-200 rounded-xl animate-pulse" />

                        <div className="h-11 bg-gray-200 rounded-xl animate-pulse" />

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
            <div className="w-full max-w-5xl mx-auto">

                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            "/hr/projects"
                        )
                    }
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
                >
                    <span>←</span>
                    Back to Projects
                </button>


                <div className="mt-6 rounded-2xl border border-red-200 bg-linear-to-br from-red-50 to-white p-6 sm:p-8 shadow-sm">

                    <div className="flex items-start gap-4">

                        <div className="w-11 h-11 shrink-0 rounded-xl bg-red-100 flex items-center justify-center">

                            <span className="text-lg">
                                !
                            </span>

                        </div>

                        <div>

                            <h1 className="text-lg font-bold text-red-800">
                                Unable to load project
                            </h1>

                            <p className="text-sm text-red-700 mt-1 leading-6">
                                {error}
                            </p>

                        </div>

                    </div>

                </div>

            </div>
        );
    }


    // ========================================================
    // PAGE
    // ========================================================

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 pb-8">


            {/* ==================================================
                HEADER
            ================================================== */}

            <header className="space-y-4">

                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            `/hr/projects/${projectId}`
                        )
                    }
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
                >
                    <span>←</span>
                    Back to Project
                </button>


                <div className="rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-blue-50 p-5 sm:p-7 shadow-sm">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

                        <div>

                            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                Project Management
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                                Edit Project
                            </h1>

                            <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-2xl leading-6">
                                Update the recruitment project's details,
                                keywords, and modules.
                            </p>

                        </div>

                        <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white border border-indigo-100 shadow-sm items-center justify-center">

                            <span className="text-2xl">
                                ✎
                            </span>

                        </div>

                    </div>

                </div>

            </header>


            {/* ==================================================
                FORM
            ================================================== */}

            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >


                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (

                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">

                        <div className="flex items-start gap-3">

                            <div className="w-9 h-9 shrink-0 rounded-lg bg-red-100 flex items-center justify-center text-red-700 font-bold">
                                !
                            </div>

                            <div>

                                <p className="text-sm font-semibold text-red-800">
                                    Please check the form
                                </p>

                                <p className="text-sm text-red-700 mt-1">
                                    {error}
                                </p>

                            </div>

                        </div>

                    </div>

                )}


                {/* ==================================================
                    BASIC INFORMATION
                ================================================== */}

                <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

                    <div className="px-5 sm:px-7 py-5 border-b border-gray-100 bg-linear-to-r from-white to-indigo-50/40">

                        <div className="flex items-start gap-3">

                            <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-100 flex items-center justify-center">

                                <span className="text-indigo-700">
                                    ✦
                                </span>

                            </div>

                            <div>

                                <h2 className="text-lg font-bold text-indigo-950">
                                    Project Information
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Update the basic recruitment project
                                    information.
                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="p-5 sm:p-7 space-y-6">

                        {/* TITLE */}

                        <div>

                            <label
                                htmlFor="title"
                                className="block text-sm font-semibold text-gray-800 mb-2"
                            >
                                Project Title
                                <span className="text-red-500 ml-1">
                                    *
                                </span>
                            </label>

                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(event) =>
                                    setTitle(
                                        event.target.value
                                    )
                                }
                                maxLength={255}
                                disabled={saving}
                                placeholder="Enter project title"
                                className="w-full h-11 sm:h-12 px-4 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />

                        </div>


                        {/* DESCRIPTION */}

                        <div>

                            <div className="flex items-center justify-between gap-3 mb-2">

                                <label
                                    htmlFor="description"
                                    className="block text-sm font-semibold text-gray-800"
                                >
                                    Description
                                    <span className="text-red-500 ml-1">
                                        *
                                    </span>
                                </label>

                                <span className="text-xs text-gray-400">
                                    {description.length} characters
                                </span>

                            </div>

                            <textarea
                                id="description"
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value
                                    )
                                }
                                rows={7}
                                disabled={saving}
                                placeholder="Describe the recruitment project..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white outline-none resize-y transition placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />

                        </div>


                        {/* TARGET + STATUS */}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* TARGET TYPE */}

                            <div>

                                <label
                                    htmlFor="targetType"
                                    className="block text-sm font-semibold text-gray-800 mb-2"
                                >
                                    Target Applicant Type
                                </label>

                                <select
                                    id="targetType"
                                    value={targetType}
                                    onChange={(event) =>
                                        setTargetType(
                                            event.target.value
                                        )
                                    }
                                    disabled={saving}
                                    className="w-full h-11 sm:h-12 px-4 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white outline-none transition hover:border-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >

                                    <option value="SINGLE_JOB_SEEKER">
                                        Single Job Seeker
                                    </option>

                                    <option value="SINGLE_INTERN">
                                        Single Intern
                                    </option>

                                    <option value="BATCH_INTERN">
                                        Batch Intern
                                    </option>

                                </select>

                                <p className="mt-2 text-xs text-indigo-600">
                                    Defines the type of candidates
                                    this project accepts.
                                </p>

                            </div>


                            {/* STATUS */}

                            <div>

                                <label
                                    htmlFor="status"
                                    className="block text-sm font-semibold text-gray-800 mb-2"
                                >
                                    Project Status
                                </label>

                                <select
                                    id="status"
                                    value={status}
                                    onChange={(event) =>
                                        setStatus(
                                            event.target.value
                                        )
                                    }
                                    disabled={saving}
                                    className="w-full h-11 sm:h-12 px-4 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white outline-none transition hover:border-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >

                                    <option value="DRAFT">
                                        Draft
                                    </option>

                                    <option value="ACTIVE">
                                        Active
                                    </option>

                                    <option value="CLOSED">
                                        Closed
                                    </option>

                                </select>

                                <p
                                    className={`mt-2 text-xs font-medium ${
                                        status === "ACTIVE"
                                            ? "text-emerald-600"
                                            : status === "CLOSED"
                                            ? "text-red-600"
                                            : "text-amber-600"
                                    }`}
                                >
                                    Current status:{" "}
                                    {formatStatus(status)}
                                </p>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    KEYWORDS
                ================================================== */}

                <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

                    <div className="px-5 sm:px-7 py-5 border-b border-gray-100 bg-linear-to-r from-white to-emerald-50/40">

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                            <div className="flex items-start gap-3">

                                <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-100 flex items-center justify-center">

                                    <span className="text-emerald-700 font-bold">
                                        #
                                    </span>

                                </div>

                                <div>

                                    <h2 className="text-lg font-bold text-emerald-950">
                                        Project Keywords
                                    </h2>

                                    <p className="text-sm text-gray-500 mt-1">
                                        Keywords used when evaluating
                                        candidate resumes.
                                    </p>

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={addKeyword}
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-emerald-700 hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-base">
                                    +
                                </span>
                                Add Keyword
                            </button>

                        </div>

                    </div>


                    <div className="p-5 sm:p-7">

                        {keywords.length === 0 ? (

                            <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 sm:p-8 text-center">

                                <div className="mx-auto w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">

                                    <span className="text-emerald-600 text-lg">
                                        #
                                    </span>

                                </div>

                                <p className="text-sm font-medium text-emerald-800 mt-3">
                                    No keywords added yet
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                    Add keywords to improve resume
                                    evaluation.
                                </p>

                            </div>

                        ) : (

                            <div className="space-y-3">

                                {keywords.map(
                                    (keyword, index) => (

                                        <div
                                            key={
                                                keyword.id
                                            }
                                            className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:p-4 transition hover:border-emerald-200 hover:bg-emerald-50/20"
                                        >

                                            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_120px_auto] gap-3 items-end">

                                                {/* KEYWORD */}

                                                <div>

                                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                                                        Keyword
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={
                                                            keyword.keyword
                                                        }
                                                        disabled={saving}
                                                        onChange={(event) =>
                                                            updateKeyword(
                                                                index,
                                                                "keyword",
                                                                event.target.value
                                                            )
                                                        }
                                                        placeholder="Example: React"
                                                        className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-gray-100"
                                                    />

                                                </div>


                                                {/* WEIGHT */}

                                                <div>

                                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                                                        Weight
                                                    </label>

                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={5}
                                                        value={
                                                            keyword.weight
                                                        }
                                                        disabled={saving}
                                                        onChange={(event) =>
                                                            updateKeyword(
                                                                index,
                                                                "weight",
                                                                event.target.value
                                                            )
                                                        }
                                                        className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm font-semibold text-emerald-700 bg-white outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-gray-100"
                                                    />

                                                </div>


                                                {/* REMOVE */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeKeyword(
                                                            index
                                                        )
                                                    }
                                                    disabled={saving}
                                                    className="h-11 px-4 border border-red-200 bg-white text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Remove
                                                </button>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </div>

                </section>


                {/* ==================================================
                    MODULES
                ================================================== */}

                <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

                    <div className="px-5 sm:px-7 py-5 border-b border-gray-100 bg-linear-to-r from-white to-violet-50/40">

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                            <div className="flex items-start gap-3">

                                <div className="w-10 h-10 shrink-0 rounded-xl bg-violet-100 flex items-center justify-center">

                                    <span className="text-violet-700 font-bold">
                                        ◈
                                    </span>

                                </div>

                                <div>

                                    <h2 className="text-lg font-bold text-violet-950">
                                        Project Modules
                                    </h2>

                                    <p className="text-sm text-gray-500 mt-1">
                                        Define the modules that candidates
                                        may be assigned to.
                                    </p>

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={addModule}
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-violet-700 hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-base">
                                    +
                                </span>
                                Add Module
                            </button>

                        </div>

                    </div>


                    <div className="p-5 sm:p-7">

                        {modules.length === 0 ? (

                            <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/50 p-6 sm:p-8 text-center">

                                <div className="mx-auto w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center">

                                    <span className="text-violet-600">
                                        ◈
                                    </span>

                                </div>

                                <p className="text-sm font-medium text-violet-800 mt-3">
                                    No modules added yet
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                    Add modules to define assignment
                                    areas for candidates.
                                </p>

                            </div>

                        ) : (

                            <div className="space-y-5">

                                {modules.map(
                                    (module, index) => (

                                        <div
                                            key={
                                                module.id
                                            }
                                            className="rounded-2xl border border-gray-200 overflow-hidden transition hover:border-violet-200 hover:shadow-sm"
                                        >

                                            {/* MODULE HEADER */}

                                            <div className="px-4 sm:px-5 py-4 bg-linear-to-r from-violet-50 to-white border-b border-violet-100">

                                                <div className="flex items-center justify-between gap-3">

                                                    <div className="flex items-center gap-3 min-w-0">

                                                        <div className="w-9 h-9 shrink-0 rounded-lg bg-violet-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                                                            {index + 1}
                                                        </div>

                                                        <div className="min-w-0">

                                                            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                                                                Module
                                                            </p>

                                                            <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                                                                {module.name ||
                                                                    `Module ${index + 1}`}
                                                            </h3>

                                                        </div>

                                                    </div>


                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeModule(
                                                                index
                                                            )
                                                        }
                                                        disabled={saving}
                                                        className="shrink-0 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                                                    >
                                                        Remove
                                                    </button>

                                                </div>

                                            </div>


                                            {/* MODULE BODY */}

                                            <div className="p-4 sm:p-5 space-y-5">

                                                {/* MODULE NAME */}

                                                <div>

                                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                        Module Name
                                                        <span className="text-red-500 ml-1">
                                                            *
                                                        </span>
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={
                                                            module.name
                                                        }
                                                        disabled={saving}
                                                        onChange={(event) =>
                                                            updateModule(
                                                                index,
                                                                "name",
                                                                event.target.value
                                                            )
                                                        }
                                                        placeholder="Example: Frontend Development"
                                                        className="w-full h-11 sm:h-12 px-4 border border-gray-300 rounded-xl text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-gray-100"
                                                    />

                                                </div>


                                                {/* DESCRIPTION */}

                                                <div>

                                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                        Description
                                                    </label>

                                                    <textarea
                                                        value={
                                                            module.description ??
                                                            ""
                                                        }
                                                        rows={4}
                                                        disabled={saving}
                                                        onChange={(event) =>
                                                            updateModule(
                                                                index,
                                                                "description",
                                                                event.target.value
                                                            )
                                                        }
                                                        placeholder="Describe what this module involves."
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 outline-none resize-y transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-gray-100"
                                                    />

                                                </div>


                                                {/* REQUIRED SKILLS */}

                                                <div>

                                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                        Required Skills
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={
                                                            module.required_skills ??
                                                            ""
                                                        }
                                                        disabled={saving}
                                                        onChange={(event) =>
                                                            updateModule(
                                                                index,
                                                                "required_skills",
                                                                event.target.value
                                                            )
                                                        }
                                                        placeholder="Example: React, Next.js, TypeScript"
                                                        className="w-full h-11 sm:h-12 px-4 border border-gray-300 rounded-xl text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-gray-100"
                                                    />

                                                    <p className="mt-2 text-xs text-violet-600">
                                                        Separate multiple skills
                                                        with commas.
                                                    </p>

                                                </div>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </div>

                </section>


                {/* ==================================================
                    ACTIONS
                ================================================== */}

                <div className="sticky bottom-0 z-10 -mx-3 sm:mx-0">

                    <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg p-3 sm:p-4">

                        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">

                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        `/hr/projects/${projectId}`
                                    )
                                }
                                disabled={saving}
                                className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>


                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-700 hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >

                                {saving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <span>
                                            ✓
                                        </span>
                                        Save Changes
                                    </>
                                )}

                            </button>

                        </div>

                    </div>

                </div>

            </form>

        </div>
    );
}