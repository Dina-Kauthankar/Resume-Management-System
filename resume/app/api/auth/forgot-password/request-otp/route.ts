import { NextRequest, NextResponse } from "next/server";
import {
    requestPasswordResetOTP,
    PasswordResetError,
} from "@/server/services/passwordResetService";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        let body: { email?: unknown };

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

        const result = await requestPasswordResetOTP(body.email);

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        if (error instanceof PasswordResetError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        console.error("Forgot password request OTP error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process password reset request." },
            { status: 500 }
        );
    }
}
