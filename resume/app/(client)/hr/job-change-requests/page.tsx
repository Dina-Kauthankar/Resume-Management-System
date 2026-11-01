"use client";

import { useEffect, useState } from "react";

// ============================================================
// TYPES
// ============================================================

interface JobChangeRequestItem {
id: number;
user_id: number;
current_type: string;
requested_type: string;
status: "PENDING" | "APPROVED" | "REJECTED";
reviewed_by: number | null;
reviewed_at: string | null;
decision_note: string | null;
created_at: string;
updated_at: string;
candidate_name?: string;
candidate_email?: string;
reviewer_name?: string | null;
}

// ============================================================
// HELPERS
// ============================================================

function formatRole(role: string): string {
switch (role) {
case "SINGLE_JOB_SEEKER":
return "Single Job Seeker";


case "SINGLE_INTERN":
  return "Single Intern";

case "BATCH_INTERN":
  return "Batch Intern";

default:
  return role?.replace(/_/g, " ") || "";


}
}

function getStatusConfig(status: JobChangeRequestItem["status"]) {
switch (status) {
case "PENDING":
return {
label: "Pending",
className:
"border-amber-200 bg-amber-50 text-amber-700",
dotClassName: "bg-amber-500",
};


case "APPROVED":
  return {
    label: "Approved",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500",
  };

case "REJECTED":
  return {
    label: "Rejected",
    className:
      "border-red-200 bg-red-50 text-red-700",
    dotClassName: "bg-red-500",
  };

default:
  return {
    label: status,
    className:
      "border-gray-200 bg-gray-50 text-gray-600",
    dotClassName: "bg-gray-400",
  };


}
}

function formatDate(date: string) {
return new Date(date).toLocaleDateString("en-IN", {
day: "2-digit",
month: "short",
year: "numeric",
});
}

// ============================================================
// ROLE ICON
// ============================================================

function RoleIcon({ role }: { role: string }) {
if (role === "BATCH_INTERN") {
return ( <svg
     className="h-4 w-4"
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     strokeWidth="1.8"
   > <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /> <circle cx="9" cy="7" r="4" /> <path d="M22 21v-2a4 4 0 0 0-3-3.87" /> <path d="M16 3.13a4 4 0 0 1 0 7.75" /> </svg>
);
}

if (role === "SINGLE_INTERN") {
return ( <svg
     className="h-4 w-4"
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     strokeWidth="1.8"
   > <rect x="3" y="4" width="18" height="16" rx="2" /> <path d="M7 8h10" /> <path d="M7 12h6" /> <path d="M7 16h4" /> </svg>
);
}

return ( <svg
   className="h-4 w-4"
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
 > <circle cx="12" cy="8" r="4" /> <path d="M5 21a7 7 0 0 1 14 0" /> </svg>
);
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
status,
}: {
status: JobChangeRequestItem["status"];
}) {
const config = getStatusConfig(status);

return (
<span
className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
>
<span
className={`h-1.5 w-1.5 rounded-full ${config.dotClassName}`}
/>
{config.label} </span>
);
}

// ============================================================
// PAGE
// ============================================================

