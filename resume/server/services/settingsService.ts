import fs from "fs/promises";
import path from "path";
import {
    getCompanySettings,
    updateCompanySettings,
    getUserNotificationPreferences,
    updateUserNotificationPreferences,
    CompanySettingsRecord,
    NotificationPreferencesRecord,
} from "@/server/repositories/settingsRepository";

export class SettingsValidationError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number = 400) {
        super(message);
        this.name = "SettingsValidationError";
        this.statusCode = statusCode;
    }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const SAFE_RESUME_FORMATS = ["pdf", "docx", "tex"];

export async function getAllSettings(userId: number): Promise<{
    companySettings: CompanySettingsRecord;
    notificationPreferences: NotificationPreferencesRecord;
}> {
    const [companySettings, notificationPreferences] = await Promise.all([
        getCompanySettings(),
        getUserNotificationPreferences(userId),
    ]);

    return {
        companySettings,
        notificationPreferences,
    };
}

export async function updateCompanyProfileService(data: {
    companyName: string;
    recruitmentEmail?: string | null;
    phone?: string | null;
    address?: string | null;
    website?: string | null;
    contactMessage?: string | null;
    officeHours?: string | null;
}): Promise<CompanySettingsRecord> {
    if (!data.companyName || !data.companyName.trim()) {
        throw new SettingsValidationError("Company name is required.");
    }

    if (data.companyName.trim().length > 190) {
        throw new SettingsValidationError("Company name must be under 190 characters.");
    }

    if (data.recruitmentEmail && data.recruitmentEmail.trim()) {
        if (!EMAIL_REGEX.test(data.recruitmentEmail.trim())) {
            throw new SettingsValidationError("Please provide a valid recruitment email address.");
        }
    }

    let normalizedWebsite: string | null = null;
    if (data.website && data.website.trim()) {
        let trimmedUrl = data.website.trim();
        if (!/^https?:\/\//i.test(trimmedUrl)) {
            trimmedUrl = `https://${trimmedUrl}`;
        }
        try {
            const parsed = new URL(trimmedUrl);
            if (!["http:", "https:"].includes(parsed.protocol)) {
                throw new Error();
            }
            normalizedWebsite = parsed.toString();
        } catch {
            throw new SettingsValidationError("Please provide a valid website URL.");
        }
    }

    if (data.phone && data.phone.trim().length > 50) {
        throw new SettingsValidationError("Phone number must not exceed 50 characters.");
    }

    return updateCompanySettings({
        companyName: data.companyName.trim(),
        recruitmentEmail: data.recruitmentEmail?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        website: normalizedWebsite,
        contactMessage: data.contactMessage?.trim() || null,
        officeHours: data.officeHours?.trim() || null,
    });
}

export async function updateAppearanceService(data: {
    brandColor: string;
}): Promise<CompanySettingsRecord> {
    if (!data.brandColor || !HEX_COLOR_REGEX.test(data.brandColor.trim())) {
        throw new SettingsValidationError("Please provide a valid HEX color code (e.g. #4f46e5).");
    }

    return updateCompanySettings({
        brandColor: data.brandColor.trim().toLowerCase(),
    });
}

export async function updateRecruitmentSettingsService(data: {
    allowedFormats: string[] | string;
    maxFileSizeMb: number;
}): Promise<CompanySettingsRecord> {
    let formatsArray: string[];
    if (Array.isArray(data.allowedFormats)) {
        formatsArray = data.allowedFormats.map((f) => f.toLowerCase().replace(/^\./, "").trim());
    } else if (typeof data.allowedFormats === "string") {
        formatsArray = data.allowedFormats
            .split(/[,;\s]+/)
            .map((f) => f.toLowerCase().replace(/^\./, "").trim())
            .filter(Boolean);
    } else {
        formatsArray = [];
    }

    // Filter against safe whitelist
    const validatedFormats = formatsArray.filter((f) => SAFE_RESUME_FORMATS.includes(f));
    if (validatedFormats.length === 0) {
        throw new SettingsValidationError(
            `At least one valid format must be selected (${SAFE_RESUME_FORMATS.join(", ")}).`
        );
    }

    const maxFileSizeMb = Math.round(Number(data.maxFileSizeMb));
    if (isNaN(maxFileSizeMb) || maxFileSizeMb < 1 || maxFileSizeMb > 50) {
        throw new SettingsValidationError("Maximum file size must be between 1 MB and 50 MB.");
    }

    return updateCompanySettings({
        allowedFormats: validatedFormats.join(","),
        maxFileSizeMb,
    });
}

export async function updateNotificationPreferencesService(
    userId: number,
    data: {
        notifyNewApplications?: boolean | number;
        notifyInterviews?: boolean | number;
        notifySelections?: boolean | number;
        notifyBatchAllocations?: boolean | number;
    }
): Promise<NotificationPreferencesRecord> {
    return updateUserNotificationPreferences(userId, data);
}

export async function saveCompanyLogoService(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
): Promise<string> {
    const ALLOWED_MIME_TYPES = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/svg+xml",
    ];

    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
        throw new SettingsValidationError(
            "Unsupported image format. Allowed formats: PNG, JPG, JPEG, WEBP, SVG."
        );
    }

    const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2 MB
    if (fileBuffer.length > MAX_LOGO_SIZE) {
        throw new SettingsValidationError("Company logo must be smaller than 2 MB.");
    }

    if (fileBuffer.length === 0) {
        throw new SettingsValidationError("Uploaded file is empty.");
    }

    // Extract extension safely
    let ext = path.extname(originalName).toLowerCase().replace(/^\./, "");
    if (!["png", "jpg", "jpeg", "webp", "svg"].includes(ext)) {
        if (mimeType.includes("png")) ext = "png";
        else if (mimeType.includes("svg")) ext = "svg";
        else if (mimeType.includes("webp")) ext = "webp";
        else ext = "jpg";
    }

    const safeFileName = `logo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const targetDir = path.join(process.cwd(), "public", "uploads", "branding");

    await fs.mkdir(targetDir, { recursive: true });

    const targetFilePath = path.join(targetDir, safeFileName);
    await fs.writeFile(targetFilePath, fileBuffer);

    const publicPath = `/uploads/branding/${safeFileName}`;

    await updateCompanySettings({
        companyLogo: publicPath,
    });

    return publicPath;
}
