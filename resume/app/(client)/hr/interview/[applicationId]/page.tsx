// "use client";

// import { FormEvent, useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";

// // ============================================================
// // TYPES
// // ============================================================

// type ApplicationStatus =
//     | "APPLIED"
//     | "SHORTLISTED"
//     | "INTERVIEW_SCHEDULED"
//     | "SELECTED"
//     | "REJECTED";

// type InterviewStatus =
//     | "SCHEDULED"
//     | "COMPLETED"
//     | "CANCELLED";

// type InterviewType = "ONLINE" | "OFFLINE";

// interface InterviewApplicationData {
//     application_id: number;
//     application_status: ApplicationStatus;
//     candidate_id: number;
//     candidate_name: string;
//     candidate_email: string;
//     candidate_phone: string | null;
//     candidate_college_details: string | null;
//     project_id: number;
//     project_title: string;
//     project_description: string | null;
//     project_target_type: string;
//     project_status: string;
// }

// interface InterviewAppointment {
//     id: number;
//     application_id: number;
//     interview_date: string;
//     interview_time: string;
//     interview_type: InterviewType;
//     meeting_link: string | null;
//     physical_location: string | null;
//     status: InterviewStatus;
//     notes: string | null;
//     created_by: number | null;
//     created_at: string;
//     updated_at: string;
// }

// interface InterviewPageData {
//     application: InterviewApplicationData;
//     interview: InterviewAppointment | null;
// }

// interface InterviewResponse {
//     success: boolean;
//     data?: InterviewPageData;
//     error?: string;
// }

// // ============================================================
// // FORMATTERS
// // ============================================================

// function formatDate(dateString: string): string {
//     if (!dateString) return "Not specified";

//     const cleanDate = dateString.includes("T")
//         ? dateString.split("T")[0]
//         : dateString;

//     const parts = cleanDate.split("-");

//     if (parts.length === 3) {
//         const year = Number(parts[0]);
//         const month = Number(parts[1]) - 1;
//         const day = Number(parts[2]);

//         const d = new Date(year, month, day);

//         if (!isNaN(d.getTime())) {
//             return d.toLocaleDateString("en-IN", {
//                 day: "2-digit",
//                 month: "short",
//                 year: "numeric",
//             });
//         }
//     }

//     return dateString;
// }

// function formatTime(timeString: string): string {
//     if (!timeString) return "Not specified";

//     const parts = timeString.split(":");

//     if (parts.length >= 2) {
//         const hours = Number(parts[0]);
//         const minutes = Number(parts[1]);

//         if (!isNaN(hours) && !isNaN(minutes)) {
//             const date = new Date();

//             date.setHours(hours, minutes, 0, 0);

//             return date.toLocaleTimeString("en-IN", {
//                 hour: "2-digit",
//                 minute: "2-digit",
//                 hour12: true,
//             });
//         }
//     }

//     return timeString;
// }

// // ============================================================
// // STATUS HELPERS
// // ============================================================

// function getApplicationStatusStyle(status: ApplicationStatus) {
//     switch (status) {
//         case "SHORTLISTED":
//             return "bg-blue-50 text-blue-700 border-blue-200";

//         case "INTERVIEW_SCHEDULED":
//             return "bg-indigo-50 text-indigo-700 border-indigo-200";

//         case "SELECTED":
//             return "bg-green-50 text-green-700 border-green-200";

//         case "REJECTED":
//             return "bg-red-50 text-red-700 border-red-200";

//         default:
//             return "bg-gray-50 text-gray-700 border-gray-200";
//     }
// }

// function getInterviewStatusStyle(status: InterviewStatus) {
//     switch (status) {
//         case "SCHEDULED":
//             return "bg-blue-50 text-blue-700 border-blue-200";

//         case "COMPLETED":
//             return "bg-green-50 text-green-700 border-green-200";

//         case "CANCELLED":
//             return "bg-red-50 text-red-700 border-red-200";

//         default:
//             return "bg-gray-50 text-gray-700 border-gray-200";
//     }
// }

// // ============================================================
// // PAGE
// // ============================================================

// export default function HRInterviewSchedulePage() {
//     const params = useParams();
//     const router = useRouter();

//     const applicationIdParam = params.applicationId;

//     const applicationIdStr = Array.isArray(applicationIdParam)
//         ? applicationIdParam[0]
//         : applicationIdParam;

//     const [data, setData] = useState<InterviewPageData | null>(null);
//     const [hrCompanyAddress, setHrCompanyAddress] = useState<string | null>(null);

//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);

//     const [submitting, setSubmitting] = useState(false);
//     const [submitError, setSubmitError] = useState<string | null>(null);
//     const [successMessage, setSuccessMessage] = useState<string | null>(null);

//     // ========================================================
//     // FORM STATE
//     // ========================================================

//     const [interviewDate, setInterviewDate] = useState("");
//     const [interviewTime, setInterviewTime] = useState("");
//     const [interviewType, setInterviewType] =
//         useState<InterviewType>("ONLINE");

//     const [meetingLink, setMeetingLink] = useState("");
//     const [physicalLocation, setPhysicalLocation] = useState("");
//     const [notes, setNotes] = useState("");

//     const [status, setStatus] =
//         useState<InterviewStatus>("SCHEDULED");

//     // ========================================================
//     // LOAD DATA
//     // ========================================================

//     async function loadInterviewData() {
//         try {
//             setLoading(true);
//             setError(null);

//             const numericAppId = Number(applicationIdStr);

//             if (!Number.isInteger(numericAppId) || numericAppId <= 0) {
//                 throw new Error("Invalid application ID.");
//             }

//             const [interviewRes, hrProfileRes] = await Promise.all([
//                 fetch(`/api/hr/interview/${numericAppId}`, {
//                     method: "GET",
//                     credentials: "include",
//                     cache: "no-store",
//                 }),

//                 fetch("/api/hr/profile", {
//                     method: "GET",
//                     credentials: "include",
//                     cache: "no-store",
//                 }),
//             ]);

//             const result =
//                 (await interviewRes.json()) as InterviewResponse;

//             const profileResult = await hrProfileRes.json();

//             if (
//                 !interviewRes.ok ||
//                 !result.success ||
//                 !result.data
//             ) {
//                 throw new Error(
//                     result.error ||
//                         "Failed to load interview information."
//                 );
//             }

//             if (
//                 hrProfileRes.ok &&
//                 profileResult.success &&
//                 profileResult.profile
//             ) {
//                 setHrCompanyAddress(
//                     profileResult.profile.companyAddress || null
//                 );
//             }

//             setData(result.data);

//             if (result.data.interview) {
//                 const inv = result.data.interview;

