import Link from "next/link";

interface PublicCareersHeroProps {
    totalProjects: number;
}

export default function PublicCareersHero({ totalProjects }: PublicCareersHeroProps) {
    return (
        <section className="relative overflow-hidden bg-linear-to-b from-white via-blue-100 to-blue-50 py-20 text-white sm:py-28">
            {/* Subtle background glow grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-orange-600">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                    </span>
                    <span>Demerge Systems India • Careers & Recruitment</span>
                </div>

                {/* Main Heading */}
                <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-blue-400 sm:text-5xl lg:text-6xl">
                    Find Your Next <span className="text-blue-400">Opportunity</span>
                </h1>

                {/* Subtitle */}
                <p className="mx-auto mt-6 max-w-2xl text-base text-slate-700 sm:text-lg sm:leading-relaxed">
                    Explore available internships and professional career opportunities tailored to your technical skill set.
                    Apply directly to engineering and development projects managed by Demerge Systems India.
                </p>

                {/* Action CTAs */}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                    <a
                        href="#careers"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                        <span>Explore Opportunities</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                        </svg>
                    </a>
                    <Link
                        href="/login"
                        className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur-xs transition-colors hover:bg-slate-700 hover:text-white"
                    >
                        Candidate Portal
                    </Link>
                </div>

                {/* Stat pills */}
                <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6 max-w-3xl mx-auto">
                    <div className="rounded-xl border border-slate-800 bg-linear-to-b from-red-50 to-red-200 p-4 backdrop-blur-xs">
                        <div className="text-2xl font-bold text-red-600">{totalProjects}</div>
                        <div className="text-xs text-slate-800 mt-0.5">Active Project Openings</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-linear-to-b from-blue-50 to-blue-200 p-4 backdrop-blur-xs">
                        <div className="text-2xl font-bold text-blue-400">3 Tracks</div>
                        <div className="text-xs text-slate-800 mt-0.5">Interns & Job Seekers</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-linear-to-b from-green-50 to-green-200 p-4 backdrop-blur-xs">
                        <div className="text-2xl font-bold text-emerald-400">Direct Match</div>
                        <div className="text-xs text-slate-800 mt-0.5">Automated Skill Assessment</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
