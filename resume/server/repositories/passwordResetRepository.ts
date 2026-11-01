import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "@/server/database/connection";

export interface PasswordResetTokenRecord {
    id: number;
    user_id: number;
    otp_hash: string;
    expires_at: string;
    attempts: number;
    is_used: number;
    reset_token_hash: string | null;
    created_at: string;
}

export async function invalidateActiveTokensForUser(userId: number): Promise<void> {
    await db.execute(
        `
        UPDATE password_reset_tokens
        SET is_used = 1
        WHERE user_id = ? AND is_used = 0
        `,
        [userId]
    );
}

export async function createPasswordResetRecord(
    userId: number,
    otpHash: string,
    expiresAt: Date
): Promise<number> {
    await invalidateActiveTokensForUser(userId);

    const [result] = await db.execute<ResultSetHeader>(
        `
        INSERT INTO password_reset_tokens (user_id, otp_hash, expires_at, attempts, is_used)
        VALUES (?, ?, ?, 0, 0)
        `,
        [userId, otpHash, expiresAt]
    );

    return result.insertId;
}

export async function findLatestActiveTokenForUser(
    userId: number
): Promise<PasswordResetTokenRecord | null> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            id,
            user_id,
            otp_hash,
            expires_at,
            attempts,
            is_used,
            reset_token_hash,
            created_at
        FROM password_reset_tokens
        WHERE user_id = ? AND is_used = 0 AND expires_at > NOW(3)
        ORDER BY id DESC
        LIMIT 1
        `,
        [userId]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0] as PasswordResetTokenRecord;
}

export async function incrementTokenAttempts(tokenId: number): Promise<number> {
    await db.execute(
        `
        UPDATE password_reset_tokens
        SET attempts = attempts + 1
        WHERE id = ?
        `,
        [tokenId]
    );

    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT attempts FROM password_reset_tokens WHERE id = ? LIMIT 1
        `,
        [tokenId]
    );

    if (rows.length === 0) {
        return 0;
    }

    return (rows[0] as { attempts: number }).attempts;
}

export async function storeResetAuthorizationToken(
    tokenId: number,
    resetTokenHash: string
): Promise<void> {
    await db.execute(
        `
        UPDATE password_reset_tokens
        SET reset_token_hash = ?
        WHERE id = ?
        `,
        [resetTokenHash, tokenId]
    );
}

export async function findTokenByResetAuthHash(
    resetTokenHash: string
): Promise<PasswordResetTokenRecord | null> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            id,
            user_id,
            otp_hash,
            expires_at,
            attempts,
            is_used,
            reset_token_hash,
            created_at
        FROM password_reset_tokens
        WHERE reset_token_hash = ? AND is_used = 0 AND expires_at > NOW(3)
        LIMIT 1
        `,
        [resetTokenHash]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0] as PasswordResetTokenRecord;
}

export async function markTokenAsUsed(tokenId: number): Promise<void> {
    await db.execute(
        `
        UPDATE password_reset_tokens
        SET is_used = 1, reset_token_hash = NULL
        WHERE id = ?
        `,
        [tokenId]
    );
}
