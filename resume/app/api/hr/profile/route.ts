import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, hashPassword } from "@/server/auth";
import { findUserById, updateHRProfile } from "@/server/repositories/userRepository";

export const runtime = "nodejs";

// GET /api/hr/profile
export async function GET(_request: NextRequest) {
    try {
        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authenticated." },
                { status: 401 }
            );
        }

        if (session.role !== "HR") {
            return NextResponse.json(
                { success: false, error: "Only HR users can access this endpoint." },
                { status: 403 }
            );
        }

        const user = await findUserById(session.userId);

        if (!user) {
            return NextResponse.json(
                { success: false, error: "HR user profile not found." },
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
                    role: user.role,
                    companyAddress: user.company_address,
                    createdAt: user.created_at,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/hr/profile error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to retrieve HR profile." },
            { status: 500 }
        );
    }
}

// PATCH /api/hr/profile
export async function PATCH(request: NextRequest) {
    try {
        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authenticated." },
                { status: 401 }
            );
        }

        if (session.role !== "HR") {
            return NextResponse.json(
                { success: false, error: "Only HR users can update this profile." },
                { status: 403 }
            );
        }

        let body: {
            fullName?: unknown;
            email?: unknown;
            password?: unknown;
            companyAddress?: unknown;
        };

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: "Invalid JSON request body." },
                { status: 400 }
            );
        }

        const updateData: {
            fullName?: string;
            email?: string;
            password?: string;
            companyAddress?: string | null;
        } = {};

        if (typeof body.fullName === "string") {
            const name = body.fullName.trim();
            if (!name) {
                return NextResponse.json(
                    { success: false, error: "Full name cannot be empty." },
                    { status: 400 }
                );
            }
            updateData.fullName = name;
        }

        if (typeof body.email === "string") {
            const email = body.email.toLowerCase().trim();
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return NextResponse.json(
                    { success: false, error: "Please provide a valid email address." },
                    { status: 400 }
                );
            }
            updateData.email = email;
        }

        if (typeof body.password === "string" && body.password.trim()) {
            if (body.password.length < 6) {
                return NextResponse.json(
                    { success: false, error: "Password must be at least 6 characters long." },
                    { status: 400 }
                );
            }
            updateData.password = await hashPassword(body.password);
        }

        if (body.companyAddress !== undefined) {
            updateData.companyAddress =
                typeof body.companyAddress === "string"
                    ? body.companyAddress.trim() || null
                    : null;
        }

        await updateHRProfile(session.userId, updateData);

        const updatedUser = await findUserById(session.userId);

        return NextResponse.json(
            {
                success: true,
                message: "HR profile updated successfully.",
                profile: updatedUser
                    ? {
                          id: updatedUser.id,
                          fullName: updatedUser.full_name,
                          email: updatedUser.email,
                          role: updatedUser.role,
                          companyAddress: updatedUser.company_address,
                          createdAt: updatedUser.created_at,
                      }
                    : null,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("PATCH /api/hr/profile error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update HR profile." },
            { status: 500 }
        );
    }
}
