import { comparePassword, hashPassword } from "@/server/auth";
import {
    findUserById,
    findUserPasswordHashById,
    updateUserPassword,
} from "@/server/repositories/userRepository";

export class CandidateProfileError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 400) {
        super(message);
        this.name = "CandidateProfileError";
        this.statusCode = statusCode;
    }
}

export interface ChangeCandidatePasswordInput {
    candidateId: number;
    currentPassword?: unknown;
    newPassword?: unknown;
    confirmPassword?: unknown;
}

export async function changeCandidatePassword(
    input: ChangeCandidatePasswordInput
): Promise<{ success: boolean; message: string }> {
    const { candidateId, currentPassword, newPassword, confirmPassword } = input;

    // 1. Verify candidate account exists and has CANDIDATE role
    const candidate = await findUserById(candidateId);
    if (!candidate) {
        throw new CandidateProfileError("Candidate account not found.", 404);
    }

    if (candidate.role !== "CANDIDATE") {
        throw new CandidateProfileError("Only candidates can perform this operation.", 403);
    }

    // 2. Validate current password presence
    if (typeof currentPassword !== "string" || currentPassword.length === 0) {
        throw new CandidateProfileError("Current password is required.", 400);
    }

    // 3. Validate new password presence
    if (typeof newPassword !== "string" || newPassword.length === 0) {
        throw new CandidateProfileError("New password is required.", 400);
    }

    // 4. Validate confirm password presence
    if (typeof confirmPassword !== "string" || confirmPassword.length === 0) {
        throw new CandidateProfileError("Password confirmation is required.", 400);
    }

    // 5. Validate new password minimum length
    if (newPassword.length < 6) {
        throw new CandidateProfileError("Password must be at least 6 characters long.", 400);
    }

    // 6. Validate confirmation match
    if (newPassword !== confirmPassword) {
        throw new CandidateProfileError("New password and confirmation password do not match.", 400);
    }

    // 7. Validate new password is not identical to current password
    if (newPassword === currentPassword) {
        throw new CandidateProfileError("New password cannot be the same as your current password.", 400);
    }

    // 8. Fetch current password hash from database
    const currentHash = await findUserPasswordHashById(candidateId);
    if (!currentHash) {
        throw new CandidateProfileError("Unable to verify current credentials.", 404);
    }

    // 9. Verify current password matches stored hash
    const isCurrentValid = await comparePassword(currentPassword, currentHash);
    if (!isCurrentValid) {
        throw new CandidateProfileError("Current password is incorrect.", 400);
    }

    // 10. Hash new password with existing bcryptjs mechanism
    const newHashedPassword = await hashPassword(newPassword);

    // 11. Update users table
    const updated = await updateUserPassword(candidateId, newHashedPassword);
    if (!updated) {
        throw new CandidateProfileError("Failed to update password. Please try again.", 500);
    }

    return {
        success: true,
        message: "Password changed successfully.",
    };
}
