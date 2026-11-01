import fs from "fs/promises";
import path from "path";

import type { ResumeRecord } from "@/server/repositories/resumeRepository";


// ============================================================
// TYPES
// ============================================================

export interface ResumeFile {

    buffer: Buffer;

    fileName: string;

    contentType: string;
}


// ============================================================
// CONTENT TYPE
// ============================================================

function getContentType(
    fileExtension: string
): string {

    const extension =
        fileExtension
            .replace(".", "")
            .toLowerCase();


    switch (extension) {

        case "pdf":
            return "application/pdf";

        case "doc":
            return "application/msword";

        case "docx":
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        case "txt":
            return "text/plain";

        default:
            return "application/octet-stream";
    }
}


// ============================================================
// GET RESUME FILE
//
// Converts the database resume record into an actual file
// that can be returned by an API route.
// ============================================================

export async function getResumeFile(
    resume: ResumeRecord
): Promise<ResumeFile> {

    // ========================================================
    // Resolve file path
    // ========================================================

    const filePath =
        path.resolve(
            resume.file_path
        );


    // ========================================================
    // Read file
    // ========================================================

    const buffer =
        await fs.readFile(
            filePath
        );


    // ========================================================
    // Determine content type
    // ========================================================

    const contentType =
        getContentType(
            resume.file_extension
        );


    return {

        buffer,

        fileName:
            resume.file_name,

        contentType,
    };
}