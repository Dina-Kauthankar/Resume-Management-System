"use client";

import Link from "next/link";
import { PublicProject } from "@/server/repositories/projectRepository";

interface ProjectCardProps {
    project: PublicProject;
    onViewDetails: (project: PublicProject) => void;
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
            return "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/10";
        case "SINGLE_INTERN":
            return "bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/10";
        case "BATCH_INTERN":
            return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10";
        default:
            return "bg-slate-100 text-slate-800 border-slate-200";
    }
}

export default function ProjectCard({ project, onViewDetails }: ProjectCardProps) {
    const formattedDate = new Date(project.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    return (
        <article className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg">
            <div>
                {/* Header: Category Badge & Date */}
                <div className="flex items-center justify-between gap-2">
                    <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getCategoryBadgeClass(
                            project.targetType
                        )}`}
                    >
                        {getCategoryLabel(project.targetType)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{formattedDate}</span>
                </div>

                {/* Title */}
                <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                    {project.title}
                </h3>

                {/* Description */}
                <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3">
                    {project.description}
                </p>

                {/* Required Skills Badges */}
                <div className="mt-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Required Skills
                    </p>
                    {project.keywords.length === 0 ? (
                        <p className="mt-1.5 text-xs text-slate-400 italic">No specific skills listed</p>
                    ) : (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {project.keywords.slice(0, 5).map((kw) => (
                                <span
                                    key={kw.id}
                                    className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                                >
                                    {kw.keyword}
                                </span>
                            ))}
                            {project.keywords.length > 5 && (
                                <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500 border border-slate-200/60">
                                    +{project.keywords.length - 5} more
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Module Count metadata */}
                {project.modules.length > 0 && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                        <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                        <span>
                            {project.modules.length} {project.modules.length === 1 ? "Module" : "Modules"}
                        </span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <button
                    type="button"
                    onClick={() => onViewDetails(project)}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                    View Details
                </button>
                <Link
                    href={`/candidate/projects/${project.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-700 py-2.5 text-center text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors"
                >
                    <span>Apply Now</span>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                </Link>
            </div>
        </article>
    );
}
