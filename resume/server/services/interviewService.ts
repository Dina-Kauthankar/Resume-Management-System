
import { db } from "@/server/database/connection";
import {
    createInterview,
    findAllInterviews,
    findApplicationForInterview,
    findCandidateInterviews,
    findCompanyPhysicalAddress,
    findInterviewByApplicationId,
    findInterviewById,
    InterviewStatus,
    InterviewType,
    updateInterview,
} from "@/server/repositories/interviewRepository";
import {
    notifyCandidateInterviewScheduled,
    notifyCandidateInterviewUpdated,
    notifyHRInterviewEvent,
} from "./notificationService";

// ============================================================
// TYPES
// ============================================================

export type ApplicationStatus =
    | "APPLIED"
    | "SHORTLISTED"
    | "INTERVIEW_SCHEDULED"
    | "SELECTED"
    | "REJECTED";

export interface ScheduleInterviewInput {
    applicationId: number;
    interviewDate: string;
    interviewTime: string;
    interviewType?: InterviewType;
    meetingLink?: string | null;
    physicalLocation?: string | null;
    notes?: string | null;
    createdBy: number;
}

export interface UpdateInterviewInput {
    interviewDate?: string;
    interviewTime?: string;
    interviewType?: InterviewType;
    meetingLink?: string | null;
    physicalLocation?: string | null;
    status?: InterviewStatus;
    notes?: string | null;
}

// ============================================================
// CUSTOM SERVICE ERROR
// ============================================================

export class InterviewServiceError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = "InterviewServiceError";
        this.statusCode = statusCode;
    }
}

// ============================================================
// DATE VALIDATION
// ============================================================

