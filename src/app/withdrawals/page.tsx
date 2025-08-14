"use client";

import MainLayout from "@/components/layouts/MainLayout";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/components/common/tableComponent";

type WithdrawalStatus = "pending" | "approved" | "rejected";
type LimitParam = number;
type Scope = "mine" | "all";

interface Withdrawal {
  withdrawalID: string;
  userID: string;
  wallet: string;
  amount: number;
  observation?: string | null;
  status: WithdrawalStatus | string;
  createdAt: string;
  challengeID?: string | null;
  user?: { firstName?: string; lastName?: string; email?: string };
  challenge?: { name?: string; accountLogin?: string };
}

interface PageResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>
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

  // Redirección si no hay sesión
  useEffect(() => {
    if (authStatus === "unauthenticated" || (!accessToken && authStatus !== "loading")) {
      router.replace("/login");
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
  
  const httpStatus: number | undefined = ((): number | undefined => {
    if (error && typeof error === 'object' && error !== null) {
      const e = error as Partial<HttpError>;
      if (typeof e.status === 'number') return e.status;
    }
    return undefined;
  })();
  const isForbidden = httpStatus === 403;
  const isServerErr = httpStatus === 500;

  return (
    <MainLayout>
      <div className="p-6 space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Retiros</h1>

          <div className="flex items-center gap-3">
            {/* Ámbito: mis retiros / todos */}
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={scope}
              onChange={(e) => {
                setPage(1);
                setScope(e.target.value as Scope);
              }}
            >
              <option value="all">Todos (admin)</option>
              <option value="mine">Mis retiros</option>
            </select>

            {/* Filtro estado (minúsculas) */}
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value as '' | WithdrawalStatus);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
            </select>

            {/* Límite */}
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={String(limit)}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPage(1);
                setLimit(val as LimitParam);
              }}
            >
              <option value="1000">Todos</option>
              <option value="10">10 por página</option>
              <option value="20">20 por página</option>
              <option value="50">50 por página</option>
            </select>

            <button
              className="border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => mutate()}
            >
              Refrescar
            </button>
          </div>
        </div>

        {/* Mensajes de error claros */}
        {isForbidden && scope === "all" && (
          <div className="p-3 rounded-md bg-amber-50 text-amber-800 text-sm border border-amber-200">
            No estás autorizado para ver <b>Todos (admin)</b>. Cambia a <b>Mis retiros</b> o inicia
            sesión con un usuario administrador.
          </div>
        )}

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
            { key: "createdAt", label: "Fecha", type: "normal" },
            { key: "amount", label: "Monto", type: "normal", render: (v) => String(v) },
            { key: "wallet", label: "Wallet", type: "normal" },
            { key: "challenge", label: "Desafío", type: "normal" },
            { key: "status", label: "Estado", type: "normal", render: (v) => <Badge status={String(v)} /> },
            { key: "observation", label: "Observación", type: "normal" },
            ...(scope === "all" ? [{ key: "userName", label: "Usuario", type: "normal" } as ColumnConfig] : []),
          ];

          const rows = withdrawals.map((w) => ({
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
              title="Retiros"
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