//                 setInterviewDate(inv.interview_date || "");
//                 setInterviewTime(inv.interview_time || "");
//                 setInterviewType(
//                     inv.interview_type || "ONLINE"
//                 );

//                 setMeetingLink(inv.meeting_link || "");

//                 setPhysicalLocation(
//                     inv.physical_location ||
//                         profileResult?.profile?.companyAddress ||
//                         ""
//                 );

//                 setNotes(inv.notes || "");
//                 setStatus(inv.status);
//             } else if (
//                 profileResult?.profile?.companyAddress
//             ) {
//                 setPhysicalLocation(
//                     profileResult.profile.companyAddress
//                 );
//             }
//         } catch (err) {
//             console.error(
//                 "Load interview page error:",
//                 err
//             );

//             setError(
//                 err instanceof Error
//                     ? err.message
//                     : "Failed to load interview information."
//             );
//         } finally {
//             setLoading(false);
//         }
//     }

//     useEffect(() => {
//         if (applicationIdStr) {
//             loadInterviewData();
//         }
//     }, [applicationIdStr]);

//     // ========================================================
//     // SUBMIT
//     // ========================================================

//     async function handleSubmit(
//         event: FormEvent<HTMLFormElement>
//     ) {
//         event.preventDefault();

//         setSubmitError(null);
//         setSuccessMessage(null);

//         const numericAppId = Number(applicationIdStr);

//         if (
//             !Number.isInteger(numericAppId) ||
//             numericAppId <= 0
//         ) {
//             setSubmitError("Invalid application ID.");
//             return;
//         }

//         if (!interviewDate) {
//             setSubmitError(
//                 "Please select an interview date."
//             );
//             return;
//         }

//         if (!interviewTime) {
//             setSubmitError(
//                 "Please select an interview time."
//             );
//             return;
//         }

//         if (
//             interviewType === "ONLINE" &&
//             !meetingLink.trim()
//         ) {
//             setSubmitError(
//                 "A valid meeting link is required for online interviews."
//             );
//             return;
//         }

//         if (
//             interviewType === "OFFLINE" &&
//             !physicalLocation.trim()
//         ) {
//             setSubmitError(
//                 "Please enter the physical location for the offline interview."
//             );
//             return;
//         }

//         if (submitting) return;

//         try {
//             setSubmitting(true);

//             const isEditing = Boolean(data?.interview);
//             const method = isEditing ? "PUT" : "POST";

//             const payload: any = {
//                 interviewDate,
//                 interviewTime,
//                 interviewType,

//                 meetingLink:
//                     interviewType === "ONLINE"
//                         ? meetingLink.trim()
//                         : null,

//                 physicalLocation:
//                     interviewType === "OFFLINE"
//                         ? physicalLocation.trim()
//                         : null,

//                 notes: notes.trim() || null,
//             };

//             if (isEditing) {
//                 payload.status = status;
//             }

//             const response = await fetch(
//                 `/api/hr/interview/${numericAppId}`,
//                 {
//                     method,
//                     credentials: "include",
//                     headers: {
//                         "Content-Type": "application/json",
//                     },
//                     body: JSON.stringify(payload),
//                 }
//             );

//             const result = await response.json();

//             if (!response.ok || !result.success) {
//                 throw new Error(
//                     result.error ||
//                         "Failed to save interview."
//                 );
//             }

//             setSuccessMessage(
//                 result.message ||
//                     (isEditing
//                         ? "Interview updated successfully."
//                         : "Interview scheduled successfully.")
//             );

//             await loadInterviewData();
//         } catch (err) {
//             console.error(
//                 "Save interview error:",
//                 err
//             );

//             setSubmitError(
//                 err instanceof Error
//                     ? err.message
//                     : "Failed to save interview."
//             );
//         } finally {
//             setSubmitting(false);
//         }
//     }

//     // ========================================================
//     // LOADING
//     // ========================================================

//     if (loading) {
//         return (
//             <div className="space-y-6 text-gray-900">
//                 <div className="space-y-2">
//                     <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
//                     <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
//                     <div className="h-4 w-80 animate-pulse rounded bg-gray-200" />
//                 </div>

//                 <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
//                     <div className="space-y-6 lg:col-span-2">
//                         <div className="h-48 animate-pulse rounded-2xl bg-gray-200" />
//                         <div className="h-36 animate-pulse rounded-2xl bg-gray-200" />
//                     </div>

//                     <div className="h-125 animate-pulse rounded-2xl bg-gray-200" />
//                 </div>
//             </div>
//         );
//     }

//     // ========================================================
//     // ERROR
//     // ========================================================

//     if (error || !data) {
//         return (
//             <div className="space-y-6 text-gray-900">
//                 <div>
//                     <button
//                         type="button"
//                         onClick={() =>
//                             router.push("/hr/interview")
//                         }
//                         className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition hover:text-indigo-700"
//                     >
//                         ← Back to Interviews
//                     </button>
//                 </div>

//                 <div className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
//                     <div className="flex gap-3">
//                         <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
//                             !
//                         </div>

//                         <div>
//                             <h1 className="text-lg font-semibold text-red-900">
//                                 Unable to load interview
//                             </h1>

//                             <p className="mt-2 text-sm leading-relaxed text-red-700">
//                                 {error ||
//                                     "Interview information could not be loaded."}
//                             </p>

//                             <button
//                                 type="button"
//                                 onClick={loadInterviewData}
//                                 className="mt-4 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
//                             >
//                                 Try Again
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     const { application, interview } = data;

//     const isEditing = Boolean(interview);

//     // ========================================================
//     // MAIN UI
//     // ========================================================

//     return (
//         <div className="space-y-6 text-gray-900">
//             {/* ====================================================
//                 HEADER
//             ==================================================== */}

//             <div>
//                 <div className="mb-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
//                     <button
//                         type="button"
//                         onClick={() =>
//                             router.push(
//                                 `/hr/application/${application.application_id}`
//                             )
//                         }
//                         className="w-fit font-medium text-gray-600 transition hover:text-indigo-700"
//                     >
//                         ← Back to Application #
//                         {application.application_id}
//                     </button>

//                     <span className="hidden text-gray-300 sm:inline">
//                         |
//                     </span>

//                     <button
//                         type="button"
//                         onClick={() =>
//                             router.push("/hr/interview")
//                         }
//                         className="w-fit font-medium text-gray-600 transition hover:text-indigo-700"
//                     >
//                         Back to Interviews List
//                     </button>
//                 </div>

//                 <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//                     <div>
//                         <div className="flex items-center gap-2">
//                             <span className="h-2 w-2 rounded-full bg-indigo-600" />

