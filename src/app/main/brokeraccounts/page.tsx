"use client";

import MainLayout from "@/components/layouts/MainLayout";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/components/common/tableComponent";
import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type LimitParam = number;
type UsedFilter = "all" | "used" | "free";

interface BrokerAccount {
  brokerAccountID: string;
  login: string;
  server?: string | null;
  serverIp?: string | null;
  platform?: string | null;
  isUsed: boolean;
  investorPass?: string | null;
  innitialBalance?: number | null;
}

interface PageResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");

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
  const lvl1 = (raw as any)?.data ?? raw;

  let items: T[] = [];
  if (Array.isArray(lvl1)) items = lvl1 as T[];
  else if (lvl1 && typeof lvl1 === "object") {
    if (Array.isArray((lvl1 as any).data)) items = (lvl1 as any).data as T[];
    else if (Array.isArray((lvl1 as any).items)) items = (lvl1 as any).items as T[];
  }

  const total = typeof (lvl1 as any)?.total === "number" ? (lvl1 as any).total : items.length;
  const page = typeof (lvl1 as any)?.page === "number" ? (lvl1 as any).page : 1;
  const limit = typeof (lvl1 as any)?.limit === "number" ? (lvl1 as any).limit : items.length || 10;
  const totalPages =
    typeof (lvl1 as any)?.totalPages === "number"
      ? (lvl1 as any).totalPages
      : limit > 0
      ? Math.max(1, Math.ceil(total / limit))
      : 1;

  return { items, total, page, limit, totalPages };
}

function BrokerAccountsInner() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<LimitParam>(10);
  const [usedFilter, setUsedFilter] = useState<UsedFilter>("all");

  const accessToken = (session as any)?.accessToken as string | undefined;

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (usedFilter !== "all") q.set("isUsed", usedFilter === "used" ? "true" : "false");
    return q.toString();
  }, [page, limit, usedFilter]);

  const basePath = "/api/broker-accounts"; // requiere admin
  const url = `${API_BASE}${basePath}?${query}`;

  const fetcher = async (u: string) => {
    const res = await fetch(u, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      credentials: "include",
    });
    if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
    return res.json();
  };

  const { data, error, isLoading, mutate } = useSWR<PageResponse<BrokerAccount>>(
    accessToken ? url : null,
    fetcher
  );

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Broker Accounts</h1>
            <p className="text-sm text-gray-500">List of available and used broker accounts</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg px-4 py-2 text-white shadow-sm">
            <div className="text-xs font-medium">Total Accounts</div>
            <div className="text-lg font-bold">{pageObj.total}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full sm:w-48">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Used filter</label>
              <select
                className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                value={usedFilter}
                onChange={(e) => { setPage(1); setUsedFilter(e.target.value as UsedFilter); }}
              >
                <option value="all">All</option>
                <option value="free">Free</option>
                <option value="used">Used</option>
              </select>
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Items per page</label>
              <select
                className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                value={String(limit)}
                onChange={(e) => { const n = Number(e.target.value) as LimitParam; setPage(1); setLimit(n); }}
              >
                <option value="10">10 items</option>
                <option value="20">20 items</option>
                <option value="50">50 items</option>
                <option value="100">100 items</option>
              </select>
            </div>

            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Actions</label>
              <button
                onClick={() => mutate()}
                disabled={isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        <PaginatedCardTable
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          emptyText={error ? (error as Error).message : "No broker accounts found"}
          pagination={{
            currentPage: page,
            totalPages: Math.max(1, totalPages),
            totalItems: pageObj.total,
            pageSize: limit,
            onPageChange: (p) => setPage(p),
            onPageSizeChange: (n) => { setPage(1); setLimit(n as LimitParam); },
          }}
        />
      </div>
    </MainLayout>
  );
}

export default function BrokerAccountsPage() {
  return (
    <SessionProvider>
      <BrokerAccountsInner />
    </SessionProvider>
  );
}
