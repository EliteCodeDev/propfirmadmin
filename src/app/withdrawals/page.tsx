// src/app/withdrawals/page.tsx
"use client";

import MainLayout from "@/components/layouts/MainLayout";
import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Withdrawal {
  withdrawalID: string;
  userID: string;
  wallet: string;
  amount: number;
  observation?: string | null;
  status: WithdrawalStatus;
  createdAt: string; // ISO
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

function Badge({ status }: { status: WithdrawalStatus }) {
  const cls = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  }[status];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function WithdrawalsInner() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  // Hooks de estado SIEMPRE antes de cualquier retorno
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [status, setStatus] = useState<"" | WithdrawalStatus>("");

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (status) q.set("status", status);
    return q.toString();
  }, [page, limit, status]);

  // Token del backend expuesto por NextAuth en la sesión
  const accessToken = (session as any)?.accessToken as string | undefined;

  // Construye URL de tu backend Nest (Swagger: /api/withdrawals/my-withdrawals)
  const url = `${API_BASE}/api/withdrawals/my-withdrawals?${query}`;

  // Fetcher con Bearer; SWR se desactiva si no hay token (key = null)
  const fetcher = async (u: string) => {
    const res = await fetch(u, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "include",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Error ${res.status}`);
    }
    return res.json();
  };

  const { data, error, isLoading, mutate } = useSWR<PageResponse<Withdrawal>>(
    accessToken ? url : null,
    fetcher
  );

  // Redirección en efecto (no cambia el orden de hooks)
  useEffect(() => {
    if (authStatus === "unauthenticated" || (!accessToken && authStatus !== "loading")) {
      router.replace("/login");
    }
  }, [authStatus, accessToken, router]);

  // UI mientras valida sesión / redirige
  if (authStatus === "loading" || (!accessToken && authStatus !== "unauthenticated")) {
    return (
      <MainLayout>
        <div className="p-6">Verificando sesión…</div>
      </MainLayout>
    );
  }

  // Si está sin sesión, ya se disparó router.replace; muestra placeholder
  if (!accessToken) {
    return (
      <MainLayout>
        <div className="p-6">Redirigiendo al login…</div>
      </MainLayout>
    );
  }

  // Normalización robusta: garantizamos que 'withdrawals' sea SIEMPRE un array
  const withdrawals = Array.isArray(data?.data)
    ? data!.data
    : Array.isArray((data as any))
    ? (data as any)
    : Array.isArray((data as any)?.items)
    ? (data as any).items
    : [];

  const totalPages =
    (data && typeof (data as any).totalPages === "number" ? (data as any).totalPages : 1) || 1;

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Mis Retiros</h1>

          <div className="flex items-center gap-3">
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value as any);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="APPROVED">Aprobado</option>
              <option value="REJECTED">Rechazado</option>
            </select>

            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={limit}
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} por página
                </option>
              ))}
            </select>

            <button
              className="border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => mutate()}
            >
              Refrescar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Desafío</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Observación</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-4 text-sm" colSpan={6}>
                    Cargando...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-red-600" colSpan={6}>
                    Error: {(error as Error).message}
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-sm" colSpan={6}>
                    No hay retiros.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w: Withdrawal) => (
                  <tr key={w.withdrawalID} className="text-sm">
                    <td className="px-4 py-3">
                      {w.createdAt ? new Date(w.createdAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {money.format(Number(w.amount ?? 0))}
                    </td>
                    <td className="px-4 py-3">{w.wallet ?? "-"}</td>
                    <td className="px-4 py-3">
                      {w.challenge?.name || w.challengeID || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={w.status} />
                    </td>
                    <td className="px-4 py-3">
                      {w.observation ? w.observation : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 border rounded-md disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Anterior
            </button>
            <button
              className="px-3 py-2 border rounded-md disabled:opacity-50"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Export default: envolvemos con SessionProvider para habilitar useSession en el árbol
export default function WithdrawalsPage() {
  return (
    <SessionProvider>
      <WithdrawalsInner />
    </SessionProvider>
  );
}
