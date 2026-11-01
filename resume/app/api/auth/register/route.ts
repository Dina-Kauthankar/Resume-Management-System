import { NextResponse } from "next/server";
import { db } from "@/server/database/connection";

import {
  hashPassword,
  signJWT,
  setAuthCookie,
} from "@/server/auth";

import {
  validateRegisterInput,
  RegisterDTO,
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
  phone: string | null;
  college_details: string | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================================
// POST /api/auth/register
// ============================================================

export async function POST(request: Request) {
  try {
    // --------------------------------------------------------
    // 1. Read request body
    // --------------------------------------------------------

    const body: RegisterDTO =
      await request.json();

    // --------------------------------------------------------
    // 2. Validate input
    // --------------------------------------------------------

    const validation =
      validateRegisterInput(body);

    console.log(
      "REGISTER BODY:",
      body
    );

    console.log(
      "KEYS:",
      Object.keys(body)
    );

    console.log(
      "body.fullName:",
      body.fullName
    );

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
    // 4. Check whether user already exists
    // --------------------------------------------------------

    const [existingUserRows] =
      await db.execute(
        `
          SELECT
            id
          FROM users
          WHERE email = ?
          LIMIT 1
        `,
        [email]
      );

    const existingUsers =
      existingUserRows as {
        id: number;
      }[];

    if (existingUsers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------------
    // 5. Hash password
    // --------------------------------------------------------

    const hashedPassword =
      await hashPassword(
        body.password
      );

    // --------------------------------------------------------
    // 6. Prepare values
    // --------------------------------------------------------

    const fullName =
      body.fullName.trim();

    const role =
      body.role || "CANDIDATE";

    const applicantType =
      body.applicantType ||
      "SINGLE_JOB_SEEKER";

    const phone =
      body.phone?.trim() || null;

    const collegeDetails =
      body.collegeDetails?.trim() ||
      null;

    // --------------------------------------------------------
    // 7. Insert user into MySQL
    // --------------------------------------------------------

    const [
      insertResult,
    ] = await db.execute(
      `
        INSERT INTO users
        (
          full_name,
          email,
          password,
          role,
          applicant_type,
          phone,
          college_details
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        fullName,
        email,
        hashedPassword,
        role,
        applicantType,
        phone,
        collegeDetails,
      ]
    );

    // --------------------------------------------------------
    // 8. Get inserted user ID
    // --------------------------------------------------------

    const userId =
      (insertResult as {
        insertId: number;
      }).insertId;

    // --------------------------------------------------------
    // 9. Fetch newly created user
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
            applicant_type,
            phone,
            college_details,
            created_at,
            updated_at
          FROM users
          WHERE id = ?
          LIMIT 1
        `,
        [userId]
      );

    const users =
      userRows as UserRow[];

    const user = users[0];

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "User was created but could not be retrieved.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------------
    // 10. Create JWT payload
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
    // 11. Sign JWT
    // --------------------------------------------------------

    const token =
      await signJWT(
        tokenPayload
      );

    // --------------------------------------------------------
    // 12. Store JWT in HTTP-only cookie
    // --------------------------------------------------------

    await setAuthCookie(
      token
    );

    // --------------------------------------------------------
    // 13. Return successful response
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        message:
          "Registration successful",

        user: {
          id: user.id,

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
      { status: 201 }
    );

  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Internal server error during registration.",
      },
      { status: 500 }
    );
  }
}