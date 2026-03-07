import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const userCount = await db.user.count();
    return NextResponse.json({ status: "ok", users: userCount, dbUrl: process.env.DATABASE_URL?.substring(0, 30) + "..." });
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e.message }, { status: 500 });
  }
}
