import HomeNav from "@/components/navigation/Home";
import PublicCareersFooter from "@/components/recruitment/PublicCareersFooter";

export default function ContactUsPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white text-slate-900">
            <HomeNav />
            <main className="flex-1 py-16 sm:py-24">
                <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                        Get In Touch
                    </span>
                    <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">
                        Contact Demerge Systems India
                    </h1>
                    <p className="mt-4 text-base text-slate-600">
                        Have questions regarding our recruitment drives, active project openings, or candidate application workflow? Reach out to our HR and talent acquisition team.
                    </p>

                    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 text-left">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                            <h3 className="text-base font-bold text-slate-900">Recruitment & Careers</h3>
                            <p className="mt-2 text-sm text-slate-600">
                                Inquiries about open positions, application statuses, and interview schedules.
                            </p>
                            <p className="mt-4 text-sm font-semibold text-blue-700">
                                hr@demergesystems.com
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                            <h3 className="text-base font-bold text-slate-900">Office Location</h3>
                            <p className="mt-2 text-sm text-slate-600">
                                Demerge Systems India Private Limited.
                            </p>
                            <p className="mt-4 text-sm font-semibold text-slate-800">
                                India
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            <PublicCareersFooter />
        </div>
    );
}
