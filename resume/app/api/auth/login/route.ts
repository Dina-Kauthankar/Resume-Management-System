import { NextResponse } from "next/server";
import { db } from "@/server/database/connection";

import {
  comparePassword,
  signJWT,
  setAuthCookie,
} from "@/server/auth";

import {
  validateLoginInput,
  LoginDTO,
} from "@/server/validation/auth";

// ============================================================
// TYPES
// ============================================================

interface UserRow {
  id: number;
  full_name: string;
  email: string;
  password: string;
  role: "HR" | "CANDIDATE";
  applicant_type:
    | "SINGLE_JOB_SEEKER"
    | "SINGLE_INTERN"
    | "BATCH_INTERN";
}

// ============================================================
// POST /api/auth/login
// ============================================================

export async function POST(request: Request) {
  try {
    // --------------------------------------------------------
    // 1. Read request body
    // --------------------------------------------------------

    const body: LoginDTO =
      await request.json();

    // --------------------------------------------------------
    // 2. Validate login input
    // --------------------------------------------------------

    const validation =
      validateLoginInput(body);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // 3. Normalize email
    // --------------------------------------------------------

    const email =
      body.email
        .toLowerCase()
        .trim();

    // --------------------------------------------------------
    // 4. Find user by email
    // --------------------------------------------------------

    const [userRows] =
      await db.execute(
        `
          SELECT
            id,
            full_name,
            email,
            password,
            role,
            applicant_type
          FROM users
          WHERE email = ?
          LIMIT 1
        `,
        [email]
      );

    const users =
      userRows as UserRow[];

    const user = users[0];

    // --------------------------------------------------------
    // 5. User not found
    // --------------------------------------------------------

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------------
    // 6. Compare password
    // --------------------------------------------------------

    const isPasswordValid =
      await comparePassword(
        body.password,
        user.password
      );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------------
    // 7. Create JWT payload
    // --------------------------------------------------------

    const tokenPayload = {
      userId: user.id,

      email: user.email,

      fullName: user.full_name,

      role: user.role,

      applicantType:
        user.applicant_type,
    };

    // --------------------------------------------------------
    // 8. Sign JWT
    // --------------------------------------------------------

    const token =
      await signJWT(
        tokenPayload
      );

    // --------------------------------------------------------
    // 9. Store JWT in HTTP-only cookie
    // --------------------------------------------------------

    await setAuthCookie(
      token
    );

    // --------------------------------------------------------
    // 10. Return successful response
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        message:
          "Login successful",

        user: {
          id:
            user.id,

          fullName:
            user.full_name,

          email:
            user.email,

          role:
            user.role,

          applicantType:
            user.applicant_type,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Internal server error during authentication.",
      },
      { status: 500 }
    );
  }
}