import { db } from "@/server/database/connection";

// ============================================================
// TYPES
// ============================================================

export interface ResumeRecord {
    id: number;

    application_id: number;

    file_name: string;

    file_extension: string;

    file_path: string;
}


// ============================================================
// GET RESUME BY APPLICATION ID
//
// Finds the resume belonging to a specific application.
//
// The application_id column is UNIQUE in the resumes table,
// therefore one application can have only one associated
// resume.
// ============================================================

export async function getResumeByApplicationId(
    applicationId: number
): Promise<ResumeRecord | null> {

    const [rows] =
        await db.execute(
            `
            SELECT
                id,
                application_id,
                file_name,
                file_extension,
                file_path

            FROM resumes

            WHERE
                application_id = ?

            LIMIT 1
            `,
            [
                applicationId,
            ]
        );


    if (
        !Array.isArray(rows) ||
        rows.length === 0
    ) {

        return null;
    }


    return rows[0] as ResumeRecord;
}