"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

// ============================================================
// TYPES
// ============================================================

interface KeywordInput {
    keyword: string;
    weight: number;
}

interface ModuleInput {
    name: string;
    description: string;
    required_skills: string;
}

interface CreateProjectResponse {
    success: boolean;
    message?: string;
    projectId?: number;
}


// ============================================================
// DEFAULT VALUES
// ============================================================

const EMPTY_KEYWORD: KeywordInput = {
    keyword: "",
    weight: 1,
};

const EMPTY_MODULE: ModuleInput = {
    name: "",
    description: "",
    required_skills: "",
};


// ============================================================
// PAGE
// ============================================================

export default function CreateProjectPage() {

    const router = useRouter();


    // ========================================================
    // PROJECT DETAILS
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
        useState<KeywordInput[]>([
            {
                ...EMPTY_KEYWORD,
            },
        ]);


    // ========================================================
    // MODULES
    // ========================================================

    const [modules, setModules] =
        useState<ModuleInput[]>([
            {
                ...EMPTY_MODULE,
            },
        ]);


    // ========================================================
    // UI STATE
    // ========================================================

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);


    // ========================================================
    // KEYWORD HANDLERS
    // ========================================================

    function addKeyword() {

        setKeywords((current) => [
            ...current,
            {
                ...EMPTY_KEYWORD,
            },
        ]);
    }


    function removeKeyword(index: number) {

        setKeywords((current) => {

            if (current.length === 1) {
                return current;
            }

            return current.filter(
                (_, currentIndex) =>
                    currentIndex !== index
            );
        });
    }


    function updateKeyword(
        index: number,
        field: keyof KeywordInput,
        value: string
    ) {

        setKeywords((current) =>
            current.map((item, currentIndex) => {

                if (currentIndex !== index) {
                    return item;
                }

                if (field === "keyword") {

                    return {
                        ...item,
                        keyword: value,
                    };
                }

                let weight =
                    Number(value);

                if (!Number.isInteger(weight)) {
                    weight = 1;
                }

                if (weight < 1) {
                    weight = 1;
                }

                if (weight > 10) {
                    weight = 10;
                }

                return {
                    ...item,
                    weight,
                };
            })
        );
    }


    // ========================================================
    // MODULE HANDLERS
    // ========================================================

    function addModule() {

        setModules((current) => [
            ...current,
            {
                ...EMPTY_MODULE,
            },
        ]);
    }


    function removeModule(index: number) {

        setModules((current) => {

            if (current.length === 1) {
                return current;
            }

            return current.filter(
                (_, currentIndex) =>
                    currentIndex !== index
            );
        });
    }


    function updateModule(
        index: number,
        field: keyof ModuleInput,
        value: string
    ) {

        setModules((current) =>
            current.map((item, currentIndex) => {

                if (currentIndex !== index) {
                    return item;
                }

                return {
                    ...item,
                    [field]: value,
                };
            })
        );
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
        // VALIDATE KEYWORDS
        // ====================================================

        const cleanedKeywords =
            keywords
                .map((item) => ({
                    keyword:
                        item.keyword.trim(),

                    weight:
                        Number(item.weight),
                }))
                .filter(
                    (item) =>
                        item.keyword.length > 0
                );


        for (const keyword of cleanedKeywords) {

            if (
                !Number.isInteger(keyword.weight) ||
                keyword.weight < 1 ||
                keyword.weight > 10
            ) {

                setError(
                    "Keyword weight must be between 1 and 10."
                );

                return;
            }
        }


        // ====================================================
        // VALIDATE MODULES
        // ====================================================

        const cleanedModules =
            modules
                .map((item) => ({
                    name:
                        item.name.trim(),

                    description:
                        item.description.trim(),

                    required_skills:
                        item.required_skills.trim(),
                }))
                .filter(
                    (item) =>
                        item.name.length > 0
                );


        // ====================================================
        // SUBMIT
        // ====================================================

        try {

            setSaving(true);


            const response =
                await fetch(
                    "/api/hr/projects",
                    {
                        method: "POST",

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

                            status,

                            keywords:
                                cleanedKeywords,

                            modules:
                                cleanedModules,
                        }),
                    }
                );


            const result:
                CreateProjectResponse =
                await response.json();


            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Failed to create project."
                );
            }


            // ==================================================
            // SUCCESS
            // ==================================================

            if (result.projectId) {

                router.push(
                    `/hr/projects/${result.projectId}`
                );

            } else {

                router.push(
                    "/hr/projects"
                );
            }

            router.refresh();

        } catch (error) {

            console.error(
                "Create project error:",
                error
            );


            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to create project."
            );

        } finally {

            setSaving(false);
        }
    }


    // ========================================================
    // PAGE
    // ========================================================

    return (
        <div className="w-full max-w-5xl mx-auto px-1 sm:px-2 lg:px-0 pb-8 space-y-6">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-blue-50 p-5 sm:p-7">

                {/* Decorative background */}

                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-100/60 blur-2xl" />

                <div className="pointer-events-none absolute -bottom-20 left-1/3 h-36 w-36 rounded-full bg-blue-100/50 blur-2xl" />


                <div className="relative">

                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/hr/projects"
                            )
                        }
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition mb-5"
                    >
                        <span className="text-base">
                            ←
                        </span>

                        Back to Projects
                    </button>


                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                        <div>

                            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 mb-3">

                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />

                                Recruitment Management

                            </div>


                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                                Create Project
                            </h1>


                            <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-2xl leading-6">
                                Create a recruitment project with
                                its required keywords, candidate
                                type, status, and project modules.
                            </p>

                        </div>


                        <div className="hidden sm:flex shrink-0 w-14 h-14 rounded-2xl bg-white border border-indigo-100 shadow-sm items-center justify-center">

                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="w-7 h-7 text-indigo-600"
                            >
                                <path
                                    d="M4 5.5C4 4.67 4.67 4 5.5 4h5A1.5 1.5 0 0 1 12 5.5v5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 10.5v-5ZM12 13.5c0-.83.67-1.5 1.5-1.5h5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-5a1.5 1.5 0 0 1-1.5-1.5v-5ZM13.5 4h5A1.5 1.5 0 0 1 20 5.5v5a1.5 1.5 0 0 1-1.5 1.5h-5a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 13.5 4ZM4 13.5C4 12.67 4.67 12 5.5 12h5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 18.5v-5Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                            </svg>

                        </div>

                    </div>

                </div>

            </div>


            {/* ==================================================
                FORM
            ================================================== */}

            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >


                {/* ==================================================
                    PROJECT DETAILS
                ================================================== */}

                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                    {/* Section header */}

                    <div className="border-b border-gray-100 bg-linear-to-r from-white to-indigo-50/50 px-5 py-5 sm:px-6">

                        <div className="flex items-start gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">

                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="w-5 h-5"
                                >
                                    <path
                                        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        d="M8 8h8M8 12h8M8 16h5"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                </svg>

                            </div>


                            <div>

                                <h2 className="text-lg font-bold text-gray-900">
                                    Project Details
                                </h2>

                                <p className="text-sm text-gray-500 mt-0.5">
                                    Basic information about the
                                    recruitment project.
                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="p-5 sm:p-6 space-y-6">


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
                                className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white outline-none transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />

                            <p className="mt-1.5 text-xs text-gray-400">
                                Use a clear title that identifies
                                the recruitment requirement.
                            </p>

                        </div>


                        {/* DESCRIPTION */}

                        <div>

                            <label
                                htmlFor="description"
                                className="block text-sm font-semibold text-gray-800 mb-2"
                            >
                                Description
                                <span className="text-red-500 ml-1">
                                    *
                                </span>
                            </label>


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
                                placeholder="Describe the project, responsibilities, requirements, and expectations..."
                                className="w-full px-3.5 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white outline-none resize-y transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />

                        </div>


                        {/* TARGET TYPE + STATUS */}

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
                                    className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white outline-none transition-all hover:border-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
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


                                <p className="mt-1.5 text-xs text-blue-600">
                                    Defines who can apply to this
                                    project.
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
                                    className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-white outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                        status === "ACTIVE"
                                            ? "border-green-300 text-green-700 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                                            : status === "CLOSED"
                                            ? "border-red-300 text-red-700 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                                            : "border-amber-300 text-amber-700 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                                    }`}
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
                                    className={`mt-1.5 text-xs ${
                                        status === "ACTIVE"
                                            ? "text-green-600"
                                            : status === "CLOSED"
                                            ? "text-red-600"
                                            : "text-amber-600"
                                    }`}
                                >
                                    {status === "ACTIVE"
                                        ? "This project will be available for applications."
                                        : status === "CLOSED"
                                        ? "This project will not accept new applications."
                                        : "This project remains in preparation mode."}
                                </p>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    KEYWORDS
                ================================================== */}

                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                    <div className="border-b border-gray-100 bg-linear-to-r from-white to-blue-50/60 px-5 py-5 sm:px-6">

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                            <div className="flex items-start gap-3">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        className="w-5 h-5"
                                    >
                                        <path
                                            d="M20 11.5 12.5 4H5v7.5l7.5 7.5L20 12v-.5Z"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinejoin="round"
                                        />
                                        <circle
                                            cx="8.5"
                                            cy="8.5"
                                            r="1"
                                            fill="currentColor"
                                        />
                                    </svg>

                                </div>


                                <div>

                                    <h2 className="text-lg font-bold text-gray-900">
                                        Project Keywords
                                    </h2>

                                    <p className="text-sm text-gray-500 mt-0.5">
                                        Keywords used for candidate
                                        resume matching and scoring.
                                    </p>

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={addKeyword}
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-base">
                                    +
                                </span>

                                Add Keyword
                            </button>

                        </div>

                    </div>


                    <div className="p-5 sm:p-6">

                        <div className="space-y-3">

                            {keywords.map(
                                (item, index) => (

                                    <div
                                        key={index}
                                        className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 transition hover:border-blue-200 hover:bg-blue-50/20"
                                    >

                                        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_110px_auto] gap-3 items-end">


                                            {/* KEYWORD */}

                                            <div>

                                                <label
                                                    className="block text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1.5"
                                                >
                                                    Keyword
                                                </label>


                                                <input
                                                    type="text"
                                                    value={
                                                        item.keyword
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateKeyword(
                                                            index,
                                                            "keyword",
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={saving}
                                                    placeholder="e.g. Next.js"
                                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100"
                                                />

                                            </div>


                                            {/* WEIGHT */}

                                            <div>

                                                <label
                                                    className="block text-xs font-semibold uppercase tracking-wide text-purple-600 mb-1.5"
                                                >
                                                    Weight
                                                </label>


                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={10}
                                                    value={
                                                        item.weight
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateKeyword(
                                                            index,
                                                            "weight",
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={saving}
                                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-100 disabled:bg-gray-100"
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
                                                disabled={
                                                    saving ||
                                                    keywords.length === 1
                                                }
                                                className="h-10 px-3.5 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Remove
                                            </button>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>


                        <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">

                            <p className="text-xs sm:text-sm text-blue-700">

                                <span className="font-semibold">
                                    Tip:
                                </span>{" "}
                                Use higher weights for skills that
                                are more important to the role.

                            </p>

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    MODULES
                ================================================== */}

                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                    <div className="border-b border-gray-100 bg-linear-to-r from-white to-violet-50/60 px-5 py-5 sm:px-6">

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                            <div className="flex items-start gap-3">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">

                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        className="w-5 h-5"
                                    >
                                        <rect
                                            x="4"
                                            y="4"
                                            width="6"
                                            height="6"
                                            rx="1"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        />
                                        <rect
                                            x="14"
                                            y="4"
                                            width="6"
                                            height="6"
                                            rx="1"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        />
                                        <rect
                                            x="4"
                                            y="14"
                                            width="6"
                                            height="6"
                                            rx="1"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        />
                                        <rect
                                            x="14"
                                            y="14"
                                            width="6"
                                            height="6"
                                            rx="1"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        />
                                    </svg>

                                </div>


                                <div>

                                    <h2 className="text-lg font-bold text-gray-900">
                                        Project Modules
                                    </h2>

                                    <p className="text-sm text-gray-500 mt-0.5">
                                        Define the modules or work
                                        areas included in this project.
                                    </p>

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={addModule}
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold shadow-sm hover:bg-violet-700 hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-base">
                                    +
                                </span>

                                Add Module
                            </button>

                        </div>

                    </div>


                    <div className="p-5 sm:p-6 space-y-5">

                        {modules.map(
                            (item, index) => (

                                <div
                                    key={index}
                                    className="relative rounded-2xl border border-gray-200 bg-gray-50/60 p-4 sm:p-5 space-y-5 transition hover:border-violet-200"
                                >

                                    {/* MODULE NUMBER */}

                                    <div className="flex items-center justify-between gap-3">

                                        <div className="flex items-center gap-3">

                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 text-sm font-bold">

                                                {index + 1}

                                            </div>


                                            <div>

                                                <h3 className="text-sm font-bold text-gray-900">
                                                    Module {index + 1}
                                                </h3>

                                                <p className="text-xs text-gray-500">
                                                    Define the work area
                                                    and required skills.
                                                </p>

                                            </div>

                                        </div>


                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeModule(
                                                    index
                                                )
                                            }
                                            disabled={
                                                saving ||
                                                modules.length === 1
                                            }
                                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-red-600 border border-red-200 bg-white hover:bg-red-50 hover:border-red-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Remove
                                        </button>

                                    </div>


                                    {/* MODULE NAME */}

                                    <div>

                                        <label
                                            className="block text-sm font-semibold text-gray-800 mb-2"
                                        >
                                            Module Name
                                        </label>


                                        <input
                                            type="text"
                                            value={
                                                item.name
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateModule(
                                                    index,
                                                    "name",
                                                    event.target.value
                                                )
                                            }
                                            disabled={saving}
                                            placeholder="e.g. Frontend Development"
                                            className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white outline-none transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-gray-100"
                                        />

                                    </div>


                                    {/* MODULE DESCRIPTION */}

                                    <div>

                                        <label
                                            className="block text-sm font-semibold text-gray-800 mb-2"
                                        >
                                            Description
                                        </label>


                                        <textarea
                                            value={
                                                item.description
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateModule(
                                                    index,
                                                    "description",
                                                    event.target.value
                                                )
                                            }
                                            rows={4}
                                            disabled={saving}
                                            placeholder="Describe what this module involves..."
                                            className="w-full px-3.5 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white outline-none resize-y transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-gray-100"
                                        />

                                    </div>


                                    {/* REQUIRED SKILLS */}

                                    <div>

                                        <label
                                            className="block text-sm font-semibold text-gray-800 mb-2"
                                        >
                                            Required Skills
                                        </label>


                                        <input
                                            type="text"
                                            value={
                                                item.required_skills
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateModule(
                                                    index,
                                                    "required_skills",
                                                    event.target.value
                                                )
                                            }
                                            disabled={saving}
                                            placeholder="e.g. Next.js, React, TypeScript"
                                            className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white outline-none transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-gray-100"
                                        />


                                        <div className="flex items-center gap-1.5 mt-2">

                                            <span className="text-violet-500">
                                                •
                                            </span>

                                            <p className="text-xs text-gray-500">
                                                Separate multiple skills
                                                using commas.
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                </section>


                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (

                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5 shadow-sm">

                        <div className="flex items-start gap-3">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">

                                <span className="text-sm font-bold">
                                    !
                                </span>

                            </div>


                            <div>

                                <p className="text-sm font-semibold text-red-800">
                                    Unable to create project
                                </p>

                                <p className="text-sm text-red-700 mt-1">
                                    {error}
                                </p>

                            </div>

                        </div>

                    </div>

                )}


                {/* ==================================================
                    ACTIONS
                ================================================== */}

                <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">

                    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">

                        <div>

                            <p className="text-sm font-semibold text-gray-800">
                                Ready to create this project?
                            </p>

                            <p className="text-xs text-gray-500 mt-0.5">
                                You can edit the project details later.
                            </p>

                        </div>


                        <div className="flex flex-col sm:flex-row gap-3">

                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        "/hr/projects"
                                    )
                                }
                                disabled={saving}
                                className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>


                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold shadow-sm hover:bg-gray-800 hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >

                                {saving ? (
                                    <>
                                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <span>
                                            ✓
                                        </span>
                                        Create Project
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