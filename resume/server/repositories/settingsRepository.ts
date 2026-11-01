import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "@/server/database/connection";

export interface CompanySettingsRecord {
    id: number;
    company_name: string;
    company_logo: string | null;
    recruitment_email: string | null;
    phone: string | null;
    address: string | null;
    website: string | null;
    contactMessage: string | null;
    office_hours: string | null;
    brand_color: string;
    allowed_formats: string;
    max_file_size_mb: number;
    created_at: string;
    updated_at: string;
}

export interface NotificationPreferencesRecord {
    id: number;
    user_id: number;
    notify_new_applications: number;
    notify_interviews: number;
    notify_selections: number;
    notify_batch_allocations: number;
    created_at: string;
    updated_at: string;
}

const DEFAULT_COMPANY_SETTINGS: Omit<CompanySettingsRecord, "created_at" | "updated_at"> = {
    id: 1,
    company_name: "Demerge Systems India",
    company_logo: "/demerg_system_india_logo.jpg",
    recruitment_email: null,
    phone: null,
    address: null,
    website: null,
    contactMessage: null,
    office_hours: "Mon - Fri, 9:00 AM - 6:00 PM",
    brand_color: "#4f46e5",
    allowed_formats: "pdf,docx,tex",
    max_file_size_mb: 5,
};

export async function getCompanySettings(): Promise<CompanySettingsRecord> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            id,
            company_name,
            company_logo,
            recruitment_email,
            phone,
            address,
            website,
            contact_message,
            office_hours,
            brand_color,
            allowed_formats,
            max_file_size_mb,
            created_at,
            updated_at
        FROM company_settings
        WHERE id = 1
        LIMIT 1
        `
    );

    if (rows.length === 0) {
        // Fallback: seed singleton if not present
        await db.execute(
            `
            INSERT INTO company_settings
            (id, company_name, company_logo, office_hours, brand_color, allowed_formats, max_file_size_mb)
            VALUES (1, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE id = 1
            `,
            [
                DEFAULT_COMPANY_SETTINGS.company_name,
                DEFAULT_COMPANY_SETTINGS.company_logo,
                DEFAULT_COMPANY_SETTINGS.office_hours,
                DEFAULT_COMPANY_SETTINGS.brand_color,
                DEFAULT_COMPANY_SETTINGS.allowed_formats,
                DEFAULT_COMPANY_SETTINGS.max_file_size_mb,
            ]
        );

        return {
            ...DEFAULT_COMPANY_SETTINGS,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    }

    return rows[0] as CompanySettingsRecord;
}

export async function updateCompanySettings(data: {
    companyName?: string;
    companyLogo?: string | null;
    recruitmentEmail?: string | null;
    phone?: string | null;
    address?: string | null;
    website?: string | null;
    contactMessage?: string | null;
    officeHours?: string | null;
    brandColor?: string;
    allowedFormats?: string;
    maxFileSizeMb?: number;
}): Promise<CompanySettingsRecord> {
    // Ensure singleton record exists first
    await getCompanySettings();

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.companyName !== undefined) {
        fields.push("company_name = ?");
        values.push(data.companyName ? data.companyName.trim() : DEFAULT_COMPANY_SETTINGS.company_name);
    }

    if (data.companyLogo !== undefined) {
        fields.push("company_logo = ?");
        values.push(data.companyLogo ? data.companyLogo.trim() : null);
    }

    if (data.recruitmentEmail !== undefined) {
        fields.push("recruitment_email = ?");
        values.push(data.recruitmentEmail ? data.recruitmentEmail.trim().toLowerCase() : null);
    }

    if (data.phone !== undefined) {
        fields.push("phone = ?");
        values.push(data.phone ? data.phone.trim() : null);
    }

    if (data.address !== undefined) {
        fields.push("address = ?");
        values.push(data.address ? data.address.trim() : null);
    }

    if (data.website !== undefined) {
        fields.push("website = ?");
        values.push(data.website ? data.website.trim() : null);
    }

    if (data.contactMessage !== undefined) {
        fields.push("contact_message = ?");
        values.push(data.contactMessage ? data.contactMessage.trim() : null);
    }

    if (data.officeHours !== undefined) {
        fields.push("office_hours = ?");
        values.push(data.officeHours ? data.officeHours.trim() : null);
    }

    if (data.brandColor !== undefined) {
        fields.push("brand_color = ?");
        values.push(data.brandColor.trim());
    }

    if (data.allowedFormats !== undefined) {
        fields.push("allowed_formats = ?");
        values.push(data.allowedFormats.trim());
    }

    if (data.maxFileSizeMb !== undefined) {
        fields.push("max_file_size_mb = ?");
        values.push(data.maxFileSizeMb);
    }

    if (fields.length > 0) {
        await db.execute<ResultSetHeader>(
            `
            UPDATE company_settings
            SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP(3)
            WHERE id = 1
            `,
            values
        );
    }

    return getCompanySettings();
}

export async function getUserNotificationPreferences(
    userId: number
): Promise<NotificationPreferencesRecord> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            id,
            user_id,
            notify_new_applications,
            notify_interviews,
            notify_selections,
            notify_batch_allocations,
            created_at,
            updated_at
        FROM notification_preferences
        WHERE user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    if (rows.length === 0) {
        // Insert default record (all enabled)
        const [result] = await db.execute<ResultSetHeader>(
            `
            INSERT INTO notification_preferences
            (user_id, notify_new_applications, notify_interviews, notify_selections, notify_batch_allocations)
            VALUES (?, 1, 1, 1, 1)
            ON DUPLICATE KEY UPDATE user_id = user_id
            `,
            [userId]
        );

        return {
            id: result.insertId || 0,
            user_id: userId,
            notify_new_applications: 1,
            notify_interviews: 1,
            notify_selections: 1,
            notify_batch_allocations: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    }

    return rows[0] as NotificationPreferencesRecord;
}

export async function updateUserNotificationPreferences(
    userId: number,
    data: {
        notifyNewApplications?: boolean | number;
        notifyInterviews?: boolean | number;
        notifySelections?: boolean | number;
        notifyBatchAllocations?: boolean | number;
    }
): Promise<NotificationPreferencesRecord> {
    // Ensure record exists
    await getUserNotificationPreferences(userId);

    const fields: string[] = [];
    const values: (number)[] = [];

    if (data.notifyNewApplications !== undefined) {
        fields.push("notify_new_applications = ?");
        values.push(data.notifyNewApplications ? 1 : 0);
    }

    if (data.notifyInterviews !== undefined) {
        fields.push("notify_interviews = ?");
        values.push(data.notifyInterviews ? 1 : 0);
    }

    if (data.notifySelections !== undefined) {
        fields.push("notify_selections = ?");
        values.push(data.notifySelections ? 1 : 0);
    }

    if (data.notifyBatchAllocations !== undefined) {
        fields.push("notify_batch_allocations = ?");
        values.push(data.notifyBatchAllocations ? 1 : 0);
    }

    if (fields.length > 0) {
        await db.execute<ResultSetHeader>(
            `
            UPDATE notification_preferences
            SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP(3)
            WHERE user_id = ?
            `,
            [...values, userId]
        );
    }

    return getUserNotificationPreferences(userId);
}
