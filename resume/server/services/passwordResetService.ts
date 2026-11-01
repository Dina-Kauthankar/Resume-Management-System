import crypto from "crypto";
import { findUserByEmail, updateUserPassword } from "@/server/repositories/userRepository";
import {
    createPasswordResetRecord,
    findLatestActiveTokenForUser,
    findTokenByResetAuthHash,
    incrementTokenAttempts,
    markTokenAsUsed,
    storeResetAuthorizationToken,
} from "@/server/repositories/passwordResetRepository";
import { sendPasswordResetOTPEmail } from "./emailService";
import { hashPassword } from "@/server/auth";

export class PasswordResetError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 400) {
        super(message);
        this.name = "PasswordResetError";
        this.statusCode = statusCode;
    }
}

function hashValue(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex");
}

export async function requestPasswordResetOTP(email: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw new PasswordResetError("Please provide a valid email address.", 400);
    }

    const user = await findUserByEmail(normalizedEmail);

    if (user) {
        // Generate cryptographically secure 6-digit OTP
        const rawOTP = crypto.randomInt(100000, 1000000).toString();
        const otpHash = hashValue(rawOTP);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await createPasswordResetRecord(user.id, otpHash, expiresAt);

        // Send via Nodemailer + SMTP
        await sendPasswordResetOTPEmail(user.email, rawOTP);
    }

    // Generic safe response to prevent email enumeration
    return {
        success: true,
        message: "If an account exists for this email, an OTP has been sent.",
    };
}

export async function verifyPasswordResetOTP(
    email: string,
    otp: string
): Promise<{ success: boolean; resetToken: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const cleanOTP = otp.trim();

    if (!normalizedEmail || !cleanOTP) {
        throw new PasswordResetError("Email and OTP are required.", 400);
    }

    if (!/^\d{6}$/.test(cleanOTP)) {
        throw new PasswordResetError("OTP must be a 6-digit code.", 400);
    }

    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
        throw new PasswordResetError("Invalid or expired OTP.", 400);
    }

    const activeToken = await findLatestActiveTokenForUser(user.id);

    if (!activeToken) {
        throw new PasswordResetError("No active OTP request found or OTP has expired.", 400);
    }

    if (activeToken.attempts >= 5) {
        await markTokenAsUsed(activeToken.id);
        throw new PasswordResetError("Maximum verification attempts exceeded. Please request a new OTP.", 400);
    }

    const inputHash = hashValue(cleanOTP);

    if (inputHash !== activeToken.otp_hash) {
        const attempts = await incrementTokenAttempts(activeToken.id);
        const remainingAttempts = Math.max(0, 5 - attempts);
        if (remainingAttempts === 0) {
            await markTokenAsUsed(activeToken.id);
            throw new PasswordResetError("Invalid OTP. Maximum attempts reached. Please request a new OTP.", 400);
        }
        throw new PasswordResetError(`Invalid OTP. You have ${remainingAttempts} attempts remaining.`, 400);
    }

    // Generate secure temporary single-use reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = hashValue(resetToken);

    await storeResetAuthorizationToken(activeToken.id, resetTokenHash);

    return {
        success: true,
        resetToken,
    };
}

export async function resetPasswordWithToken(
    resetToken: string,
    newPassword: string,
    confirmPassword: string
): Promise<{ success: boolean; message: string }> {
    if (!resetToken || typeof resetToken !== "string") {
        throw new PasswordResetError("Password reset authorization token is missing.", 400);
    }

    if (!newPassword || typeof newPassword !== "string") {
        throw new PasswordResetError("New password is required.", 400);
    }

    if (newPassword.length < 6) {
        throw new PasswordResetError("Password must be at least 6 characters long.", 400);
    }

    if (newPassword !== confirmPassword) {
        throw new PasswordResetError("Password confirmation does not match.", 400);
    }

    const resetTokenHash = hashValue(resetToken);
    const tokenRecord = await findTokenByResetAuthHash(resetTokenHash);

    if (!tokenRecord) {
        throw new PasswordResetError("Invalid or expired password reset session. Please request a new OTP.", 400);
    }

    // Hash password with existing bcryptjs mechanism
    const hashedPassword = await hashPassword(newPassword);

    await updateUserPassword(tokenRecord.user_id, hashedPassword);

    // Consume reset authorization token immediately
    await markTokenAsUsed(tokenRecord.id);

    return {
        success: true,
        message: "Password changed successfully. Please log in with your new password.",
    };
}
