import { NextRequest, NextResponse } from "next/server";
import {
  ensureSession,
  backendUrl,
  pickAllowedHeaders,
} from "@/utils/api.utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await ensureSession();
  if (auth.error)
    return NextResponse.json(
      { message: auth.message },
      { status: auth.status }
    );
  const res = await fetch(backendUrl("/users/profile"), {
    headers: {
      ...pickAllowedHeaders(req),
      Authorization: `Bearer ${auth.session.accessToken}`,
    },
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest) {
  const auth = await ensureSession();
  if (auth.error)
    return NextResponse.json(
      { message: auth.message },
      { status: auth.status }
    );
  const body = await req.json();
  const res = await fetch(backendUrl("/users/profile"), {
    method: "PATCH",
    headers: {
      ...pickAllowedHeaders(req),
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.session.accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
