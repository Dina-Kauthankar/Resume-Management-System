"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
  icon: (active: boolean) => React.ReactNode;
}

interface SidebarProps {
  portalTitle: string;
  portalSubtitle: string;
  items: NavItem[];
  mobileOpen: boolean;
  onMobileClose: () => void;
  logoUrl?: string | null;
  brandColor?: string | null;
}

export default function Sidebar({
  portalTitle,
  portalSubtitle,
  items,
  mobileOpen,
  onMobileClose,
  logoUrl,
  brandColor,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* ============================================================
          MOBILE BACKDROP
          Smooth fade + background blur
          ============================================================ */}
      <div
        className={`
          fixed inset-0 z-40
          bg-slate-950/35
          backdrop-blur-sm
          lg:hidden
          transition-all duration-300 ease-in-out
          ${
            mobileOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* ============================================================
          SIDEBAR

          Mobile:
          - Fixed drawer
          - Slides in/out from the left
          - Full viewport height

          Desktop:
          - Sticky
          - Stays visible while page content scrolls
          - Full viewport height
          - Permanently expanded
          ============================================================ */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50
          flex flex-col justify-between
          w-72
          h-screen
          bg-white
          border-r border-gray-200

          transform
          transition-transform
          duration-300
          ease-out
          will-change-transform

          ${
            mobileOpen
              ? "translate-x-0 shadow-2xl"
              : "-translate-x-full"
          }

          /* ========================================================
             DESKTOP
             ======================================================== */
          lg:sticky
          lg:top-0
          lg:h-screen
          lg:self-start
          lg:translate-x-0
          lg:z-auto
          lg:shadow-none
        `}
      >
        {/* ============================================================
            TOP SECTION
            ============================================================ */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Header */}
          <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-gray-100">
            <div className="flex items-center gap-3 min-w-0">
              {/* Logo */}
              <div
                className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm shadow-indigo-600/30 overflow-hidden"
                style={
                  brandColor
                    ? { backgroundColor: brandColor }
                    : undefined
                }
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={portalTitle}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  portalTitle.charAt(0)
                )}
              </div>

              {/* Portal Title */}
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-gray-900 leading-tight whitespace-nowrap">
                  {portalTitle}
                </h1>

                <p className="text-[11px] text-gray-500 leading-tight whitespace-nowrap">
                  {portalSubtitle}
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onMobileClose}
              className="
                lg:hidden
                shrink-0
                p-1.5
                rounded-lg
                text-gray-500
                hover:text-gray-900
                hover:bg-gray-100
                transition-colors
              "
              aria-label="Close sidebar"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* ==========================================================
              NAVIGATION
              ========================================================== */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/hr/dashboard" &&
                  item.href !== "/candidate/dashboard" &&
                  pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  className={`
                    flex items-center gap-3.5
                    px-3 py-2.5
                    rounded-xl
                    text-sm font-medium
                    transition-colors duration-150
                    group

                    ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 shadow-xs"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                >
                  {/* Icon */}
                  <div
                    className={`
                      shrink-0
                      transition-transform duration-150
                      group-hover:scale-110

                      ${
                        isActive
                          ? "text-indigo-600"
                          : "text-gray-500 group-hover:text-gray-700"
                      }
                    `}
                  >
                    {item.icon(isActive)}
                  </div>

                  {/* Label */}
                  <span className="whitespace-nowrap">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ============================================================
            FOOTER
            ============================================================ */}
        <div className="shrink-0 p-4 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400 whitespace-nowrap">
            Resume Management System
          </p>
        </div>
      </aside>
    </>
  );
}