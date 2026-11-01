// import { NextRequest, NextResponse } from "next/server";
// import { getAuthSession } from "@/server/auth";
// import {
//     getInterviewForApplication,
//     modifyInterviewForApplication,
//     scheduleInterview,
//     InterviewServiceError,
// } from "@/server/services/interviewService";

// export const runtime = "nodejs";

// // ============================================================
// // GET /api/hr/interview/[applicationId]
// // ============================================================

// export async function GET(
//     _request: NextRequest,
//     context: {
//         params: Promise<{
//             applicationId: string;
//         }>;
//     }
// ) {
//     try {
//         const session = await getAuthSession();

//         if (!session) {
//             return NextResponse.json(
//                 { success: false, error: "Not authenticated." },
//                 { status: 401 }
//             );
//         }

//         if (session.role !== "HR") {
//             return NextResponse.json(
//                 { success: false, error: "Only HR users can manage interviews." },
//                 { status: 403 }
//             );
//         }

//         const { applicationId: applicationIdParam } = await context.params;
//         const applicationId = Number(applicationIdParam);

//         if (!Number.isInteger(applicationId) || applicationId <= 0) {
//             return NextResponse.json(
//                 { success: false, error: "Invalid application ID." },
//                 { status: 400 }
//             );
//         }

//         const data = await getInterviewForApplication(applicationId);

//         return NextResponse.json(
//             { success: true, data },
//             { status: 200 }
//         );
//     } catch (error) {
//         console.error("Get HR application interview error:", error);

//         if (error instanceof InterviewServiceError) {
//             return NextResponse.json(
//                 { success: false, error: error.message },
//                 { status: error.statusCode }
//             );
//         }

//         return NextResponse.json(
//             { success: false, error: "Failed to retrieve interview information." },
//             { status: 500 }
//         );
//     }
// }

// // ============================================================
// // POST /api/hr/interview/[applicationId]
// // ============================================================

// export async function POST(
//     request: NextRequest,
//     context: {
//         params: Promise<{
//             applicationId: string;
//         }>;
//     }
// ) {
//     try {
//         const session = await getAuthSession();

//         if (!session) {
//             return NextResponse.json(
//                 { success: false, error: "Not authenticated." },
//                 { status: 401 }
//             );
//         }

//         if (session.role !== "HR") {
//             return NextResponse.json(
//                 { success: false, error: "Only HR users can schedule interviews." },
//                 { status: 403 }
//             );
//         }

//         const { applicationId: applicationIdParam } = await context.params;
//         const applicationId = Number(applicationIdParam);

//         if (!Number.isInteger(applicationId) || applicationId <= 0) {
//             return NextResponse.json(
//                 { success: false, error: "Invalid application ID." },
//                 { status: 400 }
//             );
//         }

//         let body: {
//             interviewDate?: unknown;
//             interviewTime?: unknown;
//             interviewType?: unknown;
//             meetingLink?: unknown;
//             physicalLocation?: unknown;
//             notes?: unknown;
//         };

//         try {
//             body = await request.json();
//         } catch {
//             return NextResponse.json(
//                 { success: false, error: "Invalid JSON request body." },
//                 { status: 400 }
//             );
//         }

//         if (typeof body.interviewDate !== "string") {
//             return NextResponse.json(
//                 { success: false, error: "Interview date is required." },
//                 { status: 400 }
//             );
//         }

//         if (typeof body.interviewTime !== "string") {
//             return NextResponse.json(
//                 { success: false, error: "Interview time is required." },
//                 { status: 400 }
//             );
//         }

//         const interviewType =
//             body.interviewType === "OFFLINE" ? "OFFLINE" : "ONLINE";
//         const meetingLink =
//             typeof body.meetingLink === "string" ? body.meetingLink.trim() || null : null;
//         const physicalLocation =
//             typeof body.physicalLocation === "string"
//                 ? body.physicalLocation.trim() || null
//                 : null;
//         const notes =
//             typeof body.notes === "string" ? body.notes.trim() || null : null;

