"use client";

import MainLayout from "@/components/layouts/MainLayout";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import { ManagerHeader } from "@/components/challenge-templates/ManagerHeader";
import type { ColumnConfig, BrokerAccount, PageResponse } from "@/types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";  // 👈 para obtener token
import { apiBaseUrl } from "@/config";

type LimitParam = number;
type UsedFilter = "all" | "used" | "free";

const API_BASE = apiBaseUrl.replace(/\/$/, "");

function UsedBadge({ used }: { used: boolean }) {
  const cls = used
    ? "bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] ${cls}`}>{used ? "Used" : "Free"}</span>
  );
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function unwrapPage<T = Record<string, unknown>>(raw: unknown): {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  const lvl1Data = (raw as { data?: unknown })?.data;
  const lvl1: unknown = lvl1Data !== undefined ? lvl1Data : raw;

  let items: T[] = [];
  if (Array.isArray(lvl1)) items = lvl1 as T[];
  else if (lvl1 && typeof lvl1 === "object") {
    const dataArr = (lvl1 as { data?: unknown }).data;
    const itemsArr = (lvl1 as { items?: unknown }).items;
    if (Array.isArray(dataArr)) items = dataArr as T[];
    else if (Array.isArray(itemsArr)) items = itemsArr as T[];
  }

  const totalVal = (lvl1 as { total?: unknown })?.total;
  const pageVal = (lvl1 as { page?: unknown })?.page;
  const limitVal = (lvl1 as { limit?: unknown })?.limit;
  const totalPagesVal = (lvl1 as { totalPages?: unknown })?.totalPages;

  const total = typeof totalVal === "number" ? totalVal : items.length;
  const page = typeof pageVal === "number" ? pageVal : 1;
  const limit = typeof limitVal === "number" ? limitVal : items.length || 10;
  const totalPages =
    typeof totalPagesVal === "number"
      ? totalPagesVal
      : limit > 0
        ? Math.max(1, Math.ceil(total / limit))
        : 1;

  return { items, total, page, limit, totalPages };
}

export default function BrokerAccountsPage() {
  const router = useRouter();
  const { data: session, status } = useSession(); // 👈 obtenemos la sesión
  const accessToken = session?.accessToken as string | undefined;

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<LimitParam>(10);
  const [usedFilter, setUsedFilter] = useState<UsedFilter>("all");
  const [search, setSearch] = useState<string>("");

  // debounce para búsqueda
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (usedFilter !== "all") q.set("isUsed", usedFilter === "used" ? "true" : "false");
    if (debouncedSearch.trim()) q.set("login", debouncedSearch.trim());
    return q.toString();
  }, [page, limit, usedFilter, debouncedSearch]);

  const url = `${API_BASE}/broker-accounts?${query}`;

  const fetcher = async (u: string) => {
    const res = await fetch(u, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      credentials: "include",
    });
    if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
    return res.json();
  };

  const { data, error, isLoading, mutate } = useSWR<PageResponse<BrokerAccount>>(
    accessToken ? url : null, // 👈 evita llamadas si no hay token
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  // si no está autenticado, redirigir
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <MainLayout>
        <div className="p-6">Verificando sesión…</div>
      </MainLayout>
    );
  }

  if (!accessToken) {
    return (
      <MainLayout>
        <div className="p-6">No autorizado. Redirigiendo…</div>
      </MainLayout>
    );
  }

  // unwrap datos
  const pageObj = unwrapPage<BrokerAccount>(data as unknown);
  const accounts = pageObj.items;
  const totalPages = pageObj.totalPages;
  const offset = (page - 1) * limit;

  const columns: ColumnConfig[] = [
    { key: "serial", label: "#", type: "normal" },
    { key: "login", label: "Login", type: "normal" },
    { key: "server", label: "Server", type: "normal" },
    { key: "serverIp", label: "Server IP", type: "normal" },
    { key: "platform", label: "Platform", type: "normal" },
    { key: "used", label: "Used", type: "normal", render: (v) => <UsedBadge used={Boolean(v)} /> },
    { key: "balance", label: "Initial Balance", type: "normal" },
  ];

  const rows = accounts.map((a, idx) => ({
    __raw: a,
    serial: offset + idx + 1,
    login: a.login,
    server: a.server || "-",
    serverIp: a.serverIp || "-",
    platform: a.platform || "-",
    used: a.isUsed,
    balance: typeof a.innitialBalance === "number" ? money.format(Number(a.innitialBalance)) : "-",
  }));

  return (
    <MainLayout>
      <div className="p-6 space-y-6 pt-4">
        <ManagerHeader
          title="Broker Accounts"
          description="List of available and used broker accounts"
          totalCount={pageObj.total}
          showTotalCount={true}
        />

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-end">
            {/* Buscar */}
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search by Login</label>
              <input
                type="text"
                placeholder="Enter login..."
                className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Filtro estado */}
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status Filter</label>
              <select
                className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={usedFilter}
                onChange={(e) => {
                  setUsedFilter(e.target.value as UsedFilter);
                  setPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="free">Free Only</option>
                <option value="used">Used Only</option>
              </select>
            </div>

            {/* Items por página */}
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Items per page</label>
              <select
                className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={String(limit)}
                onChange={(e) => {
                  const n = Number(e.target.value) as LimitParam;
                  setLimit(n);
                  setPage(1);
                }}
              >
                <option value="10">10 items</option>
                <option value="20">20 items</option>
                <option value="50">50 items</option>
                <option value="100">100 items</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <PaginatedCardTable
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          emptyText={error ? (error as Error).message : "No broker accounts found"}
          actionsHeader="Acciones"
          renderActions={(row) => {
            const acc = row.__raw as BrokerAccount | undefined;
            const id = acc?.brokerAccountID;
            return (
              <div className="flex items-center justify-center">
                <button
                  className="px-2 py-1 text-[11px] rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  onClick={() => id && router.push(`/admin/brokeraccounts/${id}`)}
                  disabled={!id}
                >
                  Ver
                </button>
              </div>
            );
          }}
          pagination={{
            currentPage: page,
            totalPages: Math.max(1, totalPages),
            totalItems: pageObj.total,
            pageSize: limit,
            onPageChange: (p) => setPage(p),
            onPageSizeChange: (n) => {
              setPage(1);
              setLimit(n as LimitParam);
            },
          }}
        />
      </div>
    </MainLayout>
  );
}
