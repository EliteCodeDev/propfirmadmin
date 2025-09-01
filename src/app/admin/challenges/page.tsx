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
import { toast } from "react-hot-toast";

type LimitParam = number;
type Scope = "mine" | "all";

const API_BASE = apiBaseUrl.replace(/\/$/, "");

// Función para calcular la posición inteligente del dropdown
const calculateDropdownPosition = (buttonRect: DOMRect, dropdownWidth = 200, dropdownHeight = 150) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  
  let top = buttonRect.bottom + scrollY + 4;
  let left = buttonRect.left + scrollX;
  
  // Verificar si el dropdown se sale por la derecha
  if (left + dropdownWidth > viewportWidth + scrollX) {
    // Alinear a la derecha del botón
    left = buttonRect.right + scrollX - dropdownWidth;
    
    // Si aún se sale por la derecha, alinear con el borde derecho de la ventana
    if (left + dropdownWidth > viewportWidth + scrollX) {
      left = viewportWidth + scrollX - dropdownWidth - 8;
    }
  }
  
  // Verificar si el dropdown se sale por la izquierda
  if (left < scrollX) {
    left = scrollX + 8;
  }
  
  // Verificar si el dropdown se sale por abajo
  if (top + dropdownHeight > viewportHeight + scrollY) {
    // Mostrar arriba del botón
    top = buttonRect.top + scrollY - dropdownHeight - 4;
    
    // Si aún se sale por arriba, ajustar al espacio disponible
    if (top < scrollY) {
      top = scrollY + 8;
    }
  }
  
  return { top, left };
};

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

  // Shared fetcher for authenticated requests
  const fetcher = async (u: string) => {
    const res = await fetch(u, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      credentials: "include",
    });
    if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
    return res.json();
  };

  // Helper to unwrap various user list shapes to an array
  const unwrapUsers = (raw: unknown): any[] => {
    if (!raw) return [];
    const lvl1 = (raw as any).data ?? raw;
    if (Array.isArray(lvl1)) return lvl1 as any[];
    if (lvl1 && typeof lvl1 === "object") {
      if (Array.isArray((lvl1 as any).users)) return (lvl1 as any).users as any[];
      if (Array.isArray((lvl1 as any).data)) return (lvl1 as any).data as any[];
      if (Array.isArray((lvl1 as any).items)) return (lvl1 as any).items as any[];
    }
    return [];
  };
  const getUserId = (u: any): string | undefined => u?.userID || u?.id || u?.userId;

  // Utilities to detect email and UUID-like IDs
  const isEmail = (v: string) => /.+@.+\..+/.test(v);
  const isUuidLike = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

  // When searching, resolve userID if the term is an email or a direct userID input
  const trimmedSearch = search.trim();
  const lowerSearch = trimmedSearch.toLowerCase();
  const usersSearchUrl = useMemo(() => {
    if (!accessToken) return null;
    if (!isEmail(trimmedSearch)) return null; // Only query users API for email terms
    const q = new URLSearchParams();
    q.set("limit", "50");
    q.set("search", trimmedSearch);
    return `${API_BASE}/users?${q.toString()}`;
  }, [accessToken, trimmedSearch]);

  const { data: usersData } = useSWR<any>(usersSearchUrl, usersSearchUrl ? fetcher : null);

  const matchedUserID = useMemo(() => {
    // Priority 1: exact email match (case-insensitive)
    if (isEmail(trimmedSearch)) {
      const arr = unwrapUsers(usersData);
      const exact = arr.find((u) => String(u?.email ?? "").toLowerCase() === lowerSearch);
      if (exact) return getUserId(exact);
      // If no exact match but there are candidates, choose the first (user said multiple matches are acceptable)
      if (arr.length > 0) {
        const first = arr[0];
        const fid = getUserId(first);
        if (fid) return fid;
      }
    }
    // Priority 2: direct userID input (UUID-like)
    if (isUuidLike(trimmedSearch)) return trimmedSearch;
    // No server-assisted user filter
    return undefined;
  }, [usersData, trimmedSearch, lowerSearch]);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (status) q.set("status", status);
    if (matchedUserID) q.set("userID", matchedUserID);
    // Nota: No enviar `search` al backend de challenges
    return q.toString();
  }, [page, limit, status, matchedUserID]);

  const basePath = scope === "all" ? "/challenges" : "/challenges/my-challenges";
  const url = `${API_BASE}${basePath}?${query}`;

  const { data, error, isLoading, mutate } = useSWR<PageResponse<Challenge>>(accessToken ? url : null, fetcher);

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

  const columns: ColumnConfig[] = [
    { key: "serial", label: "ID", type: "normal" },
    { key: "user", label: "User", type: "normal" },
    { key: "login", label: "Login", type: "normal" },
    { key: "platform", label: "Platform", type: "normal" },
    { key: "numPhase", label: "Phase", type: "normal" },
    { key: "dynamicBalance", label: "Dyn. Balance", type: "normal" },
    { key: "status", label: "Status", type: "normal" },
    { key: "startDate", label: "Start", type: "normal" },
    { key: "endDate", label: "End", type: "normal" },
    { key: "actions", label: "Acciones", type: "normal", render: (value, row) => value as React.ReactNode },
  ];

  const rows: Record<string, unknown>[] = filteredChallenges.map((c, idx) => {
    const serial = offset + idx + 1;
    const userName = c.user
      ? `${c.user.firstName ?? ""} ${c.user.lastName ?? ""}`.trim() || c.user.email || c.userID
      : c.userID;
    const login = c.brokerAccount?.login ?? "-";
    const platform = c.brokerAccount?.platform ?? "-";
    const dynBal = c.dynamicBalance != null ? String(c.dynamicBalance) : "-";
    const start = c.startDate ? new Date(c.startDate).toLocaleDateString() : "-";
    const end = c.endDate ? new Date(c.endDate).toLocaleDateString() : "-";

  const row: Record<string, unknown> = {
      serial,
      user: userName,
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
            <div className="w-full sm:flex-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <input
                type="text"
                className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Email, user ID, login, challenge ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

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
          emptyText={error ? (error as Error).message : (filteredChallenges.length === 0 ? "No challenges found." : undefined)}
          pagination={{
            currentPage: page,
            totalPages: Math.max(1, totalPages),
            totalItems: pageObj.total,
            pageSize: limit,
            onPageChange: (p) => setPage(p),
            onPageSizeChange: (n) => { setPage(1); setLimit(n as LimitParam); },
          }}
        />

        {/* Dropdown menu mejorado con posicionamiento inteligente */}
        {dropdownOpen && (
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(null)}
          >
            <div 
              className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xl z-50 min-w-[200px] max-w-[250px] dropdown-container animate-in fade-in-0 zoom-in-95 duration-100"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                maxHeight: '200px',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const challenge = challenges.find(c => c.challengeID === dropdownOpen);
                    if (challenge) {
                      setSelectedChallenge(challenge);
                      setPendingAction('credentials');
                      setShowConfirmationModal(true);
                    }
                    setDropdownOpen(null);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-300 transition-colors duration-150"
                  type="button"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate">Enviar Credenciales</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const challenge = challenges.find(c => c.challengeID === dropdownOpen);
                    if (challenge) {
                      setSelectedChallenge(challenge);
                      setPendingAction('approve');
                      setShowConfirmationModal(true);
                    }
                    setDropdownOpen(null);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-300 transition-colors duration-150"
                  type="button"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="truncate">Aprobar Challenge</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const challenge = challenges.find(c => c.challengeID === dropdownOpen);
                    if (challenge) {
                      setSelectedChallenge(challenge);
                      setPendingAction('disapprove');
                      setShowConfirmationModal(true);
                    }
                    setDropdownOpen(null);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300 transition-colors duration-150"
                  type="button"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="truncate">Desaprobar Challenge</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación */}
        {showConfirmationModal && selectedChallenge && (
          <div className="fixed inset-0  bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-96">
              <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
                  {getActionDetails().icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {getActionDetails().title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Verificar datos antes de continuar
                  </p>
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  {getActionDetails().description}
                </p>

                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Usuario</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {selectedChallenge.user 
                          ? `${selectedChallenge.user.firstName ?? ""} ${selectedChallenge.user.lastName ?? ""}`.trim() || selectedChallenge.user.email || selectedChallenge.userID
                          : selectedChallenge.userID}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Email</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {selectedChallenge.user?.email || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Login</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {selectedChallenge.brokerAccount?.login || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Fase</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {selectedChallenge.numPhase ?? 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Estado</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full text-center ${
                        selectedChallenge.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        selectedChallenge.status === 'disapproved' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                        selectedChallenge.status === 'progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {selectedChallenge.status || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={closeConfirmationModal}
                  className="flex-1 px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`flex-1 px-3 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 ${getActionDetails().buttonColor} shadow-lg hover:shadow-xl transform hover:scale-105`}
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Credenciales */}
        {showCredentialsModal && (
          <div className="fixed inset-0  bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Enviar Credenciales
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                ¿Está seguro que desea enviar las credenciales por correo electrónico?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeCredentialsModal}
                  disabled={isLoadingCredentials}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendCredentials}
                  disabled={isLoadingCredentials}
                  className="flex-1 px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoadingCredentials ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    'Enviar'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Aprobación */}
        {showApprovalModal && (
          <div className="fixed inset-0  bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Aprobar Challenge
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                ¿Está seguro que desea aprobar este challenge?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeApprovalModal}
                  disabled={isLoadingApproval}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isLoadingApproval}
                  className="flex-1 px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoadingApproval ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Aprobando...
                    </>
                  ) : (
                    'Aprobar'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Desaprobación */}
        {showDisapprovalModal && (
          <div className="fixed inset-0  bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Desaprobar Challenge
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                ¿Está seguro que desea desaprobar este challenge? Por favor, proporcione una razón:
              </p>
              <textarea
                value={disapprovalReason}
                onChange={(e) => setDisapprovalReason(e.target.value)}
                placeholder="Ingrese la razón de la desaprobación..."
                disabled={isLoadingDisapproval}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none disabled:opacity-50"
                rows={4}
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeDisapprovalModal}
                  disabled={isLoadingDisapproval}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDisapproval}
                  disabled={isLoadingDisapproval || !disapprovalReason.trim()}
                  className="flex-1 px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoadingDisapproval ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Desaprobando...
                    </>
                  ) : (
                    'Desaprobar'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
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