//                             <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
//                                 {isEditing
//                                     ? "View / Edit Interview"
//                                     : "Schedule Interview"}
//                             </h1>
//                         </div>

//                         <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
//                             {isEditing
//                                 ? "Manage and update existing interview appointment details."
//                                 : "Schedule an online or offline interview for this shortlisted candidate."}
//                         </p>
//                     </div>

//                     <span
//                         className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${getApplicationStatusStyle(
//                             application.application_status
//                         )}`}
//                     >
//                         {application.application_status.replace(
//                             /_/g,
//                             " "
//                         )}
//                     </span>
//                 </div>
//             </div>

//             {/* ====================================================
//                 SUCCESS MESSAGE
//             ==================================================== */}

//             {successMessage && (
//                 <div className="rounded-xl border border-green-200 bg-green-50 p-4">
//                     <div className="flex items-start gap-3">
//                         <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
//                             ✓
//                         </div>

//                         <p className="pt-1 text-sm font-medium text-green-800">
//                             {successMessage}
//                         </p>
//                     </div>
//                 </div>
//             )}

//             {/* ====================================================
//                 MAIN GRID
//             ==================================================== */}

//             <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
//                 {/* =================================================
//                     LEFT COLUMN
//                 ================================================= */}

//                 <div className="space-y-6 lg:col-span-2">
//                     {/* =================================================
//                         CANDIDATE INFORMATION
//                     ================================================= */}

//                     <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
//                         <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-4 sm:px-6">
//                             <div className="flex items-center gap-3">
//                                 <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
//                                     👤
//                                 </div>

//                                 <div>
//                                     <h2 className="text-base font-bold text-gray-900">
//                                         Candidate Information
//                                     </h2>

//                                     <p className="text-xs text-gray-500">
//                                         Applicant details
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="p-5 sm:p-6">
//                             <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
//                                 {/* Name */}
//                                 <div>
//                                     <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
//                                         Name
//                                     </span>

//                                     <p className="mt-1 font-semibold text-gray-900">
//                                         {application.candidate_name}
//                                     </p>
//                                 </div>

//                                 {/* Email */}
//                                 <div className="min-w-0">
//                                     <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
//                                         Email
//                                     </span>

//                                     <p className="mt-1 break-all font-medium text-indigo-700">
//                                         {application.candidate_email}
//                                     </p>
//                                 </div>

//                                 {/* Phone */}
//                                 <div>
//                                     <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
//                                         Phone
//                                     </span>

//                                     <p className="mt-1 font-medium text-gray-800">
//                                         {application.candidate_phone ||
//                                             "Not provided"}
//                                     </p>
//                                 </div>

//                                 {/* College */}
//                                 <div>
//                                     <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
//                                         College / Education
//                                     </span>

//                                     <p className="mt-1 font-medium leading-relaxed text-gray-800">
//                                         {application.candidate_college_details ||
//                                             "Not provided"}
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* =================================================
//                         PROJECT POSITION
//                     ================================================= */}

//                     <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
//                         <div className="border-l-4 border-indigo-500 p-5 sm:p-6">
//                             <div className="mb-3 flex items-center gap-2">
//                                 <span className="text-lg">💼</span>

//                                 <h2 className="text-base font-bold text-gray-900">
//                                     Project Position
//                                 </h2>
//                             </div>

//                             <p className="text-lg font-bold text-indigo-700">
//                                 {application.project_title}
//                             </p>

//                             {application.project_description && (
//                                 <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
//                                     {
//                                         application.project_description
//                                     }
//                                 </p>
//                             )}

//                             <div className="mt-4 flex flex-wrap gap-2">
//                                 <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
//                                     {application.project_target_type.replace(
//                                         /_/g,
//                                         " "
//                                     )}
//                                 </span>

//                                 <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-600">
//                                     {application.project_status.replace(
//                                         /_/g,
//                                         " "
//                                     )}
//                                 </span>
//                             </div>
//                         </div>
//                     </div>

//                     {/* =================================================
//                         CURRENT INTERVIEW RECORD
//                     ================================================= */}

//                     {interview && (
//                         <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
//                             <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
//                                 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                                     <div>
//                                         <h2 className="text-base font-bold text-gray-900">
//                                             Current Interview Record
//                                         </h2>

//                                         <p className="mt-1 text-xs text-gray-500">
//                                             Existing appointment details
//                                         </p>
//                                     </div>

//                                     <span
//                                         className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getInterviewStatusStyle(
//                                             interview.status
//                                         )}`}
//                                     >
//                                         {interview.status}
//                                     </span>
//                                 </div>
//                             </div>

//                             <div className="p-5 sm:p-6">
//                                 <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
//                                     {/* Date & Time */}
//                                     <div>
//                                         <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
//                                             Date & Time
//                                         </span>

//                                         <p className="mt-1 font-semibold text-gray-900">
//                                             {formatDate(
//                                                 interview.interview_date
//                                             )}
//                                         </p>

//                                         <p className="mt-0.5 text-sm font-medium text-indigo-600">
//                                             {formatTime(
//                                                 interview.interview_time
//                                             )}
//                                         </p>
//                                     </div>

//                                     {/* Type */}
//                                     <div>
//                                         <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
//                                             Interview Type
//                                         </span>

//                                         <div className="mt-1">
//                                             {interview.interview_type ===
//                                             "ONLINE" ? (
//                                                 <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
//                                                     🌐 Online
//                                                 </span>
//                                             ) : (
//                                                 <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
//                                                     🏢 In-Person
//                                                 </span>
//                                             )}
//                                         </div>
//                                     </div>

//                                     {/* Meeting Link */}
//                                     {interview.meeting_link && (
//                                         <div className="sm:col-span-2">
//                                             <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
//                                                 Meeting Link
//                                             </span>

//                                             <a
//                                                 href={
//                                                     interview.meeting_link
//                                                 }
//                                                 target="_blank"
//                                                 rel="noopener noreferrer"
//                                                 className="mt-1 block break-all font-mono text-xs text-blue-600 transition hover:text-blue-800 hover:underline"
//                                             >
//                                                 {
//                                                     interview.meeting_link
//                                                 }
//                                             </a>
//                                         </div>
//                                     )}

//                                     {/* Physical Location */}
//                                     {interview.physical_location && (
//                                         <div className="sm:col-span-2">
//                                             <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
//                                                 Physical Location
//                                             </span>

//                                             <p className="mt-1 text-sm leading-relaxed text-gray-800">
//                                                 {
//                                                     interview.physical_location
//                                                 }
//                                             </p>
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </div>

//                 {/* =================================================
//                     RIGHT COLUMN: FORM
//                 ================================================= */}