//         const createdBy = Number(session.userId);

//         if (!Number.isInteger(createdBy) || createdBy <= 0) {
//             return NextResponse.json(
//                 { success: false, error: "Authenticated HR user ID is missing." },
//                 { status: 401 }
//             );
//         }

//         const result = await scheduleInterview({
//             applicationId,
//             interviewDate: body.interviewDate,
//             interviewTime: body.interviewTime,
//             interviewType,
//             meetingLink,
//             physicalLocation,
//             notes,
//             createdBy,
//         });

//         return NextResponse.json(
//             {
//                 success: true,
//                 message: "Interview scheduled successfully.",
//                 result,
//             },
//             { status: 201 }
//         );
//     } catch (error) {
//         console.error("Schedule HR interview error:", error);

//         if (error instanceof InterviewServiceError) {
//             return NextResponse.json(
//                 { success: false, error: error.message },
//                 { status: error.statusCode }
//             );
//         }

//         return NextResponse.json(
//             { success: false, error: "Failed to schedule interview." },
//             { status: 500 }
//         );
//     }
// }

// // ============================================================
// // PUT /api/hr/interview/[applicationId]
// // ============================================================

// export async function PUT(
//     request: NextRequest,
//     context: {
//         params: Promise<{
//             applicationId: string;
//         }>;
//     }
// ) {
//     try {
//         const session = await getAuthSession();

//         if (!session) {
//             return NextResponse.json(
//                 { success: false, error: "Not authenticated." },
//                 { status: 401 }
//             );
//         }

//         if (session.role !== "HR") {
//             return NextResponse.json(
//                 { success: false, error: "Only HR users can update interviews." },
//                 { status: 403 }
//             );
//         }

//         const { applicationId: applicationIdParam } = await context.params;
//         const applicationId = Number(applicationIdParam);

//         if (!Number.isInteger(applicationId) || applicationId <= 0) {
//             return NextResponse.json(
//                 { success: false, error: "Invalid application ID." },
//                 { status: 400 }
//             );
//         }

//         let body: {
//             interviewDate?: unknown;
//             interviewTime?: unknown;
//             interviewType?: unknown;
//             meetingLink?: unknown;
//             physicalLocation?: unknown;
//             notes?: unknown;
//             status?: unknown;
//         };

//         try {
//             body = await request.json();
//         } catch {
//             return NextResponse.json(
//                 { success: false, error: "Invalid JSON request body." },
//                 { status: 400 }
//             );
//         }

//         const updateData: {
//             interviewDate?: string;
//             interviewTime?: string;
//             interviewType?: "ONLINE" | "OFFLINE";
//             meetingLink?: string | null;
//             physicalLocation?: string | null;
//             notes?: string | null;
//             status?: "SCHEDULED" | "COMPLETED" | "CANCELLED";
//         } = {};

//         if (typeof body.interviewDate === "string") {
//             updateData.interviewDate = body.interviewDate;
//         }

//         if (typeof body.interviewTime === "string") {
//             updateData.interviewTime = body.interviewTime;
//         }

//         if (body.interviewType === "ONLINE" || body.interviewType === "OFFLINE") {
//             updateData.interviewType = body.interviewType;
//         }

//         if (body.meetingLink !== undefined) {
//             updateData.meetingLink =
//                 typeof body.meetingLink === "string" ? body.meetingLink.trim() || null : null;
//         }

//         if (body.physicalLocation !== undefined) {
//             updateData.physicalLocation =
//                 typeof body.physicalLocation === "string"
//                     ? body.physicalLocation.trim() || null
//                     : null;
//         }

//         if (body.notes !== undefined) {
//             updateData.notes =
//                 typeof body.notes === "string" ? body.notes.trim() || null : null;
//         }