export function isValidDate(value: string): boolean {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

// ============================================================
// TIME VALIDATION
// ============================================================

export function isValidTime(value: string): boolean {
    if (typeof value !== "string") {
        return false;
    }

    return /^\d{2}:\d{2}(:\d{2})?$/.test(value);
}

// ============================================================
// RESOLVE OFFLINE LOCATION
// ============================================================
//
// Priority:
//
// 1. Explicit interview-specific location
// 2. company_settings.address
//
// IMPORTANT:
// We deliberately DO NOT use users.company_address here.
// company_settings.address is the application's single source
// of truth for the default company physical address.
// ============================================================

async function resolveOfflineLocation(
    interviewSpecificLocation?: string | null
): Promise<string> {
    const explicitLocation =
        interviewSpecificLocation?.trim() || "";

    if (explicitLocation) {
        return explicitLocation;
    }

    const companyAddress =
        await findCompanyPhysicalAddress();

    if (!companyAddress) {
        throw new InterviewServiceError(
            "Company physical address is not configured. Please set the company address in Company Settings before scheduling an offline interview.",
            400
        );
    }

    return companyAddress;
}

// ============================================================
// SCHEDULE INTERVIEW
// ============================================================

export async function scheduleInterview(
    data: ScheduleInterviewInput
) {
    // ========================================================
    // 1. FIND APPLICATION
    // ========================================================

    const application =
        await findApplicationForInterview(
            data.applicationId
        );

    if (!application) {
        throw new InterviewServiceError(
            "Application not found.",
            404
        );
    }

    // ========================================================
    // 2. VALIDATE APPLICATION STATUS
    // ========================================================

    if (
        application.application_status !== "SHORTLISTED" &&
        application.application_status !==
            "INTERVIEW_SCHEDULED"
    ) {
        throw new InterviewServiceError(
            "An interview can only be scheduled for a shortlisted application.",
            400
        );
    }

    // ========================================================
    // 3. CHECK FOR EXISTING INTERVIEW
    // ========================================================

    const existingInterview =
        await findInterviewByApplicationId(
            data.applicationId
        );

    const interviewType: InterviewType =
        data.interviewType || "ONLINE";

    // ========================================================
    // 4. VALIDATE DATE
    // ========================================================

    if (!isValidDate(data.interviewDate)) {
        throw new InterviewServiceError(
            "Invalid interview date.",
            400
        );
    }

    // ========================================================
    // 5. VALIDATE TIME
    // ========================================================

    if (!isValidTime(data.interviewTime)) {
        throw new InterviewServiceError(
            "Invalid interview time.",
            400
        );
    }

    // ========================================================
    // 6. RESOLVE MEETING LINK / PHYSICAL LOCATION
    // ========================================================

    let finalMeetingLink: string | null = null;
    let finalPhysicalLocation: string | null = null;

    if (interviewType === "ONLINE") {
        if (
            !data.meetingLink ||
            !data.meetingLink.trim()
        ) {
            throw new InterviewServiceError(
                "A meeting link is required for online interviews.",
                400
            );
        }

        finalMeetingLink =
            data.meetingLink.trim();

        finalPhysicalLocation = null;
    } else {
        // Explicit location entered by HR wins.
        // Otherwise company_settings.address is used.
        finalPhysicalLocation =
            await resolveOfflineLocation(
                data.physicalLocation
            );

        finalMeetingLink = null;
    }

    // ========================================================
    // 7. EXISTING INTERVIEW
    // ========================================================

    if (existingInterview) {
        await updateInterview(
            existingInterview.id,
            {
                interviewDate:
                    data.interviewDate,

                interviewTime:
                    data.interviewTime,

                interviewType,

                meetingLink:
                    finalMeetingLink,

                physicalLocation:
                    finalPhysicalLocation,

                notes:
                    data.notes?.trim() || null,
            }
        );

        const updatedAppointment =
            await findInterviewByApplicationId(
                data.applicationId
            );

        await notifyCandidateInterviewScheduled(
            application.candidate_id,
            application.application_id,
            application.project_title,
            data.interviewDate,
            data.interviewTime,
            interviewType,
            finalMeetingLink,
            finalPhysicalLocation
        );

        try {
            await notifyHRInterviewEvent(
                application.candidate_name,
                application.project_title,
                application.application_id,
                "SCHEDULED",
                data.interviewDate,
                data.interviewTime
            );
        } catch (hrNotifErr) {
            console.error(
                "Failed to notify HR interview scheduled:",
                hrNotifErr
            );
        }

        return {
            appointmentId:
                existingInterview.id,

            applicationId:
                data.applicationId,

            status:
                existingInterview.status,

            applicationStatus:
                application.application_status,

            appointment:
                updatedAppointment,
        };
    }

    // ========================================================
    // 8. DATABASE CONNECTION
    // ========================================================

    const connection =
        await db.getConnection();

    try {
        await connection.beginTransaction();

        // ====================================================
        // 9. RECHECK APPLICATION STATUS
        // ====================================================

        const [currentAppRows] =
            await connection.execute(
                `
                SELECT status
                FROM applications
                WHERE id = ?
                LIMIT 1
                `,
                [data.applicationId]
            );

        if (
            !Array.isArray(currentAppRows) ||
            currentAppRows.length === 0
        ) {
            throw new InterviewServiceError(
                "Application no longer exists.",
                404
            );
        }

        const currentStatus =
            (
                currentAppRows[0] as {
                    status: ApplicationStatus;
                }
            ).status;

        if (
            currentStatus !== "SHORTLISTED" &&
            currentStatus !==
                "INTERVIEW_SCHEDULED"
        ) {
            throw new InterviewServiceError(
                "The application is no longer available for interview scheduling.",
                409
            );
        }

        // ====================================================
        // 10. INSERT APPOINTMENT
        // ====================================================

        const appointmentId =
            await createInterview(
                connection,
                {
                    applicationId:
                        data.applicationId,

                    interviewDate:
                        data.interviewDate,

                    interviewTime:
                        data.interviewTime,

                    interviewType,

                    meetingLink:
                        finalMeetingLink,

                    physicalLocation:
                        finalPhysicalLocation,

                    notes:
                        data.notes?.trim() || null,

                    createdBy:
                        data.createdBy,
                }
            );

        // ====================================================
        // 11. UPDATE APPLICATION STATUS
        // ====================================================

        if (
            currentStatus === "SHORTLISTED"
        ) {
            const [updateResult] =
                await connection.execute(
                    `
                    UPDATE applications
                    SET
                        status = 'INTERVIEW_SCHEDULED',
                        updated_at = CURRENT_TIMESTAMP(3)
                    WHERE
                        id = ?
                        AND status = 'SHORTLISTED'
                    `,
                    [data.applicationId]
                );

            const affectedRows =
                (
                    updateResult as {
                        affectedRows: number;
                    }
                ).affectedRows;

            if (affectedRows !== 1) {
                throw new InterviewServiceError(
                    "The application status could not be changed to INTERVIEW_SCHEDULED.",
                    409
                );
            }

            // =================================================
            // 12. INSERT STATUS HISTORY
            // =================================================

            await connection.execute(
                `
                INSERT INTO application_status_history
                (
                    application_id,
                    old_status,
                    new_status,
                    changed_by,
                    decision_note
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    data.applicationId,
                    "SHORTLISTED",
                    "INTERVIEW_SCHEDULED",
                    data.createdBy,
                    data.notes?.trim() ||
                        "Interview scheduled",
                ]
            );
        }

        // ====================================================
        // 13. COMMIT
        // ====================================================

        await connection.commit();

        // ====================================================
        // 14. FETCH CREATED APPOINTMENT
        // ====================================================

        const createdAppointment =
            await findInterviewByApplicationId(
                data.applicationId
            );

        // ====================================================
        // 15. NOTIFY CANDIDATE
        // ====================================================

        await notifyCandidateInterviewScheduled(
            application.candidate_id,
            application.application_id,
            application.project_title,
            data.interviewDate,
            data.interviewTime,
            interviewType,
            finalMeetingLink,
            finalPhysicalLocation
        );

        // ====================================================
        // 16. NOTIFY HR
        // ====================================================

        try {
            await notifyHRInterviewEvent(
                application.candidate_name,
                application.project_title,
                application.application_id,
                "SCHEDULED",
                data.interviewDate,
                data.interviewTime
            );
        } catch (hrNotifErr) {
            console.error(
                "Failed to notify HR interview scheduled:",
                hrNotifErr
            );
        }

        // ====================================================
        // 17. RETURN RESULT
        // ====================================================

        return {
            appointmentId,

            applicationId:
                data.applicationId,

            status:
                "SCHEDULED" as const,

            applicationStatus:
                "INTERVIEW_SCHEDULED" as const,

            appointment:
                createdAppointment,
        };
    } catch (error) {
        await connection.rollback();

        throw error;
    } finally {
        connection.release();
    }
}

// ============================================================
// MODIFY INTERVIEW BY APPOINTMENT ID
// ============================================================

export async function modifyInterview(
    appointmentId: number,
    data: UpdateInterviewInput
) {
    // ========================================================
    // 1. FIND EXISTING INTERVIEW
    // ========================================================

    const existingInterview =
        await findInterviewById(
            appointmentId
        );

    if (!existingInterview) {
        throw new InterviewServiceError(
            "Interview not found.",
            404
        );
    }

    // ========================================================
    // 2. VALIDATE DATE
    // ========================================================

    if (
        data.interviewDate !== undefined &&
        !isValidDate(data.interviewDate)
    ) {
        throw new InterviewServiceError(
            "Invalid interview date.",
            400
        );
    }

    // ========================================================
    // 3. VALIDATE TIME
    // ========================================================

    if (
        data.interviewTime !== undefined &&
        !isValidTime(data.interviewTime)
    ) {
        throw new InterviewServiceError(
            "Invalid interview time.",
            400
        );
    }

    // ========================================================
    // 4. DETERMINE TARGET INTERVIEW TYPE
    // ========================================================

    const targetType: InterviewType =
        data.interviewType !== undefined
            ? data.interviewType
            : existingInterview.interview_type;

    // ========================================================
    // 5. RESOLVE MEETING LINK
    // ========================================================

    let finalMeetingLink: string | null =
        data.meetingLink !== undefined
            ? data.meetingLink?.trim() || null
            : existingInterview.meeting_link;

    // ========================================================
    // 6. RESOLVE PHYSICAL LOCATION
    // ========================================================
    //
    // OFFLINE priority:
    //
    // 1. Explicit location supplied by HR
    // 2. Existing interview location
    // 3. company_settings.address
    //
    // This is the key fix.
    // ========================================================

    let finalPhysicalLocation: string | null;

    if (
        data.physicalLocation !== undefined
    ) {
        finalPhysicalLocation =
            data.physicalLocation?.trim() ||
            null;
    } else {
        finalPhysicalLocation =
            existingInterview.physical_location
                ?.trim() || null;
    }

    // ========================================================
    // 7. ONLINE INTERVIEW
    // ========================================================

    if (targetType === "ONLINE") {
        if (
            !finalMeetingLink ||
            !finalMeetingLink.trim()
        ) {
            throw new InterviewServiceError(
                "A meeting link is required for online interviews.",
                400
            );
        }

        finalMeetingLink =
            finalMeetingLink.trim();

        finalPhysicalLocation = null;
    }

    // ========================================================
    // 8. OFFLINE INTERVIEW
    // ========================================================

    else {
        if (
            !finalPhysicalLocation ||
            !finalPhysicalLocation.trim()
        ) {
            finalPhysicalLocation =
                await resolveOfflineLocation(
                    null
                );
        } else {
            finalPhysicalLocation =
                finalPhysicalLocation.trim();
        }

        finalMeetingLink = null;
    }

    // ========================================================
    // 9. UPDATE INTERVIEW
    // ========================================================

    await updateInterview(
        appointmentId,
        {
            ...data,

            interviewType:
                targetType,

            meetingLink:
                finalMeetingLink,

            physicalLocation:
                finalPhysicalLocation,
        }
    );

    // ========================================================
    // 10. FETCH UPDATED INTERVIEW
    // ========================================================

    const updated =
        await findInterviewById(
            appointmentId
        );

    if (!updated) {
        throw new InterviewServiceError(
            "Interview could not be retrieved after update.",
            500
        );
    }

    // ========================================================
    // 11. NOTIFY CANDIDATE / HR
    // ========================================================

    const application =
        await findApplicationForInterview(
            updated.application_id
        );

    if (application) {
        await notifyCandidateInterviewUpdated(
            application.candidate_id,
            application.application_id,
            application.project_title,
            updated.status,
            updated.interview_date,
            updated.interview_time
        );

        try {
            const eventType =
                updated.status === "CANCELLED"
                    ? "CANCELLED"
                    : "UPDATED";

            await notifyHRInterviewEvent(
                application.candidate_name,
                application.project_title,
                application.application_id,
                eventType,
                updated.interview_date,
                updated.interview_time
            );
        } catch (hrNotifErr) {
            console.error(
                "Failed to notify HR interview updated:",
                hrNotifErr
            );
        }
    }

    // ========================================================
    // 12. RETURN UPDATED INTERVIEW
    // ========================================================

    return updated;
}

// ============================================================
// MODIFY INTERVIEW BY APPLICATION ID
// ============================================================

export async function modifyInterviewForApplication(
    applicationId: number,
    data: UpdateInterviewInput
) {
    const existingInterview =
        await findInterviewByApplicationId(
            applicationId
        );

    if (!existingInterview) {
        throw new InterviewServiceError(
            "No interview appointment found for this application.",
            404
        );
    }

    return await modifyInterview(
        existingInterview.id,
        data
    );
}

// ============================================================
// GET ALL INTERVIEWS
// ============================================================

export async function getAllInterviews() {
    return await findAllInterviews();
}

// ============================================================
// GET ONE INTERVIEW BY APPOINTMENT ID
// ============================================================

export async function getInterview(
    appointmentId: number
) {
    const interview =
        await findInterviewById(
            appointmentId
        );

    if (!interview) {
        throw new InterviewServiceError(
            "Interview not found.",
            404
        );
    }

    return interview;
}

// ============================================================
// GET INTERVIEW FOR APPLICATION
// ============================================================
//
// Returns:
// - application
// - existing interview
// - company_settings.address as the default location
//
// The frontend can therefore use ONE interview API request.
// ============================================================

export async function getInterviewForApplication(
    applicationId: number
) {
    if (
        !Number.isInteger(applicationId) ||
        applicationId <= 0
    ) {
        throw new InterviewServiceError(
            "Invalid application ID.",
            400
        );
    }

    const application =
        await findApplicationForInterview(
            applicationId
        );

    if (!application) {
        throw new InterviewServiceError(
            "Application not found.",
            404
        );
    }

    const interview =
        await findInterviewByApplicationId(
            applicationId
        );

    const defaultPhysicalLocation =
        await findCompanyPhysicalAddress();

    return {
        application,
        interview,
        defaultPhysicalLocation,
    };
}

// ============================================================
// GET CANDIDATE INTERVIEWS
// ============================================================

export async function getCandidateInterviews(
    userId: number
) {
    if (
        !Number.isInteger(userId) ||
        userId <= 0
    ) {
        throw new InterviewServiceError(
            "Invalid candidate user ID.",
            400
        );
    }

    return await findCandidateInterviews(
        userId
    );
}