import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "@/server/database/connection";
import { ApplicantType } from "@/server/auth";

export type JobChangeStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface JobChangeRequestRecord {
    id: number;
    user_id: number;
    current_type: ApplicantType;
    requested_type: ApplicantType;
    status: JobChangeStatus;
    reviewed_by: number | null;
    reviewed_at: string | null;
    decision_note: string | null;
    created_at: string;
    updated_at: string;
    candidate_name?: string;
    candidate_email?: string;
    reviewer_name?: string | null;
}

export async function createJobChangeRequest(data: {
    userId: number;
    currentType: ApplicantType;
    requestedType: ApplicantType;
}): Promise<number> {
    const [result] = await db.execute<ResultSetHeader>(
        `
        INSERT INTO job_change_requests
        (user_id, current_type, requested_type, status, created_at, updated_at)
        VALUES (?, ?, ?, 'PENDING', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
        `,
        [data.userId, data.currentType, data.requestedType]
    );

    return result.insertId;
}

export async function findLatestRequestByCandidate(
    userId: number
): Promise<JobChangeRequestRecord | null> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            id,
            user_id,
            current_type,
            requested_type,
            status,
            reviewed_by,
            reviewed_at,
            decision_note,
            created_at,
            updated_at
        FROM job_change_requests
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 1
        `,
        [userId]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0] as JobChangeRequestRecord;
}

export async function findJobChangeRequestById(
    requestId: number
): Promise<JobChangeRequestRecord | null> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            j.id,
            j.user_id,
            j.current_type,
            j.requested_type,
            j.status,
            j.reviewed_by,
            j.reviewed_at,
            j.decision_note,
            j.created_at,
            j.updated_at,
            u.full_name AS candidate_name,
            u.email AS candidate_email,
            r.full_name AS reviewer_name
        FROM job_change_requests AS j
        INNER JOIN users AS u ON j.user_id = u.id
        LEFT JOIN users AS r ON j.reviewed_by = r.id
        WHERE j.id = ?
        LIMIT 1
        `,
        [requestId]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0] as JobChangeRequestRecord;
}

export async function findAllJobChangeRequests(): Promise<JobChangeRequestRecord[]> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            j.id,
            j.user_id,
            j.current_type,
            j.requested_type,
            j.status,
            j.reviewed_by,
            j.reviewed_at,
            j.decision_note,
            j.created_at,
            j.updated_at,
            u.full_name AS candidate_name,
            u.email AS candidate_email,
            r.full_name AS reviewer_name
        FROM job_change_requests AS j
        INNER JOIN users AS u ON j.user_id = u.id
        LEFT JOIN users AS r ON j.reviewed_by = r.id
        ORDER BY
            CASE WHEN j.status = 'PENDING' THEN 1 ELSE 2 END,
            j.created_at DESC
        `
    );

    return rows as JobChangeRequestRecord[];
}

export async function approveJobChangeRequest(
    requestId: number,
    reviewedBy: number,
    decisionNote: string | null = null
): Promise<{ success: boolean; candidateId: number; newType: ApplicantType }> {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [requestRows] = await connection.execute<RowDataPacket[]>(
            `
            SELECT id, user_id, requested_type, status
            FROM job_change_requests
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
            `,
            [requestId]
        );

        if (requestRows.length === 0) {
            throw new Error("Job change request not found.");
        }

        const request = requestRows[0] as {
            id: number;
            user_id: number;
            requested_type: ApplicantType;
            status: JobChangeStatus;
        };

        if (request.status !== "PENDING") {
            throw new Error(`Request has already been ${request.status.toLowerCase()}.`);
        }

        // 1. Update job change request
        await connection.execute(
            `
            UPDATE job_change_requests
            SET
                status = 'APPROVED',
                reviewed_by = ?,
                reviewed_at = CURRENT_TIMESTAMP(3),
                decision_note = ?,
                updated_at = CURRENT_TIMESTAMP(3)
            WHERE id = ?
            `,
            [reviewedBy, decisionNote, requestId]
        );

        // 2. Update user's applicant_type in users table
        // Historical applications.applicant_type is intentionally preserved
        await connection.execute(
            `
            UPDATE users
            SET applicant_type = ?, updated_at = CURRENT_TIMESTAMP(3)
            WHERE id = ?
            `,
            [request.requested_type, request.user_id]
        );

        await connection.commit();

        return {
            success: true,
            candidateId: request.user_id,
            newType: request.requested_type,
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function rejectJobChangeRequest(
    requestId: number,
    reviewedBy: number,
    decisionNote: string | null = null
): Promise<{ success: boolean; candidateId: number; currentType: ApplicantType }> {
    const [requestRows] = await db.execute<RowDataPacket[]>(
        `
        SELECT id, user_id, current_type, status
        FROM job_change_requests
        WHERE id = ?
        LIMIT 1
        `,
        [requestId]
    );

    if (requestRows.length === 0) {
        throw new Error("Job change request not found.");
    }

    const request = requestRows[0] as {
        id: number;
        user_id: number;
        current_type: ApplicantType;
        status: JobChangeStatus;
    };

    if (request.status !== "PENDING") {
        throw new Error(`Request has already been ${request.status.toLowerCase()}.`);
    }

    await db.execute(
        `
        UPDATE job_change_requests
        SET
            status = 'REJECTED',
            reviewed_by = ?,
            reviewed_at = CURRENT_TIMESTAMP(3),
            decision_note = ?,
            updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
        `,
        [reviewedBy, decisionNote, requestId]
    );

    return {
        success: true,
        candidateId: request.user_id,
        currentType: request.current_type,
    };
}
