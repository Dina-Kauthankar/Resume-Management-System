"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PublicProject } from "@/server/repositories/projectRepository";

interface ProjectDetailsModalProps {
    project: PublicProject | null;
    onClose: () => void;
}

function getCategoryLabel(type: string): string {
    switch (type) {
        case "SINGLE_JOB_SEEKER":
            return "Single Job Seeker";
        case "SINGLE_INTERN":
            return "Single Intern";
        case "BATCH_INTERN":
            return "Batch Intern";
        default:
            return type.replace(/_/g, " ");
    }
}

function getCategoryBadgeClass(type: string): string {
    switch (type) {
        case "SINGLE_JOB_SEEKER":
            return "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20";
        case "SINGLE_INTERN":
            return "bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/20";
        case "BATCH_INTERN":
            return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20";
        default:
            return "bg-slate-100 text-slate-800 border-slate-200";
    }
}

export default function ProjectDetailsModal({
    project,
    onClose,
}: ProjectDetailsModalProps) {
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                onClose();
            }
        }
        if (project) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [project, onClose]);

    if (!project) return null;

    const formattedDate = new Date(project.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-project-title"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-slate-100 p-6 sm:px-8">
                    <div className="space-y-2 pr-6">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getCategoryBadgeClass(
                                    project.targetType
                                )}`}
                            >
                                {getCategoryLabel(project.targetType)}
                            </span>
                            <span className="text-xs text-slate-500">
                                Posted on {formattedDate}
                            </span>
                        </div>
                        <h2
                            id="modal-project-title"
                            className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                        >
                            {project.title}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        aria-label="Close details"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="flex-1 space-y-6 overflow-y-auto p-6 sm:px-8">
                    {/* Description */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Project Overview
                        </h3>
                        <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                            {project.description}
                        </p>
                    </div>

                    {/* Required Core Skills */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Required Technical Skills 
                        </h3>
                        {project.keywords.length === 0 ? (
                            <p className="mt-2 text-sm text-slate-500 italic">
                                General technical skills apply.
                            </p>
                        ) : (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {project.keywords.map((kw) => (
                                    <div
                                        key={kw.id}
                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800"
                                    >
                                        <span>{kw.keyword}</span>
                                        {/* <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                            Weight: {kw.weight}
                                        </span> */}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Modules Breakdown */}
                    {project.modules.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Project Modules ({project.modules.length})
                            </h3>
                            <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50">
                                {project.modules.map((module, idx) => (
                                    <div key={module.id} className="p-4">
                                        <div className="flex items-start gap-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                                {idx + 1}
                                            </span>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-semibold text-slate-900">
                                                    {module.name}
                                                </h4>
                                                {module.description && (
                                                    <p className="text-xs text-slate-600 leading-relaxed">
                                                        {module.description}
                                                    </p>
                                                )}
                                                {module.requiredSkills && (
                                                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                                                        <span className="font-semibold text-slate-700">
                                                            Skills:
                                                        </span>
                                                        <span>{module.requiredSkills}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 p-6 sm:flex-row sm:items-center sm:justify-end sm:px-8">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        Close
                    </button>
                    <Link
                        href={`/candidate/projects/${project.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors"
                    >
                        <span>Apply Now</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}
