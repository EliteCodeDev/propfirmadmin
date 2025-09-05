"use client";

import MainLayout from "@/components/layouts/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/types";

import { useParams, useRouter } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";
import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";
import { apiBaseUrl, PUBLIC_API_KEY } from "@/config";
import {
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import type { User, Challenge } from "@/types";
import { challengesApi, type ChallengeWithDetails, type ChallengeDetailedData } from "@/api/challenges";
import { verificationApi } from "@/api/verification";
import type { VerificationItem, VerificationStatus, DocumentType, MediaItem } from "@/types/verification";
import Image from "next/image";

/* ========= Config ========= */
const API_BASE = apiBaseUrl.replace(/\/$/, "");
const API_KEY = PUBLIC_API_KEY || "";

/* ========= Tipos ========= */
// [moved-to-src/types] Original inline types now live in src/types.
// type Challenge = { ... }
// type User = { ... }

/* ========= Helpers ========= */
const buildHeaders = (token?: string): HeadersInit => {
  const h: Record<string, string> = {};
  if (token) h.Authorization = `Bearer ${token}`;
  if (API_KEY) h["x-api-key"] = API_KEY;
  return h;
};

const unwrapItems = <T,>(raw: unknown): T[] => {
  if (!raw) return [];
  const lvl1 =
    (raw as { data?: unknown; items?: unknown })?.data ??
    (raw as { items?: unknown })?.items ??
    raw;

  if (Array.isArray(lvl1)) return lvl1 as T[];
  if (lvl1 && typeof lvl1 === "object") {
    const l1d = (lvl1 as { data?: unknown }).data;
    const l1i = (lvl1 as { items?: unknown }).items;
    if (Array.isArray(l1d)) return l1d as T[];
    if (Array.isArray(l1i)) return l1i as T[];
    const lvl2 =
      (lvl1 as { data?: unknown; items?: unknown }).data ??
      (lvl1 as { items?: unknown }).items;
    if (Array.isArray(lvl2)) return lvl2 as T[];
    if (lvl2 && typeof lvl2 === "object") {
      const l2d = (lvl2 as { data?: unknown }).data;
      const l2i = (lvl2 as { items?: unknown }).items;
      if (Array.isArray(l2d)) return l2d as T[];
      if (Array.isArray(l2i)) return l2i as T[];
    }
  }
  return [];
};

const unwrapOne = <T,>(raw: unknown): T | null => {
  if (!raw) return null;
  const lvl1 =
    (raw as { data?: unknown; item?: unknown })?.data ??
    (raw as { item?: unknown })?.item ??
    raw;
  if (lvl1 && typeof lvl1 === "object" && !Array.isArray(lvl1)) {
    const inner = (lvl1 as { data?: unknown }).data;
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      return inner as T;
    }
    return lvl1 as T;
  }
  return null;
};

async function authedFetcher([url, token]: [string, string]) {
  if (!token) throw new Error("Missing access token");
  const full = url.startsWith("http") ? url : `${API_BASE}${url}`;
  const res = await fetch(full, {
    method: "GET",
    headers: buildHeaders(token),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }
  return res.json();
}

/* ========= Verifications UI helpers ========= */
const statusColors: Record<VerificationStatus | string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
} as const;

const documentTypeLabels: Record<DocumentType | string, string> = {
  dni: "DNI",
  passport: "Pasaporte",
  driver_license: "Licencia de Conducir",
  other: "Otro",
} as const;

