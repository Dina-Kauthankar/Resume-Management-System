import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "@/server/database/connection";
import { ApplicantType, Role } from "@/server/auth";

export interface UserRecord {
    id: number;
    full_name: string;
    email: string;
    password?: string;
    role: Role;
    applicant_type: ApplicantType;
    phone: string | null;
    college_details: string | null;
    company_address: string | null;
    created_at: string;
    updated_at: string;
}

export async function findUserById(id: number): Promise<UserRecord | null> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            id,
            full_name,
            email,
            role,
            applicant_type,
            phone,
            college_details,
            company_address,
            created_at,
            updated_at
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0] as UserRecord;
}

export async function findUserPasswordHashById(id: number): Promise<string | null> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT password
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    if (rows.length === 0 || !rows[0].password) {
        return null;
    }

    return rows[0].password as string;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            id,
            full_name,
            email,
            password,
            role,
            applicant_type,
            phone,
            college_details,
            company_address,
            created_at,
            updated_at
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
        [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0] as UserRecord;
}

export async function findHRUser(): Promise<UserRecord | null> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT
            id,
            full_name,
            email,
            role,
            applicant_type,
            phone,
            college_details,
            company_address,
            created_at,
            updated_at
        FROM users
        WHERE role = 'HR'
        ORDER BY id ASC
        LIMIT 1
        `
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0] as UserRecord;
}

export async function updateHRProfile(
    id: number,
    data: {
        fullName?: string;
        email?: string;
        password?: string;
        companyAddress?: string | null;
    }
): Promise<boolean> {
    const fields: string[] = [];
    const values: (string | null | number)[] = [];

    if (data.fullName !== undefined) {
        fields.push("full_name = ?");
        values.push(data.fullName.trim());
    }

    if (data.email !== undefined) {
        fields.push("email = ?");
        values.push(data.email.toLowerCase().trim());
    }

    if (data.password !== undefined) {
        fields.push("password = ?");
        values.push(data.password);
    }

    if (data.companyAddress !== undefined) {
        fields.push("company_address = ?");
        values.push(data.companyAddress ? data.companyAddress.trim() : null);
    }

    if (fields.length === 0) {
        return false;
    }

    values.push(id);

    const [result] = await db.execute<ResultSetHeader>(
        `
        UPDATE users
        SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ? AND role = 'HR'
        `,
        values
    );

    return result.affectedRows > 0;
}

export async function updateCandidateProfile(
    id: number,
    data: {
        fullName?: string;
        phone?: string | null;
        collegeDetails?: string | null;
    }
): Promise<boolean> {
    const fields: string[] = [];
    const values: (string | null | number)[] = [];

    if (data.fullName !== undefined) {
        fields.push("full_name = ?");
        values.push(data.fullName.trim());
    }

    if (data.phone !== undefined) {
        fields.push("phone = ?");
        values.push(data.phone ? data.phone.trim() : null);
    }

    if (data.collegeDetails !== undefined) {
        fields.push("college_details = ?");
        values.push(data.collegeDetails ? data.collegeDetails.trim() : null);
    }

    if (fields.length === 0) {
        return false;
    }

    values.push(id);

    const [result] = await db.execute<ResultSetHeader>(
        `
        UPDATE users
        SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ? AND role = 'CANDIDATE'
        `,
        values
    );

    return result.affectedRows > 0;
}

export async function updateUserPassword(
    id: number,
    hashedPassword: string
): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
        `
        UPDATE users
        SET password = ?, updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
        `,
        [hashedPassword, id]
    );

    return result.affectedRows > 0;
}
