"use client";

import MainLayout from "@/components/layouts/MainLayout";
import LoadingSpinner from "@/components/common/loadingSpinner";
import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/components/common/tableComponent";

type LimitParam = number;

interface User {
  userID?: string;
  id?: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isBlocked?: boolean;
  createdAt?: string | Date;
  role?: { name?: string };
  address?: { country?: string | null };
}

interface PageResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");

/* Badge de estado */
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
          : "px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"
      }
    >
      {active ? "Active" : "Blocked"}
    </span>
  );
}

/* Unwrap robusto: AxiosResponse | {data:[]} | [] */
function unwrapPage<T = Record<string, unknown>>(raw: unknown): {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  const lvl1 = (raw as any)?.data ?? raw;

  let items: T[] = [];
  if (Array.isArray(lvl1)) {
    items = lvl1 as T[];
  } else if (lvl1 && typeof lvl1 === "object") {
    if (Array.isArray((lvl1 as any).data)) items = (lvl1 as any).data as T[];
    else if (Array.isArray((lvl1 as any).items)) items = (lvl1 as any).items as T[];
  }

  const total =
    typeof (lvl1 as any)?.total === "number" ? (lvl1 as any).total : items.length;
  const page =
    typeof (lvl1 as any)?.page === "number" ? (lvl1 as any).page : 1;
  const limit =
    typeof (lvl1 as any)?.limit === "number" ? (lvl1 as any).limit : items.length || 10;
  const totalPages =
    typeof (lvl1 as any)?.totalPages === "number"
      ? (lvl1 as any).totalPages
      : limit > 0
      ? Math.max(1, Math.ceil(total / limit))
      : 1;

  return { items, total, page, limit, totalPages };
}

function UsersInner() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  // Estado UI
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<LimitParam>(10);
  const [search, setSearch] = useState<string>("");

  const accessToken = (session as any)?.accessToken as string | undefined;

  // Querystring
  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (search.trim()) q.set("search", search.trim()); // backend: username/email LIKE
    return q.toString();
  }, [page, limit, search]);

  // Usa el proxy que ya tienes en logs
  const basePath = "/api/users";
  const url = `${API_BASE}${basePath}?${query}`;

  // fetcher
  const fetcher = async (u: string) => {
    const res = await fetch(u, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      credentials: "include",
    });
    if (!res.ok) {
      const text = await res.text();
      const err: Error & { status?: number } = new Error(text || `Error ${res.status}`);
      (err as any).status = res.status;
      throw err;
    }
    return res.json();
  };

  const { data, error, isLoading, mutate } = useSWR<PageResponse<User>>(
    accessToken ? url : null,
    fetcher
  );

  // Redirección si no hay sesión
  useEffect(() => {
    if (authStatus === "unauthenticated" || (!accessToken && authStatus !== "loading")) {
      router.replace("/login");
    }
  }, [authStatus, accessToken, router]);

  // 👇 Aquí está el cambio principal - usar LoadingSpinner en lugar del div simple
  if (authStatus === "loading" || (!accessToken && authStatus !== "unauthenticated")) {
    return (
      <LoadingSpinner
        size="md"
        text="Verificando Sesión"
        subtitle="Validando credenciales de usuario..."
        showProgress={true}
        steps={[
          'Verificando token de sesión...',
          'Validando permisos de usuario...',
          'Cargando configuración...',
          'Preparando dashboard...'
        ]}
      />
    );
  }
  
  if (!accessToken) {
    return (
      <LoadingSpinner
        size="md"
        text="Redirigiendo"
        subtitle="Redirigiendo al sistema de login..."
        showProgress={true}
        steps={[
          'Cerrando sesión actual...',
          'Limpiando datos locales...',
          'Preparando login...',
          'Redirigiendo...'
        ]}
      />
    );
  }

  // Normaliza datos
  const pageObj = unwrapPage<User>(data as unknown);
  const users = pageObj.items;
  const totalPages = pageObj.totalPages;

  // Columnas (ID numérico + status con render)
  const columns: ColumnConfig[] = [
    { key: "serial", label: "ID", type: "normal" }, // numérico (1,2,3…)
    { key: "name", label: "NAME", type: "normal" },
    { key: "username", label: "USERNAME", type: "normal" },
    { key: "email", label: "EMAIL", type: "normal" },
    { key: "role", label: "ROLE", type: "normal" },
    {
      key: "status",
      label: "STATUS",
      type: "normal",
      // 👇 El table espera texto; usamos render para pintar el badge
      render: (val: unknown) => <StatusBadge active={Boolean(val)} />,
    },
    { key: "country", label: "COUNTRY", type: "normal" },
    { key: "createdAt", label: "DATE JOINED", type: "normal" },
  ];

  const offset = (page - 1) * limit;

  // Filas (status es boolean para que el render lo convierta a badge)
  const rows = users.map((u, idx) => {
    const serial = offset + idx + 1; // ← ID numérico solicitado
    const name = `${(u.firstName ?? "").trim()} ${(u.lastName ?? "").trim()}`.trim() || "-";
    const roleName = u.role?.name ?? "-";
    const active = !(u.isBlocked ?? false); // true => Active
    const country = u.address?.country ?? "-"; // requiere relation address en backend
    const created = u.createdAt ? new Date(u.createdAt).toLocaleString() : "-";

    return {
      serial, // número visible
      name,
      username: u.username || "-",
      email: u.email || "-",
      role: roleName,
      status: active, // <- boolean; el render dibuja el badge
      country,
      createdAt: created,
      // opcional: uuid "oculto" por si quieres tooltip
      _uuid: (u as any).id ?? (u as any).userID ?? "",
    };
  });

  return (
    <MainLayout>
      <div className="p-6 space-y-6 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Users</h1>
            <p className="text-sm text-gray-500">You can see all users from here</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search username or email"
              className="px-3 py-2 border rounded-md text-sm"
            />
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={String(limit)}
              onChange={(e) => {
                const n = Number(e.target.value) as LimitParam;
                setPage(1);
                setLimit(n);
              }}
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
            <button
              className="border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => mutate()}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* KPI */}
        <div className="flex justify-end">
          <div className="px-3 py-2 border rounded-md text-sm bg-white">
            <span className="font-medium">Total Users: </span>
            {pageObj.total}
          </div>
        </div>

        {/* Tabla paginada */}
        <PaginatedCardTable
          title="All Users"
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          emptyText={error ? (error as Error).message : "No users found."}
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

export default function UsersPage() {
  return (
    <SessionProvider>
      <UsersInner />
    </SessionProvider>
  );
}