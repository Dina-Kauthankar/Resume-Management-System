import HomeNav from "@/components/navigation/Home";
import PublicCareersHero from "@/components/recruitment/PublicCareersHero";
import PublicCareersList from "@/components/recruitment/PublicCareersList";
import PublicCareersFooter from "@/components/recruitment/PublicCareersFooter";
import { findPublicProjects, PublicProject } from "@/server/repositories/projectRepository";

export const dynamic = "force-dynamic";

export default async function RecruitmentLandingPage() {
    let projects: PublicProject[] = [];
    let loadError: string | null = null;

    try {
        projects = await findPublicProjects();
    } catch (error) {
        console.error("Failed to load public projects on homepage:", error);
        loadError = "Unable to connect to the recruitment database right now. Please refresh or try again later.";
    }

    return (
        <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
            {/* Main Header / Navigation */}
            <HomeNav />

            {/* Error banner if database query failed */}
            {loadError && (
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 text-center">
                    <p className="text-sm font-medium text-amber-800">{loadError}</p>
                </div>
            )}

            <main className="flex-1">
                {/* Hero Section */}
                <PublicCareersHero totalProjects={projects.length} />

                {/* Opportunities Section with Filters, Search, Cards & Modal */}
                <PublicCareersList initialProjects={projects} />
            </main>

            {/* Public Footer & Contact Information */}
            <PublicCareersFooter />
        </div>
    );
}
