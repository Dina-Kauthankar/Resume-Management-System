"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserAccountDropdownProps {
  fullName: string;
  email: string;
  role: "HR" | "CANDIDATE";
}

export default function UserAccountDropdown({
  fullName,
  email,
  role,
}: UserAccountDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initial = fullName ? fullName.charAt(0).toUpperCase() : role.charAt(0);
  const profileHref = role === "HR" ? "/hr/profile" : "/candidate/profile";

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        router.push("/login");
        router.refresh();
      } else {
        router.push("/login");
      }
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none"
        aria-label="User menu"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-linear-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
          {initial}
        </div>

        {/* User info */}
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-gray-900 leading-tight">
            {fullName || (role === "HR" ? "HR Manager" : "Candidate")}
          </p>
          <p className="text-[11px] text-gray-500 leading-tight mt-0.5 truncate max-w-35">
            {email}
          </p>
        </div>

        {/* Chevron icon */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 py-1">
          {/* Mobile User Info header */}
          <div className="sm:hidden px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">{fullName}</p>
            <p className="text-xs text-gray-500 truncate">{email}</p>
          </div>

          <Link
            href={profileHref}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            My Profile
          </Link>

          {role === "HR" && (
            <Link
              href="/hr/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </Link>
          )}

          <hr className="my-1 border-gray-100" />

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left disabled:opacity-50"
          >
            <svg
              className="w-4 h-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {loggingOut ? "Logging out..." : "Log Out"}
          </button>
        </div>
      )}
    </div>
  );
}
