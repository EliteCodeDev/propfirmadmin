"use client";

import MainLayout from "@/components/layouts/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/types";
import EditUserModal from "@/components/user/EditUserModal";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import type { RoleOption, User, PageResponse } from "@/types";
import { apiBaseUrl } from "@/config";

type LimitParam = number;

// [moved-to-src/types] Original inline types now live in src/types.
// interface RoleOption { ... }
// interface User { ... }
// interface PageResponse<T> { ... }

const API_BASE = apiBaseUrl.replace(/\/$/, "");

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
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          confirmed ? "bg-emerald-400" : "bg-amber-400"
        }`}
      />
      {confirmed ? "Active" : "Unconfirmed"}
    </span>
  );
}

/* Unwrap robusto */
function unwrapPage<T = Record<string, unknown>>(
  raw: unknown
): {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  const lvl1 =
    (raw as { data?: unknown } | (unknown & Record<string, unknown>)) &&
    (raw as { data?: unknown }).data !== undefined
      ? (raw as { data?: unknown }).data
      : raw;

  let items: T[] = [];
  if (Array.isArray(lvl1)) items = lvl1 as T[];
  else if (lvl1 && typeof lvl1 === "object") {
    const d = (lvl1 as { data?: unknown }).data;
    const it = (lvl1 as { items?: unknown }).items;
    if (Array.isArray(d)) items = d as T[];
    else if (Array.isArray(it)) items = it as T[];
  }

  const total =
    typeof (lvl1 as { total?: unknown })?.total === "number"
      ? ((lvl1 as { total?: unknown }).total as number)
      : items.length;
  const page =
    typeof (lvl1 as { page?: unknown })?.page === "number"
      ? ((lvl1 as { page?: unknown }).page as number)
      : 1;
  const limit =
    typeof (lvl1 as { limit?: unknown })?.limit === "number"
      ? ((lvl1 as { limit?: unknown }).limit as number)
      : items.length || 10;
  const totalPages =
    typeof (lvl1 as { totalPages?: unknown })?.totalPages === "number"
      ? ((lvl1 as { totalPages?: unknown }).totalPages as number)
      : limit > 0
      ? Math.max(1, Math.ceil(total / limit))
      : 1;

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

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });
  const [selectedNewRoleID, setSelectedNewRoleID] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Modal editar usuario
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const accessToken = session?.accessToken as string | undefined;

  // Querystring
  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (search.trim()) q.set("search", search.trim());
    return q.toString();
  }, [page, limit, search]);

  // Rutas reales del backend
  const usersPath = "/users";
  const rolesPath = "/roles";
  const bffRolesAssign = `/api/server/roles/assign`;

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

  const fetchRoles = async (token?: string): Promise<RoleOption[]> => {
    // Backend valida limit <= 100; incluimos reintentos en caso de validaciones estrictas
    const tryFetch = async (url: string) => {
      const r = await fetch(url, {
        headers: { Accept: "application/json", ...buildHeaders(token) },
        credentials: "include",
      });
      return r;
    };

    let res = await tryFetch(`${API_BASE}${rolesPath}?page=1&limit=100`);
    if (!res.ok && (res.status === 400 || res.status === 422)) {
      // Reintentar con un límite menor
      res = await tryFetch(`${API_BASE}${rolesPath}?page=1&limit=50`);
    }
    if (!res.ok && (res.status === 400 || res.status === 422)) {
      // Último intento: sin paginación (usa defaults del backend)
      res = await tryFetch(`${API_BASE}${rolesPath}`);
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Error ${res.status}`);
    }

    const json: unknown = await res.json();
    // Debug: ayuda a diagnosticar si el backend responde con tupla u objeto
    try {
      console.debug("[roles] raw response", json);
    } catch {}
    // Soportar múltiples formatos de respuesta:
    // 1) [items, total] (findAndCount)
    // 2) { data: items, meta: { ... } }
    // 2b) { data: { data: items, meta: { ... } } }
    // 3) items[] directo
    let items: unknown[] = [];
    if (Array.isArray(json)) {
      // Caso [items, total] o items[] directo
      if (
        Array.isArray(json[0]) &&
        (typeof json[1] === "number" || typeof json[1] === "object")
      ) {
        items = json[0] as unknown[];
      } else {
        items = json as unknown[];
      }
    } else if (Array.isArray((json as { data?: unknown })?.data)) {
      // Puede ser data = items[] o data = [items[], total]
      const d = (json as { data: unknown[] }).data as unknown[];
      if (
        Array.isArray(d[0]) &&
        (typeof (d as unknown[])[1] === "number" ||
          typeof (d as unknown[])[1] === "object")
      ) {
        items = (d[0] as unknown[]) ?? [];
      } else {
        items = d as unknown[];
      }
    } else if (Array.isArray((json as { items?: unknown })?.items)) {
      items = (json as { items: unknown[] }).items as unknown[];
    } else if (Array.isArray((json as { roles?: unknown })?.roles)) {
      items = (json as { roles: unknown[] }).roles as unknown[];
    } else if (
      Array.isArray((json as { data?: { data?: unknown[] } })?.data?.data)
    ) {
      items = (json as { data: { data: unknown[] } }).data.data as unknown[];
    } else if (
      Array.isArray((json as { data?: { items?: unknown[] } })?.data?.items)
    ) {
      items = (json as { data: { items: unknown[] } }).data.items as unknown[];
    } else if (
      Array.isArray((json as { data?: { roles?: unknown[] } })?.data?.roles)
    ) {
      items = (json as { data: { roles: unknown[] } }).data.roles as unknown[];
    } else if (
      Array.isArray((json as { result?: { data?: unknown[] } })?.result?.data)
    ) {
      items = (json as { result: { data: unknown[] } }).result
        .data as unknown[];
    } else if (
      Array.isArray((json as { payload?: { data?: unknown[] } })?.payload?.data)
    ) {
      items = (json as { payload: { data: unknown[] } }).payload
        .data as unknown[];
    }
    const result: RoleOption[] = items
      .map((x) => {
        const obj = x as { roleID?: unknown; id?: unknown; name?: unknown };
        return {
          roleID: String(obj.roleID ?? obj.id ?? ""),
          name: String(obj.name ?? ""),
        };
      })
      .filter((x: RoleOption) => x.roleID && x.name);
    try {
      console.debug("[roles] parsed count", result.length);
    } catch {}
    return result;
  };

  // SWR
  const { data, error, isLoading, mutate } = useSWR<PageResponse<User>>(
    accessToken ? usersUrl : null,
    fetcher
  );
  const {
    data: rolesData,
    error: rolesError,
    isLoading: rolesLoading,
    mutate: mutateRoles,
  } = useSWR<RoleOption[]>(
    accessToken ? ["roles", accessToken] : null,
    ([, token]) => fetchRoles(token as string | undefined)
  );

  // Redirección si no hay sesión
  useEffect(() => {
    if (
      authStatus === "unauthenticated" ||
      (!accessToken && authStatus !== "loading")
    ) {
      router.replace("/auth/login");
    }
  }, [authStatus, accessToken, router]);

  if (
    authStatus === "loading" ||
    (!accessToken && authStatus !== "unauthenticated")
  ) {
    return (
      <LoadingSpinner
        size="md"
        text="Verificando Sesión"
        subtitle="Validando credenciales de usuario..."
        showProgress
      />
    );
  }
  if (!accessToken) {
    return (
      <LoadingSpinner
        size="md"
        text="Redirigiendo"
        subtitle="Redirigiendo al sistema de login..."
        showProgress
      />
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
    {
      key: "status",
      label: "STATUS",
      type: "normal",
      render: (v) => <StatusBadge confirmed={Boolean(v)} />,
    },
    { key: "country", label: "COUNTRY", type: "normal" },
    { key: "createdAt", label: "DATE JOINED", type: "normal" },
    {
      key: "edit",
      label: "EDIT",
      type: "normal",
      render: (_: unknown, row: Record<string, unknown>) => (
        <button
          className="p-1.5 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-700"
          title="Edit user"
          aria-label="Edit user"
          onClick={() => {
            setEditUser(row.__raw as User);
            setEditOpen(true);
          }}
        >
          <PencilSquareIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>
      ),
    },

    // NUEVA COLUMNA: navegar al detalle del usuario
    {
      key: "view",
      label: "VIEW",
      type: "normal",
      render: (_: unknown, row: Record<string, unknown>) => {
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
      render: (_: unknown, row: Record<string, unknown>) => (
        <button
          className="px-2 py-1 text-xs border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          onClick={() => {
            setRoleModalUser(row.__raw as User);
            setSelectedRoleID(String((row.__raw as User)?.role?.roleID ?? ""));
            // revalidar roles al abrir para evitar estados viejos
            mutateRoles();
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
    const name =
      `${(u.firstName ?? "").trim()} ${(u.lastName ?? "").trim()}`.trim() ||
      "-";
    const roleName = u.role?.name ?? "-";
    const confirmed = Boolean(u.isConfirmed);
    const country = u.address?.country ?? "-";
    const created = u.createdAt
      ? new Date(u.createdAt as string | number | Date).toLocaleDateString()
      : "-";
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

  type CreateUserBody = {
    firstName?: string;
    lastName?: string;
    username: string;
    email: string;
    password: string;
    roleId?: string;
  };
  const createUser = async (body: CreateUserBody) => {
    const res = await fetch(`${API_BASE}${usersPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...buildHeaders(accessToken),
      },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
    return res.json();
  };

  type UpdateUserBody = Partial<{
    username: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    isConfirmed: boolean;
    isBlocked: boolean;
    isVerified: boolean;
  }>;
  const updateUser = async (userId: string, body: UpdateUserBody) => {
    const res = await fetch(`${API_BASE}${usersPath}/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...buildHeaders(accessToken),
      },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
    return res.json();
  };

  const assignRole = async (userID: string, roleId: string) => {
    // Use BFF to ensure Authorization header is present and avoid CORS
    const res = await fetch(bffRolesAssign, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userID, roleId }),
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json?.message || `Error ${res.status}`);
      } catch {
        throw new Error(text || `Error ${res.status}`);
      }
    }
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
    } catch (e) {
      const maybe = e as unknown;
      const message =
        typeof maybe === "object" && maybe !== null && "message" in maybe
          ? String((maybe as { message?: unknown }).message || "")
          : "";
      setMsg(message || "Error updating role");
    } finally {
      setBusy(false);
    }
  };

  // Crear Usuario
  const onCreateUser = async () => {
    if (!newUser.email || !newUser.username || !newUser.password) {
      setMsg("Email, Username and Password are required.");
      return;
    }
    // role es opcional; si no hay, backend intentará asignar 'user'
    try {
      // Cerrar modal y limpiar antes del llamado para asegurar UX consistente
      const payloadUser = { ...newUser };
      const chosenRoleId = selectedNewRoleID || undefined;
      setCreateUserOpen(false);
      setNewUser({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
      });
      setSelectedNewRoleID("");

      setBusy(true);
      const created = await createUser({
        ...payloadUser,
        roleId: chosenRoleId,
      });
      const uid = String(created?.userID ?? created?.id ?? "");
      if (!uid) {
        // No bloquea el cierre del modal; sólo informa
        setMsg("User created, but ID was not returned by API.");
      }

      // Backend ya asigna rol si se envía roleId o por defecto 'user'
      setMsg("User created.");
      await mutate();
    } catch (e) {
      const maybe = e as unknown;
      const message =
        typeof maybe === "object" && maybe !== null && "message" in maybe
          ? String((maybe as { message?: unknown }).message || "")
          : "";
      setMsg(message || "Error creating user");
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
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  User Management
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Manage and monitor all system users
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg px-4 py-2 text-white shadow-sm">
                  <div className="text-xs font-medium">Total Users</div>
                  <div className="text-lg font-bold">{pageObj.total}</div>
                </div>
                <button
                  className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => {
                    // Preseleccionar rol "user" por defecto
                    const userRole = roleOptions.find(
                      (r) => r.name.toLowerCase() === "user"
                    );
                    setSelectedNewRoleID(userRole?.roleID ?? "");
                    // Refrescar roles al abrir
                    mutateRoles();
                    setCreateUserOpen(true);
                  }}
                >
                  + Create User
                </button>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search Users
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => {
                      setPage(1);
                      setSearch(e.target.value);
                    }}
                    placeholder="Search by username, email, or name..."
                    autoComplete="off"
                    name="users-search"
                    autoCorrect="off"
                    autoCapitalize="none"
                    className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Items per page
                </label>
                <select
                  className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  value={String(limit)}
                  onChange={(e) => {
                    const n = Number(e.target.value) as LimitParam;
                    setPage(1);
                    setLimit(n);
                  }}
                >
                  <option value="10">10 items</option>
                  <option value="20">20 items</option>
                  <option value="50">50 items</option>
                  <option value="100">100 items</option>
                </select>
              </div>

              <div className="w-full sm:w-auto">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Actions
                </label>
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
          <PaginatedCardTable
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
              onPageSizeChange: (n) => {
                setPage(1);
                setLimit(n as LimitParam);
              },
            }}
          />

          {msg && (
            <div className="text-sm text-center text-gray-700 dark:text-gray-300">
              {msg}
            </div>
          )}
        </div>
      </div>

      {/* Modal Cambiar Rol */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Change Role
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 break-words">
              User: <b>{roleModalUser?.email}</b>
            </p>

            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select role
            </label>
            <select
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
              value={selectedRoleID}
              onChange={(e) => setSelectedRoleID(e.target.value)}
              disabled={rolesLoading}
            >
              {rolesLoading && <option value="">Loading...</option>}
              {!rolesLoading && <option value="">-- Select --</option>}
              {!rolesLoading && roleOptions.length === 0 && (
                <option value="" disabled>
                  No roles available
                </option>
              )}
              {roleOptions.map((r) => (
                <option key={r.roleID} value={r.roleID}>
                  {r.name}
                </option>
              ))}
            </select>
            {rolesError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400 break-words">
                Failed to load roles.{" "}
                {rolesError instanceof Error ? rolesError.message : ""}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                className="px-3 py-2 text-sm rounded-lg border"
                onClick={() => {
                  setRoleModalOpen(false);
                  setRoleModalUser(null);
                }}
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

      {/* Modal Crear Usuario */}
      {createUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Create User
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <input
                className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                placeholder="First name"
                value={newUser.firstName}
                onChange={(e) =>
                  setNewUser((s) => ({ ...s, firstName: e.target.value }))
                }
              />
              <input
                className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                placeholder="Last name"
                value={newUser.lastName}
                onChange={(e) =>
                  setNewUser((s) => ({ ...s, lastName: e.target.value }))
                }
              />
              <input
                className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser((s) => ({ ...s, username: e.target.value }))
                }
              />
              <input
                className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                placeholder="Email"
                type="email"
                value={newUser.email}
                autoComplete="off"
                name="new-user-email"
                onChange={(e) =>
                  setNewUser((s) => ({ ...s, email: e.target.value }))
                }
              />
              <input
                className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                placeholder="Password"
                type="password"
                value={newUser.password}
                autoComplete="new-password"
                name="new-user-password"
                onChange={(e) =>
                  setNewUser((s) => ({ ...s, password: e.target.value }))
                }
              />

              {/* Select de Rol */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                  value={selectedNewRoleID}
                  onChange={(e) => setSelectedNewRoleID(e.target.value)}
                  disabled={rolesLoading}
                >
                  {rolesLoading && <option value="">Loading...</option>}
                  {!rolesLoading && <option value="">-- Select --</option>}
                  {!rolesLoading && roleOptions.length === 0 && (
                    <option value="" disabled>
                      No roles available
                    </option>
                  )}
                  {roleOptions.map((r) => (
                    <option key={r.roleID} value={r.roleID}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {rolesError && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400 break-words">
                    Failed to load roles.{" "}
                    {rolesError instanceof Error ? rolesError.message : ""}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                className="px-3 py-2 text-sm rounded-lg border"
                onClick={() => {
                  setCreateUserOpen(false);
                  setNewUser({
                    firstName: "",
                    lastName: "",
                    username: "",
                    email: "",
                    password: "",
                  });
                  setSelectedNewRoleID("");
                }}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                onClick={onCreateUser}
                disabled={busy}
              >
                {busy ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario (Reutilizable) */}
      {editOpen && (
        <EditUserModal
          open={editOpen}
          user={editUser as User | null}
          onClose={() => {
            setEditOpen(false);
            setEditUser(null);
          }}
          onSubmit={async (vals, uid) => {
            // Solo enviar campos permitidos por UpdateUserDto
            const payload: UpdateUserBody = {
              username: vals.username,
              email: vals.email,
              firstName: vals.firstName,
              lastName: vals.lastName,
              phone: vals.phone,
              isConfirmed: vals.isConfirmed,
              isBlocked: vals.isBlocked,
              isVerified: vals.isVerified,
            };
            // limpiar undefined para no sobrescribir con undefined
            (Object.keys(payload) as (keyof UpdateUserBody)[]).forEach(
              (k) =>
                payload[k] === undefined &&
                delete (payload as Record<string, unknown>)[k as string]
            );
            await updateUser(uid, payload);
            await mutate();
          }}
          title="Edit User"
          submitLabel="Save"
        />
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
