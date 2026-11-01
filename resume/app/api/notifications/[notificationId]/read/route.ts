import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import { markAsRead } from "@/server/services/notificationService";

export const runtime = "nodejs";

export async function PATCH(
    _request: NextRequest,
    context: {
        params: Promise<{
            notificationId: string;
        }>;
    }
) {
    try {
        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authenticated." },
                { status: 401 }
            );
        }

        const { notificationId: notificationIdParam } = await context.params;
        const notificationId = Number(notificationIdParam);

        if (!Number.isInteger(notificationId) || notificationId <= 0) {
            return NextResponse.json(
                { success: false, error: "Invalid notification ID." },
                { status: 400 }
            );
        }

        const updated = await markAsRead(notificationId, session.userId);

        return NextResponse.json(
            {
                success: true,
                updated,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Mark notification as read error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update notification." },
            { status: 500 }
        );
    }
}