export default function HRJobChangeRequestsPage() {
const [requests, setRequests] = useState<JobChangeRequestItem[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [successMessage, setSuccessMessage] =
useState<string | null>(null);

// Review modal state
const [selectedRequest, setSelectedRequest] =
useState<JobChangeRequestItem | null>(null);

const [reviewAction, setReviewAction] =
useState<"APPROVE" | "REJECT">("APPROVE");

const [decisionNote, setDecisionNote] = useState("");
const [submitting, setSubmitting] = useState(false);

// ============================================================
// FETCH REQUESTS
// ============================================================

const fetchRequests = async () => {
try {
setLoading(true);
setError(null);


  const res = await fetch("/api/hr/job-change", {
    method: "GET",
    cache: "no-store",
    credentials: "include",
  });

  const data = await res.json();

  if (res.ok && data.success) {
    setRequests(data.requests || []);
  } else {
    throw new Error(
      data.error || "Failed to load requests."
    );
  }
} catch (err) {
  console.error("Fetch requests error:", err);

  setError(
    err instanceof Error
      ? err.message
      : "Failed to load requests."
  );
} finally {
  setLoading(false);
}


};

useEffect(() => {
fetchRequests();
}, []);

// ============================================================
// OPEN REVIEW MODAL
// ============================================================

const openReviewModal = (
req: JobChangeRequestItem,
action: "APPROVE" | "REJECT"
) => {
setSelectedRequest(req);
setReviewAction(action);
setDecisionNote("");
setError(null);
};

// ============================================================
// SUBMIT REVIEW
// ============================================================

const handleReviewSubmit = async (
e: React.FormEvent
) => {
e.preventDefault();


if (!selectedRequest) return;

try {
  setSubmitting(true);
  setError(null);
  setSuccessMessage(null);

  const res = await fetch(
    `/api/hr/job-change/${selectedRequest.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        action: reviewAction,
        decisionNote:
          decisionNote.trim() || null,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(
      data.error || "Failed to submit review."
    );
  }

  setSuccessMessage(
    `Job role request for ${
      selectedRequest.candidate_name || "candidate"
    } has been ${reviewAction.toLowerCase()}d.`
  );

  setSelectedRequest(null);

  fetchRequests();
} catch (err) {
  console.error("Submit review error:", err);

  setError(
    err instanceof Error
      ? err.message
      : "Failed to review request."
  );
} finally {
  setSubmitting(false);
}


};

// ============================================================
// LOADING
// ============================================================

if (loading) {
return ( <div className="space-y-6 text-gray-900">
{/* Header */} <div className="space-y-2"> <div className="h-8 w-64 animate-pulse rounded-xl bg-gray-200" /> <div className="h-4 w-full max-w-xl animate-pulse rounded-lg bg-gray-200" /> </div>


    {/* Summary skeleton */}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-8 w-12 animate-pulse rounded-lg bg-gray-200" />
        </div>
      ))}
    </div>

    {/* Content skeleton */}
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="h-14 animate-pulse bg-gray-100" />

      <div className="space-y-4 p-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-xl bg-gray-100"
          />
        ))}
      </div>
    </div>
  </div>
);


}

// ============================================================
// COUNTS
// ============================================================

const pendingCount = requests.filter(
(request) => request.status === "PENDING"
).length;

const approvedCount = requests.filter(
(request) => request.status === "APPROVED"
).length;

const rejectedCount = requests.filter(
(request) => request.status === "REJECTED"
).length;

// ============================================================
// MAIN UI
// ============================================================

return ( <div className="min-w-0 space-y-6 text-gray-900 sm:space-y-7">
{/* ======================================================
PAGE HEADER
====================================================== */}


  <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-blue-50 p-5 shadow-sm sm:p-6 lg:p-7">
    {/* Decorative background */}
    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-200/30 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl" />

    <div className="relative">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100">
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
              </svg>
            </span>
            Recruitment Management
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            Candidate Job Role Requests
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Review and manage candidate requests to switch
            between applicant type tracks.
          </p>
        </div>

        {/* Refresh */}
        <button
          type="button"
          onClick={fetchRequests}
          disabled={loading}
          className="group inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white/90 px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:text-indigo-700 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
            <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  </div>

  {/* ======================================================
      ALERTS
  ====================================================== */}

  {error && (
    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </svg>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-red-900">
          Something went wrong
        </p>

        <p className="mt-0.5 text-sm text-red-700">
          {error}
        </p>
      </div>
    </div>
  )}

  {successMessage && (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m5 12 4 4L19 6" />
        </svg>
      </div>

      <div>
        <p className="text-sm font-semibold text-emerald-900">
          Request updated
        </p>

        <p className="mt-0.5 text-sm text-emerald-700">
          {successMessage}
        </p>
      </div>
    </div>
  )}

  {/* ======================================================
      SUMMARY CARDS
  ====================================================== */}

  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
    {/* Total */}
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-5">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-indigo-50 opacity-70 blur-2xl transition-opacity group-hover:opacity-100" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total
          </span>

          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
        </div>

        <p className="mt-3 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
          {requests.length}
        </p>
      </div>
    </div>

    {/* Pending */}
    <div className="group relative overflow-hidden rounded-2xl border border-amber-200/70 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-amber-100/60 blur-2xl" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Pending
          </span>

          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
        </div>

        <p className="mt-3 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
          {pendingCount}
        </p>
      </div>
    </div>

    {/* Approved */}
    <div className="group relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-emerald-100/60 blur-2xl" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Approved
          </span>

          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="m5 12 4 4L19 6" />
            </svg>
          </span>
        </div>

        <p className="mt-3 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
          {approvedCount}
        </p>
      </div>
    </div>

    {/* Rejected */}
    <div className="group relative overflow-hidden rounded-2xl border border-red-200/70 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-red-100/60 blur-2xl" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Rejected
          </span>

          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="m7 7 10 10" />
              <path d="m17 7-10 10" />
            </svg>
          </span>
        </div>

        <p className="mt-3 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
          {rejectedCount}
        </p>
      </div>
    </div>
  </div>

  {/* ======================================================
      REQUESTS SECTION
  ====================================================== */}

  <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    {/* Section header */}
    <div className="border-b border-gray-100 bg-linear-to-r from-white to-gray-50/70 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-950 sm:text-lg">
            Role Change Requests
          </h2>

          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Review candidate applicant-type changes.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          {requests.length}{" "}
          {requests.length === 1
            ? "request"
            : "requests"}
        </div>
      </div>
    </div>

    {/* ====================================================
        DESKTOP / TABLET TABLE
    ==================================================== */}

    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-212.5 text-left">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80">
            <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 lg:px-6">
              Candidate
            </th>

            <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Current Role
            </th>

            <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Requested Role
            </th>

            <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Submitted
            </th>

            <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Status
            </th>

            <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 lg:px-6">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {requests.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-16 text-center"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                  <svg
                    className="h-7 w-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M8 6h13" />
                    <path d="M8 12h13" />
                    <path d="M8 18h13" />
                    <path d="M3 6h.01" />
                    <path d="M3 12h.01" />
                    <path d="M3 18h.01" />
                  </svg>
                </div>

                <h3 className="mt-4 text-sm font-semibold text-gray-900">
                  No role change requests
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Candidate requests will appear here.
                </p>
              </td>
            </tr>
          ) : (
            requests.map((req) => (
              <tr
                key={req.id}
                className="group transition-colors duration-150 hover:bg-indigo-50/30"
              >
                {/* Candidate */}
                <td className="px-5 py-4 lg:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-blue-500 text-xs font-bold text-white shadow-sm">
                      {(
                        req.candidate_name ||
                        "U"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {req.candidate_name ||
                          `User #${req.user_id}`}
                      </p>

                      <p className="mt-0.5 max-w-47.5 truncate text-xs text-gray-500">
                        {req.candidate_email || "No email"}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Current role */}
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      <RoleIcon
                        role={req.current_type}
                      />
                    </span>

                    {formatRole(req.current_type)}
                  </span>
                </td>

                {/* Requested role */}
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-sm font-semibold text-indigo-700">
                    <RoleIcon
                      role={req.requested_type}
                    />

                    {formatRole(req.requested_type)}
                  </span>
                </td>

                {/* Date */}
                <td className="px-4 py-4 text-xs text-gray-500">
                  {formatDate(req.created_at)}
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  <StatusBadge status={req.status} />

                  {req.decision_note && (
                    <p
                      className="mt-1.5 max-w-45 truncate text-[11px] italic text-gray-400"
                      title={req.decision_note}
                    >
                      {req.decision_note}
                    </p>
                  )}
                </td>

                {/* Actions */}
                <td className="px-5 py-4 text-right lg:px-6">
                  {req.status === "PENDING" ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openReviewModal(
                            req,
                            "APPROVE"
                          )
                        }
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-sm active:translate-y-0"
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openReviewModal(
                            req,
                            "REJECT"
                          )
                        }
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 hover:shadow-sm active:translate-y-0"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-gray-400">
                      Reviewed
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {/* ====================================================
        MOBILE CARDS
    ==================================================== */}

    <div className="divide-y divide-gray-100 md:hidden">
      {requests.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
            <svg
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path d="M8 6h13" />
              <path d="M8 12h13" />
              <path d="M8 18h13" />
              <path d="M3 6h.01" />
              <path d="M3 12h.01" />
              <path d="M3 18h.01" />
            </svg>
          </div>

          <h3 className="mt-4 text-sm font-semibold text-gray-900">
            No role change requests
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Candidate requests will appear here.
          </p>
        </div>
      ) : (
        requests.map((req) => (
          <div
            key={req.id}
            className="p-4 transition-colors active:bg-gray-50"
          >
            {/* Candidate + Status */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-blue-500 text-sm font-bold text-white shadow-sm">
                  {(
                    req.candidate_name || "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {req.candidate_name ||
                      `User #${req.user_id}`}
                  </p>

                  <p className="truncate text-xs text-gray-500">
                    {req.candidate_email ||
                      "No email available"}
                  </p>
                </div>
              </div>

              <StatusBadge status={req.status} />
            </div>

            {/* Role transition */}
            <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Requested Track Change
              </p>

              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Current
                  </p>

                  <p className="mt-1 truncate text-xs font-semibold text-gray-700">
                    {formatRole(req.current_type)}
                  </p>
                </div>

                <svg
                  className="h-4 w-4 shrink-0 text-indigo-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>

                <div className="min-w-0 flex-1 rounded-xl border border-indigo-100 bg-indigo-50 p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-400">
                    Requested
                  </p>

                  <p className="mt-1 truncate text-xs font-semibold text-indigo-700">
                    {formatRole(req.requested_type)}
                  </p>
                </div>
              </div>
            </div>

            {/* Date + note */}
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg
                  className="h-3.5 w-3.5 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="17"
                    rx="2"
                  />
                  <path d="M16 2v4" />
                  <path d="M8 2v4" />
                  <path d="M3 10h18" />
                </svg>

                Submitted{" "}
                <span className="font-medium text-gray-700">
                  {formatDate(req.created_at)}
                </span>
              </div>

              {req.decision_note && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Decision Note
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    {req.decision_note}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            {req.status === "PENDING" ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openReviewModal(
                      req,
                      "APPROVE"
                    )
                  }
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 transition-all duration-200 hover:bg-emerald-100 active:scale-[0.98]"
                >
                  Approve Request
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openReviewModal(
                      req,
                      "REJECT"
                    )
                  }
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 transition-all duration-200 hover:bg-red-100 active:scale-[0.98]"
                >
                  Reject Request
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-gray-50 px-3 py-2 text-center text-xs font-medium text-gray-400">
                This request has already been reviewed.
              </div>
            )}
          </div>
        ))
      )}
    </div>
  </section>

  {/* ======================================================
      REVIEW MODAL
  ====================================================== */}

  {selectedRequest && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          if (!submitting) {
            setSelectedRequest(null);
          }
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/40 bg-white shadow-2xl shadow-black/20 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal header */}
        <div
          className={`relative overflow-hidden border-b p-5 sm:p-6 ${
            reviewAction === "APPROVE"
              ? "border-emerald-100 bg-linear-to-br from-emerald-50 via-white to-teal-50"
              : "border-red-100 bg-linear-to-br from-red-50 via-white to-orange-50"
          }`}
        >
          <div
            className={`absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl ${
              reviewAction === "APPROVE"
                ? "bg-emerald-200/40"
                : "bg-red-200/40"
            }`}
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  reviewAction === "APPROVE"
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {reviewAction === "APPROVE" ? (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="m7 7 10 10" />
                    <path d="m17 7-10 10" />
                  </svg>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-950 sm:text-lg">
                  {reviewAction === "APPROVE"
                    ? "Approve Role Change"
                    : "Reject Role Change"}
                </h3>

                <p className="mt-0.5 text-xs text-gray-500">
                  Review candidate request
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                !submitting &&
                setSelectedRequest(null)
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/80 hover:text-gray-700"
              aria-label="Close modal"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="m6 6 12 12" />
                <path d="m18 6-12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal body */}
        <form
          onSubmit={handleReviewSubmit}
          className="space-y-5 p-5 sm:p-6"
        >
          {/* Candidate */}
          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-blue-500 text-sm font-bold text-white">
              {(
                selectedRequest.candidate_name ||
                "U"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {selectedRequest.candidate_name ||
                  `User #${selectedRequest.user_id}`}
              </p>

              <p className="truncate text-xs text-gray-500">
                {selectedRequest.candidate_email ||
                  "No email available"}
              </p>
            </div>
          </div>

          {/* Role transition */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Applicant Type Change
            </p>

            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Current
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-700">
                  {formatRole(
                    selectedRequest.current_type
                  )}
                </p>
              </div>

              <svg
                className="h-5 w-5 shrink-0 text-indigo-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>

              <div className="min-w-0 flex-1 rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-400">
                  Requested
                </p>

                <p className="mt-1 text-sm font-semibold text-indigo-700">
                  {formatRole(
                    selectedRequest.requested_type
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Decision note */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-600">
              Decision Note{" "}
              <span className="font-normal normal-case text-gray-400">
                (optional)
              </span>
            </label>

            <textarea
              rows={4}
              value={decisionNote}
              onChange={(e) =>
                setDecisionNote(e.target.value)
              }
              placeholder="Enter a reason or feedback for the candidate..."
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />

            <p className="mt-1.5 text-[11px] text-gray-400">
              This note will be stored with the review decision.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2.5 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                setSelectedRequest(null)
              }
              disabled={submitting}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${
                reviewAction === "APPROVE"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {submitting
                ? "Processing..."
                : reviewAction === "APPROVE"
                ? "Confirm Approval"
                : "Confirm Rejection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
</div>


);
}
