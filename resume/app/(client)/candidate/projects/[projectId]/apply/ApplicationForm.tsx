"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

// ============================================================
// TYPES
// ============================================================

type Candidate = {
    id: number;
    fullName: string;
    email: string;
    phone: string | null;
    collegeDetails: string | null;
    applicantType: string;
};

type Keyword = {
    id: number;
    keyword: string;
    weight: number;
};

type ProjectModule = {
    id: number;
    name: string;
    description: string | null;
    requiredSkills: string | null;
};

type Project = {
    id: number;
    title: string;
    targetType: string;
    keywords: Keyword[];
    modules: ProjectModule[];
};

type ApplicationFormProps = {
    candidate: Candidate;
    project: Project;
};

// ============================================================
// HELPER
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

// ============================================================
// COMPONENT
// ============================================================

export default function ApplicationForm({
    candidate,
    project,
}: ApplicationFormProps) {
    // --------------------------------------------------------
    // STATE
    // --------------------------------------------------------

    const [currentStep, setCurrentStep] = useState(1);

    const [resumeFile, setResumeFile] =
        useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    // ========================================================
    // STEP NAVIGATION
    // ========================================================

    function goToNextStep() {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    }

    function goToPreviousStep() {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    }

    // // ========================================================
    // // RESUME SELECTION
    // // ========================================================

    // function handleResumeChange(
    //     event: React.ChangeEvent<HTMLInputElement>
    // ) {
    //     const file = event.target.files?.[0];

    //     if (!file) {
    //         return;
    //     }

    //     const allowedExtensions = [
    //         ".pdf",
    //         ".docx",
    //         ".tex",
    //     ];

    //     const fileName =
    //         file.name.toLowerCase();

    //     const isAllowed =
    //         allowedExtensions.some(
    //             (extension) =>
    //                 fileName.endsWith(extension)
    //         );

    //     if (!isAllowed) {
    //         toast.error(
    //             "Invalid file format. Please upload a PDF, DOCX, or TEX file."
    //         );

    //         event.target.value = "";

    //         return;
    //     }

    //     const MAX_FILE_SIZE =
    //         5 * 1024 * 1024;

    //     if (file.size === 0) {
    //         toast.error(
    //             "The selected resume file is empty."
    //         );

    //         event.target.value = "";

    //         return;
    //     }

    //     if (file.size > MAX_FILE_SIZE) {
    //         toast.error(
    //             "File size must be smaller than 5 MB."
    //         );

    //         event.target.value = "";

    //         return;
    //     }

    //     setResumeFile(file);
    // }

    // // ========================================================
    // // REMOVE RESUME
    // // ========================================================

    // function removeResume() {
    //     setResumeFile(null);

    //     const input =
    //         document.getElementById(
    //             "resume"
    //         ) as HTMLInputElement | null;

    //     if (input) {
    //         input.value = "";
    //     }
    // }

    // // ========================================================
    // // SUBMIT APPLICATION
    // // ========================================================

    // async function handleSubmit() {
    //     if (!resumeFile) {
    //         toast.error(
    //             "Please upload your resume before submitting."
    //         );

    //         setCurrentStep(2);

    //         return;
    //     }

    //     if (isSubmitting) {
    //         return;
    //     }

    //     try {
    //         setIsSubmitting(true);

    //         const formData =
    //             new FormData();

    //         formData.append(
    //             "projectId",
    //             String(project.id)
    //         );

    //         formData.append(
    //             "resume",
    //             resumeFile
    //         );

    //         const response =
    //             await fetch(
    //                 "/api/applications",
    //                 {
    //                     method: "POST",
    //                     body: formData,
    //                 }
    //             );

    //         const result =
    //             await response.json();

    //         if (!response.ok) {
    //             throw new Error(
    //                 result?.error ||
    //                 "Application submission failed."
    //             );
    //         }

    //         console.log(
    //             "Application submitted successfully:",
    //             result
    //         );

    //         const score =
    //             result?.matching?.score ?? 0;

    //         const matchedKeywords =
    //             result?.matching
    //                 ?.matchedKeywords
    //                 ?.length ?? 0;

    //         const confidencePercentage =
    //             result?.matching
    //                 ?.confidencePercentage ?? 0;

    //         toast.success(
    //             "Application submitted successfully!",
    //             {
    //                 description:
    //                     `Score: ${score} • ` +
    //                     `Matched keywords: ${matchedKeywords} • ` +
    //                     `Confidence: ${confidencePercentage}%`,
    //                 duration: 5000,
    //             }
    //         );

    //         window.location.href =
    //             "/candidate/application";
    //     } catch (error) {
    //         console.error(
    //             "Application submission error:",
    //             error
    //         );

    //         toast.error(
    //             error instanceof Error
    //                 ? error.message
    //                 : "Something went wrong while submitting your application."
    //         );
    //     } finally {
    //         setIsSubmitting(false);
    //     }
    // }

  
// ========================================================
// RESUME SELECTION
// ========================================================

function handleResumeChange(
    event: React.ChangeEvent<HTMLInputElement>
) {
    const file = event.target.files?.[0];

    if (!file) {
        return;
    }

    const allowedExtensions = [
        ".pdf",
        ".docx",
        ".tex",
    ];

    const fileName =
        file.name.toLowerCase();

    const isAllowed =
        allowedExtensions.some(
            (extension) =>
                fileName.endsWith(extension)
        );

    if (!isAllowed) {
        toast.error(
            "Invalid file format. Please upload a PDF, DOCX, or TEX file.",
            {
                duration: 5000,
            }
        );

        event.target.value = "";

        return;
    }

    const MAX_FILE_SIZE =
        5 * 1024 * 1024;

    if (file.size === 0) {
        toast.error(
            "The selected resume file is empty.",
            {
                duration: 5000,
            }
        );

        event.target.value = "";

        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        toast.error(
            "File size must be smaller than 5 MB.",
            {
                duration: 5000,
            }
        );

        event.target.value = "";

        return;
    }

    setResumeFile(file);
}


// ========================================================
// REMOVE RESUME
// ========================================================

function removeResume() {
    setResumeFile(null);

    const input =
        document.getElementById(
            "resume"
        ) as HTMLInputElement | null;

    if (input) {
        input.value = "";
    }
}


// ========================================================
// SUBMIT APPLICATION
// ========================================================

async function handleSubmit() {
    if (!resumeFile) {
        toast.error(
            "Please upload your resume before submitting.",
            {
                duration: 5000,
            }
        );

        setCurrentStep(2);

        return;
    }

    if (isSubmitting) {
        return;
    }

    try {
        setIsSubmitting(true);

        const formData =
            new FormData();

        formData.append(
            "projectId",
            String(project.id)
        );

        formData.append(
            "resume",
            resumeFile
        );

        const response =
            await fetch(
                "/api/applications",
                {
                    method: "POST",
                    body: formData,
                }
            );

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result?.error ||
                    "Application submission failed."
            );
        }

        console.log(
            "Application submitted successfully:",
            result
        );

        const score =
            result?.matching?.score ?? 0;

        const matchedKeywords =
            result?.matching
                ?.matchedKeywords
                ?.length ?? 0;

        const confidencePercentage =
            result?.matching
                ?.confidencePercentage ?? 0;

        // ------------------------------------------------
        // SUCCESS TOAST
        // ------------------------------------------------

        toast.success(
            "Application submitted successfully!",
            {
                description:
                    `Score: ${score} • ` +
                    `Matched keywords: ${matchedKeywords} • ` +
                    `Confidence: ${confidencePercentage}%`,

                // Keep the toast visible for at least 5 seconds.
                duration: 5000,
            }
        );

        // ------------------------------------------------
        // NAVIGATE TO APPLICATION PAGE
        // ------------------------------------------------
        window.location.href = "/candidate/application"

    } catch (error) {
        console.error(
            "Application submission error:",
            error
        );

        toast.error(
            error instanceof Error
                ? error.message
                : "Something went wrong while submitting your application.",
            {
                duration: 5000,
            }
        );
    } finally {
        setIsSubmitting(false);
    }
}


    // ========================================================
    // STEPS
    // ========================================================

    const steps = [
        {
            number: 1,
            title: "Confirm Details",
            description: "Verify your information",
        },
        {
            number: 2,
            title: "Upload Resume",
            description: "Add your resume",
        },
        {
            number: 3,
            title: "Review",
            description: "Review & submit",
        },
    ];

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 sm:space-y-8">
            {/* ==================================================
                PAGE INTRO
            ================================================== */}



            {/* ==================================================
                STEP INDICATOR
            ================================================== */}

            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="relative">
                    {/* Progress line */}

                    <div className="absolute left-[16.66%] right-[16.66%] top-5 hidden h-px bg-gray-200 sm:block" />

                    <div
                        className="absolute left-[16.66%] top-5 hidden h-px bg-gray-900 transition-all duration-500 sm:block"
                        style={{
                            width:
                                currentStep === 1
                                    ? "0%"
                                    : currentStep === 2
                                        ? "50%"
                                        : "100%",
                            maxWidth: "66.68%",
                        }}
                    />

                    <div className="relative grid grid-cols-3 gap-2 sm:gap-6">
                        {steps.map((step) => {
                            const isActive =
                                currentStep ===
                                step.number;

                            const isCompleted =
                                currentStep >
                                step.number;

                            return (
                                <div
                                    key={step.number}
                                    className="flex flex-col items-center text-center"
                                >
                                    <div
                                        className={`
                                            flex h-10 w-10 items-center justify-center
                                            rounded-full border-2 text-sm font-bold
                                            transition-all duration-300
                                            ${isCompleted
                                                ? "border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20"
                                                : isActive
                                                    ? "border-gray-900 bg-white text-gray-900 ring-4 ring-gray-100"
                                                    : "border-gray-200 bg-white text-gray-400"
                                            }
                                        `}
                                    >
                                        {isCompleted ? (
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.415 0l-3.25-3.25a1 1 0 111.415-1.42l2.543 2.544 6.543-6.544a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        ) : (
                                            step.number
                                        )}
                                    </div>

                                    <p
                                        className={`
                                            mt-3 text-xs font-semibold sm:text-sm
                                            ${isActive ||
                                                isCompleted
                                                ? "text-gray-900"
                                                : "text-gray-400"
                                            }
                                        `}
                                    >
                                        {step.title}
                                    </p>

                                    <p className="mt-1 hidden text-xs text-gray-500 sm:block">
                                        {step.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ==================================================
                STEP 1 — CONFIRM DETAILS
            ================================================== */}

            {currentStep === 1 && (
                <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                    {/* Header */}

                    <div className="border-b border-gray-100 bg-linear-to-br from-gray-50 to-white px-5 py-6 sm:px-8 sm:py-7">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-lg shadow-gray-900/10">
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                    <circle
                                        cx="12"
                                        cy="7"
                                        r="4"
                                    />
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-gray-950">
                                    Confirm Your Details
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-gray-600">
                                    Make sure your candidate
                                    information is correct before
                                    continuing.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Details */}

                    <div className="p-5 sm:p-8">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Full Name */}

                            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 transition hover:border-gray-300 hover:bg-gray-50">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Full Name
                                </p>

                                <p className="mt-2 wrap-break-word text-sm font-semibold text-gray-900">
                                    {candidate.fullName}
                                </p>
                            </div>

                            {/* Email */}

                            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 transition hover:border-gray-300 hover:bg-gray-50">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Email
                                </p>

                                <p className="mt-2 break-all text-sm font-semibold text-gray-900">
                                    {candidate.email}
                                </p>
                            </div>

                            {/* Phone */}

                            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 transition hover:border-gray-300 hover:bg-gray-50">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Phone
                                </p>

                                <p className="mt-2 text-sm font-semibold text-gray-900">
                                    {candidate.phone ||
                                        "Not provided"}
                                </p>
                            </div>

                            {/* Applicant Type */}

                            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 transition hover:border-gray-300 hover:bg-gray-50">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Applicant Type
                                </p>

                                <p className="mt-2 text-sm font-semibold text-gray-900">
                                    {applicantTypeLabel(
                                        candidate.applicantType
                                    )}
                                </p>
                            </div>

                            {/* College */}

                            <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-gray-50/70 p-4 transition hover:border-gray-300 hover:bg-gray-50">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    College Details
                                </p>

                                <p className="mt-2 wrap-break-word text-sm font-semibold text-gray-900">
                                    {candidate.collegeDetails ||
                                        "Not provided"}
                                </p>
                            </div>
                        </div>

                        {/* Applying For */}

                        <div className="mt-5 overflow-hidden rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50 to-purple-50">
                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                                        <svg
                                            className="h-5 w-5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                            <line
                                                x1="12"
                                                y1="22.08"
                                                x2="12"
                                                y2="12"
                                            />
                                        </svg>
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                                            Applying For
                                        </p>

                                        <p className="mt-1 wrap-break-word text-base font-bold text-gray-950">
                                            {project.title}
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-indigo-700">
                                            Target applicant type:{" "}
                                            <span className="font-semibold">
                                                {applicantTypeLabel(
                                                    project.targetType
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}

                    <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/50 p-5 sm:flex-row sm:justify-end sm:p-6">
                        <button
                            type="button"
                            onClick={goToNextStep}
                            className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-950/10 transition hover:-translate-y-0.5 hover:bg-gray-800 active:translate-y-0 sm:w-auto"
                        >
                            Continue to Resume

                            <svg
                                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* ==================================================
                STEP 2 — UPLOAD RESUME
            ================================================== */}

            {currentStep === 2 && (
                <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                    {/* Header */}

                    <div className="border-b border-gray-100 bg-linear-to-br from-gray-50 to-white px-5 py-6 sm:px-8 sm:py-7">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line
                                        x1="12"
                                        y1="3"
                                        x2="12"
                                        y2="15"
                                    />
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-gray-950">
                                    Upload Your Resume
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-gray-600">
                                    Upload the resume you want to
                                    submit for this project.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 sm:p-8">
                        {/* Upload Area */}

                        <label
                            htmlFor="resume"
                            className="
                                group flex cursor-pointer flex-col
                                items-center justify-center rounded-3xl
                                border-2 border-dashed border-gray-300
                                bg-linear-to-b from-gray-50 to-white
                                px-5 py-10 text-center
                                transition-all duration-300
                                hover:border-indigo-400
                                hover:bg-indigo-50/30
                                sm:px-8 sm:py-14
                            "
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-md ring-1 ring-gray-100 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                                <svg
                                    className="h-7 w-7"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line
                                        x1="12"
                                        y1="18"
                                        x2="12"
                                        y2="12"
                                    />
                                    <line
                                        x1="9"
                                        y1="15"
                                        x2="12"
                                        y2="12"
                                    />
                                    <line
                                        x1="15"
                                        y1="15"
                                        x2="12"
                                        y2="12"
                                    />
                                </svg>
                            </div>

                            <p className="mt-5 text-sm font-bold text-gray-900 sm:text-base">
                                Click to select your resume
                            </p>

                            <p className="mt-2 text-xs text-gray-500">
                                PDF, DOCX, or TEX
                            </p>

                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-600">
                                    PDF
                                </span>

                                <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-600">
                                    DOCX
                                </span>

                                <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-600">
                                    TEX
                                </span>

                                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
                                    Max 5 MB
                                </span>
                            </div>

                            <input
                                id="resume"
                                type="file"
                                accept=".pdf,.docx,.tex"
                                onChange={
                                    handleResumeChange
                                }
                                className="hidden"
                            />
                        </label>

                        {/* Selected File */}

                        {resumeFile && (
                            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50/60 p-4 sm:p-5">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm">
                                        <svg
                                            className="h-5 w-5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <polyline points="9 15 11 17 15 13" />
                                        </svg>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-green-700">
                                            Resume Selected
                                        </p>

                                        <p className="mt-1 break-all text-sm font-semibold text-gray-900">
                                            {resumeFile.name}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500">
                                            {(
                                                resumeFile.size /
                                                1024 /
                                                1024
                                            ).toFixed(2)}{" "}
                                            MB
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={
                                            removeResume
                                        }
                                        className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Important Notice */}

                        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
                            <div className="flex gap-3">
                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
                                    <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                        />
                                        <line
                                            x1="12"
                                            y1="8"
                                            x2="12"
                                            y2="12"
                                        />
                                        <line
                                            x1="12"
                                            y1="16"
                                            x2="12.01"
                                            y2="16"
                                        />
                                    </svg>
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-amber-900">
                                        Resume evaluation
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-amber-800 sm:text-sm">
                                        Your resume will be
                                        processed and evaluated
                                        against the required
                                        skills of this project.
                                        Make sure the information
                                        is accurate.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}

                    <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <button
                            type="button"
                            onClick={
                                goToPreviousStep
                            }
                            className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 sm:w-auto"
                        >
                            ← Back
                        </button>

                        <button
                            type="button"
                            onClick={goToNextStep}
                            disabled={!resumeFile}
                            className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-950/10 transition hover:-translate-y-0.5 hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none sm:w-auto"
                        >
                            Review Application

                            <svg
                                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* ==================================================
                STEP 3 — REVIEW
            ================================================== */}

            {currentStep === 3 && (
                <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                    {/* Header */}

                    <div className="border-b border-gray-100 bg-linear-to-br from-gray-50 to-white px-5 py-6 sm:px-8 sm:py-7">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-600/20">
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M9 11l3 3L22 4" />
                                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-gray-950">
                                    Review Your Application
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-gray-600">
                                    Everything looks good? Submit
                                    your application when you're
                                    ready.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Review Content */}

                    <div className="space-y-5 p-5 sm:p-8">
                        {/* Candidate */}

                        <section className="rounded-2xl border border-gray-200 bg-gray-50/50 p-5">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Candidate
                                </h3>

                                <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-600">
                                    Step 1
                                </span>
                            </div>

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-900 text-base font-bold text-white">
                                    {candidate.fullName
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                    <p className="wrap-break-word font-bold text-gray-950">
                                        {candidate.fullName}
                                    </p>

                                    <p className="mt-1 break-all text-sm text-gray-600">
                                        {candidate.email}
                                    </p>

                                    <p className="mt-1 text-xs font-medium text-indigo-600">
                                        {applicantTypeLabel(
                                            candidate.applicantType
                                        )}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Project */}

                        <section className="rounded-2xl border border-gray-200 bg-gray-50/50 p-5">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Project
                                </h3>

                                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
                                    Applying
                                </span>
                            </div>

                            <div className="mt-4 flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                                    <svg
                                        className="h-5 w-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <rect
                                            x="3"
                                            y="4"
                                            width="18"
                                            height="16"
                                            rx="2"
                                        />
                                        <path d="M8 8h8M8 12h5M8 16h7" />
                                    </svg>
                                </div>

                                <div className="min-w-0">
                                    <p className="wrap-break-word font-bold text-gray-950">
                                        {project.title}
                                    </p>

                                    <p className="mt-1 text-sm text-gray-600">
                                        Target:{" "}
                                        <span className="font-medium text-gray-900">
                                            {applicantTypeLabel(
                                                project.targetType
                                            )}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Resume */}

                        <section className="rounded-2xl border border-gray-200 bg-gray-50/50 p-5">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Resume
                                </h3>

                                <span className="rounded-full bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-600">
                                    Ready
                                </span>
                            </div>

                            <div className="mt-4 flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm ring-1 ring-gray-100">
                                    <svg
                                        className="h-5 w-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <polyline points="9 15 11 17 15 13" />
                                    </svg>
                                </div>

                                {resumeFile ? (
                                    <div className="min-w-0">
                                        <p className="break-all text-sm font-semibold text-gray-900">
                                            {resumeFile.name}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500">
                                            {(
                                                resumeFile.size /
                                                1024 /
                                                1024
                                            ).toFixed(2)}{" "}
                                            MB
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm font-medium text-red-600">
                                        No resume selected.
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* Evaluation Notice */}

                        <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 to-indigo-50 p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                                    <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                        />
                                        <path d="M12 16v-4M12 8h.01" />
                                    </svg>
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-blue-950">
                                        Automated Resume Evaluation
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-blue-800 sm:text-sm">
                                        After submission, your
                                        resume will be processed
                                        by the resume extraction
                                        system and evaluated
                                        against this project's
                                        required keywords.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}

                    <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <button
                            type="button"
                            onClick={
                                goToPreviousStep
                            }
                            disabled={
                                isSubmitting
                            }
                            className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            ← Back
                        </button>

                        <button
                            type="button"
                            onClick={
                                handleSubmit
                            }
                            disabled={
                                !resumeFile ||
                                isSubmitting
                            }
                            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-950/10 transition hover:-translate-y-0.5 hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none sm:w-auto"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg
                                        className="h-4 w-4 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="9"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            className="opacity-30"
                                        />

                                        <path
                                            d="M21 12a9 9 0 00-9-9"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                    </svg>

                                    Submitting...
                                </>
                            ) : (
                                <>
                                    Submit Application

                                    <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25a1 1 0 111.414-1.414l6.543 6.543 6.543-6.543a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ==================================================
                CANCEL
            ================================================== */}

            <div className="pb-4 text-center">
                <Link
                    href={`/candidate/projects/${project.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                >
                    <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                            clipRule="evenodd"
                        />
                    </svg>

                    Cancel and return to project
                </Link>
            </div>
        </div>
    );
}