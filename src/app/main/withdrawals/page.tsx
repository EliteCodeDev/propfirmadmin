"use client";

import MainLayout from "@/components/layouts/MainLayout";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/components/common/tableComponent";
import type { Withdrawal, WithdrawalStatus, PageResponse } from "@/types";
// Removed ClipboardIcon import as Withdrawal ID column is removed

type LimitParam = number;
type Scope = "mine" | "all";

// [moved-to-src/types] Original inline types now live in src/types.
// type WithdrawalStatus = ...
// interface Withdrawal { ... }
// interface PageResponse<T> { ... }

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");

function Badge({ status }: { status: WithdrawalStatus | string }) {
  const up = String(status).toUpperCase();
  const cls =
    up === "PENDING"
      ? "bg-yellow-100 text-yellow-800"
      : up === "APPROVED"
      ? "bg-green-100 text-green-800"
      : up === "REJECTED"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";
  return (
    <span className={`px-1.5 py-[1px] rounded-full text-[10px] leading-tight font-normal ${cls}`}>
      {up}
    </span>
  );
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

type UnknownRecord = Record<string, unknown>;
interface HttpError extends Error { status?: number; body?: string }

function unwrapPage<T = UnknownRecord>(raw: unknown): {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  const r = raw as UnknownRecord | undefined;
  const dataField = (r && (r as UnknownRecord)["data"]) as unknown;
  const layer: UnknownRecord | unknown[] | undefined =
    dataField && !Array.isArray(dataField) ? (dataField as UnknownRecord) : r;

  let items: T[] = [];
  if (layer && typeof layer === "object" && !Array.isArray(layer)) {
    const maybeData = (layer as UnknownRecord)["data"] as unknown;
    const maybeItems = (layer as UnknownRecord)["items"] as unknown;
    if (Array.isArray(maybeData)) items = maybeData as T[];
    else if (Array.isArray(maybeItems)) items = maybeItems as T[];
  } else if (Array.isArray(layer)) {
    items = layer as T[];
  }

  const total =
    layer && typeof layer === "object" && typeof (layer as UnknownRecord)["total"] === "number"
      ? ((layer as UnknownRecord)["total"] as number)
      : items.length;
  const page =
    layer && typeof layer === "object" && typeof (layer as UnknownRecord)["page"] === "number"
      ? ((layer as UnknownRecord)["page"] as number)
      : 1;
  const limit =
    layer && typeof layer === "object" && typeof (layer as UnknownRecord)["limit"] === "number"
      ? ((layer as UnknownRecord)["limit"] as number)
      : items.length;
  const totalPages =
    typeof layer?.totalPages === "number"
      ? layer.totalPages
      : limit > 0
      ? Math.max(1, Math.ceil(total / limit))
      : 1;

  return { items, total, page, limit, totalPages };
}

function WithdrawalsInner() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  // Estado
  const [scope, setScope] = useState<Scope>("all");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<LimitParam>(10);
  const [status, setStatus] = useState<"" | WithdrawalStatus>("");

  const accessToken = session?.accessToken as string | undefined;

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (status) q.set("status", status); // minúsculas para evitar 500
    return q.toString();
  }, [page, limit, status]);

  const basePath =
    scope === "all"
      ? "/api/withdrawals" // requiere rol admin
      : "/api/withdrawals/my-withdrawals";

  const url = `${API_BASE}${basePath}?${query}`;

  const fetcher = async (u: string) => {
    const res = await fetch(u, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      credentials: "include",
    });
    if (!res.ok) {
      const text = await res.text();
      const err: HttpError = new Error(text || `Error ${res.status}`);
      err.status = res.status;
      err.body = text;
      throw err;
    }
    return res.json();
  };

  const { data, error, isLoading, mutate } = useSWR<PageResponse<Withdrawal>>(
    accessToken ? url : null,
    fetcher
  );

  // Derivar httpStatus de forma estable para usar en efectos antes de cualquier return condicional
  const httpStatus: number | undefined = ((): number | undefined => {
    if (error && typeof error === 'object' && error !== null) {
      const e = error as Partial<HttpError>;
      if (typeof e.status === 'number') return e.status;
    }
    return undefined;
  })();

  // Si el usuario no tiene permisos para ver "Todos (admin)", alterna automáticamente a "Mis retiros"
  useEffect(() => {
    if (httpStatus === 403 && scope === "all") {
      setScope("mine");
    }
  }, [httpStatus, scope]);

  // Redirección si no hay sesión
  useEffect(() => {
    if (authStatus === "unauthenticated" || (!accessToken && authStatus !== "loading")) {
      router.replace("/auth/login");
    }
  }, [authStatus, accessToken, router]);

  if (authStatus === "loading" || (!accessToken && authStatus !== "unauthenticated")) {
    return (
      <MainLayout>
        <div className="p-6">Verificando sesión…</div>
      </MainLayout>
    );
  }

  if (!accessToken) {
    return (
      <MainLayout>
        <div className="p-6">Redirigiendo al login…</div>
      </MainLayout>
    );
  }

  const pageObj = unwrapPage<Withdrawal>(data as unknown);
  const withdrawals = pageObj.items;
  const totalPages = pageObj.totalPages;
  const offset = (page - 1) * limit;
  const isForbidden = httpStatus === 403;
  const isServerErr = httpStatus === 500;

  return (
    <MainLayout>
      <div className="p-6 space-y-6 pt-4">
        <div className="flex items-center justify-start">
          <h1 className="text-2xl font-semibold">Retiros</h1>
        </div>

        {/* Mensajes de error claros */}

        {isServerErr && (
          <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
            El servidor devolvió 500. Asegúrate de enviar <b>status</b> en minúsculas
            (<code>pending|approved|rejected</code>) y revisa los logs del backend.
          </div>
        )}

        <div className="text-sm text-gray-600">
          {`Mostrando ${withdrawals.length} registros`}
        </div>

        {(() => {
          const columns: ColumnConfig[] = [
            { key: "serial", label: "ID", type: "normal" },
            { key: "createdAt", label: "Fecha", type: "normal" },
            { key: "amount", label: "Monto", type: "normal", render: (v) => String(v) },
            { key: "wallet", label: "Wallet", type: "normal" },
            { key: "challenge", label: "Desafío", type: "normal" },
            { key: "status", label: "Estado", type: "normal", render: (v) => <Badge status={String(v)} /> },
            { key: "observation", label: "Observación", type: "normal" },
            ...(scope === "all" ? [{ key: "userName", label: "Usuario", type: "normal" } as ColumnConfig] : []),
          ];

          const rows = withdrawals.map((w, idx) => ({
            serial: offset + idx + 1,
            // withdrawalID removed from columns
            createdAt: w.createdAt ? new Date(w.createdAt).toLocaleString() : "-",
            amount: money.format(Number(w.amount ?? 0)),
            wallet: w.wallet ?? "-",
            challenge: w.challenge?.name || w.challengeID || "-",
            status: w.status,
            observation: w.observation ? w.observation : "-",
            userName:
              scope === "all"
                ? (w.user
                    ? `${w.user.firstName ?? ""} ${w.user.lastName ?? ""}`.trim() || w.user.email || w.userID
                    : w.userID)
                : undefined,
          }));

          return (
            <PaginatedCardTable
              columns={columns}
              rows={rows}
              isLoading={isLoading}
              emptyText={error ? (error as Error).message : "No hay retiros."}
              pagination={{
                currentPage: page,
                totalPages: Math.max(1, totalPages),
                totalItems: pageObj.total,
                pageSize: limit,
                onPageChange: (p) => setPage(p),
                onPageSizeChange: (n) => { setPage(1); setLimit(n as LimitParam); },
              }}
            />
          );
        })()}
      </div>
    </MainLayout>
  );
}

export default function WithdrawalsPage() {
  return (
    <SessionProvider>
      <WithdrawalsInner />
    </SessionProvider>
  );
}
