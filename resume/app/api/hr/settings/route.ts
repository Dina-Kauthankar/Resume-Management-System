import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import {
    getAllSettings,
    updateCompanyProfileService,
    updateAppearanceService,
    updateRecruitmentSettingsService,
    updateNotificationPreferencesService,
    SettingsValidationError,
} from "@/server/services/settingsService";

export const runtime = "nodejs";

// ============================================================
// GET /api/hr/settings
// Returns company settings and HR user's notification preferences
// ============================================================

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
                { success: false, error: "Access denied. Only HR users can access settings." },
                { status: 403 }
            );
        }

        const data = await getAllSettings(Number(session.userId));

        return NextResponse.json(
            {
                success: true,
                settings: data.companySettings,
                notificationPreferences: data.notificationPreferences,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("GET /api/hr/settings error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to load settings." },
            { status: 500 }
        );
    }
}

// ============================================================
// PATCH /api/hr/settings
// Updates company profile, appearance, recruitment, or notification preferences
// ============================================================

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
                { success: false, error: "Access denied. Only HR users can update settings." },
                { status: 403 }
            );
        }

        let body: any;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: "Invalid JSON request body." },
                { status: 400 }
            );
        }

        if (!body || typeof body !== "object") {
            return NextResponse.json(
                { success: false, error: "Payload must be an object." },
                { status: 400 }
            );
        }

        // 1. Company Profile
        if (body.companyProfile) {
            await updateCompanyProfileService(body.companyProfile);
        }

        // 2. Appearance
        if (body.appearance) {
            await updateAppearanceService(body.appearance);
        }

        // 3. Recruitment Settings
        if (body.recruitment) {
            await updateRecruitmentSettingsService(body.recruitment);
        }

        // 4. Notification Preferences (for the current HR user)
        if (body.notificationPreferences) {
            await updateNotificationPreferencesService(Number(session.userId), body.notificationPreferences);
        }

        // Return refreshed settings
        const refreshed = await getAllSettings(Number(session.userId));

        return NextResponse.json(
            {
                success: true,
                message: "Settings updated successfully.",
                settings: refreshed.companySettings,
                notificationPreferences: refreshed.notificationPreferences,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("PATCH /api/hr/settings error:", error);

        if (error instanceof SettingsValidationError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "Failed to update settings." },
            { status: 500 }
        );
    }
}
