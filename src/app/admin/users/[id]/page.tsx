"use client";

import MainLayout from "@/components/layouts/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/types";
import { ChallengeRelation } from "@/api/challenges";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { challengesApi, type ChallengeWithDetails } from "@/api/challenges";
import { challengeTemplatesApi } from "@/api/challenge-templates";
import { verificationApi } from "@/api/verification";
import type {
  VerificationItem,
  VerificationStatus,
  DocumentType,
} from "@/types/verification";
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
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
} as const;

const documentTypeLabels: Record<DocumentType | string, string> = {
  dni: "DNI",
  passport: "Pasaporte",
  driver_license: "Licencia de Conducir",
  other: "Otro",
} as const;

/* ========= Página interna ========= */
export default function UserDetailInner() {
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

  /* ---- Cargar categorías y planes para nombres compuestos ---- */
  const { data: categoriesData, isLoading: categoriesLoading } = useSWR(
    "challenge-categories",
    () => challengeTemplatesApi.listCategories(),
    { revalidateOnFocus: false }
  );

  const { data: plansData, isLoading: plansLoading } = useSWR(
    "challenge-plans",
    () => challengeTemplatesApi.listPlans(),
    { revalidateOnFocus: false }
  );

  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const plans = Array.isArray(plansData) ? plansData : [];

  // Helper functions para obtener nombres
  const getCategoryName = (id: string) => {
    const category = categories.find((c) => c?.categoryID === id);
    return category?.name || "N/A";
  };

  const getPlanName = (id: string) => {
    const plan = plans.find((p) => p?.planID === id);
    return plan?.name || "N/A";
  };

  // Función para generar nombre compuesto como en RelationsManager
  const getComposedRelationName = (relation?: ChallengeRelation) => {
    if (!relation) return "Challenge";

    const categoryName = getCategoryName(relation.categoryID || "");
    const planName = getPlanName(relation.planID || "");

    // Cambiar a "Plan - Categoría" y evitar guion si no hay categoría
    return categoryName && categoryName !== "N/A"
      ? `${planName}`
      : planName;
  };

  /* ---- Challenges del usuario ---- */
  const {
    data: challengesWithDetailsRaw,
    isLoading: chLoading,
    error: chErr,
  } = useSWR(
    canFetch && hasUserData && userId
      ? [`challenges-with-details-${userId}`, token!]
      : null,
    async () => {
      try {
        const response = await challengesApi.getChallengesWithDetails(userId);
        console.log("response", response);
        return response.data.data;
      } catch (error) {
        console.error("Error fetching challenges with details:", error);
        throw error;
      }
    },
    { revalidateOnFocus: false }
  );

  const challengesWithDetails: ChallengeWithDetails[] = useMemo(() => {
    return Array.isArray(challengesWithDetailsRaw)
      ? challengesWithDetailsRaw
      : [];
  }, [challengesWithDetailsRaw]);

  const challenges: Challenge[] = useMemo(() => {
    return challengesWithDetails.map(
      (c): Challenge => ({
        challengeID: c.challengeID,
        userID: c.userID ?? undefined,
        status: c.status ?? null,
        isActive: c.isActive ?? null,
        numPhase: c.numPhase ?? null,
        dynamicBalance:
          c.dynamicBalance != null ? Number(c.dynamicBalance) : null,
        brokerAccount: {
          login: c.brokerAccount?.login ?? null,
          platform: c.brokerAccount?.platform ?? null,
          innitialBalance:
            c.brokerAccount?.innitialBalance != null
              ? Number(c.brokerAccount.innitialBalance)
              : null,
        },
        startDate: c.startDate ?? null,
        endDate: c.endDate ?? null,
        relation: c.relation,
      })
    );
  }, [challengesWithDetails]);

  /* ---- Verificaciones del usuario ---- */
  const {
    data: verificationsResp,
    isLoading: verifLoading,
    error: verifErr,
  } = useSWR(
    canFetch && userId ? ["user-verifications", userId] : null,
    async () => {
      const res = await verificationApi.getByUserId(String(userId), {
        page: 1,
        limit: 10,
      });
      return res;
    },
    { revalidateOnFocus: false }
  );

  const verifications: VerificationItem[] = useMemo(() => {
    const list = verificationsResp?.data ?? [];
    return Array.isArray(list) ? list : [];
  }, [verificationsResp]);

  // Estados de carga específicos
  const isInitialLoading = isAuthLoading || !token;
  const isUserDataLoading = userLoading && !hasUserData;
  const isChallengesLoading = chLoading;
  const hasErrors = userErr || chErr;

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
    //{ key: "balance", label: "Balance", type: "normal" },
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

        // Size: From brokerAccount.initialBalance
        const accountSize = c?.brokerAccount?.innitialBalance
          ? parseFloat(String(c.brokerAccount.innitialBalance))
          : null;

        // Equity: From dynamicBalance
        const equityNum = c?.dynamicBalance
          ? parseFloat(String(c.dynamicBalance))
          : null;

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
          accountType: getComposedRelationName(
            c.relation || ({} as ChallengeRelation)
          ),
          accountSize:
            accountSize != null ? `$${accountSize.toLocaleString()}` : "-",
          equity: equityNum != null ? `$${equityNum.toLocaleString()}` : "-",
          platform,
          status: c?.status ?? (c?.isActive ? "Active" : "Inactive"),
          dateReceived: whenDate ? whenDate.toLocaleDateString() : "-",
        };
      }),
    [challenges, categories, plans]
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
                onClick={() => router.push("/admin/users")}
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
          {/* <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
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
                        {v.numDocument ? (
                          <span className="ml-2 text-xs font-normal text-gray-600 dark:text-gray-400">N° {v.numDocument}</span>
                        ) : null}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[v.status] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}>
                        {v.status}
                      </span>
                    </div>

                    {/* Detalles en grilla legible 
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="flex items-start justify-between sm:block">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Enviado:</span>
                        <span className="text-gray-900 dark:text-gray-100 sm:ml-2">{new Date(v.submittedAt).toLocaleString()}</span>
                      </div>
                      {v.approvedAt && (
                        <div className="flex items-start justify-between sm:block">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Aprobado:</span>
                          <span className="text-gray-900 dark:text-gray-100 sm:ml-2">{new Date(v.approvedAt).toLocaleString()}</span>
                        </div>
                      )}
                      {v.rejectedAt && (
                        <div className="flex items-start justify-between sm:block">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Rechazado:</span>
                          <span className="text-gray-900 dark:text-gray-100 sm:ml-2">{new Date(v.rejectedAt).toLocaleString()}</span>
                        </div>
                      )}
                      {v.rejectionReason && (
                        <div className="sm:col-span-2">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Motivo rechazo:</span>
                          <span className="text-red-700 dark:text-red-400 sm:ml-2"> {v.rejectionReason}</span>
                        </div>
                      )}
                    </div>

                    {/* Separador y media 
                    {Array.isArray(v.media) && v.media.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Documentos</div>
                        <div className="grid grid-cols-3 gap-2">
                          {v.media.slice(0, 6).map((m: MediaItem, idx: number) => {
                            const raw = m.url || '';
                            const cleanUrl = raw.replace(/[\s)]+$/g, '');
                            const isImage = m.type === 'image' && !!cleanUrl;
                            return (
                              <div key={m.mediaID} className="relative w-full aspect-[3/4] overflow-hidden rounded border border-gray-200 dark:border-gray-700 bg-white/30 dark:bg-gray-800/30">
                                {isImage ? (
                                  <a href={cleanUrl} target="_blank" rel="noreferrer" aria-label={`Abrir documento ${idx + 1}`}>
                                    <Image src={cleanUrl} alt={`Documento ${idx + 1}`} fill className="object-cover" sizes="(max-width: 768px) 33vw, 200px" />
                                  </a>
                                ) : (
                                  <a
                                    href={cleanUrl || '#'}
                                    target={cleanUrl ? "_blank" : undefined}
                                    rel={cleanUrl ? "noreferrer" : undefined}
                                    className="absolute inset-0 flex items-center justify-center text-[11px] px-2 text-blue-700 dark:text-blue-300 underline bg-white/40 dark:bg-gray-900/30"
                                    aria-label={`Ver documento ${idx + 1}`}
                                  >
                                    Ver documento
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {v.media.length > 6 && (
                          <div className="mt-2 text-right">
                            <span className="text-xs text-gray-500 dark:text-gray-400">y {v.media.length - 6} más…</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {verifications.length > 0 && (
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Showing {verifications.length} verifications. Use the Verifications section for full management.
                </div>
              )}
            </div>
          </div> */}

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