//         if (
//             body.status === "SCHEDULED" ||
//             body.status === "COMPLETED" ||
//             body.status === "CANCELLED"
//         ) {
//             updateData.status = body.status;
//         }

//         const result = await modifyInterviewForApplication(applicationId, updateData);

//         return NextResponse.json(
//             {
//                 success: true,
//                 message: "Interview updated successfully.",
//                 result,
//             },
//             { status: 200 }
//         );
//     } catch (error) {
//         console.error("Update HR interview error:", error);

//         if (error instanceof InterviewServiceError) {
//             return NextResponse.json(
//                 { success: false, error: error.message },
//                 { status: error.statusCode }
//             );
//         }

//         return NextResponse.json(
//             { success: false, error: "Failed to update interview." },
//             { status: 500 }
//         );
//     }
// }

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import {
    getInterviewForApplication,
    modifyInterviewForApplication,
    scheduleInterview,
    InterviewServiceError,
} from "@/server/services/interviewService";

export const runtime = "nodejs";

// ============================================================
// GET /api/hr/interview/[applicationId]
// ============================================================

export async function GET(
    _request: NextRequest,
    context: {
        params: Promise<{
            applicationId: string;
        }>;
    }
) {
    try {
        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Not authenticated.",
                },
                {
                    status: 401,
                }
            );
        }

        if (session.role !== "HR") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Only HR users can manage interviews.",
                },
                {
                    status: 403,
                }
            );
        }

        const {
            applicationId: applicationIdParam,
        } = await context.params;

        const applicationId =
            Number(applicationIdParam);

        if (
            !Number.isInteger(applicationId) ||
            applicationId <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid application ID.",
                },
                {
                    status: 400,
                }
            );
        }

        const data =
            await getInterviewForApplication(
                applicationId
            );

        return NextResponse.json(
            {
                success: true,
                data,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.error(
            "Get HR application interview error:",
            error
        );

        if (
            error instanceof InterviewServiceError
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: error.message,
                },
                {
                    status: error.statusCode,
                }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error:
                    "Failed to retrieve interview information.",
            },
            {
                status: 500,
            }
        );
    }
}

// ============================================================
// POST /api/hr/interview/[applicationId]
// ============================================================

export async function POST(
    request: NextRequest,
    context: {
        params: Promise<{
            applicationId: string;
        }>;
    }
) {
    try {
        const session =
            await getAuthSession();

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Not authenticated.",
                },
                {
                    status: 401,
                }
            );
        }

        if (session.role !== "HR") {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Only HR users can schedule interviews.",
                },
                {
                    status: 403,
                }
            );
        }

        const {
            applicationId: applicationIdParam,
        } = await context.params;

        const applicationId =
            Number(applicationIdParam);

        if (
            !Number.isInteger(applicationId) ||
            applicationId <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid application ID.",
                },
                {
                    status: 400,
                }
            );
        }

        let body: {
            interviewDate?: unknown;
            interviewTime?: unknown;
            interviewType?: unknown;
            meetingLink?: unknown;
            physicalLocation?: unknown;
            notes?: unknown;
        };

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Invalid JSON request body.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            typeof body.interviewDate !==
            "string"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Interview date is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            typeof body.interviewTime !==
            "string"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Interview time is required.",
                },
                {
                    status: 400,
                }
            );
        }

        const interviewType =
            body.interviewType === "OFFLINE"
                ? "OFFLINE"
                : "ONLINE";

        const meetingLink =
            typeof body.meetingLink ===
            "string"
                ? body.meetingLink.trim() ||
                  null
                : null;

        const physicalLocation =
            typeof body.physicalLocation ===
            "string"
                ? body.physicalLocation.trim() ||
                  null
                : null;

        const notes =
            typeof body.notes === "string"
                ? body.notes.trim() || null
                : null;

        const createdBy =
            Number(session.userId);

        if (
            !Number.isInteger(createdBy) ||
            createdBy <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Authenticated HR user ID is missing.",
                },
                {
                    status: 401,
                }
            );
        }

        const result =
            await scheduleInterview({
                applicationId,

                interviewDate:
                    body.interviewDate,

                interviewTime:
                    body.interviewTime,

                interviewType,

                meetingLink,

                physicalLocation,

                notes,

                createdBy,
            });

        return NextResponse.json(
            {
                success: true,
                message:
                    "Interview scheduled successfully.",
                result,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "Schedule HR interview error:",
            error
        );

        if (
            error instanceof InterviewServiceError
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: error.message,
                },
                {
                    status: error.statusCode,
                }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error:
                    "Failed to schedule interview.",
            },
            {
                status: 500,
            }
        );
    }
}

