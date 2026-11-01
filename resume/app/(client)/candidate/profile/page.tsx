"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type ApplicantType =
  | "SINGLE_JOB_SEEKER"
  | "SINGLE_INTERN"
  | "BATCH_INTERN";

interface Profile {
  id: number;
  fullName: string;
  email: string;
  applicantType: ApplicantType;
  phone: string | null;
  collegeDetails: string | null;
  createdAt: string;
}

interface JobChangeRequest {
  id: number;
  user_id: number;
  current_type: ApplicantType;
  requested_type: ApplicantType;
  status: "PENDING" | "APPROVED" | "REJECTED";
  decision_note: string | null;
  created_at: string;
  updated_at: string;
}

function formatApplicantType(type: ApplicantType | string): string {
  switch (type) {
    case "SINGLE_JOB_SEEKER":
      return "Single Job Seeker";
    case "SINGLE_INTERN":
      return "Single Intern";
    case "BATCH_INTERN":
      return "Batch Intern";
    default:
      return type?.replace(/_/g, " ") || "";
  }
}

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [collegeDetails, setCollegeDetails] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Job Change Request state
  const [latestRequest, setLatestRequest] = useState<JobChangeRequest | null>(null);
  const [requestedRole, setRequestedRole] = useState<ApplicantType>("SINGLE_JOB_SEEKER");
  const [requestingRole, setRequestingRole] = useState(false);
  const [roleRequestError, setRoleRequestError] = useState<string | null>(null);
  const [roleRequestSuccess, setRoleRequestSuccess] = useState<string | null>(null);

  const loadProfileAndRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileRes, requestRes] = await Promise.all([
        fetch("/api/candidate/profile", { method: "GET", cache: "no-store", credentials: "include" }),
        fetch("/api/candidate/job-change", { method: "GET", cache: "no-store", credentials: "include" }),
      ]);

      const profileData = await profileRes.json();
      const requestData = await requestRes.json();

      if (profileRes.ok && profileData.success) {
        const prof = profileData.profile as Profile;
        setProfile(prof);
        setFullName(prof.fullName || "");
        setPhone(prof.phone || "");
        setCollegeDetails(prof.collegeDetails || "");
        // Default requested role to a different role
        if (prof.applicantType === "SINGLE_JOB_SEEKER") {
          setRequestedRole("SINGLE_INTERN");
        } else if (prof.applicantType === "SINGLE_INTERN") {
          setRequestedRole("SINGLE_JOB_SEEKER");
        } else {
          setRequestedRole("SINGLE_JOB_SEEKER");
        }
      } else {
        throw new Error(profileData.error || "Failed to load profile.");
      }

      if (requestRes.ok && requestData.success) {
        setLatestRequest(requestData.request || null);
      }
    } catch (err) {
      console.error("Load profile error:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileAndRequest();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/candidate/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          collegeDetails: collegeDetails.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile.");
      }

      if (data.profile) {
        setProfile(data.profile);
      }
      setSuccessMessage("Personal details updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changingPassword) return;

    setPasswordError(null);
    setPasswordSuccess(null);

    // Client-side validations
    if (!currentPassword) {
      const msg = "Current password is required.";
      setPasswordError(msg);
      toast.error(msg);
      return;
    }

    if (!newPassword) {
      const msg = "New password is required.";
      setPasswordError(msg);
      toast.error(msg);
      return;
    }

    if (newPassword.length < 6) {
      const msg = "New password must be at least 6 characters long.";
      setPasswordError(msg);
      toast.error(msg);
      return;
    }

    if (!confirmPassword) {
      const msg = "Password confirmation is required.";
      setPasswordError(msg);
      toast.error(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = "New password and confirmation password do not match.";
      setPasswordError(msg);
      toast.error(msg);
      return;
    }

    if (newPassword === currentPassword) {
      const msg = "New password cannot be the same as your current password.";
      setPasswordError(msg);
      toast.error(msg);
      return;
    }

    try {
      setChangingPassword(true);
      const res = await fetch("/api/candidate/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to change password.");
      }

      // On success: clear inputs and display success feedback
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      const successMsg = data.message || "Password changed successfully!";
      setPasswordSuccess(successMsg);
      toast.success(successMsg);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to change password.";
      console.error("Password change error:", err);
      setPasswordError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleJobChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleRequestError(null);
    setRoleRequestSuccess(null);

    if (!profile) return;

    if (requestedRole === profile.applicantType) {
      setRoleRequestError("Please select a different job role from your current role.");
      return;
    }

    try {
      setRequestingRole(true);
      const res = await fetch("/api/candidate/job-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ requestedType: requestedRole }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit role change request.");
      }

      setRoleRequestSuccess("Job role change request submitted! Awaiting HR review.");
      // Reload request status
      const reqRes = await fetch("/api/candidate/job-change", { cache: "no-store", credentials: "include" });
      const reqData = await reqRes.json();
      if (reqRes.ok && reqData.success) {
        setLatestRequest(reqData.request || null);
      }
    } catch (err) {
      console.error("Role change request error:", err);
      setRoleRequestError(err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setRequestingRole(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 text-gray-900">
        <div className="h-8 w-48 rounded bg-gray-200 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-200 animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <p className="font-semibold">Unable to load candidate profile.</p>
        <p className="text-sm mt-1">{error || "Please refresh the page."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 text-gray-900">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Candidate Profile</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your contact details, education, and career track preferences.
        </p>
      </div>

      {/* SECTION 1: Personal Details */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-600/20">
              {fullName.charAt(0).toUpperCase() || "C"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{fullName || "Candidate"}</h2>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {formatApplicantType(profile.applicantType)}
          </span>
        </div>

        {error && (
          <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="m-6 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                Email Address <span className="text-gray-400 font-normal lowercase">(read-only)</span>
              </label>
              <input
                id="email"
                type="email"
                disabled
                value={profile.email}
                className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 sm:w-1/2"
            />
          </div>

          <div>
            <label htmlFor="collegeDetails" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              College & Degree Details
            </label>
            <textarea
              id="collegeDetails"
              rows={4}
              value={collegeDetails}
              onChange={(e) => setCollegeDetails(e.target.value)}
              placeholder="College name, degree (e.g. B.Tech Computer Science), graduation year, CGPA..."
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-md shadow-indigo-600/20 text-sm"
            >
              {saving ? "Saving Changes..." : "Save Personal Details"}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: Change Password */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Update your account password. Ensure your new password is at least 6 characters long.
          </p>
        </div>

        {passwordError && (
          <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{passwordError}</p>
          </div>
        )}

        {passwordSuccess && (
          <div className="m-6 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">{passwordSuccess}</p>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
              >
                Current Password
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={changingPassword}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                >
                  {showCurrentPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={changingPassword}
                  placeholder="Min 6 characters"
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                >
                  {showNewPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={changingPassword}
                  placeholder="Repeat new password"
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={changingPassword}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-md text-sm flex items-center gap-2"
            >
              {changingPassword && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {changingPassword ? "Updating Password..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: Job Role & Role Change Request */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Job Role & Applicant Type</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Your applicant type dictates which job openings and internships are visible to you. Changing roles requires HR review.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Role Banner */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current Job Role</p>
              <p className="text-base font-bold text-gray-900 mt-0.5">
                {formatApplicantType(profile.applicantType)}
              </p>
            </div>
            <span className="text-xs text-gray-500 max-w-xs text-right hidden sm:block">
              Historical applications maintain the applicant type at the time of submission.
            </span>
          </div>

          {/* Latest Request Status Banner */}
          {latestRequest && (
            <div
              className={`p-4 rounded-xl border ${
                latestRequest.status === "PENDING"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : latestRequest.status === "APPROVED"
                  ? "bg-green-50 border-green-200 text-green-900"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  {latestRequest.status === "PENDING" && "⏳ Request Pending HR Review"}
                  {latestRequest.status === "APPROVED" && "✅ Previous Request Approved"}
                  {latestRequest.status === "REJECTED" && "❌ Previous Request Rejected"}
                </div>
                <span className="text-xs opacity-75">
                  {new Date(latestRequest.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs mt-1.5">
                Requested transition from <strong>{formatApplicantType(latestRequest.current_type)}</strong> to{" "}
                <strong>{formatApplicantType(latestRequest.requested_type)}</strong>.
              </p>
              {latestRequest.decision_note && (
                <p className="text-xs mt-1 italic">HR Note: {latestRequest.decision_note}</p>
              )}
            </div>
          )}

          {roleRequestError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{roleRequestError}</p>
            </div>
          )}

          {roleRequestSuccess && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">{roleRequestSuccess}</p>
            </div>
          )}

          {/* Request Role Change Form */}
          <form onSubmit={handleJobChangeRequest} className="space-y-4 pt-2">
            <div>
              <label htmlFor="requestedRole" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                Request Job Role Change
              </label>
              <select
                id="requestedRole"
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value as ApplicantType)}
                disabled={latestRequest?.status === "PENDING" || requestingRole}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 sm:w-1/2 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="SINGLE_JOB_SEEKER">Single Job Seeker</option>
                <option value="SINGLE_INTERN">Single Intern</option>
                <option value="BATCH_INTERN">Batch Intern</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={
                latestRequest?.status === "PENDING" ||
                requestingRole ||
                requestedRole === profile.applicantType
              }
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-md text-sm"
            >
              {requestingRole
                ? "Submitting..."
                : latestRequest?.status === "PENDING"
                ? "Request Pending HR Review"
                : "Submit Role Change Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}