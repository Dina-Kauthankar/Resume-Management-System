import { NextResponse } from "next/server";

import { getAuthSession } from "@/server/auth";
import { db } from "@/server/database/connection";

export async function GET() {
  try {
    // --------------------------------------------------------
    // 1. Get authenticated session
    // --------------------------------------------------------

    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------------
    // 2. Fetch user from MySQL
    // --------------------------------------------------------

    const [rows] = await db.execute(
      `
        SELECT
          id,
          full_name AS fullName,
          email,
          role,
          applicant_type AS applicantType,
          phone,
          college_details AS collegeDetails,
          created_at AS createdAt
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [session.userId]
    );

    // --------------------------------------------------------
    // 3. Get first user
    // --------------------------------------------------------

    const users = rows as {
      id: number;
      fullName: string;
      email: string;
      role: "HR" | "CANDIDATE";
      applicantType:
        | "SINGLE_JOB_SEEKER"
        | "SINGLE_INTERN"
        | "BATCH_INTERN";
      phone: string | null;
      collegeDetails: string | null;
      createdAt: Date;
    }[];

    const user = users[0];

    // --------------------------------------------------------
    // 4. User not found
    // --------------------------------------------------------

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User profile not found",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // 5. Return user
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(
      "Get user session error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}