/* ========= Página interna ========= */
function UserDetailInner() {
  const router = useRouter();
  const { id: userId } = useParams<{ id: string }>();

  const { data: session, status } = useSession();
  const token = session?.accessToken as string | undefined;

  // Estados de carga unificados
  const isAuthLoading = status === "loading";
  const isUnauthenticated = status === "unauthenticated";
  const canFetch = status === "authenticated" && !!token;

  useEffect(() => {
    if (isUnauthenticated) router.replace("/auth/login");
  }, [isUnauthenticated, router]);

  /* ---- Usuario ---- */
  const {
    data: userRaw,
    isLoading: userLoading,
    error: userErr,
  } = useSWR(
    canFetch && userId ? [`/users/${userId}`, token!] : null,
    authedFetcher,
    { revalidateOnFocus: false }
  );

  const user = useMemo<User>(
    () => (unwrapOne<User>(userRaw) ?? {}) as User,
    [userRaw]
  );
  const hasUserData = !!(user?.userID || user?.id || user?.username);

  /* ---- Challenges del usuario ---- */
  const {
    data: challengesWithDetailsRaw,
    isLoading: chLoading,
    error: chErr,
  } = useSWR(
    canFetch && hasUserData ? [`challenges-with-details`, token!] : null,
    async () => {
      try {
        const response = await challengesApi.getChallengesWithDetails();
        return response.data.data;
      } catch (error) {
        console.error('Error fetching challenges with details:', error);
        throw error;
      }
    },
    { revalidateOnFocus: false }
  );

  const challengesWithDetails: ChallengeWithDetails[] = useMemo(() => {
    const list = Array.isArray(challengesWithDetailsRaw) ? challengesWithDetailsRaw : [];
    return userId ? list.filter(c => c.userID === userId) : [];
  }, [challengesWithDetailsRaw, userId]);

  // Fetch detailed data for each challenge
  const {
    data: challengeDetailsMap,
    isLoading: detailsLoading,
    error: detailsErr,
  } = useSWR(
    canFetch && challengesWithDetails.length > 0 ? [`challenge-details-${challengesWithDetails.map(c => c.challengeID).join(',')}`, token!] : null,
    async () => {
      const detailsMap: Record<string, ChallengeDetailedData> = {};
      
      for (const challenge of challengesWithDetails) {
        try {
          const response = await challengesApi.getChallengeDetails(challenge.challengeID);
          detailsMap[challenge.challengeID] = response.data;
        } catch (error) {
          console.error(`Error fetching details for challenge ${challenge.challengeID}:`, error);
          // Continue with other challenges even if one fails
        }
      }
      
      return detailsMap;
    },
    { revalidateOnFocus: false }
  );

  const challenges: Challenge[] = useMemo(() => {
    // Convert ChallengeWithDetails to Challenge format for backward compatibility
    return challengesWithDetails.map(c => ({
      challengeID: c.challengeID,
      userID: c.userID,
      status: c.status,
      isActive: c.isActive,
      numPhase: c.numPhase,
      dynamicBalance: c.dynamicBalance,
      brokerAccount: c.brokerAccount,
      startDate: c.startDate,
      endDate: c.endDate,
    } as Challenge));
  }, [challengesWithDetails]);

   /* ---- Verificaciones del usuario ---- */
   const {
     data: verificationsResp,
     isLoading: verifLoading,
     error: verifErr,
   } = useSWR(
     canFetch && userId ? ["user-verifications", userId] : null,
     async () => {
       const res = await verificationApi.getByUserId(String(userId), { page: 1, limit: 10 });
       return res;
     },
     { revalidateOnFocus: false }
   );

   const verifications: VerificationItem[] = useMemo(() => {
     const list = verificationsResp?.data?.data ?? [];
     return Array.isArray(list) ? list : [];
   }, [verificationsResp]);

  // Estados de carga específicos
  const isInitialLoading = isAuthLoading || !token;
  const isUserDataLoading = userLoading && !hasUserData;
  const isChallengesLoading = chLoading || detailsLoading;
  const hasErrors = userErr || chErr || detailsErr;

  /* ---- Cards ---- */
  const fullName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
    user?.username ||
    "-";

  const contactFields = [
    { label: "Email", value: user?.email ?? "-" },
    { label: "Phone", value: user?.phone ?? "-" },
    { label: "Name", value: fullName },
    {
      label: "Address",
      value:
        [
          user?.address?.address1,
          user?.address?.city,
          user?.address?.state,
          user?.address?.country,
          user?.address?.zipCode,
        ]
          .filter(Boolean)
          .join(", ") || "-",
    },
  ];

  const accountFields = [
    { label: "Username", value: user?.username ?? "-" },
    { label: "Coupon Code", value: user?.couponCode ?? "-" },
    {
      label: "Status",
      value: user?.status ?? (user?.isConfirmed ? "active" : "unconfirmed"),
    },
    { label: "Is Verified", value: user?.isVerified ? "Yes" : "No" },
  ];

  const activityFields = [
    {
      label: "Updated Date",
      value: user?.updatedAt
        ? new Date(user.updatedAt).toLocaleDateString()
        : "-",
    },
    {
      label: "Registration",
      value: user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString()
        : "-",
    },
    { label: "Login Count", value: "-" },
  ];

  /* ---- Tabla ---- */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columns: ColumnConfig[] = [
    { key: "accountNumber", label: "Account", type: "normal" },
    { key: "accountType", label: "Type", type: "normal" },
    { key: "accountSize", label: "Size", type: "normal" },
    { key: "balance", label: "Balance", type: "normal" },
    { key: "equity", label: "Equity", type: "normal" },
    { key: "platform", label: "Platform", type: "normal" },
    { key: "status", label: "Status", type: "badge" },
    { key: "dateReceived", label: "Date", type: "normal" },
  ];

  const mapped = useMemo(
    () =>
      (challenges || []).map((c) => {
        const login = c?.brokerAccount?.login ?? "-";
        const platform = c?.brokerAccount?.platform ?? "-";
        
        // Get detailed challenge data for real balance information
        const detailedData = challengeDetailsMap?.[c.challengeID];
        
        // Use real balance data if available, fallback to initial balance
        const currentBalance = detailedData?.balance?.currentBalance;
        const initialBalance = detailedData?.balance?.initialBalance ?? c?.brokerAccount?.initialBalance;
        const equity = detailedData?.equity;
        
        // Parse balance values
        const currentBalanceNum = currentBalance ? parseFloat(currentBalance) : null;
        const initialBalanceNum = initialBalance ? parseFloat(String(initialBalance)) : null;
        
        // Use current balance for display, fallback to initial balance
        const displayBalance = currentBalanceNum ?? initialBalanceNum;
        const accountSize = initialBalanceNum; // Account size is the initial balance

        const whenRaw =
          (c as { startDate?: unknown; createdAt?: unknown }).startDate ??
          (c as { createdAt?: unknown }).createdAt ??
          null;
        const whenDate =
          typeof whenRaw === "string" ||
          typeof whenRaw === "number" ||
          whenRaw instanceof Date
            ? new Date(whenRaw)
            : null;

        return {
          accountNumber: login || `${c.challengeID.slice(0, 8)}...`,
          accountType: c?.numPhase ? `${c.numPhase}-step` : "Challenge",
          accountSize: accountSize != null ? `$${accountSize.toLocaleString()}` : "-",
          balance: displayBalance != null ? `$${displayBalance.toLocaleString()}` : "-",
          equity: equity != null ? `$${equity.toLocaleString()}` : "-",
          platform,
          status: c?.status ?? (c?.isActive ? "Active" : "Inactive"),
          dateReceived: whenDate ? whenDate.toLocaleDateString() : "-",
        };
      }),
    [challenges, challengeDetailsMap]
  );

  const totalItems = mapped.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIdx = (page - 1) * pageSize;
  const rows = useMemo(
    () =>
      mapped.slice(startIdx, startIdx + pageSize) as unknown as Record<
        string,
        unknown
      >[],
    [mapped, startIdx, pageSize]
  );

  // Renderizado condicional por estados de carga
  if (isInitialLoading) {
    return (
      <LoadingSpinner
        size="md"
        text="Verificando Sesión"
        subtitle="Validando credenciales de usuario..."
        showProgress
        steps={[
          "Verificando token de sesión...",
          "Validando permisos de usuario...",
          "Cargando configuración...",
          "Preparando dashboard...",
        ]}
      />
    );
  }

  if (isUserDataLoading) {
    return (
      <MainLayout>
        <LoadingSpinner
        size="md"
        text="Cargando Challenges"
        subtitle="Obteniendo información del usuario y challenges..."
        showProgress
        steps={[
          "Consultando datos del usuario...",
          "Cargando challenges del usuario...",
          "Obteniendo balances y detalles...",
          "Preparando vista de detalles...",
        ]}
      />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 transition-colors duration-200">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Header compacto */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <button
                className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200"
                onClick={() => router.back()}
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Users
              </button>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  User ID
                </div>
                <div className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-center">
                  {userId}
                </div>
              </div>
            </div>
          </div>

          {/* Cards de información */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Contact Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center mb-3">
                <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Contact Information
                </h3>
              </div>
              <div className="space-y-2">
                {contactFields.map((f, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-xs"
                  >
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {f.label}:
                    </span>
                    <span
                      className="text-gray-900 dark:text-gray-100 font-mono text-right max-w-xs truncate"
                      title={f.value}
                    >
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center mb-3">
                <ClockIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Account Details
                </h3>
              </div>
              <div className="space-y-2">
                {accountFields.map((f, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-xs"
                  >
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {f.label}:
                    </span>
                    <span
                      className="text-gray-900 dark:text-gray-100 font-mono text-right max-w-xs truncate"
                      title={f.value}
                    >
                      {f.value === "Yes" || f.value === "active" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                          {f.value}
                        </span>
                      ) : f.value === "No" || f.value === "unconfirmed" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                          {f.value}
                        </span>
                      ) : (
                        f.value
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center mb-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Recent Activity
                </h3>
              </div>
              <div className="space-y-2">
                {activityFields.map((f, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-xs"
                  >
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {f.label}:
                    </span>
                    <span
                      className="text-gray-900 dark:text-gray-100 font-mono text-right max-w-xs truncate"
                      title={f.value}
                    >
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
            {/* Verificaciones KYC del usuario */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">User Verifications (KYC)</h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Últimas verificaciones enviadas por este usuario
                </p>
              </div>
              {verifLoading && (
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  Cargando verificaciones...
                </div>
              )}
            </div>

            <div className="p-4">
              {verifErr && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  No fue posible cargar las verificaciones de este usuario.
                </div>
              )}

              {!verifLoading && !verifErr && verifications.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Este usuario no tiene verificaciones.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verifications.map((v: VerificationItem) => (
                  <div key={v.verificationID} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {documentTypeLabels[v.documentType] || v.documentType.toUpperCase()}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[v.status] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}>
                        {v.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div><span className="font-medium">Documento:</span> {v.numDocument || "-"}</div>
                      <div><span className="font-medium">Enviado:</span> {new Date(v.submittedAt).toLocaleString()}</div>
                      {v.approvedAt && <div><span className="font-medium">Aprobado:</span> {new Date(v.approvedAt).toLocaleString()}</div>}
                      {v.rejectedAt && <div><span className="font-medium">Rechazado:</span> {new Date(v.rejectedAt).toLocaleString()}</div>}
                      {v.rejectionReason && (
                        <div className="mt-1 text-red-600 dark:text-red-400"><span className="font-medium">Motivo rechazo:</span> {v.rejectionReason}</div>
                      )}
                    </div>

                    {Array.isArray(v.media) && v.media.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Documentos</div>
                        <div className="grid grid-cols-3 gap-2">
                          {v.media.slice(0, 6).map((m: MediaItem) => (
                            <div key={m.mediaID} className="relative w-full aspect-video overflow-hidden rounded">
                              {m.type === 'image' ? (
                                <Image src={(m.url || '').replace(/[\s)]$/g, '')} alt="doc" fill className="object-cover" />
                              ) : (
                                <a
                                  href={m.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300"
                                  title="Abrir documento"
                                >
                                  Ver documento
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {(verificationsResp?.data?.totalPages ?? 0) > 1 && (
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Mostrando {verifications.length} de {verificationsResp?.data?.total} verificaciones. Usa la sección Verifications para gestión completa.
                </div>
              )}
            </div>
          </div>

          {/* Tabla de challenges */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Prop Accounts
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Linked challenges & broker accounts ({totalItems} total)
                  </p>
                </div>
                {isChallengesLoading && (
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    Loading challenges...
                  </div>
                )}
              </div>
            </div>

            <PaginatedCardTable
              columns={columns}
              rows={rows}
              isLoading={isChallengesLoading}
              emptyText={
                hasErrors?.message ||
                (!isChallengesLoading && mapped.length === 0
                  ? "This user has no challenges."
                  : undefined)
              }
              pagination={{
                currentPage: page,
                totalPages,
                totalItems,
                pageSize,
                onPageChange: (p) => setPage(p),
                onPageSizeChange: (n) => {
                  setPage(1);
                  setPageSize(n);
                },
              }}
            />
          </div>

          
        </div>
      </div>
    </MainLayout>
  );
}

export default function Page() {
  return (
    <SessionProvider>
      <UserDetailInner />
    </SessionProvider>
  );
}
