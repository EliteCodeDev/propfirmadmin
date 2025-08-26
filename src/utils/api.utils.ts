import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { internalApiBaseUrl } from "@/config";

export async function ensureSession() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { error: true, status: 401, message: "Unauthorized" } as const;
  }
  return { error: false, session } as const;
}

export function backendUrl(path: string) {
  return `${internalApiBaseUrl}${path.startsWith("/") ? path : "/" + path}`;
}

export function pickAllowedHeaders(req: NextRequest) {
  const headers: Record<string, string> = {};
  // Lista blanca de cabeceras permitidas hacia backend
  const allow = ["content-type", "x-api-key"];
  allow.forEach((k) => {
    const v = req.headers.get(k);
    if (v) headers[k] = v;
  });
  return headers;
}
