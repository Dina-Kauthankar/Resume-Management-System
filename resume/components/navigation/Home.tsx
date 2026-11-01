"use client";

import Image from "next/image";
import Link from "next/link";

export default function Home() {
    return (
        <header className="relative z-50 border-b border-slate-200 bg-white text-slate-900">
            <nav className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
                <Link href="/" aria-label="Demerge Systems India home">
                    <Image
                        src="/demerg_system_india_logo.jpg"
                        alt="Demerge Systems India"
                        width={180}
                        height={56}
                        className="h-14 w-auto object-contain"
                        priority
                    />
                </Link>

                <div className="flex items-center gap-6 text-sm font-medium">
                    <Link
                        className="transition-colors hover:text-blue-700"
                        href="/#careers"
                    >
                        Careers
                    </Link>

                    <Link
                        className="transition-colors hover:text-blue-700"
                        href="/#contact-us"
                    >
                        Contact Us
                    </Link>

                    <Link
                        className="rounded-md bg-blue-700 px-4 py-2 text-white transition-colors hover:bg-blue-800"
                        href="/login"
                    >
                        Login
                    </Link>
                </div>
            </nav>
        </header>
    );
}