//                 <div className="lg:col-span-1">
//                     <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
//                         {/* Form Header */}
//                         <div className="border-b border-gray-100 bg-gray-50/70 p-5 sm:p-6">
//                             <div className="flex items-center gap-3">
//                                 <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
//                                     📅
//                                 </div>

//                                 <div>
//                                     <h2 className="text-base font-bold text-gray-900">
//                                         {isEditing
//                                             ? "Edit Appointment"
//                                             : "Schedule Appointment"}
//                                     </h2>

//                                     <p className="mt-0.5 text-xs text-gray-500">
//                                         Configure interview details
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="p-5 sm:p-6">
//                             <form
//                                 onSubmit={handleSubmit}
//                                 className="space-y-5"
//                             >
//                                 {/* =================================================
//                                     FORM ERROR
//                                 ================================================= */}

//                                 {submitError && (
//                                     <div className="rounded-xl border border-red-200 bg-red-50 p-3.5">
//                                         <div className="flex items-start gap-2">
//                                             <span className="font-bold text-red-600">
//                                                 !
//                                             </span>

//                                             <p className="text-xs leading-relaxed text-red-800">
//                                                 {submitError}
//                                             </p>
//                                         </div>
//                                     </div>
//                                 )}

//                                 {/* =================================================
//                                     INTERVIEW FORMAT
//                                 ================================================= */}

//                                 <div>
//                                     <label
//                                         htmlFor="interviewType"
//                                         className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700"
//                                     >
//                                         Interview Format
//                                     </label>

//                                     <select
//                                         id="interviewType"
//                                         value={interviewType}
//                                         onChange={(e) => {
//                                             const newType =
//                                                 e.target.value as InterviewType;

//                                             setInterviewType(newType);

//                                             // When switching to OFFLINE, use the HR company
//                                             // address as the default location only if the
//                                             // HR has not already entered a location.
//                                             if (
//                                                 newType === "OFFLINE" &&
//                                                 !physicalLocation.trim() &&
//                                                 hrCompanyAddress
//                                             ) {
//                                                 setPhysicalLocation(
//                                                     hrCompanyAddress
//                                                 );
//                                             }
//                                         }}
//                                         className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition focus:ring-2 ${
//                                             interviewType ===
//                                             "ONLINE"
//                                                 ? "border-blue-200 bg-blue-50/40 focus:border-blue-500 focus:ring-blue-500/20"
//                                                 : "border-amber-200 bg-amber-50/40 focus:border-amber-500 focus:ring-amber-500/20"
//                                         }`}
//                                     >
//                                         <option value="ONLINE">
//                                             🌐 Online Interview
//                                         </option>

//                                         <option value="OFFLINE">
//                                             🏢 Offline (In-Person)
//                                             Interview
//                                         </option>
//                                     </select>
//                                 </div>

//                                 {/* =================================================
//                                     DATE
//                                 ================================================= */}

//                                 <div>
//                                     <label
//                                         htmlFor="interviewDate"
//                                         className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700"
//                                     >
//                                         Interview Date
//                                     </label>

//                                     <input
//                                         id="interviewDate"
//                                         type="date"
//                                         required
//                                         value={interviewDate}
//                                         onChange={(e) =>
//                                             setInterviewDate(
//                                                 e.target.value
//                                             )
//                                         }
//                                         className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
//                                     />
//                                 </div>

//                                 {/* =================================================
//                                     TIME
//                                 ================================================= */}

//                                 <div>
//                                     <label
//                                         htmlFor="interviewTime"
//                                         className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700"
//                                     >
//                                         Interview Time
//                                     </label>

//                                     <input
//                                         id="interviewTime"
//                                         type="time"
//                                         required
//                                         value={interviewTime}
//                                         onChange={(e) =>
//                                             setInterviewTime(
//                                                 e.target.value
//                                             )
//                                         }
//                                         className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
//                                     />
//                                 </div>

//                                 {/* =================================================
//                                     ONLINE MEETING LINK
//                                 ================================================= */}

//                                 {interviewType ===
//                                     "ONLINE" && (
//                                     <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
//                                         <label
//                                             htmlFor="meetingLink"
//                                             className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-blue-800"
//                                         >
//                                             Online Meeting Link
//                                         </label>

//                                         <input
//                                             id="meetingLink"
//                                             type="url"
//                                             required
//                                             value={meetingLink}
//                                             onChange={(e) =>
//                                                 setMeetingLink(
//                                                     e.target
//                                                         .value
//                                                 )
//                                             }
//                                             placeholder="https://meet.google.com/xyz"
//                                             className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 font-mono text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
//                                         />

//                                         <p className="mt-1.5 text-[11px] text-blue-600">
//                                             Provide the meeting URL the
//                                             candidate should use.
//                                         </p>
//                                     </div>
//                                 )}

//                                 {/* =================================================
//                                     OFFLINE LOCATION
//                                 ================================================= */}

//                                 {interviewType ===
//                                     "OFFLINE" && (
//                                     <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5">
//                                         <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-800">
//                                             Company Physical Location
//                                         </label>

//                                         <input
//                                             id="physicalLocation"
//                                             type="text"
//                                             required
//                                             value={physicalLocation}
//                                             onChange={(e) =>
//                                                 setPhysicalLocation(
//                                                     e.target.value
//                                                 )
//                                             }
//                                             placeholder={
//                                                 hrCompanyAddress ||
//                                                 "Enter interview location"
//                                             }
//                                             className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
//                                         />

//                                         <div className="mt-2 flex items-start gap-2">
//                                             <span className="text-xs text-amber-700">
//                                                 📍
//                                             </span>

//                                             <p className="text-[11px] leading-relaxed text-amber-700">
//                                                 {hrCompanyAddress
//                                                     ? "The HR Profile address is loaded as the default location. You can edit it for this interview."
//                                                     : "Enter the physical location where the interview will take place."}
//                                             </p>
//                                         </div>
//                                     </div>
//                                 )}

//                                 {/* =================================================
//                                     STATUS
//                                 ================================================= */}

//                                 {isEditing && (
//                                     <div>
//                                         <label
//                                             htmlFor="interviewStatus"
//                                             className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700"
//                                         >
//                                             Interview Status
//                                         </label>

//                                         <select
//                                             id="interviewStatus"
//                                             value={status}
//                                             onChange={(e) =>
//                                                 setStatus(
//                                                     e.target
//                                                         .value as InterviewStatus
//                                                 )
//                                             }
//                                             className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition focus:ring-2 ${
//                                                 status ===
//                                                 "SCHEDULED"
//                                                     ? "border-blue-200 bg-blue-50 text-blue-700 focus:border-blue-500 focus:ring-blue-500/20"
//                                                     : status ===
//                                                       "COMPLETED"
//                                                     ? "border-green-200 bg-green-50 text-green-700 focus:border-green-500 focus:ring-green-500/20"
//                                                     : "border-red-200 bg-red-50 text-red-700 focus:border-red-500 focus:ring-red-500/20"
//                                             }`}
//                                         >
//                                             <option value="SCHEDULED">
//                                                 SCHEDULED
//                                             </option>

