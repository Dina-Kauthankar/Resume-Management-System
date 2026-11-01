import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import { findUserById, updateCandidateProfile } from "@/server/repositories/userRepository";
import {
    CandidateProfileError,
    changeCandidatePassword,
} from "@/server/services/candidateProfileService";

export const runtime = "nodejs";

// ============================================================
// GET /api/candidate/profile
// ============================================================

export async function GET() {
    try {
        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authenticated." },
                { status: 401 }
            );
        }

        if (session.role !== "CANDIDATE") {
            return NextResponse.json(
                { success: false, error: "Only candidates can access this profile." },
                { status: 403 }
            );
        }

        const user = await findUserById(session.userId);

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Candidate not found." },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                profile: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    applicantType: user.applicant_type,
                    phone: user.phone,
                    collegeDetails: user.college_details,
                    createdAt: user.created_at,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/candidate/profile error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error." },
            { status: 500 }
        );
    }
}

// ============================================================
// POST /api/candidate/profile
// Supports password change for authenticated candidate
// ============================================================

export async function POST(request: Request) {
    try {
        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authenticated." },
                { status: 401 }
            );
        }

        if (session.role !== "CANDIDATE") {
            return NextResponse.json(
                { success: false, error: "Only candidates can perform this operation." },
                { status: 403 }
            );
        }

        let body: {
            currentPassword?: unknown;
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

        const result = await changeCandidatePassword({
            candidateId: session.userId,
            currentPassword: body.currentPassword,
            newPassword: body.newPassword,
            confirmPassword: body.confirmPassword,
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        if (error instanceof CandidateProfileError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        console.error("POST /api/candidate/profile error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error." },
            { status: 500 }
        );
    }
}

// ============================================================
// PATCH /api/candidate/profile
// Candidate can update:
// 1. Password (when currentPassword/newPassword/confirmPassword is sent)
// 2. Personal profile details (fullName, phone, collegeDetails)
// Role/ApplicantType cannot be directly modified here.
// ============================================================

export async function PATCH(request: Request) {
    try {
        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authenticated." },
                { status: 401 }
            );
        }

        if (session.role !== "CANDIDATE") {
            return NextResponse.json(
                { success: false, error: "Only candidates can update their profile." },
                { status: 403 }
            );
        }

        let body: {
            fullName?: unknown;
            phone?: unknown;
            collegeDetails?: unknown;
            currentPassword?: unknown;
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

        // If request is for password change, route to changeCandidatePassword
        if (
            body.currentPassword !== undefined ||
            body.newPassword !== undefined ||
            body.confirmPassword !== undefined
        ) {
            const result = await changeCandidatePassword({
                candidateId: session.userId,
                currentPassword: body.currentPassword,
                newPassword: body.newPassword,
                confirmPassword: body.confirmPassword,
            });

            return NextResponse.json(result, { status: 200 });
        }

        const fullName =
            typeof body.fullName === "string" ? body.fullName.trim() : "";

        const phone =
            typeof body.phone === "string" ? body.phone.trim() : null;

        const collegeDetails =
            typeof body.collegeDetails === "string" ? body.collegeDetails.trim() : null;

        if (!fullName) {
            return NextResponse.json(
                { success: false, error: "Full name is required." },
                { status: 400 }
            );
        }

        await updateCandidateProfile(session.userId, {
            fullName,
            phone,
            collegeDetails,
        });

        const updatedUser = await findUserById(session.userId);

        if (!updatedUser) {
            return NextResponse.json(
                { success: false, error: "Candidate not found after update." },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Profile updated successfully.",
                profile: {
                    id: updatedUser.id,
                    fullName: updatedUser.full_name,
                    email: updatedUser.email,
                    applicantType: updatedUser.applicant_type,
                    phone: updatedUser.phone,
                    collegeDetails: updatedUser.college_details,
                    createdAt: updatedUser.created_at,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        if (error instanceof CandidateProfileError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        console.error("PATCH /api/candidate/profile error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error." },
            { status: 500 }
        );
    }
}