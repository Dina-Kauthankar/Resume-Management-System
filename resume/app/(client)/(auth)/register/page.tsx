
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Home from "@/components/navigation/Home"

import {
  type ApplicantType,
  type Role,
} from "@/server/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState<Role>("CANDIDATE");

  const [applicantType, setApplicantType] =
    useState<ApplicantType>("SINGLE_JOB_SEEKER");

  const [phone, setPhone] = useState("");
  const [collegeDetails, setCollegeDetails] =
    useState("");

  const [error, setError] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(false);

  // ============================================================
  // HANDLE REGISTER
  // ============================================================

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        "/api/auth/register",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            fullName,
            email,
            password,
            role,
            applicantType,
            phone,
            collegeDetails,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
          "Registration failed. Please try again."
        );
      }

      // ========================================================
      // REDIRECT BASED ON ROLE
      // ========================================================

      if (data.user.role === "HR") {
        router.push("/h/dashboard");
      } else {
        router.push("/candidate/dashboard");
      }

      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "An unexpected error occurred."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      <Home></Home>
      <div className="min-h-screen flex items-center justify-center p-4 bg-white text-black">
        <div className="w-full max-w-lg bg-blend-soft-light backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">

          {/* ======================================================
            HEADER
            ====================================================== */}

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-blue-800">
              Create Account
            </h1>

            <p className="text-sm text-slate-400">
              Join the Recruitment Management Platform
            </p>
          </div>

          {/* ======================================================
            ERROR
            ====================================================== */}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">

              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>

              <span>{error}</span>
            </div>
          )}

          {/* ======================================================
            REGISTER FORM
            ====================================================== */}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* ====================================================
              FULL NAME
              ==================================================== */}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Full Name
              </label>

              <input
                type="text"
                required
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                placeholder="John Doe"
                className="w-full px-4 py-2.5 bg-blend-color border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-red-950 placeholder-slate-500"
              />
            </div>

            {/* ====================================================
              EMAIL
              ==================================================== */}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="candidate@example.com"
                className="w-full px-4 py-2.5 bg-blend-color border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-red-950 placeholder-slate-500"
              />
            </div>

            {/* ====================================================
              PASSWORD
              ==================================================== */}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>

              <input
                type="password"
                required
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-2.5 bg-blend-color border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-red-950 placeholder-slate-500"
              />
            </div>

            {/* ====================================================
              ROLE + APPLICANT TYPE
              ==================================================== */}

            <div className="grid grid-cols-2 gap-4">

              {/* ==================================================
                ROLE
                ================================================== */}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Account Role
                </label>

                <select
                  value={role}
                  onChange={(e) =>
                    setRole(
                      e.target.value as Role
                    )
                  }
                  className="w-full px-4 py-2.5 bg-blend-color border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-red-950"
                >
                  <option value="CANDIDATE">
                    Candidate
                  </option>

                  {/* <option value="HR">
                    HR / Admin
                  </option> */}
                </select>
              </div>

              {/* ==================================================
                APPLICANT TYPE
                ================================================== */}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Applicant Type
                </label>

                <select
                  value={applicantType}
                  onChange={(e) =>
                    setApplicantType(
                      e.target.value as ApplicantType
                    )
                  }
                  className="w-full px-4 py-2.5 bg-blend-color border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-red-950"
                >
                  <option value="SINGLE_JOB_SEEKER">
                    Single Job Seeker
                  </option>

                  <option value="SINGLE_INTERN">
                    Single Intern
                  </option>

                  <option value="BATCH_INTERN">
                    Batch Intern
                  </option>
                </select>
              </div>
            </div>

            {/* ====================================================
              PHONE
              ==================================================== */}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Phone Number (Optional)
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="+91 xxx xxxx xxx"
                className="w-full px-4 py-2.5 bg-blend-color border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-red-950 placeholder-slate-500"
              />
            </div>

            {/* ====================================================
              COLLEGE DETAILS
              ==================================================== */}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                College / University Details (Optional)
              </label>

              <textarea
                rows={2}
                value={collegeDetails}
                onChange={(e) =>
                  setCollegeDetails(
                    e.target.value
                  )
                }
                placeholder="Degree, College Name, Major..."
                className="w-full px-4 py-2.5 bg-blend-color border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-red-950 placeholder-slate-500"
              />
            </div>

            {/* ====================================================
              SUBMIT BUTTON
              ==================================================== */}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl transition duration-200 shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />

                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* ======================================================
            LOGIN LINK
            ====================================================== */}

          <div className="text-center pt-2 text-xs text-slate-400">
            Already have an account?{" "}

            <Link
              href="/login"
              className="text-indigo-400 hover:text-indigo-300 font-medium underline"
            >
              Sign in
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