//                                             <option value="COMPLETED">
//                                                 COMPLETED
//                                             </option>

//                                             <option value="CANCELLED">
//                                                 CANCELLED
//                                             </option>
//                                         </select>
//                                     </div>
//                                 )}

//                                 {/* =================================================
//                                     NOTES
//                                 ================================================= */}

//                                 <div>
//                                     <label
//                                         htmlFor="notes"
//                                         className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700"
//                                     >
//                                         Notes & Instructions{" "}
//                                         <span className="font-normal normal-case text-gray-400">
//                                             (optional)
//                                         </span>
//                                     </label>

//                                     <textarea
//                                         id="notes"
//                                         rows={4}
//                                         value={notes}
//                                         onChange={(e) =>
//                                             setNotes(
//                                                 e.target.value
//                                             )
//                                         }
//                                         placeholder="Any preparation details for the candidate..."
//                                         className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
//                                     />
//                                 </div>

//                                 {/* =================================================
//                                     SUBMIT BUTTON
//                                 ================================================= */}

//                                 <button
//                                     type="submit"
//                                     disabled={
//                                         submitting ||
//                                         (interviewType ===
//                                             "OFFLINE" &&
//                                             !physicalLocation.trim())
//                                     }
//                                     className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 disabled:cursor-not-allowed disabled:opacity-50"
//                                 >
//                                     {submitting
//                                         ? "Saving..."
//                                         : isEditing
//                                         ? "Update Interview Appointment"
//                                         : "Schedule Interview"}
//                                 </button>

//                                 <p className="text-center text-[11px] leading-relaxed text-gray-400">
//                                     {isEditing
//                                         ? "Changes will update the existing interview appointment."
//                                         : "The interview will be created for the selected application."}
//                                 </p>
//                             </form>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

"use client";

import {
    FormEvent,
    useEffect,
    useState,
} from "react";
import {
    useParams,
    useRouter,
} from "next/navigation";

// ============================================================
// TYPES
// ============================================================

type ApplicationStatus =
    | "APPLIED"
    | "SHORTLISTED"
    | "INTERVIEW_SCHEDULED"
    | "SELECTED"
    | "REJECTED";

type InterviewStatus =
    | "SCHEDULED"
    | "COMPLETED"
    | "CANCELLED";

type InterviewType =
    | "ONLINE"
    | "OFFLINE";

interface InterviewApplicationData {
    application_id: number;
    application_status: ApplicationStatus;
    candidate_id: number;
    candidate_name: string;
    candidate_email: string;
    candidate_phone: string | null;
    candidate_college_details: string | null;
    project_id: number;
    project_title: string;
    project_description: string | null;
    project_target_type: string;
    project_status: string;
}

interface InterviewAppointment {
    id: number;
    application_id: number;
    interview_date: string;
    interview_time: string;
    interview_type: InterviewType;
    meeting_link: string | null;
    physical_location: string | null;
    status: InterviewStatus;
    notes: string | null;
    created_by: number | null;
    created_at: string;
    updated_at: string;
}

interface InterviewPageData {
    application: InterviewApplicationData;
    interview: InterviewAppointment | null;

    // Default comes from company_settings.address
    defaultPhysicalLocation: string | null;
}

interface InterviewResponse {
    success: boolean;
    data?: InterviewPageData;
    error?: string;
}

// ============================================================
// FORMATTERS
// ============================================================

function formatDate(
    dateString: string
): string {
    if (!dateString) {
        return "Not specified";
    }

    const cleanDate =
        dateString.includes("T")
            ? dateString.split("T")[0]
            : dateString;

    const parts =
        cleanDate.split("-");

    if (parts.length === 3) {
        const year =
            Number(parts[0]);

        const month =
            Number(parts[1]) - 1;

        const day =
            Number(parts[2]);

        const d = new Date(
            year,
            month,
            day
        );

        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }
            );
        }
    }

    return dateString;
}

function formatTime(
    timeString: string
): string {
    if (!timeString) {
        return "Not specified";
    }

    const parts =
        timeString.split(":");

    if (parts.length >= 2) {
        const hours =
            Number(parts[0]);

        const minutes =
            Number(parts[1]);

        if (
            !isNaN(hours) &&
            !isNaN(minutes)
        ) {
            const date =
                new Date();

            date.setHours(
                hours,
                minutes,
                0,
                0
            );

            return date.toLocaleTimeString(
                "en-IN",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                }
            );
        }
    }

    return timeString;
}

// ============================================================
// STATUS HELPERS
// ============================================================

function getApplicationStatusStyle(
    status: ApplicationStatus
) {
    switch (status) {
        case "SHORTLISTED":
            return "bg-blue-50 text-blue-700 border-blue-200";

        case "INTERVIEW_SCHEDULED":
            return "bg-indigo-50 text-indigo-700 border-indigo-200";

        case "SELECTED":
            return "bg-green-50 text-green-700 border-green-200";

        case "REJECTED":
            return "bg-red-50 text-red-700 border-red-200";

        default:
            return "bg-gray-50 text-gray-700 border-gray-200";
    }
}

function getInterviewStatusStyle(
    status: InterviewStatus
) {
    switch (status) {
        case "SCHEDULED":
            return "bg-blue-50 text-blue-700 border-blue-200";

        case "COMPLETED":
            return "bg-green-50 text-green-700 border-green-200";

        case "CANCELLED":
            return "bg-red-50 text-red-700 border-red-200";

        default:
            return "bg-gray-50 text-gray-700 border-gray-200";
    }
}

// ============================================================
// PAGE
// ============================================================

