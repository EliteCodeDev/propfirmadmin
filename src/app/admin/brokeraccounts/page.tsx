"use client";

import MainLayout from "@/components/layouts/MainLayout";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import { ManagerHeader } from "@/components/challenge-templates/ManagerHeader";
import type { ColumnConfig, BrokerAccount, PageResponse, CreateBrokerAccountDto, UpdateBrokerAccountDto } from "@/types";
import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";  // 👈 para obtener token
import { apiBaseUrl } from "@/config";
import { Delete, Edit, Eye } from "lucide-react";
import { brokerAccountsApi } from "@/api/broker-accounts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { mutate } from "swr";

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
  
  // Estados para modales
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BrokerAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados del formulario de edición
  const [formData, setFormData] = useState<UpdateBrokerAccountDto>({
    login: "",
    server: "",
    serverIp: "",
    platform: "",
    isUsed: false,
    investorPass: "",
    innitialBalance: 0,
  });
  
  // Estados para modal de creación
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateBrokerAccountDto>({
    login: "",
    password: "",
    server: "",
    serverIp: "",
    platform: "",
    isUsed: false,
    investorPass: "",
    innitialBalance: 0,
  });

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
  
  // Funciones para manejar modales
  const handleEdit = (account: BrokerAccount) => {
    setSelectedAccount(account);
    setFormData({
      login: account.login,
      server: account.server || "",
      serverIp: account.serverIp || "",
      platform: account.platform || "",
      isUsed: account.isUsed,
      investorPass: account.investorPass || "",
      innitialBalance: account.innitialBalance || 0,
    });
    setEditModalOpen(true);
  };
  
  const handleDelete = (account: BrokerAccount) => {
    setSelectedAccount(account);
    setDeleteModalOpen(true);
  };
  
  const handleUpdateSubmit = async () => {
    if (!selectedAccount) return;
    
    setIsSubmitting(true);
    try {
      await brokerAccountsApi.update(selectedAccount.brokerAccountID, formData);
      await mutate(url); // Revalidate data for the current URL
      setEditModalOpen(false);
      setSelectedAccount(null);
    } catch (error) {
      console.error("Error updating broker account:", error);
      alert("Error al actualizar la cuenta. Por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!selectedAccount) return;
    
    setIsSubmitting(true);
    try {
      await brokerAccountsApi.remove(selectedAccount.brokerAccountID);
      await mutate(url); // Revalidar datos
      setDeleteModalOpen(false);
      setSelectedAccount(null);
    } catch (error) {
      console.error("Error deleting broker account:", error);
      alert("Error al eliminar la cuenta. Por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCreate = () => {
    setCreateFormData({
      login: "",
      password: "",
      server: "",
      serverIp: "",
      platform: "",
      isUsed: false,
      investorPass: "",
      innitialBalance: 0,
    });
    setCreateModalOpen(true);
  };
  
  const handleCreateSubmit = async () => {
    setIsSubmitting(true);
    try {
      await brokerAccountsApi.create(createFormData);
      await mutate(url); // Revalidar datos
      setCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating broker account:", error);
      alert("Error al crear la cuenta. Por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const url = `${API_BASE}/broker-accounts?${query}`;

  const fetcher = async (u: string) => {
    const res = await fetch(u, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      credentials: "include",
    });
    if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
    return res.json();
  };

  const { data, error, isLoading } = useSWR<PageResponse<BrokerAccount>>(
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
        <div className="flex justify-between items-center">
          <ManagerHeader
            title="Broker Accounts"
            description="List of available and used broker accounts"
            totalCount={pageObj.total}
            showTotalCount={true}
          />
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex justify-between">
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
          <div className="flex items-center justify-end">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + New Account
            </button>
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
              <div className="flex items-center justify-center gap-2">
                <button
                  className="px-2 py-1 text-[11px] rounded bg-sky-400 hover:bg-sky-600 text-white disabled:opacity-50"
                  onClick={() => acc && handleEdit(acc)}
                  disabled={!acc}
                  title="Edit data of account"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  className="px-2 py-1 text-[11px] rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  onClick={() => id && router.push(`/admin/brokeraccounts/${id}`)}
                  disabled={!id}
                  title="Look account"
                >
                  <Eye className="h-4 w-4" />
                </button>

                <button
                  className="px-2 py-1 text-[11px] rounded hover:bg-red-600 text-white disabled:opacity-50 bg-red-400"
                  onClick={() => acc && handleDelete(acc)}
                  disabled={!acc}
                  title="Look account"
                >
                  <Delete className="h-4 w-4" />
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
        
        {/* Modal de Edición */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Cuenta de Broker</DialogTitle>
              <DialogDescription>
                Modifica los campos de la cuenta. El ID y login no son editables.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="login" className="text-right text-sm font-medium">
                  Login
                </label>
                <input
                  id="login"
                  value={selectedAccount?.login || ""}
                  disabled
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="server" className="text-right text-sm font-medium">
                  Server
                </label>
                <input
                  id="server"
                  value={formData.server || ""}
                  onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="serverIp" className="text-right text-sm font-medium">
                  Server IP
                </label>
                <input
                  id="serverIp"
                  value={formData.serverIp || ""}
                  onChange={(e) => setFormData({ ...formData, serverIp: e.target.value })}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="platform" className="text-right text-sm font-medium">
                  Platform
                </label>
                <input
                  id="platform"
                  value={formData.platform || ""}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="investorPass" className="text-right text-sm font-medium">
                  Investor Pass
                </label>
                <input
                  id="investorPass"
                  value={formData.investorPass || ""}
                  onChange={(e) => setFormData({ ...formData, investorPass: e.target.value })}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="innitialBalance" className="text-right text-sm font-medium">
                  Initial Balance
                </label>
                <input
                  id="innitialBalance"
                  type="number"
                  value={formData.innitialBalance || 0}
                  onChange={(e) => setFormData({ ...formData, innitialBalance: Number(e.target.value) })}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="isUsed" className="text-right text-sm font-medium">
                  En Uso
                </label>
                <div className="col-span-3">
                  <input
                    id="isUsed"
                    type="checkbox"
                    checked={formData.isUsed}
                    onChange={(e) => setFormData({ ...formData, isUsed: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUpdateSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Modal de Confirmación de Eliminación */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                {`¿Estás seguro de que deseas eliminar la cuenta de broker con login ${selectedAccount?.login}. Esta acción no se puede deshacer.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? "Eliminando..." : "Eliminar"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Modal de Creación */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Cuenta de Broker</DialogTitle>
              <DialogDescription>
                Completa todos los campos para crear una nueva cuenta de broker.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="create-login" className="text-right text-sm font-medium">
                  Login *
                </label>
                <input
                  id="create-login"
                  value={createFormData.login}
                  onChange={(e) => setCreateFormData({ ...createFormData, login: e.target.value })}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="MT5_123456"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="create-password" className="text-right text-sm font-medium">
                  Password *
                </label>
                <input
                  id="create-password"
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="securePassword123"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="create-server" className="text-right text-sm font-medium">
                  Server
                </label>
                <input
                  id="create-server"
                  value={createFormData.server || ""}
                  onChange={(e) => setCreateFormData({ ...createFormData, server: e.target.value })}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="create-serverIp" className="text-right text-sm font-medium">
                  Server IP
                </label>
                <input
                  id="create-serverIp"
                  value={createFormData.serverIp || ""}
                  onChange={(e) => setCreateFormData({ ...createFormData, serverIp: e.target.value })}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="192.168.1.1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="create-platform" className="text-right text-sm font-medium">
                  Platform
                </label>
                <input
                  id="create-platform"
                  value={createFormData.platform || ""}
                  onChange={(e) => setCreateFormData({ ...createFormData, platform: e.target.value })}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="create-investorPass" className="text-right text-sm font-medium">
                  Investor Pass
                </label>
                <input
                  id="create-investorPass"
                  value={createFormData.investorPass || ""}
                  onChange={(e) => setCreateFormData({ ...createFormData, investorPass: e.target.value })}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="create-innitialBalance" className="text-right text-sm font-medium">
                  Initial Balance
                </label>
                <input
                  id="create-innitialBalance"
                  type="number"
                  value={createFormData.innitialBalance || 0}
                  onChange={(e) => setCreateFormData({ ...createFormData, innitialBalance: Number(e.target.value) })}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="create-isUsed" className="text-right text-sm font-medium">
                  En Uso
                </label>
                <div className="col-span-3">
                  <input
                    id="create-isUsed"
                    type="checkbox"
                    checked={createFormData.isUsed}
                    onChange={(e) => setCreateFormData({ ...createFormData, isUsed: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateSubmit}
                disabled={isSubmitting || !createFormData.login || !createFormData.password}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Creando..." : "Crear"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}


