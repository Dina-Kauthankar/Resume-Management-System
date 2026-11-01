

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// ============================================================
// DATABASE ENUM TYPES
// ============================================================

export type Role = "HR" | "CANDIDATE";

export type ApplicantType =
    | "SINGLE_JOB_SEEKER"
    | "SINGLE_INTERN"
    | "BATCH_INTERN";

// ============================================================
// AUTH CONFIGURATION
// ============================================================

export const AUTH_COOKIE_NAME = "auth_token";

const JWT_SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET ||
        "super-secret-jwt-key-resume-management-2026"
);

// ============================================================
// USER SESSION PAYLOAD
// ============================================================

export interface UserSessionPayload {
    userId: number;
    email: string;
    fullName: string;
    role: Role;
    applicantType: ApplicantType;
}

// ============================================================
// PASSWORD HASHING
// ============================================================

export async function hashPassword(
    password: string
): Promise<string> {
    const salt = await bcrypt.genSalt(10);

    return bcrypt.hash(password, salt);
}

// ============================================================
// PASSWORD COMPARISON
// ============================================================

export async function comparePassword(
    password: string,
    hashed: string
): Promise<boolean> {
    return bcrypt.compare(password, hashed);
}

// ============================================================
// CREATE JWT
// ============================================================

export async function signJWT(
    payload: UserSessionPayload
): Promise<string> {
    return new SignJWT({
        userId: payload.userId,
        email: payload.email,
        fullName: payload.fullName,
        role: payload.role,
        applicantType: payload.applicantType,
    })
        .setProtectedHeader({
            alg: "HS256",
        })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(JWT_SECRET_KEY);
}

// ============================================================
// VERIFY JWT
// ============================================================

export async function verifyJWT(
    token: string
): Promise<UserSessionPayload | null> {
    try {
        const { payload } = await jwtVerify(
            token,
            JWT_SECRET_KEY
        );

        if (
            typeof payload.userId !== "number" ||
            typeof payload.email !== "string" ||
            typeof payload.fullName !== "string" ||
            (payload.role !== "HR" &&
                payload.role !== "CANDIDATE") ||
            (
                payload.applicantType !==
                    "SINGLE_JOB_SEEKER" &&
                payload.applicantType !==
                    "SINGLE_INTERN" &&
                payload.applicantType !==
                    "BATCH_INTERN"
            )
        ) {
            return null;
        }

        return {
            userId: payload.userId,
            email: payload.email,
            fullName: payload.fullName,
            role: payload.role,
            applicantType: payload.applicantType,
        };
    } catch {
        return null;
    }
}

// ============================================================
// SET AUTH COOKIE
// ============================================================

export async function setAuthCookie(
    token: string
): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.set(
        AUTH_COOKIE_NAME,
        token,
        {
            httpOnly: true,

            secure:
                process.env.NODE_ENV === "production",

            sameSite: "lax",

            path: "/",

            maxAge: 60 * 60 * 24,
        }
    );
}

// ============================================================
// REMOVE AUTH COOKIE
// ============================================================

export async function removeAuthCookie(): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.delete(
        AUTH_COOKIE_NAME
    );
}

// ============================================================
// GET AUTHENTICATED USER SESSION
// ============================================================

export async function getAuthSession(): Promise<UserSessionPayload | null> {
    const cookieStore = await cookies();

    const token = cookieStore.get(
        AUTH_COOKIE_NAME
    )?.value;

    console.log("====================================");
    console.log("SERVER AUTH CHECK");
    console.log("HAS TOKEN:", !!token);

    if (!token) {
        console.log("NO AUTH TOKEN");
        console.log("====================================");

        return null;
    }

    const session = await verifyJWT(token);

    console.log("AUTH SESSION:", session);
    console.log("====================================");

    return session;
}