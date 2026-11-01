import { NextRequest, NextResponse } from "next/server";
import {
    resetPasswordWithToken,
    PasswordResetError,
} from "@/server/services/passwordResetService";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        let body: {
            resetToken?: unknown;
            newPassword?: unknown;
            confirmPassword?: unknown;
        };

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: "Invalid JSON request body." },
                { status: 400 }
            );
        }

        if (typeof body.resetToken !== "string" || !body.resetToken.trim()) {
            return NextResponse.json(
                { success: false, error: "Password reset token is required." },
                { status: 400 }
            );
        }

        if (typeof body.newPassword !== "string" || !body.newPassword) {
            return NextResponse.json(
                { success: false, error: "New password is required." },
                { status: 400 }
            );
        }

        if (typeof body.confirmPassword !== "string" || !body.confirmPassword) {
            return NextResponse.json(
                { success: false, error: "Password confirmation is required." },
                { status: 400 }
            );
        }

        const result = await resetPasswordWithToken(
            body.resetToken,
            body.newPassword,
            body.confirmPassword
        );

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        if (error instanceof PasswordResetError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        console.error("Reset password error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to reset password." },
            { status: 500 }
        );
    }
}
