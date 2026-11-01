
import { NextResponse } from "next/server";
import { removeAuthCookie } from "@/server/auth";

export async function POST() {
  await removeAuthCookie();
  return NextResponse.json({ success: true, message: "Logged out successfully" }, { status: 200 });
}