import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "@/server/database/connection";

export interface NotificationRecord {
    id: number;
    recipient_user_id: number;
    type: string;
    title: string;
    message: string;
    reference_id: number | null;
    reference_type: string | null;
    is_read: number;
    created_at: string;
}

export async function createNotification(data: {
    recipientUserId: number;
    type: string;
    title: string;
    message: string;
    referenceId?: number | null;
    referenceType?: string | null;
}): Promise<number> {
    const [result] = await db.execute<ResultSetHeader>(
        `
        INSERT INTO notifications
        (recipient_user_id, type, title, message, reference_id, reference_type, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP(3))
        `,
        [
            data.recipientUserId,
            data.type,
            data.title,
            data.message,
            data.referenceId ?? null,
            data.referenceType ?? null,
        ]
    );

    return result.insertId;
}

export async function getUserNotifications(
    userId: number,
    limit: number = 30
): Promise<NotificationRecord[]> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            id,
            recipient_user_id,
            type,
            title,
            message,
            reference_id,
            reference_type,
            is_read,
            created_at
        FROM notifications
        WHERE recipient_user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT ?
        `,
        [userId, limit.toString()]
    );

    return rows as NotificationRecord[];
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT COUNT(*) AS unread_count
        FROM notifications
        WHERE recipient_user_id = ? AND is_read = 0
        `,
        [userId]
    );

    if (rows.length === 0) {
        return 0;
    }

    return Number((rows[0] as { unread_count: number }).unread_count);
}

export async function markNotificationAsRead(
    notificationId: number,
    userId: number
): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
        `
        UPDATE notifications
        SET is_read = 1
        WHERE id = ? AND recipient_user_id = ?
        `,
        [notificationId, userId]
    );

    return result.affectedRows > 0;
}

export async function markAllNotificationsAsRead(userId: number): Promise<number> {
    const [result] = await db.execute<ResultSetHeader>(
        `
        UPDATE notifications
        SET is_read = 1
        WHERE recipient_user_id = ? AND is_read = 0
        `,
        [userId]
    );

    return result.affectedRows;
}

export async function checkNotificationExists(
    recipientUserId: number,
    type: string,
    referenceId: number,
    referenceType: string
): Promise<boolean> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT id
        FROM notifications
        WHERE recipient_user_id = ? AND type = ? AND reference_id = ? AND reference_type = ?
        LIMIT 1
        `,
        [recipientUserId, type, referenceId, referenceType]
    );

    return rows.length > 0;
}

