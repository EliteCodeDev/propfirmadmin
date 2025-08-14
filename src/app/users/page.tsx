"use client";

import MainLayout from "@/components/layouts/MainLayout";
import LoadingSpinner from "@/components/common/loadingSpinner";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/components/common/tableComponent";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TrophyIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

type LimitParam = number;

interface RoleOption {
  roleID: string;
  name: string;
}

interface User {
  userID?: string;
  id?: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isConfirmed?: boolean;
  createdAt?: string | Date;
  role?: { roleID?: string; name?: string };
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

/* Badge de estado (isConfirmed) */
function StatusBadge({ confirmed }: { confirmed: boolean }) {
  return (
    <span
      className={
        confirmed
          ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
          : "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
      }
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${confirmed ? "bg-emerald-400" : "bg-amber-400"}`} />
      {confirmed ? "Active" : "Unconfirmed"}
    </span>
  );
}

/* Unwrap robusto */
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
  const page  = typeof (lvl1 as any)?.page === "number" ? (lvl1 as any).page : 1;
  const limit = typeof (lvl1 as any)?.limit === "number" ? (lvl1 as any).limit : items.length || 10;
  const totalPages =
    typeof (lvl1 as any)?.totalPages === "number"
      ? (lvl1 as any).totalPages
      : limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;

  return { items, total, page, limit, totalPages };
}

/* Helper para headers tipado correctamente */
const buildHeaders = (token?: string): HeadersInit =>
  token ? { Authorization: `Bearer ${token}` } : {};

function UsersInner() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  // Estado UI
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<LimitParam>(10);
  const [search, setSearch] = useState<string>("");

  // Modales
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [selectedRoleID, setSelectedRoleID] = useState<string>("");

  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const accessToken = (session as any)?.accessToken as string | undefined;

  // Querystring
  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (search.trim()) q.set("search", search.trim());
    return q.toString();
  }, [page, limit, search]);

  // Rutas reales del backend
  const usersPath = "/api/users";
  const rolesPath = "/api/roles";

  const usersUrl = `${API_BASE}${usersPath}?${query}`;

  // fetchers (con HeadersInit correcto)
  const fetcher = async (u: string) => {
    const res = await fetch(u, {
      headers: buildHeaders(accessToken),
      credentials: "include",
    });
    if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
    return res.json();
  };

  const fetchRoles = async (): Promise<RoleOption[]> => {
    const res = await fetch(`${API_BASE}${rolesPath}?page=1&limit=1000`, {
      headers: buildHeaders(accessToken),
      credentials: "include",
    });
    if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
    const json = await res.json();
    const items = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
    return items
      .map((x: any) => ({ roleID: String(x.roleID ?? x.id ?? ""), name: String(x.name ?? "") }))
      .filter((x: RoleOption) => x.roleID && x.name);
  };

  // SWR
  const { data, error, isLoading, mutate } = useSWR<PageResponse<User>>(accessToken ? usersUrl : null, fetcher);
  const { data: rolesData } = useSWR<RoleOption[]>(accessToken ? "roles" : null, fetchRoles);

  // Redirección si no hay sesión
  useEffect(() => {
    if (authStatus === "unauthenticated" || (!accessToken && authStatus !== "loading")) {
      router.replace("/login");
    }
  }, [authStatus, accessToken, router]);

  if (authStatus === "loading" || (!accessToken && authStatus !== "unauthenticated")) {
    return (
      <LoadingSpinner size="md" text="Verificando Sesión" subtitle="Validando credenciales de usuario..." showProgress />
    );
  }
  if (!accessToken) {
    return (
      <LoadingSpinner size="md" text="Redirigiendo" subtitle="Redirigiendo al sistema de login..." showProgress />
    );
  }

  // Normalización
  const pageObj = unwrapPage<User>(data as unknown);
  const users = pageObj.items;
  const totalPages = pageObj.totalPages;
  const roleOptions: RoleOption[] = Array.isArray(rolesData) ? rolesData : [];

  // Columnas
  const columns: ColumnConfig[] = [
    { key: "serial", label: "ID", type: "normal" },
    { key: "name", label: "NAME", type: "normal" },
    { key: "email", label: "EMAIL", type: "normal" },
    { key: "role", label: "ROLE", type: "normal" },
    { key: "status", label: "STATUS", type: "normal", render: (v) => <StatusBadge confirmed={Boolean(v)} /> },
    { key: "country", label: "COUNTRY", type: "normal" },
    { key: "createdAt", label: "DATE JOINED", type: "normal" },

    // NUEVA COLUMNA: navegar al detalle del usuario
    {
      key: "view",
      label: "VIEW",
      type: "normal",
      render: (_: unknown, row: any) => {
        const u = row.__raw as User;
        const uid = String(u.userID ?? u.id ?? "");
        return (
          <button
            className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Ver challenges del usuario"
            onClick={() => uid && router.push(`/users/${uid}`)}
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            View
          </button>
        );
      },
    },

    {
      key: "actions",
      label: "ACTIONS",
      type: "normal",
      render: (_: unknown, row: any) => (
        <button
          className="px-2 py-1 text-xs border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          onClick={() => {
            setRoleModalUser(row.__raw as User);
            setSelectedRoleID(String((row.__raw as User)?.role?.roleID ?? ""));
            setRoleModalOpen(true);
          }}
        >
          Change role
        </button>
      ),
    },
  ];

  const offset = (page - 1) * limit;

  // Filas (incluye __raw para acciones)
  const rows = users.map((u, idx) => {
    const serial = offset + idx + 1;
    const name = `${(u.firstName ?? "").trim()} ${(u.lastName ?? "").trim()}`.trim() || "-";
    const roleName = u.role?.name ?? "-";
    const confirmed = Boolean(u.isConfirmed);
    const country = u.address?.country ?? "-";
    const created = u.createdAt ? new Date(u.createdAt as any).toLocaleDateString() : "-";
    return {
      serial,
      name,
      email: u.email || "-",
      role: roleName,
      status: confirmed,
      country,
      createdAt: created,
      __raw: u,
    };
  });

  // Helpers API
  const getUserId = (u: User) => String(u.userID ?? u.id ?? "");

  const createUser = async (body: any) => {
    const res = await fetch(`${API_BASE}${usersPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...buildHeaders(accessToken) },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
    return res.json();
  };

  const assignRole = async (userID: string, roleId: string) => {
    const res = await fetch(`${API_BASE}${rolesPath}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...buildHeaders(accessToken) },
      credentials: "include",
      body: JSON.stringify({ userID, roleId }),
    });
    if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
    return true;
  };

  // Guardar rol
  const onSaveRole = async () => {
    if (!roleModalUser || !selectedRoleID) {
      setMsg("Select a role.");
      return;
    }
    try {
      setBusy(true);
      await assignRole(getUserId(roleModalUser), selectedRoleID);
      setMsg("Role updated.");
      setRoleModalOpen(false);
      setRoleModalUser(null);
      await mutate();
    } catch (e: any) {
      setMsg(e?.message || "Error updating role");
    } finally {
      setBusy(false);
    }
  };

  // Crear Admin
  const onCreateAdmin = async () => {
    const adminRole = roleOptions.find((r) => r.name.toLowerCase() === "admin");
    if (!adminRole) {
      setMsg("Role 'admin' not found.");
      return;
    }
    if (!newAdmin.email || !newAdmin.username || !newAdmin.password) {
      setMsg("Email, Username and Password are required.");
      return;
    }
    try {
      setBusy(true);
      const created = await createUser({ ...newAdmin, isConfirmed: true });
      const uid = String(created?.userID ?? created?.id ?? "");
      if (!uid) throw new Error("User created but ID missing");

      await assignRole(uid, adminRole.roleID);
      setMsg("Admin created successfully.");
      setCreateAdminOpen(false);
      setNewAdmin({ firstName: "", lastName: "", username: "", email: "", password: "" });
      await mutate();
    } catch (e: any) {
      setMsg(e?.message || "Error creating admin");
    } finally {
      setBusy(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen dark:bg-gray-800 transition-colors duration-200">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Manage and monitor all system users</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg px-4 py-2 text-white shadow-sm">
                  <div className="text-xs font-medium">Total Users</div>
                  <div className="text-lg font-bold">{pageObj.total}</div>
                </div>
                <button
                  className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => setCreateAdminOpen(true)}
                >
                  + Create Admin
                </button>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search Users</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                    placeholder="Search by username or email..."
                    className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
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

          {/* Tabla */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <PaginatedCardTable
              title=""
              columns={columns}
              rows={rows}
              isLoading={isLoading}
              emptyText={error ? (error as Error).message : "No users found"}
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

          {msg && <div className="text-sm text-center text-gray-700 dark:text-gray-300">{msg}</div>}
        </div>
      </div>

      {/* Modal Cambiar Rol */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Change Role</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 break-words">
              User: <b>{roleModalUser?.email}</b>
            </p>

            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Select role</label>
            <select
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
              value={selectedRoleID}
              onChange={(e) => setSelectedRoleID(e.target.value)}
            >
              <option value="">-- Select --</option>
              {roleOptions.map((r) => (
                <option key={r.roleID} value={r.roleID}>{r.name}</option>
              ))}
            </select>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                className="px-3 py-2 text-sm rounded-lg border"
                onClick={() => { setRoleModalOpen(false); setRoleModalUser(null); }}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white disabled:opacity-50"
                onClick={onSaveRole}
                disabled={busy || !selectedRoleID}
              >
                {busy ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Admin */}
      {createAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Create Admin</h3>
            <div className="grid grid-cols-1 gap-3">
              <input className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                placeholder="First name" value={newAdmin.firstName}
                onChange={(e) => setNewAdmin((s) => ({ ...s, firstName: e.target.value }))} />
              <input className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                placeholder="Last name" value={newAdmin.lastName}
                onChange={(e) => setNewAdmin((s) => ({ ...s, lastName: e.target.value }))} />
              <input className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                placeholder="Username" value={newAdmin.username}
                onChange={(e) => setNewAdmin((s) => ({ ...s, username: e.target.value }))} />
              <input className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                placeholder="Email" type="email" value={newAdmin.email}
                onChange={(e) => setNewAdmin((s) => ({ ...s, email: e.target.value }))} />
              <input className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                placeholder="Password" type="password" value={newAdmin.password}
                onChange={(e) => setNewAdmin((s) => ({ ...s, password: e.target.value }))} />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button className="px-3 py-2 text-sm rounded-lg border" onClick={() => setCreateAdminOpen(false)} disabled={busy}>
                Cancel
              </button>
              <button className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                onClick={onCreateAdmin} disabled={busy}>
                {busy ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
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