// ============================================================
// PUT /api/hr/interview/[applicationId]
// ============================================================

export async function PUT(
    request: NextRequest,
    context: {
        params: Promise<{
            applicationId: string;
        }>;
    }
) {
    try {
        const session =
            await getAuthSession();

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Not authenticated.",
                },
                {
                    status: 401,
                }
            );
        }

        if (session.role !== "HR") {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Only HR users can update interviews.",
                },
                {
                    status: 403,
                }
            );
        }

        const {
            applicationId: applicationIdParam,
        } = await context.params;

        const applicationId =
            Number(applicationIdParam);

        if (
            !Number.isInteger(applicationId) ||
            applicationId <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid application ID.",
                },
                {
                    status: 400,
                }
            );
        }

        let body: {
            interviewDate?: unknown;
            interviewTime?: unknown;
            interviewType?: unknown;
            meetingLink?: unknown;
            physicalLocation?: unknown;
            notes?: unknown;
            status?: unknown;
        };

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Invalid JSON request body.",
                },
                {
                    status: 400,
                }
            );
        }

        const updateData: {
            interviewDate?: string;
            interviewTime?: string;
            interviewType?:
                | "ONLINE"
                | "OFFLINE";
            meetingLink?: string | null;
            physicalLocation?: string | null;
            notes?: string | null;
            status?:
                | "SCHEDULED"
                | "COMPLETED"
                | "CANCELLED";
        } = {};

        if (
            typeof body.interviewDate ===
            "string"
        ) {
            updateData.interviewDate =
                body.interviewDate;
        }

        if (
            typeof body.interviewTime ===
            "string"
        ) {
            updateData.interviewTime =
                body.interviewTime;
        }

        if (
            body.interviewType === "ONLINE" ||
            body.interviewType === "OFFLINE"
        ) {
            updateData.interviewType =
                body.interviewType;
        }

        if (
            body.meetingLink !== undefined
        ) {
            updateData.meetingLink =
                typeof body.meetingLink ===
                "string"
                    ? body.meetingLink.trim() ||
                      null
                    : null;
        }

        if (
            body.physicalLocation !==
            undefined
        ) {
            updateData.physicalLocation =
                typeof body.physicalLocation ===
                "string"
                    ? body.physicalLocation.trim() ||
                      null
                    : null;
        }

        if (body.notes !== undefined) {
            updateData.notes =
                typeof body.notes ===
                "string"
                    ? body.notes.trim() || null
                    : null;
        }

        if (
            body.status === "SCHEDULED" ||
            body.status === "COMPLETED" ||
            body.status === "CANCELLED"
        ) {
            updateData.status =
                body.status;
        }

        const result =
            await modifyInterviewForApplication(
                applicationId,
                updateData
            );

        return NextResponse.json(
            {
                success: true,
                message:
                    "Interview updated successfully.",
                result,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.error(
            "Update HR interview error:",
            error
        );

        if (
            error instanceof InterviewServiceError
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: error.message,
                },
                {
                    status: error.statusCode,
                }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error:
                    "Failed to update interview.",
            },
            {
                status: 500,
            }
        );
    }
}