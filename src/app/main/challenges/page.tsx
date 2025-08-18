"use client";

import MainLayout from "@/components/layouts/MainLayout";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import { ManagerHeader } from "@/components/challenge-templates/ManagerHeader";
import type { ColumnConfig } from "@/types";
import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Challenge, PageResponse } from "@/types";
import { apiBaseUrl } from "@/config";

type LimitParam = number;
type Scope = "mine" | "all";

// [moved-to-src/types] Original inline types now live in src/types.
// interface Challenge { ... }
// interface PageResponse<T> { ... }

const API_BASE = apiBaseUrl.replace(/\/$/, "");

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

function ChallengesInner() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [scope, setScope] = useState<Scope>("all");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<LimitParam>(10);
  const [status, setStatus] = useState<string>("");

  const accessToken = session?.accessToken as string | undefined;

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (status) q.set("status", status);
    return q.toString();
  }, [page, limit, status]);

  const basePath = scope === "all" ? "/challenges" : "/challenges/my-challenges";
  const url = `${API_BASE}${basePath}?${query}`;

  const fetcher = async (u: string) => {
    const res = await fetch(u, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      credentials: "include",
    });
    if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
    return res.json();
  };

  const { data, error, isLoading } = useSWR<PageResponse<Challenge>>(accessToken ? url : null, fetcher);

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

  const pageObj = unwrapPage<Challenge>(data as unknown);
  const challenges = pageObj.items;
  const totalPages = pageObj.totalPages;
  const offset = (page - 1) * limit;

  const columns: ColumnConfig[] = [
    { key: "serial", label: "ID", type: "normal" },
    { key: "user", label: "User", type: "normal" },
    { key: "plan", label: "Plan", type: "normal" },
    { key: "category", label: "Category", type: "normal" },
    { key: "login", label: "Login", type: "normal" },
    { key: "platform", label: "Platform", type: "normal" },
    { key: "numPhase", label: "Phase", type: "normal" },
    { key: "dynamicBalance", label: "Dyn. Balance", type: "normal" },
    { key: "status", label: "Status", type: "normal" },
    { key: "startDate", label: "Start", type: "normal" },
    { key: "endDate", label: "End", type: "normal" },
  ];

  const rows: Record<string, unknown>[] = challenges.map((c, idx) => {
    const serial = offset + idx + 1;
    const userName = c.user
      ? `${c.user.firstName ?? ""} ${c.user.lastName ?? ""}`.trim() || c.user.email || c.userID
      : c.userID;
    const plan = c.relation?.plan?.name ?? "-";
    const category = c.relation?.category?.name ?? "-";
    const login = c.brokerAccount?.login ?? "-";
    const platform = c.brokerAccount?.platform ?? "-";
    const dynBal = c.dynamicBalance != null ? String(c.dynamicBalance) : "-";
    const start = c.startDate ? new Date(c.startDate).toLocaleDateString() : "-";
    const end = c.endDate ? new Date(c.endDate).toLocaleDateString() : "-";

  const row: Record<string, unknown> = {
      serial,
      user: userName,
      plan,
      category,
      login,
      platform,
      numPhase: c.numPhase ?? "-",
      dynamicBalance: dynBal,
      status: c.status ?? "-",
      startDate: start,
      endDate: end,
  };
  return row;
  });

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        <ManagerHeader
          title="Challenges"
          description="Manage and monitor all user challenges"
          totalCount={pageObj.total}
          showTotalCount={true}
        />

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full sm:w-48">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Scope</label>
              <select
                className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={scope}
                onChange={(e) => { setPage(1); setScope(e.target.value as Scope); }}
              >
                <option value="all">All (admin)</option>
                <option value="mine">My challenges</option>
              </select>
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={status}
                onChange={(e) => { setPage(1); setStatus(e.target.value); }}
              >
                <option value="">All</option>
                <option value="initial">Initial</option>
                <option value="progress">In Progress</option>
                <option value="approvable">Approvable</option>
                <option value="approved">Approved</option>
                <option value="disapprovable">Disapprovable</option>
                <option value="disapproved">Disapproved</option>
                <option value="withdrawable">Withdrawable</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Items per page</label>
              <select
                className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={String(limit)}
                onChange={(e) => { const n = Number(e.target.value) as LimitParam; setPage(1); setLimit(n); }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>

        <PaginatedCardTable
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          emptyText={error ? (error as Error).message : "No challenges found."}
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

export default function ChallengesPage() {
  return (
    <SessionProvider>
      <ChallengesInner />
    </SessionProvider>
  );
}
