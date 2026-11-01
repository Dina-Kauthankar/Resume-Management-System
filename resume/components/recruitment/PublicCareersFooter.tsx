import Link from "next/link";

export default function PublicCareersFooter() {
    return (
        <footer
            id="contact-us"
            className="border-t border-slate-200 bg-white py-12 text-slate-600 sm:py-16"
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    {/* Brand column */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="text-xl font-extrabold tracking-tight text-slate-900">
                            Demerge Systems <span className="text-blue-700">India</span>
                        </div>
                        <p className="max-w-md text-sm leading-relaxed text-slate-500">
                            Industrial-level automated recruitment, resume extraction, skill-keyword matching, and smart candidate task allocation platform.
                        </p>
                        <p className="text-xs text-slate-400">
                            Empowering candidates and HR teams with precision skill intelligence.
                        </p>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Careers
                        </h4>
                        <ul className="mt-4 space-y-2.5 text-sm">
                            <li>
                                <a href="#careers" className="hover:text-blue-700 transition-colors">
                                    All Opportunities
                                </a>
                            </li>
                            <li>
                                <Link href="/login" className="hover:text-blue-700 transition-colors">
                                    Candidate Login
                                </Link>
                            </li>
                            <li>
                                <Link href="/register" className="hover:text-blue-700 transition-colors">
                                    Register Account
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact details */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Contact Us
                        </h4>
                        <ul className="mt-4 space-y-2.5 text-sm">
                            <li className="flex items-center gap-2">
                                <span className="text-slate-400">Email:</span>
                                <span className="text-slate-700">hr@demergesystems.com</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-slate-400">Location:</span>
                                <span className="text-slate-700">India</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-slate-400">Support:</span>
                                <span className="text-slate-700">Mon - Fri (9 AM - 6 PM IST)</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
                    &copy; {new Date().getFullYear()} Demerge Systems India. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
