import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import {
    getNotifications,
    markAllAsRead,
} from "@/server/services/notificationService";

export const runtime = "nodejs";

// GET /api/notifications -> get notifications & unread count
export async function GET(_request: NextRequest) {
    try {
        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authenticated." },
                { status: 401 }
            );
        }

        const data = await getNotifications(session.userId);

        return NextResponse.json(
            {
                success: true,
                notifications: data.notifications,
                unreadCount: data.unreadCount,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/notifications error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to retrieve notifications." },
            { status: 500 }
        );
    }
}

// PATCH /api/notifications -> mark all notifications as read
export async function PATCH(_request: NextRequest) {
    try {
        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authenticated." },
                { status: 401 }
            );
        }

        const affectedRows = await markAllAsRead(session.userId);

        return NextResponse.json(
            {
                success: true,
                message: "All notifications marked as read.",
                affectedRows,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("PATCH /api/notifications error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to mark all notifications as read." },
            { status: 500 }
        );
    }
}
