import { NextRequest, NextResponse } from "next/server";
import {
    verifyPasswordResetOTP,
    PasswordResetError,
} from "@/server/services/passwordResetService";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        let body: { email?: unknown; otp?: unknown };

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: "Invalid JSON request body." },
                { status: 400 }
            );
        }

        if (typeof body.email !== "string" || !body.email.trim()) {
            return NextResponse.json(
                { success: false, error: "Email address is required." },
                { status: 400 }
            );
        }

        if (typeof body.otp !== "string" || !body.otp.trim()) {
            return NextResponse.json(
                { success: false, error: "OTP is required." },
                { status: 400 }
            );
        }

        const result = await verifyPasswordResetOTP(body.email, body.otp);

        return NextResponse.json(
            {
                success: true,
                message: "OTP verified successfully.",
                resetToken: result.resetToken,
            },
            { status: 200 }
        );
    } catch (error) {
        if (error instanceof PasswordResetError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        console.error("Forgot password verify OTP error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to verify OTP." },
            { status: 500 }
        );
    }
}
