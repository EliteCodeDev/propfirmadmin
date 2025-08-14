"use client";

import MainLayout from "@/components/layouts/MainLayout";
import { usersApi, type UserEntity, type UserQuery } from "@/api/users";
import { useEffect, useMemo, useState } from "react";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/components/common/tableComponent";
import { useSession, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";

function UsersInner() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<UserEntity[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [titleCounts, setTitleCounts] = useState<string>("");

  const canLoad = Boolean((session as { accessToken?: string } | null | undefined)?.accessToken);

  const query = useMemo<UserQuery>(() => ({ page, limit, search: search || undefined }), [page, limit, search]);

  const fetchData = async () => {
    if (!canLoad) return;
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.list(query);
      // Normalize shape differences
      const maybeAny = res as unknown as { data?: unknown; totalPages?: unknown } | unknown[];
      const arr = Array.isArray(maybeAny)
        ? (maybeAny as unknown[])
        : Array.isArray((maybeAny as { data?: unknown[] }).data)
        ? ((maybeAny as { data: unknown[] }).data)
        : [];
      const pages = typeof (maybeAny as { totalPages?: unknown }).totalPages === "number"
        ? ((maybeAny as { totalPages: number }).totalPages)
        : 1;
      setItems(arr as UserEntity[]); // server includes extra props; safe cast for display
      setTotalPages(pages);
      setTitleCounts(`Página ${page} de ${pages}`);
    } catch (e) {
      // Try to decode axios error shape
      const maybeAxios = e as { response?: { status?: number; data?: unknown } };
      if (maybeAxios?.response?.status === 403) {
        setError("No tienes permisos para ver los usuarios (se requiere rol admin).");
      } else if (maybeAxios?.response?.status === 401) {
        setError("Sesión expirada o no autorizada.");
      } else {
        const msg = e instanceof Error ? e.message : "Error al cargar usuarios";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, canLoad]);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              placeholder="Buscar por username"
              className="px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>

        {(() => {
          const columns: ColumnConfig[] = [
            { key: "id", label: "ID", type: "normal" },
            { key: "username", label: "Username", type: "normal" },
            { key: "email", label: "Email", type: "normal" },
            { key: "role", label: "Rol", type: "normal" },
            {
              key: "status",
              label: "Estado",
              type: "badge",
              render: (value) => {
                const isBlocked = String(value) === "Bloqueado";
                return (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    isBlocked
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700"
                  }`}>
                    {value as string}
                  </span>
                );
              },
            },
            { key: "createdAt", label: "Creado", type: "normal" },
          ];

          const rows = items.map((u) => ({
            id: (u as unknown as { id?: string; userID?: string }).id || (u as unknown as { userID?: string }).userID,
            username: u.username,
            email: u.email,
            role: (u as unknown as { role?: { name?: string } })?.role?.name || "-",
            status: (u as unknown as { isBlocked?: boolean })?.isBlocked ? "Bloqueado" : "Activo",
            createdAt: u.createdAt ? new Date(u.createdAt).toLocaleString() : "-",
          }));

          return (
            <PaginatedCardTable
              title="Lista de Usuarios"
              subtitleBadge={titleCounts}
              columns={columns}
              rows={rows}
              isLoading={loading}
              emptyText={error ? error : "Sin usuarios"}
              pagination={{
                currentPage: page,
                totalPages: Math.max(1, totalPages),
                pageSize: limit,
                onPageChange: (p) => setPage(p),
                onPageSizeChange: (n) => { setPage(1); setLimit(n); },
              }}
            />
          );
        })()}
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
