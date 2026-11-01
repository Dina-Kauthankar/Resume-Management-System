"use client";

import { useState } from "react";
import Sidebar, { NavItem } from "./Sidebar";
import NotificationDropdown from "./NotificationDropdown";
import UserAccountDropdown from "./UserAccountDropdown";
import Link from "next/link";
import Image from "next/image";

interface CandidateLayoutShellProps {
  user: {
    fullName: string;
    email: string;
    role: "CANDIDATE";
  };
  children: React.ReactNode;
}

const candidateNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/candidate/dashboard",
    icon: (active) => (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? "2.5" : "2"}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
  },
  {
    label: "Available Vacancies",
    href: "/candidate/projects",
    icon: (active) => (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? "2.5" : "2"}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    label: "My Applications",
    href: "/candidate/application",
    icon: (active) => (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? "2.5" : "2"}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    label: "Interview Schedule",
    href: "/candidate/interview",
    icon: (active) => (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? "2.5" : "2"}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },

  // ============================================================
  // TEAM
  // ============================================================

  {
    label: "Team",
    href: "/candidate/team",
    icon: (active) => (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? "2.5" : "2"}
          d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-8a4 4 0 11-8 0 4 4 0 018 0zm6 2a3 3 0 10-6 0 3 3 0 006 0z"
        />
      </svg>
    ),
  },

  {
    label: "Profile",
    href: "/candidate/profile",
    icon: (active) => (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? "2.5" : "2"}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  // {
  //   label: "Settings",
  //   href: "/candidate/settings",
  //   icon: (active) => (
  //     <svg
  //       className="h-5 w-5"
  //       fill="none"
  //       stroke="currentColor"
  //       viewBox="0 0 24 24"
  //     >
  //       <path
  //         strokeLinecap="round"
  //         strokeLinejoin="round"
  //         strokeWidth={active ? "2.5" : "2"}
  //         d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 010 3.35 1.724 1.724 0 00-1.065 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
  //       />
  //       <path
  //         strokeLinecap="round"
  //         strokeLinejoin="round"
  //         strokeWidth={active ? "2.5" : "2"}
  //         d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
  //       />
  //     </svg>
  //   ),
  // },
];

export default function CandidateLayoutShell({
  user,
  children,
}: CandidateLayoutShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <Sidebar
        portalTitle="Candidate Portal"
        portalSubtitle="Recruitment System"
        items={candidateNavItems}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-2xs sm:px-6">
          {/* Left: Mobile hamburger & title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
              aria-label="Open sidebar"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* <h2 className="hidden text-base font-semibold text-gray-900 sm:block">
              Candidate Portal
            </h2> */}
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
          </div>

          {/* Right: Notifications & User Dropdown */}
          <div className="flex items-center gap-3 sm:gap-4">
            <NotificationDropdown userRole="CANDIDATE" />

            <div className="h-6 w-px bg-gray-200" />

            <UserAccountDropdown
              fullName={user.fullName}
              email={user.email}
              role="CANDIDATE"
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}