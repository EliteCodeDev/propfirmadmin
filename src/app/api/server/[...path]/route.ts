import { NextRequest, NextResponse } from "next/server";
import {
  ensureSession,
  backendUrl,
  pickAllowedHeaders,
} from "@/utils/api.utils";

// Lista blanca de prefijos permitidos (rutas de la API backend a las que se puede acceder vía BFF)
const ALLOWED_PREFIXES = [
  "/auth",
  "/users",
  "/roles",
  "/challenges",
  "/challenge-templates",
  "/smt-api",
  "/plans",
  "/withdrawals",
  "/mailer",
];

export const dynamic = "force-dynamic";

function isAllowed(path: string) {
  return ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

async function proxy(req: NextRequest) {
  const auth = await ensureSession();
  if (auth.error) {
    return NextResponse.json(
      { message: auth.message },
      { status: auth.status }
    );
  }

  // Recompone la subruta eliminando el segmento inicial "server".
  const url = new URL(req.url);
  const serverIndex = url.pathname.indexOf("/api/server/");
  const subPath =
    url.pathname.substring(serverIndex + "/api/server".length) || "/";

  if (!isAllowed(subPath)) {
    return NextResponse.json({ message: "Not allowed" }, { status: 403 });
  }

  const target = backendUrl(`${subPath}`);
  const method = req.method.toUpperCase();
  const headers = pickAllowedHeaders(req);
  headers["Authorization"] = `Bearer ${auth.session.accessToken}`;

  let body: BodyInit | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await req.json();
      body = JSON.stringify(json);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      const entries = Array.from(formData.entries()).map(([k, v]) => [
        k,
        String(v),
      ]) as [string, string][];
      body = new URLSearchParams(entries).toString();
    } else if (contentType.includes("multipart/form-data")) {
      // Para simplificar se podría implementar forward de FormData; caso no soportado por ahora.
      return NextResponse.json(
        { message: "Unsupported content-type" },
        { status: 415 }
      );
    }
  }

  const res = await fetch(target, {
    method,
    headers: {
      ...headers,
    },
    body,
    cache: "no-cache",
  });

  const text = await res.text();
  let data: unknown = text;
  const responseContentType = res.headers.get("content-type") || "";
  if (responseContentType.includes("application/json")) {
    try {
      data = JSON.parse(text);
    } catch {}
  }

  // Si el backend devuelve algo que no sea JSON, lo envolvemos para mantener coherencia.
  if (typeof data !== "object" || data === null) {
    return NextResponse.json({ raw: data }, { status: res.status });
  }
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest) {
  return proxy(req);
}
export async function POST(req: NextRequest) {
  return proxy(req);
}
export async function PATCH(req: NextRequest) {
  return proxy(req);
}
export async function PUT(req: NextRequest) {
  return proxy(req);
}
export async function DELETE(req: NextRequest) {
  return proxy(req);
}
