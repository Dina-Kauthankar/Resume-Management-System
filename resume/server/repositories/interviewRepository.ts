
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "@/server/database/connection";

// ============================================================
// TYPES
// ============================================================

export type InterviewStatus =
    | "SCHEDULED"
    | "COMPLETED"
    | "CANCELLED";

export type InterviewType =
    | "ONLINE"
    | "OFFLINE";

export type ApplicationStatus =
    | "APPLIED"
    | "SHORTLISTED"
    | "INTERVIEW_SCHEDULED"
    | "SELECTED"
    | "REJECTED";

// ============================================================
// INTERVIEW
// ============================================================

export interface Interview {
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

// ============================================================
// INTERVIEW WITH APPLICATION
// ============================================================

export interface InterviewWithApplication extends Interview {
    candidate_name: string;
    candidate_email: string;
    project_title: string;
    application_status: ApplicationStatus;
}

// ============================================================
// APPLICATION DATA FOR INTERVIEW
// ============================================================

export interface InterviewApplicationData {
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

// ============================================================
// INTERVIEW APPOINTMENT
// ============================================================

export interface InterviewAppointment {
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

// ============================================================
// CANDIDATE INTERVIEW
// ============================================================

export interface CandidateInterview {
    id: number;
    application_id: number;
    interview_date: string;
    interview_time: string;
    interview_type: InterviewType;
    meeting_link: string | null;
    physical_location: string | null;
    status: InterviewStatus;
    created_at: string;
    updated_at: string;
    project_id: number;
    project_title: string;
    application_status: ApplicationStatus;
}

// ============================================================
// COMPANY SETTINGS
// ============================================================

export interface CompanySettings {
    id: number;
    company_name: string;
    company_logo: string | null;
    recruitment_email: string | null;
    phone: string | null;
    address: string | null;
    website: string | null;
    contact_message: string | null;
    office_hours: string | null;
    brand_color: string;
    allowed_formats: string;
    max_file_size_mb: number;
}

// ============================================================
// INTERNAL DATABASE ROW TYPES
// ============================================================

interface InterviewWithApplicationRow
    extends RowDataPacket,
        InterviewWithApplication {}

interface CompanySettingsRow
    extends RowDataPacket,
        CompanySettings {}

// ============================================================
// AUTO-COMPLETE PAST SCHEDULED INTERVIEWS
// ============================================================

export async function autoCompleteInterviews(): Promise<number> {
    const [result] = await db.execute<ResultSetHeader>(
        `
        UPDATE appointments
        SET
            status = 'COMPLETED',
            updated_at = CURRENT_TIMESTAMP(3)
        WHERE status = 'SCHEDULED'
          AND (
                interview_date < CURRENT_DATE()
                OR (
                    interview_date = CURRENT_DATE()
                    AND interview_time <= CURRENT_TIME()
                )
          )
        `
    );

    return result.affectedRows;
}

// ============================================================
// FIND DEFAULT COMPANY SETTINGS
// ============================================================

export async function findCompanySettings(): Promise<CompanySettings | null> {
    const [rows] = await db.execute<CompanySettingsRow[]>(
        `
        SELECT
            id,
            company_name,
            company_logo,
            recruitment_email,
            phone,
            address,
            website,
            contact_message,
            office_hours,
            brand_color,
            allowed_formats,
            max_file_size_mb
        FROM company_settings
        WHERE id = 1
        LIMIT 1
        `
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0];
}

// ============================================================
// FIND DEFAULT COMPANY PHYSICAL ADDRESS
// ============================================================

export async function findCompanyPhysicalAddress(): Promise<string | null> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            address
        FROM company_settings
        WHERE id = 1
        LIMIT 1
        `
    );

    if (rows.length === 0) {
        return null;
    }

    const address = rows[0].address;

    if (typeof address !== "string") {
        return null;
    }

    const trimmedAddress = address.trim();

    return trimmedAddress || null;
}

// ============================================================
// FIND APPLICATION FOR INTERVIEW
// ============================================================

export async function findApplicationForInterview(
    applicationId: number
): Promise<InterviewApplicationData | null> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            a.id AS application_id,
            a.status AS application_status,
            u.id AS candidate_id,
            u.full_name AS candidate_name,
            u.email AS candidate_email,
            u.phone AS candidate_phone,
            u.college_details AS candidate_college_details,
            p.id AS project_id,
            p.title AS project_title,
            p.description AS project_description,
            p.target_type AS project_target_type,
            p.status AS project_status
        FROM applications AS a
        INNER JOIN users AS u
            ON a.user_id = u.id
        INNER JOIN projects AS p
            ON a.project_id = p.id
        WHERE a.id = ?
        LIMIT 1
        `,
        [applicationId]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0] as InterviewApplicationData;
}

// ============================================================
// FIND INTERVIEW BY APPLICATION
// ============================================================

export async function findInterviewByApplicationId(
    applicationId: number
): Promise<InterviewAppointment | null> {
    await autoCompleteInterviews();

    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            id,
            application_id,
            DATE_FORMAT(interview_date, '%Y-%m-%d') AS interview_date,
            TIME_FORMAT(interview_time, '%H:%i') AS interview_time,
            interview_type,
            meeting_link,
            physical_location,
            status,
            notes,
            created_by,
            created_at,
            updated_at
        FROM appointments
        WHERE application_id = ?
        ORDER BY id DESC
        LIMIT 1
        `,
        [applicationId]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0] as InterviewAppointment;
}

// ============================================================
// FIND INTERVIEW BY ID
// ============================================================

export async function findInterviewById(
    appointmentId: number
): Promise<InterviewWithApplication | null> {
    await autoCompleteInterviews();

    const [rows] = await db.execute<InterviewWithApplicationRow[]>(
        `
        SELECT
            ap.id,
            ap.application_id,
            DATE_FORMAT(ap.interview_date, '%Y-%m-%d') AS interview_date,
            TIME_FORMAT(ap.interview_time, '%H:%i') AS interview_time,
            ap.interview_type,
            ap.meeting_link,
            ap.physical_location,
            ap.status,
            ap.notes,
            ap.created_by,
            ap.created_at,
            ap.updated_at,
            u.full_name AS candidate_name,
            u.email AS candidate_email,
            p.title AS project_title,
            a.status AS application_status
        FROM appointments AS ap
        INNER JOIN applications AS a
            ON ap.application_id = a.id
        INNER JOIN users AS u
            ON a.user_id = u.id
        INNER JOIN projects AS p
            ON a.project_id = p.id
        WHERE ap.id = ?
        LIMIT 1
        `,
        [appointmentId]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0];
}

// ============================================================
// GET ALL INTERVIEWS
// ============================================================

export async function findAllInterviews(): Promise<
    InterviewWithApplication[]
> {
    await autoCompleteInterviews();

    const [rows] = await db.execute<InterviewWithApplicationRow[]>(
        `
        SELECT
            ap.id,
            ap.application_id,
            DATE_FORMAT(ap.interview_date, '%Y-%m-%d') AS interview_date,
            TIME_FORMAT(ap.interview_time, '%H:%i') AS interview_time,
            ap.interview_type,
            ap.meeting_link,
            ap.physical_location,
            ap.status,
            ap.notes,
            ap.created_by,
            ap.created_at,
            ap.updated_at,
            u.full_name AS candidate_name,
            u.email AS candidate_email,
            p.title AS project_title,
            a.status AS application_status
        FROM appointments AS ap
        INNER JOIN applications AS a
            ON ap.application_id = a.id
        INNER JOIN users AS u
            ON a.user_id = u.id
        INNER JOIN projects AS p
            ON a.project_id = p.id
        ORDER BY
            ap.interview_date ASC,
            ap.interview_time ASC,
            ap.id ASC
        `
    );

    return rows;
}

// ============================================================
// CREATE INTERVIEW
// ============================================================

export async function createInterview(
    connection: PoolConnection,
    data: {
        applicationId: number;
        interviewDate: string;
        interviewTime: string;
        interviewType: InterviewType;
        meetingLink: string | null;
        physicalLocation: string | null;
        notes: string | null;
        createdBy: number | null;
    }
): Promise<number> {
    const [result] = await connection.execute(
        `
        INSERT INTO appointments
        (
            application_id,
            interview_date,
            interview_time,
            interview_type,
            meeting_link,
            physical_location,
            status,
            notes,
            created_by
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'SCHEDULED',
            ?,
            ?
        )
        `,
        [
            data.applicationId,
            data.interviewDate,
            data.interviewTime,
            data.interviewType,
            data.meetingLink,
            data.physicalLocation,
            data.notes,
            data.createdBy,
        ]
    );

    const insertResult = result as ResultSetHeader;

    return insertResult.insertId;
}

// ============================================================
// UPDATE INTERVIEW
// ============================================================

export async function updateInterview(
    appointmentId: number,
    data: {
        interviewDate?: string;
        interviewTime?: string;
        interviewType?: InterviewType;
        meetingLink?: string | null;
        physicalLocation?: string | null;
        status?: InterviewStatus;
        notes?: string | null;
    }
): Promise<boolean> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.interviewDate !== undefined) {
        fields.push("interview_date = ?");
        values.push(data.interviewDate);
    }

    if (data.interviewTime !== undefined) {
        fields.push("interview_time = ?");
        values.push(data.interviewTime);
    }

    if (data.interviewType !== undefined) {
        fields.push("interview_type = ?");
        values.push(data.interviewType);
    }

    if (data.meetingLink !== undefined) {
        fields.push("meeting_link = ?");
        values.push(data.meetingLink);
    }

    if (data.physicalLocation !== undefined) {
        fields.push("physical_location = ?");
        values.push(data.physicalLocation);
    }

    if (data.status !== undefined) {
        fields.push("status = ?");
        values.push(data.status);
    }

    if (data.notes !== undefined) {
        fields.push("notes = ?");
        values.push(data.notes);
    }

    if (fields.length === 0) {
        return false;
    }

    fields.push("updated_at = CURRENT_TIMESTAMP(3)");

    values.push(appointmentId);

    const [result] = await db.execute(
        `
        UPDATE appointments
        SET ${fields.join(", ")}
        WHERE id = ?
        `,
        values
    );

    const updateResult = result as ResultSetHeader;

    return updateResult.affectedRows > 0;
}

// ============================================================
// DELETE INTERVIEW
// ============================================================

export async function deleteInterview(
    appointmentId: number
): Promise<boolean> {
    const [result] = await db.execute(
        `
        DELETE FROM appointments
        WHERE id = ?
        `,
        [appointmentId]
    );

    const deleteResult = result as ResultSetHeader;

    return deleteResult.affectedRows > 0;
}

// ============================================================
// FIND CANDIDATE INTERVIEWS
// ============================================================

export async function findCandidateInterviews(
    userId: number
): Promise<CandidateInterview[]> {
    await autoCompleteInterviews();

    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            ap.id,
            ap.application_id,
            DATE_FORMAT(ap.interview_date, '%Y-%m-%d') AS interview_date,
            TIME_FORMAT(ap.interview_time, '%H:%i') AS interview_time,
            ap.interview_type,
            ap.meeting_link,
            ap.physical_location,
            ap.status,
            ap.created_at,
            ap.updated_at,
            a.project_id,
            a.status AS application_status,
            p.title AS project_title
        FROM appointments AS ap
        INNER JOIN applications AS a
            ON ap.application_id = a.id
        INNER JOIN projects AS p
            ON a.project_id = p.id
        WHERE a.user_id = ?
        ORDER BY
            ap.interview_date ASC,
            ap.interview_time ASC,
            ap.id ASC
        `,
        [userId]
    );

    return rows as CandidateInterview[];
}