export default function HRInterviewSchedulePage() {
    const params = useParams();
    const router = useRouter();

    const applicationIdParam =
        params.applicationId;

    const applicationIdStr =
        Array.isArray(
            applicationIdParam
        )
            ? applicationIdParam[0]
            : applicationIdParam;

    const [data, setData] =
        useState<InterviewPageData | null>(
            null
        );

    // ========================================================
    // DEFAULT COMPANY LOCATION
    // ========================================================
    //
    // This now comes from:
    //
    // company_settings.address
    //
    // through:
    //
    // repository → service → API → frontend
    //
    // ========================================================

    const [
        defaultPhysicalLocation,
        setDefaultPhysicalLocation,
    ] = useState<string | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [submitting, setSubmitting] =
        useState(false);

    const [submitError, setSubmitError] =
        useState<string | null>(null);

    const [successMessage, setSuccessMessage] =
        useState<string | null>(null);

    // ========================================================
    // FORM STATE
    // ========================================================

    const [
        interviewDate,
        setInterviewDate,
    ] = useState("");

    const [
        interviewTime,
        setInterviewTime,
    ] = useState("");

    const [
        interviewType,
        setInterviewType,
    ] = useState<InterviewType>(
        "ONLINE"
    );

    const [
        meetingLink,
        setMeetingLink,
    ] = useState("");

    const [
        physicalLocation,
        setPhysicalLocation,
    ] = useState("");

    const [notes, setNotes] =
        useState("");

    const [status, setStatus] =
        useState<InterviewStatus>(
            "SCHEDULED"
        );

    // ========================================================
    // LOAD DATA
    // ========================================================

    async function loadInterviewData() {
        try {
            setLoading(true);
            setError(null);

            const numericAppId =
                Number(applicationIdStr);

            if (
                !Number.isInteger(
                    numericAppId
                ) ||
                numericAppId <= 0
            ) {
                throw new Error(
                    "Invalid application ID."
                );
            }

            // =================================================
            // IMPORTANT:
            //
            // Only ONE API call is required.
            //
            // The interview API now returns:
            //
            // data.defaultPhysicalLocation
            //
            // which comes from company_settings.address.
            // =================================================

            const interviewRes =
                await fetch(
                    `/api/hr/interview/${numericAppId}`,
                    {
                        method: "GET",
                        credentials: "include",
                        cache: "no-store",
                    }
                );

            const result =
                (await interviewRes.json()) as InterviewResponse;

            if (
                !interviewRes.ok ||
                !result.success ||
                !result.data
            ) {
                throw new Error(
                    result.error ||
                        "Failed to load interview information."
                );
            }

            const pageData =
                result.data;

            setData(pageData);

            const companyDefault =
                pageData.defaultPhysicalLocation ||
                null;

            setDefaultPhysicalLocation(
                companyDefault
            );

            // =================================================
            // EXISTING INTERVIEW
            // =================================================

            if (pageData.interview) {
                const inv =
                    pageData.interview;

                setInterviewDate(
                    inv.interview_date ||
                        ""
                );

                setInterviewTime(
                    inv.interview_time ||
                        ""
                );

                setInterviewType(
                    inv.interview_type ||
                        "ONLINE"
                );

                setMeetingLink(
                    inv.meeting_link ||
                        ""
                );

                // =================================================
                // IMPORTANT:
                //
                // Existing interview location has priority.
                //
                // company_settings.address is only the default.
                // =================================================

                setPhysicalLocation(
                    inv.physical_location ||
                        companyDefault ||
                        ""
                );

                setNotes(
                    inv.notes || ""
                );

                setStatus(inv.status);
            } else {
                // =================================================
                // NEW INTERVIEW
                //
                // Pre-fill offline location with the company
                // default from company_settings.
                // =================================================

                setPhysicalLocation(
                    companyDefault || ""
                );
            }
        } catch (err) {
            console.error(
                "Load interview page error:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load interview information."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (applicationIdStr) {
            loadInterviewData();
        }
    }, [applicationIdStr]);

    // ========================================================
    // SUBMIT
    // ========================================================

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setSubmitError(null);
        setSuccessMessage(null);

        const numericAppId =
            Number(applicationIdStr);

        if (
            !Number.isInteger(
                numericAppId
            ) ||
            numericAppId <= 0
        ) {
            setSubmitError(
                "Invalid application ID."
            );

            return;
        }

        if (!interviewDate) {
            setSubmitError(
                "Please select an interview date."
            );

            return;
        }

        if (!interviewTime) {
            setSubmitError(
                "Please select an interview time."
            );

            return;
        }

        if (
            interviewType === "ONLINE" &&
            !meetingLink.trim()
        ) {
            setSubmitError(
                "A valid meeting link is required for online interviews."
            );

            return;
        }

        if (
            interviewType === "OFFLINE" &&
            !physicalLocation.trim()
        ) {
            setSubmitError(
                "Please enter the physical location for the offline interview."
            );

            return;
        }

        if (submitting) {
            return;
        }

        try {
            setSubmitting(true);

            const isEditing =
                Boolean(data?.interview);

            const method =
                isEditing
                    ? "PUT"
                    : "POST";

            const payload = {
                interviewDate,

                interviewTime,

                interviewType,

                meetingLink:
                    interviewType ===
                    "ONLINE"
                        ? meetingLink.trim()
                        : null,

                // =================================================
                // IMPORTANT:
                //
                // Always send the value currently shown in the
                // editable input.
                //
                // This allows HR to override the company default.
                // =================================================

                physicalLocation:
                    interviewType ===
                    "OFFLINE"
                        ? physicalLocation.trim()
                        : null,

                notes:
                    notes.trim() || null,
            };

            if (isEditing) {
                (
                    payload as {
                        status?: InterviewStatus;
                    }
                ).status = status;
            }

            const response =
                await fetch(
                    `/api/hr/interview/${numericAppId}`,
                    {
                        method,

                        credentials:
                            "include",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify(
                            payload
                        ),
                    }
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result.error ||
                        "Failed to save interview."
                );
            }

            setSuccessMessage(
                result.message ||
                    (isEditing
                        ? "Interview updated successfully."
                        : "Interview scheduled successfully.")
            );

            await loadInterviewData();
        } catch (err) {
            console.error(
                "Save interview error:",
                err
            );

            setSubmitError(
                err instanceof Error
                    ? err.message
                    : "Failed to save interview."
            );
        } finally {
            setSubmitting(false);
        }
    }

    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {
        return (
            <div className="space-y-6 text-gray-900">
                <div className="space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />

                    <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />

                    <div className="h-4 w-80 animate-pulse rounded bg-gray-200" />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <div className="h-48 animate-pulse rounded-2xl bg-gray-200" />

                        <div className="h-36 animate-pulse rounded-2xl bg-gray-200" />
                    </div>

                    <div className="h-[500px] animate-pulse rounded-2xl bg-gray-200" />
                </div>
            </div>
        );
    }

    // ========================================================
    // ERROR
    // ========================================================

    if (error || !data) {
        return (
            <div className="space-y-6 text-gray-900">
                <div>
                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/hr/interview"
                            )
                        }
                        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition hover:text-indigo-700"
                    >
                        ← Back to Interviews
                    </button>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
                    <div className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                            !
                        </div>

                        <div>
                            <h1 className="text-lg font-semibold text-red-900">
                                Unable to load interview
                            </h1>

                            <p className="mt-2 text-sm leading-relaxed text-red-700">
                                {error ||
                                    "Interview information could not be loaded."}
                            </p>

                            <button
                                type="button"
                                onClick={
                                    loadInterviewData
                                }
                                className="mt-4 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const {
        application,
        interview,
    } = data;

    const isEditing =
        Boolean(interview);

    // ========================================================
    // MAIN UI
    // ========================================================

    return (
        <div className="space-y-6 text-gray-900">
            {/* ====================================================
                HEADER
            ==================================================== */}

            <div>
                <div className="mb-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                `/hr/application/${application.application_id}`
                            )
                        }
                        className="w-fit font-medium text-gray-600 transition hover:text-indigo-700"
                    >
                        ← Back to Application #
                        {
                            application.application_id
                        }
                    </button>

                    <span className="hidden text-gray-300 sm:inline">
                        |
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/hr/interview"
                            )
                        }
                        className="w-fit font-medium text-gray-600 transition hover:text-indigo-700"
                    >
                        Back to Interviews List
                    </button>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-indigo-600" />

                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                                {isEditing
                                    ? "View / Edit Interview"
                                    : "Schedule Interview"}
                            </h1>
                        </div>

                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                            {isEditing
                                ? "Manage and update existing interview appointment details."
                                : "Schedule an online or offline interview for this shortlisted candidate."}
                        </p>
                    </div>

                    <span
                        className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${getApplicationStatusStyle(
                            application.application_status
                        )}`}
                    >
                        {application.application_status.replace(
                            /_/g,
                            " "
                        )}
                    </span>
                </div>
            </div>

            {/* ====================================================
                SUCCESS MESSAGE
            ==================================================== */}

            {successMessage && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                            ✓
                        </div>

                        <p className="pt-1 text-sm font-medium text-green-800">
                            {successMessage}
                        </p>
                    </div>
                </div>
            )}

            {/* ====================================================
                MAIN GRID
            ==================================================== */}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* =================================================
                    LEFT COLUMN
                ================================================= */}

                <div className="space-y-6 lg:col-span-2">
                    {/* =================================================
                        CANDIDATE INFORMATION
                    ================================================= */}

                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                                    👤
                                </div>

                                <div>
                                    <h2 className="text-base font-bold text-gray-900">
                                        Candidate Information
                                    </h2>

                                    <p className="text-xs text-gray-500">
                                        Applicant details
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 sm:p-6">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                        Name
                                    </span>

                                    <p className="mt-1 font-semibold text-gray-900">
                                        {
                                            application.candidate_name
                                        }
                                    </p>
                                </div>

                                <div className="min-w-0">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                        Email
                                    </span>

                                    <p className="mt-1 break-all font-medium text-indigo-700">
                                        {
                                            application.candidate_email
                                        }
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                        Phone
                                    </span>

                                    <p className="mt-1 font-medium text-gray-800">
                                        {
                                            application.candidate_phone ||
                                            "Not provided"
                                        }
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                        College / Education
                                    </span>

                                    <p className="mt-1 font-medium leading-relaxed text-gray-800">
                                        {
                                            application.candidate_college_details ||
                                            "Not provided"
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* =================================================
                        PROJECT POSITION
                    ================================================= */}

                    <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
                        <div className="border-l-4 border-indigo-500 p-5 sm:p-6">
                            <div className="mb-3 flex items-center gap-2">
                                <span className="text-lg">
                                    💼
                                </span>

                                <h2 className="text-base font-bold text-gray-900">
                                    Project Position
                                </h2>
                            </div>

                            <p className="text-lg font-bold text-indigo-700">
                                {
                                    application.project_title
                                }
                            </p>

                            {application.project_description && (
                                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                                    {
                                        application.project_description
                                    }
                                </p>
                            )}

                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                                    {application.project_target_type.replace(
                                        /_/g,
                                        " "
                                    )}
                                </span>

                                <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-600">
                                    {application.project_status.replace(
                                        /_/g,
                                        " "
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* =================================================
                        CURRENT INTERVIEW RECORD
                    ================================================= */}

                    {interview && (
                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900">
                                            Current Interview Record
                                        </h2>

                                        <p className="mt-1 text-xs text-gray-500">
                                            Existing appointment details
                                        </p>
                                    </div>

                                    <span
                                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getInterviewStatusStyle(
                                            interview.status
                                        )}`}
                                    >
                                        {
                                            interview.status
                                        }
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 sm:p-6">
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                            Date & Time
                                        </span>

                                        <p className="mt-1 font-semibold text-gray-900">
                                            {formatDate(
                                                interview.interview_date
                                            )}
                                        </p>

                                        <p className="mt-0.5 text-sm font-medium text-indigo-600">
                                            {formatTime(
                                                interview.interview_time
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                            Interview Type
                                        </span>

                                        <div className="mt-1">
                                            {interview.interview_type ===
                                            "ONLINE" ? (
                                                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                                    🌐 Online
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                                    🏢 In-Person
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {interview.meeting_link && (
                                        <div className="sm:col-span-2">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                Meeting Link
                                            </span>

                                            <a
                                                href={
                                                    interview.meeting_link
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-1 block break-all font-mono text-xs text-blue-600 transition hover:text-blue-800 hover:underline"
                                            >
                                                {
                                                    interview.meeting_link
                                                }
                                            </a>
                                        </div>
                                    )}

                                    {interview.physical_location && (
                                        <div className="sm:col-span-2">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                Physical Location
                                            </span>

                                            <p className="mt-1 text-sm leading-relaxed text-gray-800">
                                                {
                                                    interview.physical_location
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* =================================================
                    RIGHT COLUMN
                ================================================= */}

                <div className="lg:col-span-1">
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 bg-gray-50/70 p-5 sm:p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                                    📅
                                </div>

                                <div>
                                    <h2 className="text-base font-bold text-gray-900">
                                        {isEditing
                                            ? "Edit Appointment"
                                            : "Schedule Appointment"}
                                    </h2>

                                    <p className="mt-0.5 text-xs text-gray-500">
                                        Configure interview details
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 sm:p-6">
                            <form
                                onSubmit={
                                    handleSubmit
                                }
                                className="space-y-5"
                            >
                                {/* =================================================
                                    FORM ERROR
                                ================================================= */}

                                {submitError && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-3.5">
                                        <div className="flex items-start gap-2">
                                            <span className="font-bold text-red-600">
                                                !
                                            </span>

                                            <p className="text-xs leading-relaxed text-red-800">
                                                {
                                                    submitError
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* =================================================
                                    INTERVIEW FORMAT
                                ================================================= */}

                                <div>
                                    <label
                                        htmlFor="interviewType"
                                        className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700"
                                    >
                                        Interview Format
                                    </label>

                                    <select
                                        id="interviewType"
                                        value={
                                            interviewType
                                        }
                                        onChange={(
                                            e
                                        ) => {
                                            const newType =
                                                e.target
                                                    .value as InterviewType;

                                            setInterviewType(
                                                newType
                                            );

                                            // =================================================
                                            // When switching to OFFLINE:
                                            //
                                            // Only populate the company default if there
                                            // is currently no location.
                                            //
                                            // Never overwrite an address HR already typed.
                                            // =================================================

                                            if (
                                                newType ===
                                                    "OFFLINE" &&
                                                !physicalLocation.trim() &&
                                                defaultPhysicalLocation
                                            ) {
                                                setPhysicalLocation(
                                                    defaultPhysicalLocation
                                                );
                                            }
                                        }}
                                        className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition focus:ring-2 ${
                                            interviewType ===
                                            "ONLINE"
                                                ? "border-blue-200 bg-blue-50/40 focus:border-blue-500 focus:ring-blue-500/20"
                                                : "border-amber-200 bg-amber-50/40 focus:border-amber-500 focus:ring-amber-500/20"
                                        }`}
                                    >
                                        <option value="ONLINE">
                                            🌐 Online Interview
                                        </option>

                                        <option value="OFFLINE">
                                            🏢 Offline (In-Person)
                                            Interview
                                        </option>
                                    </select>
                                </div>

                                {/* =================================================
                                    DATE
                                ================================================= */}

                                <div>
                                    <label
                                        htmlFor="interviewDate"
                                        className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700"
                                    >
                                        Interview Date
                                    </label>

                                    <input
                                        id="interviewDate"
                                        type="date"
                                        required
                                        value={
                                            interviewDate
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setInterviewDate(
                                                e.target
                                                    .value
                                            )
                                        }
                                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>

                                {/* =================================================
                                    TIME
                                ================================================= */}

                                <div>
                                    <label
                                        htmlFor="interviewTime"
                                        className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700"
                                    >
                                        Interview Time
                                    </label>

                                    <input
                                        id="interviewTime"
                                        type="time"
                                        required
                                        value={
                                            interviewTime
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setInterviewTime(
                                                e.target
                                                    .value
                                            )
                                        }
                                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>

                                {/* =================================================
                                    ONLINE MEETING LINK
                                ================================================= */}

                                {interviewType ===
                                    "ONLINE" && (
                                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
                                        <label
                                            htmlFor="meetingLink"
                                            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-blue-800"
                                        >
                                            Online Meeting Link
                                        </label>

                                        <input
                                            id="meetingLink"
                                            type="url"
                                            required
                                            value={
                                                meetingLink
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setMeetingLink(
                                                    e.target
                                                        .value
                                                )
                                            }
                                            placeholder="https://meet.google.com/xyz"
                                            className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 font-mono text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        />

                                        <p className="mt-1.5 text-[11px] text-blue-600">
                                            Provide the meeting URL the candidate should use.
                                        </p>
                                    </div>
                                )}

                                {/* =================================================
                                    OFFLINE LOCATION
                                ================================================= */}

                                {interviewType ===
                                    "OFFLINE" && (
                                    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5">
                                        <label
                                            htmlFor="physicalLocation"
                                            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-800"
                                        >
                                            Interview Physical Location
                                        </label>

                                        <input
                                            id="physicalLocation"
                                            type="text"
                                            required
                                            value={
                                                physicalLocation
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setPhysicalLocation(
                                                    e.target
                                                        .value
                                                )
                                            }
                                            placeholder={
                                                defaultPhysicalLocation ||
                                                "Enter interview location"
                                            }
                                            className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                        />

                                        <div className="mt-2 flex items-start gap-2">
                                            <span className="text-xs text-amber-700">
                                                📍
                                            </span>

                                            <p className="text-[11px] leading-relaxed text-amber-700">
                                                {defaultPhysicalLocation
                                                    ? "The company address from Company Settings is loaded as the default. You can edit this location specifically for this interview."
                                                    : "No default company address is configured. Enter the physical location where the interview will take place."}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* =================================================
                                    STATUS
                                ================================================= */}

                                {isEditing && (
                                    <div>
                                        <label
                                            htmlFor="interviewStatus"
                                            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700"
                                        >
                                            Interview Status
                                        </label>

                                        <select
                                            id="interviewStatus"
                                            value={
                                                status
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setStatus(
                                                    e.target
                                                        .value as InterviewStatus
                                                )
                                            }
                                            className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition focus:ring-2 ${
                                                status ===
                                                "SCHEDULED"
                                                    ? "border-blue-200 bg-blue-50 text-blue-700 focus:border-blue-500 focus:ring-blue-500/20"
                                                    : status ===
                                                      "COMPLETED"
                                                    ? "border-green-200 bg-green-50 text-green-700 focus:border-green-500 focus:ring-green-500/20"
                                                    : "border-red-200 bg-red-50 text-red-700 focus:border-red-500 focus:ring-red-500/20"
                                            }`}
                                        >
                                            <option value="SCHEDULED">
                                                SCHEDULED
                                            </option>

                                            <option value="COMPLETED">
                                                COMPLETED
                                            </option>

                                            <option value="CANCELLED">
                                                CANCELLED
                                            </option>
                                        </select>
                                    </div>
                                )}

                                {/* =================================================
                                    NOTES
                                ================================================= */}

                                <div>
                                    <label
                                        htmlFor="notes"
                                        className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700"
                                    >
                                        Notes & Instructions{" "}
                                        <span className="font-normal normal-case text-gray-400">
                                            (optional)
                                        </span>
                                    </label>

                                    <textarea
                                        id="notes"
                                        rows={4}
                                        value={
                                            notes
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setNotes(
                                                e.target
                                                    .value
                                            )
                                        }
                                        placeholder="Any preparation details for the candidate..."
                                        className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>

                                {/* =================================================
                                    SUBMIT BUTTON
                                ================================================= */}

                                <button
                                    type="submit"
                                    disabled={
                                        submitting ||
                                        (interviewType ===
                                            "OFFLINE" &&
                                            !physicalLocation.trim())
                                    }
                                    className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting
                                        ? "Saving..."
                                        : isEditing
                                        ? "Update Interview Appointment"
                                        : "Schedule Interview"}
                                </button>

                                <p className="text-center text-[11px] leading-relaxed text-gray-400">
                                    {isEditing
                                        ? "Changes will update the existing interview appointment."
                                        : "The interview will be created for the selected application."}
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}