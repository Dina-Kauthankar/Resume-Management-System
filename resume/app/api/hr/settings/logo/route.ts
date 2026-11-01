import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import {
    saveCompanyLogoService,
    SettingsValidationError,
} from "@/server/services/settingsService";

export const runtime = "nodejs";

// ============================================================
// POST /api/hr/settings/logo
// Uploads and saves company logo
// ============================================================

export async function POST(request: NextRequest) {
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
                { success: false, error: "Access denied. Only HR users can update company logo." },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const logoFile = formData.get("logo");

        if (!(logoFile instanceof File)) {
            return NextResponse.json(
                { success: false, error: "Please provide a valid logo image file." },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await logoFile.arrayBuffer());
        const logoUrl = await saveCompanyLogoService(buffer, logoFile.name, logoFile.type);

        return NextResponse.json(
            {
                success: true,
                message: "Company logo uploaded successfully.",
                logoUrl,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("POST /api/hr/settings/logo error:", error);

        if (error instanceof SettingsValidationError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "Failed to upload logo." },
            { status: 500 }
        );
    }
}
