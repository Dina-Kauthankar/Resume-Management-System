
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";


// ============================================================
// AUTH CONFIGURATION
// ============================================================

const AUTH_COOKIE_NAME = "auth_token";

const JWT_SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET ||
    "super-secret-jwt-key-resume-management-2026"
);


// ============================================================
// SESSION TYPE
// ============================================================

interface UserSessionPayload {
    userId: number;
    email: string;
    fullName: string;

    role: "HR" | "CANDIDATE";

    applicantType:
        | "SINGLE_JOB_SEEKER"
        | "SINGLE_INTERN"
        | "BATCH_INTERN";
}


// ============================================================
// VERIFY JWT
// ============================================================

async function verifyToken(
    token: string
): Promise<UserSessionPayload | null> {

    try {

        const { payload } =
            await jwtVerify(
                token,
                JWT_SECRET_KEY
            );

        return payload as unknown as UserSessionPayload;

    } catch {

        return null;
    }
}


// ============================================================
// MIDDLEWARE
// ============================================================

export async function middleware(
    request: NextRequest
) {

    const { pathname } =
        request.nextUrl;


    // ========================================================
    // GET AUTH TOKEN
    // ========================================================

    const token =
        request.cookies.get(
            AUTH_COOKIE_NAME
        )?.value;


    // ========================================================
    // VERIFY SESSION
    // ========================================================

    const session =
        token
            ? await verifyToken(token)
            : null;


    // ========================================================
    // DEBUG LOGGING
    // ========================================================

    console.log(
        "===================================="
    );

    console.log(
        "MIDDLEWARE PATH:",
        pathname
    );

    console.log(
        "HAS TOKEN:",
        Boolean(token)
    );

    console.log(
        "SESSION:",
        session
    );

    console.log(
        "====================================");


    // ========================================================
    // ROUTE TYPES
    // ========================================================

    const isHRRoute =
        pathname.startsWith("/hr");

    const isCandidateRoute =
        pathname.startsWith("/candidate");

    const isAuthRoute =
        pathname === "/login" ||
        pathname === "/register";


    // ========================================================
    // AUTH ROUTES
    //
    // If already logged in, don't allow the user to remain
    // on login/register pages.
    // ========================================================

    if (isAuthRoute && session) {

        const targetUrl =
            session.role === "HR"
                ? "/hr/dashboard"
                : "/candidate/dashboard";


        console.log(
            "AUTH ROUTE → REDIRECT:",
            targetUrl
        );


        return NextResponse.redirect(
            new URL(
                targetUrl,
                request.url
            )
        );
    }


    // ========================================================
    // HR ROUTES
    // ========================================================

    if (isHRRoute) {

        // ----------------------------------------------------
        // NOT LOGGED IN
        // ----------------------------------------------------

        if (!session) {

            console.log(
                "HR → LOGIN"
            );


            const loginUrl =
                new URL(
                    "/login",
                    request.url
                );


            loginUrl.searchParams.set(
                "callbackUrl",
                pathname
            );


            return NextResponse.redirect(
                loginUrl
            );
        }


        // ----------------------------------------------------
        // LOGGED IN BUT NOT HR
        // ----------------------------------------------------

        if (session.role !== "HR") {

            console.log(
                "HR → CANDIDATE DASHBOARD"
            );


            return NextResponse.redirect(
                new URL(
                    "/candidate/dashboard",
                    request.url
                )
            );
        }


        // ----------------------------------------------------
        // HR ALLOWED
        // ----------------------------------------------------

        console.log(
            "HR ROUTE ALLOWED:",
            pathname
        );
    }


    // ========================================================
    // CANDIDATE ROUTES
    // ========================================================

    if (isCandidateRoute) {

        // ----------------------------------------------------
        // NOT LOGGED IN
        // ----------------------------------------------------

        if (!session) {

            console.log(
                "CANDIDATE → LOGIN"
            );


            const loginUrl =
                new URL(
                    "/login",
                    request.url
                );


            loginUrl.searchParams.set(
                "callbackUrl",
                pathname
            );


            return NextResponse.redirect(
                loginUrl
            );
        }


        // ----------------------------------------------------
        // LOGGED IN BUT NOT CANDIDATE
        // ----------------------------------------------------

        if (session.role !== "CANDIDATE") {

            console.log(
                "CANDIDATE → HR DASHBOARD"
            );


            return NextResponse.redirect(
                new URL(
                    "/hr/dashboard",
                    request.url
                )
            );
        }


        // ----------------------------------------------------
        // CANDIDATE ALLOWED
        // ----------------------------------------------------

        console.log(
            "CANDIDATE ROUTE ALLOWED:",
            pathname
        );
    }


    // ========================================================
    // ALLOW REQUEST
    // ========================================================

    console.log(
        "NEXT:",
        pathname
    );


    return NextResponse.next();
}


// ============================================================
// MIDDLEWARE MATCHER
// ============================================================

export const config = {

    matcher: [
        "/hr/:path*",
        "/candidate/:path*",
        "/login",
        "/register",
    ],

};