"use client";

import MainLayout from "@/components/layouts/MainLayout";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import { ManagerHeader } from "@/components/challenge-templates/ManagerHeader";
import type {
  ColumnConfig,
  BrokerAccount,
  PageResponse,
  GenerateBrokerAccountDto,
  GenerateBrokerAccountResponse,
} from "@/types";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // 👈 para obtener token
import { apiBaseUrl } from "@/config";
import { toast } from "sonner";
import { brokerAccountsApi } from "@/api/broker-accounts";
import { challengeTemplatesApi } from "@/api/challenge-templates";
import type { ChallengeRelation } from "@/types/challenge-template";
import { AxiosError } from "axios";
import axios from "axios";
import {
  MagnifyingGlassIcon,
  UserIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

type LimitParam = number;
type UsedFilter = "all" | "used" | "free";

const API_BASE = apiBaseUrl.replace(/\/$/, "");

function UsedBadge({ used }: { used: boolean }) {
  const cls = used
    ? "bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] ${cls}`}>
      {used ? "Used" : "Free"}
    </span>
  );
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function unwrapPage<T = Record<string, unknown>>(
  raw: unknown
): {
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

  // Estados para el modal de generación
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [relations, setRelations] = useState<ChallengeRelation[]>([]);
  const [loadingRelations, setLoadingRelations] = useState(false);
  const [generateData, setGenerateData] = useState<GenerateBrokerAccountDto>({
    login: "",
    email: "",
    groupName: "",
    masterPassword: "",
    investorPassword: "",
    initialBalance: 10000,
    relationID: "",
    isActive: true,
  });

  // Estados para búsqueda de usuarios
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const emailDropdownRef = useRef<HTMLDivElement>(null);

  // debounce para búsqueda
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Cargar relations cuando se abre el modal
  const loadRelations = async () => {
    if (relations.length > 0) return; // Ya están cargadas

    setLoadingRelations(true);
    try {
      const relationsData = await challengeTemplatesApi.listRelationsComplete();
      setRelations(relationsData);
    } catch (error) {
      console.error("Error loading relations:", error);
      toast.error("Error loading relations");
    } finally {
      setLoadingRelations(false);
    }
  };

  // Cargar usuarios
  const loadUsers = async () => {
    if (users.length > 0) return; // Ya están cargados

    setLoadingUsers(true);
    try {
      const response = await axios.get(
        `${apiBaseUrl}/users?page=1&limit=999999999`
      );

      // Mapear los datos de la API a la estructura esperada
      const mappedUsers = response.data.data.data.map((user: any) => ({
        id: user.userID,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        phone: user.phone,
        role: user.role,
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      toast.error("Error loading users");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (generateOpen) {
      loadRelations();
      loadUsers();
    }
  }, [generateOpen]);

  // Manejar clicks fuera del dropdown de email
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emailInputRef.current &&
        !emailInputRef.current.contains(event.target as Node) &&
        emailDropdownRef.current &&
        !emailDropdownRef.current.contains(event.target as Node)
      ) {
        setShowEmailDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrar sugerencias de email basado en la búsqueda
  const filteredEmailSuggestions = useMemo(() => {
    if (!generateData.email.trim() || generateData.email.length < 2) return [];
    if (!Array.isArray(users)) return [];

    const filtered = users
      .filter(
        (user) =>
          user.email &&
          user.email.toLowerCase().includes(generateData.email.toLowerCase())
      )
      .slice(0, 10);

    return filtered;
  }, [users, generateData.email]);

  // Manejar selección de email del dropdown
  const handleEmailSuggestionClick = (user: any) => {
    setGenerateData((s) => ({ ...s, email: user.email }));
    setSelectedUser(user);
    setShowEmailDropdown(false);
    setHighlightedIndex(-1);
  };

  // Manejar cambio en el input de email
  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGenerateData((s) => ({ ...s, email: value }));
    setSelectedUser(null);
    setHighlightedIndex(-1);

    const shouldShow = value.length >= 2;
    setShowEmailDropdown(shouldShow);
  };

  // Manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showEmailDropdown || filteredEmailSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredEmailSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredEmailSuggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleEmailSuggestionClick(
            filteredEmailSuggestions[highlightedIndex]
          );
        }
        break;
      case "Escape":
        setShowEmailDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
  }

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (usedFilter !== "all")
      q.set("isUsed", usedFilter === "used" ? "true" : "false");
    if (debouncedSearch.trim()) q.set("login", debouncedSearch.trim());
    return q.toString();
  }, [page, limit, usedFilter, debouncedSearch]);

  const url = `${API_BASE}/broker-accounts?${query}`;

  const fetcher = async (u: string) => {
    const res = await fetch(u, {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
      credentials: "include",
    });
    if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
    return res.json();
  };

  const { data, error, isLoading, mutate } = useSWR<
    PageResponse<BrokerAccount>
  >(
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
    {
      key: "used",
      label: "Used",
      type: "normal",
      render: (v) => <UsedBadge used={Boolean(v)} />,
    },
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
    balance:
      typeof a.innitialBalance === "number"
        ? money.format(Number(a.innitialBalance))
        : "-",
  }));

  // Función para generar broker account
  const onGenerateBrokerAccount = async () => {
    if (!generateData.login.trim() || !generateData.email.trim()) {
      toast.error("Please fill in all required fields (login and email)");
      return;
    }

    setGenerating(true);
    try {
      const response = await brokerAccountsApi.generate(generateData);
      console.log(response);
      toast.success(
        `Broker account generated successfully! Login: ${response.login}`
      );
      setGenerateOpen(false);
      setGenerateData({
        login: "",
        email: "",
        groupName: "",
        masterPassword: "",
        investorPassword: "",
        initialBalance: 10000,
        relationID: "",
        isActive: true,
      });
      setSelectedUser(null);
      setShowEmailDropdown(false);
      setHighlightedIndex(-1);
      await mutate(); // Revalidar datos
    } catch (error) {
      console.error("Error generating broker account:", error);
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to generate broker account"
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 pt-4">
        <ManagerHeader
          title="Broker Accounts"
          description="List of available and used broker accounts"
          totalCount={pageObj.total}
          showTotalCount={true}
        />

        {/* Botón Generate */}
        <div className="flex justify-end">
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setGenerateOpen(true)}
            disabled={generating}
          >
            {generating && (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            Generate Broker Account
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-end">
            {/* Buscar */}
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search by Login
              </label>
              <input
                type="text"
                placeholder="Enter login..."
                className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={search}
                autoComplete="off"
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Filtro estado */}
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status Filter
              </label>
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
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Items per page
              </label>
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
          emptyText={
            error ? (error as Error).message : "No broker accounts found"
          }
          actionsHeader="Acciones"
          renderActions={(row) => {
            const acc = row.__raw as BrokerAccount | undefined;
            const id = acc?.brokerAccountID;
            return (
              <div className="flex items-center justify-center">
                <button
                  className="px-2 py-1 text-[11px] rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  onClick={() =>
                    id && router.push(`/admin/brokeraccounts/${id}`)
                  }
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

        {/* Modal Generate Broker Account */}
        {generateOpen && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (generating) {
                e.preventDefault();
                return;
              }
              // Solo cerrar si se hace clic en el backdrop (no en el modal)
              if (e.target === e.currentTarget) {
                setGenerateOpen(false);
                setGenerateData({
                  login: "",
                  email: "",
                  groupName: "",
                  masterPassword: "",
                  investorPassword: "",
                  initialBalance: 10000,
                  relationID: "",
                  isActive: true,
                });
                setSelectedUser(null);
                setShowEmailDropdown(false);
                setHighlightedIndex(-1);
              }
            }}
          >
            <div
              className={`w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 relative ${
                generating ? "pointer-events-none" : ""
              }`}
            >
              {generating && (
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-xl flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="text-sm font-medium">
                      Generando broker account...
                    </span>
                  </div>
                </div>
              )}
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                Generate Broker Account
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Generate a new broker account with associated challenge for a
                user.
              </p>
              <div className="grid grid-cols-1 gap-3">
                <input
                  className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Login *"
                  type="text"
                  value={generateData.login}
                  autoComplete="off"
                  onChange={(e) =>
                    setGenerateData((s) => ({ ...s, login: e.target.value }))
                  }
                  required
                />
                <div className="relative">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      ref={emailInputRef}
                      className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Email *"
                      type="email"
                      value={generateData.email}
                      autoComplete="off"
                      onChange={handleEmailInputChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => {
                        if (generateData.email.length >= 2) {
                          setShowEmailDropdown(true);
                        }
                      }}
                      required
                      aria-autocomplete="list"
                      aria-expanded={showEmailDropdown}
                      aria-controls="email-suggestions"
                    />
                  </div>

                  {/* Dropdown de sugerencias de email */}
                  {showEmailDropdown && filteredEmailSuggestions.length > 0 && (
                    <div
                      ref={emailDropdownRef}
                      id="email-suggestions"
                      className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                      role="listbox"
                    >
                      <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                          {filteredEmailSuggestions.length} usuario
                          {filteredEmailSuggestions.length !== 1
                            ? "s"
                            : ""}{" "}
                          encontrado
                          {filteredEmailSuggestions.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {filteredEmailSuggestions.map((user, index) => (
                        <div
                          key={user.id}
                          onClick={() => handleEmailSuggestionClick(user)}
                          className={classNames(
                            "mx-2 my-1 px-3 py-2 cursor-pointer rounded-md transition-all",
                            index === highlightedIndex
                              ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          )}
                          role="option"
                          aria-selected={index === highlightedIndex}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <div
                                className={classNames(
                                  "w-8 h-8 rounded-full grid place-items-center",
                                  index === highlightedIndex
                                    ? "bg-blue-100 dark:bg-blue-900/30"
                                    : "bg-gray-100 dark:bg-gray-700"
                                )}
                              >
                                <UserIcon
                                  className={classNames(
                                    "h-4 w-4",
                                    index === highlightedIndex
                                      ? "text-blue-600"
                                      : "text-gray-500 dark:text-gray-400"
                                  )}
                                />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <EnvelopeIcon
                                  className={classNames(
                                    "h-3 w-3 flex-shrink-0",
                                    index === highlightedIndex
                                      ? "text-blue-600"
                                      : "text-gray-400"
                                  )}
                                />
                                <span
                                  className={classNames(
                                    "font-medium truncate text-sm",
                                    index === highlightedIndex
                                      ? "text-blue-700 dark:text-blue-400"
                                      : "text-gray-900 dark:text-white"
                                  )}
                                >
                                  {user.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <UserIcon className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {user.firstName || "Sin nombre"}{" "}
                                  {user.lastName || ""}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-400 dark:text-gray-500 px-2 text-center">
                          Usa ↑↓ para navegar • Enter para seleccionar • Esc
                          para cerrar
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Group Name (optional)"
                  type="text"
                  value={generateData.groupName}
                  autoComplete="off"
                  onChange={(e) =>
                    setGenerateData((s) => ({
                      ...s,
                      groupName: e.target.value,
                    }))
                  }
                />
                <input
                  className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Master Password (optional)"
                  type="password"
                  value={generateData.masterPassword}
                  autoComplete="new-password"
                  onChange={(e) =>
                    setGenerateData((s) => ({
                      ...s,
                      masterPassword: e.target.value,
                    }))
                  }
                />
                <input
                  className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Investor Password (optional)"
                  type="password"
                  value={generateData.investorPassword}
                  autoComplete="new-password"
                  onChange={(e) =>
                    setGenerateData((s) => ({
                      ...s,
                      investorPassword: e.target.value,
                    }))
                  }
                />
                <input
                  className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Initial Balance (optional)"
                  type="number"
                  min="0"
                  step="100"
                  value={generateData.initialBalance || ""}
                  autoComplete="off"
                  onChange={(e) =>
                    setGenerateData((s) => ({
                      ...s,
                      initialBalance: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                />
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Relation
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                    value={generateData.relationID || ""}
                    onChange={(e) =>
                      setGenerateData((s) => ({
                        ...s,
                        relationID: e.target.value || undefined,
                      }))
                    }
                    disabled={loadingRelations}
                    required
                  >
                    <option value="">Select a relation...*</option>
                    {loadingRelations ? (
                      <option disabled>Loading relations...</option>
                    ) : (
                      relations.map((relation) => {
                        const categoryName = relation.category?.name || "N/A";
                        const planName = relation.plan?.name || "N/A";
                        const displayName =
                          categoryName !== "N/A"
                            ? `${planName} - ${categoryName}`
                            : planName;
                        return (
                          <option
                            key={relation.relationID}
                            value={relation.relationID}
                          >
                            {displayName}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={generateData.isActive || false}
                    onChange={(e) =>
                      setGenerateData((s) => ({
                        ...s,
                        isActive: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    Is Active
                  </label>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  className="px-3 py-2 text-sm rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    setGenerateOpen(false);
                    setGenerateData({
                      login: "",
                      email: "",
                      groupName: "",
                      masterPassword: "",
                      investorPassword: "",
                      initialBalance: 10000,
                      relationID: "",
                      isActive: true,
                    });
                  }}
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  onClick={onGenerateBrokerAccount}
                  disabled={generating}
                >
                  {generating && (
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {generating ? "Generando..." : "Generate"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
