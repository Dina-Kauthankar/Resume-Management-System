"use client";

import { useEffect, useState } from "react";

import Sidebar, { NavItem } from "./Sidebar";
import NotificationDropdown from "./NotificationDropdown";
import UserAccountDropdown from "./UserAccountDropdown";
import Link from "next/link";
import Image from "next/image";

interface HRLayoutShellProps {
  user: {
    fullName: string;
    email: string;
    role: "HR";
  };
  children: React.ReactNode;
}

const hrNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/hr/dashboard",
    icon: (active) => (
      <svg
        className="w-5 h-5"
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
    label: "Vacancies",
    href: "/hr/projects",
    icon: (active) => (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? "2.5" : "2"}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  {
    label: "Batch Allocation",
    href: "/hr/batch-allocation",
    icon: (active) => (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? "2.5" : "2"}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    label: "Applications",
    href: "/hr/application",
    icon: (active) => (
      <svg
        className="w-5 h-5"
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
    label: "Interviews",
    href: "/hr/interview",
    icon: (active) => (
      <svg
        className="w-5 h-5"
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
  {
    label: "Role Requests",
    href: "/hr/job-change-requests",
    icon: (active) => (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? "2.5" : "2"}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        />
      </svg>
    ),
  },
  {
    label: "HR Profile",
    href: "/hr/profile",
    icon: (active) => (
      <svg
        className="w-5 h-5"
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
  {
    label: "Settings",
    href: "/hr/settings",
    icon: (active) => (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? "2.5" : "2"}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.608-2.296.07-2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? "2.5" : "2"}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

export default function HRLayoutShell({
  user,
  children,
}: HRLayoutShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const [companyBranding, setCompanyBranding] = useState<{
    name: string;
    logo: string | null;
    brandColor: string;
  }>({
    name: "Demerge Systems India",
    logo: null,
    brandColor: "#4f46e5",
  });

  useEffect(() => {
    // Apply saved theme (Light / Dark / System)
    const applyTheme = (theme: string) => {
      const root = document.documentElement;

      if (theme === "dark") {
        root.classList.add("dark");
      } else if (theme === "light") {
        root.classList.remove("dark");
      } else {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };

    const savedTheme = localStorage.getItem("theme") || "system";
    applyTheme(savedTheme);

    // Fetch company branding
    async function loadBranding() {
      try {
        const res = await fetch("/api/hr/settings", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const data = await res.json();

        if (res.ok && data.success && data.settings) {
          setCompanyBranding({
            name: data.settings.company_name || "Demerge Systems India",
            logo: data.settings.company_logo || null,
            brandColor: data.settings.brand_color || "#4f46e5",
          });

          document.documentElement.style.setProperty(
            "--brand-primary",
            data.settings.brand_color || "#4f46e5"
          );
        }
      } catch (err) {
        console.error(
          "Failed to load branding in HRLayoutShell:",
          err
        );
      }
    }

    loadBranding();

    // Listen for real-time theme and settings updates from settings page
    const handleSettingsUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      const detail = customEvt.detail;
      if (detail) {
        setCompanyBranding((prev) => ({
          name: detail.company_name !== undefined ? (detail.company_name || "Demerge Systems India") : prev.name,
          logo: detail.company_logo !== undefined ? detail.company_logo : prev.logo,
          brandColor: detail.brand_color || prev.brandColor,
        }));
        if (detail.brand_color) {
          document.documentElement.style.setProperty("--brand-primary", detail.brand_color);
        }
      }
    };

    const handleThemeEvent = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail?.theme) {
        applyTheme(customEvt.detail.theme);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "theme") {
        applyTheme(e.newValue || "system");
      }
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      const current = localStorage.getItem("theme") || "system";
      if (current === "system") {
        applyTheme("system");
      }
    };

    window.addEventListener("rms-settings-updated", handleSettingsUpdate);
    window.addEventListener("theme-change", handleThemeEvent);
    window.addEventListener("storage", handleStorage);
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      window.removeEventListener("rms-settings-updated", handleSettingsUpdate);
      window.removeEventListener("theme-change", handleThemeEvent);
      window.removeEventListener("storage", handleStorage);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <Sidebar
        portalTitle={companyBranding.name}
        portalSubtitle="Recruitment Management"
        items={hrNavItems}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        logoUrl={companyBranding.logo}
        brandColor={companyBranding.brandColor}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-2xs">
          {/* Left: Mobile hamburger & title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Open sidebar"
            >
              <svg
                className="w-6 h-6"
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

            <h2 className="text-base font-semibold text-gray-900 hidden sm:block">
              {companyBranding.name}
            </h2>
          </div>

          {/* Right: Notifications & User Dropdown */}
          <div className="flex items-center gap-3 sm:gap-4">
            <NotificationDropdown userRole="HR" />

            <div className="h-6 w-px bg-gray-200" />

            <UserAccountDropdown
              fullName={user.fullName}
              email={user.email}
              role="HR"
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
