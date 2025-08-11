import { NextResponse } from "next/server";
import type { AxiosError } from "axios";
import { ensureSession } from "@/utils/api.utils";
import { smtApiServer } from "@/api/smt-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await ensureSession();
  if (auth.error)
    return NextResponse.json(
      { message: auth.message },
      { status: auth.status }
    );

  try {
    const token = auth.session.accessToken as string; // assert requerido
    const data = await smtApiServer.listAccounts(token);
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    const err = e as AxiosError<{ message?: string }>;
    return NextResponse.json(
      {
        message:
          err.response?.data?.message ||
          err.message ||
          "Error fetching accounts",
      },
      { status: err.response?.status || 500 }
    );
  }
}
