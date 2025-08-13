// src/app/withdrawals/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";

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

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error ${res.status}`);
  }
  return res.json();
};

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

export default function WithdrawalsPage() {
  // Filtros/paginación UI
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [status, setStatus] = useState<"" | WithdrawalStatus>("");

  // Construir query para el endpoint del backend Nest
  // Si quieres listar TODOS (admin), cambia a `/withdrawals` y asegura el rol en backend.
  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (status) q.set("status", status);
    return q.toString();
  }, [page, limit, status]);

  // Nota: asumo que tu Next.js tiene un reverse-proxy o middleware al backend.
  // Si no lo tienes, reemplaza `/withdrawals/my-withdrawals` por tu URL base:
  // `${process.env.NEXT_PUBLIC_API_URL}/withdrawals/my-withdrawals`
  const { data, error, isLoading, mutate } = useSWR<PageResponse<Withdrawal>>(
    `/withdrawals/my-withdrawals?${query}`,
    fetcher
  );

  const withdrawals = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
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
              withdrawals.map((w) => (
                <tr key={w.withdrawalID} className="text-sm">
                  <td className="px-4 py-3">
                    {new Date(w.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    ${Number(w.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">{w.wallet}</td>
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
          Página {data?.page ?? page} de {totalPages}
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
  );
}
