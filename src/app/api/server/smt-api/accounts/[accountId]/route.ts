import { NextRequest, NextResponse } from "next/server";
import type { AxiosError } from "axios";
import { ensureSession } from "@/utils/api.utils";
import { smtApiServer } from "@/api/smt-api";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ accountId: string }> }
) {
  const auth = await ensureSession();
  if (auth.error)
    return NextResponse.json(
      { message: auth.message },
      { status: auth.status }
    );

  try {
    const { accountId } = await context.params;
    const token = auth.session.accessToken as string;
    const data = await smtApiServer.getAccount(token, accountId);
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    const err = e as AxiosError<{ message?: string }>;
    return NextResponse.json(
      {
        message:
          err.response?.data?.message ||
          err.message ||
          "Error fetching account",
      },
      { status: err.response?.status || 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ accountId: string }> }
) {
  const auth = await ensureSession();
  if (auth.error)
    return NextResponse.json(
      { message: auth.message },
      { status: auth.status }
    );
  const body = await req.json();
  try {
    const { accountId } = await context.params;
    const token = auth.session.accessToken as string;
    const data = await smtApiServer.ingestAccount(token, accountId, body);
    return NextResponse.json(data, { status: 201 });
  } catch (e: unknown) {
    const err = e as AxiosError<{ message?: string }>;
    return NextResponse.json(
      {
        message:
          err.response?.data?.message ||
          err.message ||
          "Error ingesting account",
      },
      { status: err.response?.status || 500 }
    );
  }
}
