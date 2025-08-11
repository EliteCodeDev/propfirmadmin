import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true, message: "server root" });
}

export const dynamic = "force-dynamic";
