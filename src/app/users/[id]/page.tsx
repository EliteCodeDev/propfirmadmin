"use client";

import MainLayout from "@/components/layouts/MainLayout";
import LoadingSpinner from "@/components/common/loadingSpinner";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/components/common/tableComponent";

import { useParams, useRouter } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";
import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";
import {
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

/* ========= Config ========= */
const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

/* ========= Tipos ========= */
type Challenge = {
  challengeID: string;
  userID?: string;
  userId?: string;
  user?: { id?: string; userID?: string } | null;
  status?: string | null;
  numPhase?: number | null;
  startDate?: string | null;
  createdAt?: string | null;
  dynamicBalance?: number | string | null;
  isActive?: boolean | null;
  brokerAccount?: {
    login?: string | null;
    platform?: string | null;
    initialBalance?: number | null;
  } | null;
};

type User = {
  userID?: string;
  id?: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isVerified?: boolean;
  isConfirmed?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  couponCode?: string | null;
  status?: string | null;
  address?: {
    address1?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    zipCode?: string | null;
  } | null;
};

/* ========= Helpers ========= */
const buildHeaders = (token?: string): HeadersInit => {
  const h: Record<string, string> = {};
  if (token) h.Authorization = `Bearer ${token}`;
  if (API_KEY) h["x-api-key"] = API_KEY;
  return h;
};

// Arrays en {data:{data:[...]}} | {data:[...]} | {items:[...]} | [...]
const unwrapItems = <T,>(raw: any): T[] => {
  if (!raw) return [];
  const lvl1 = raw?.data ?? raw?.items ?? raw;

  if (Array.isArray(lvl1)) return lvl1 as T[];
  if (lvl1 && typeof lvl1 === "object") {
    if (Array.isArray(lvl1.data)) return lvl1.data as T[];
    if (Array.isArray(lvl1.items)) return lvl1.items as T[];
    const lvl2 = (lvl1 as any).data ?? (lvl1 as any).items;
    if (Array.isArray(lvl2)) return lvl2 as T[];
    if (lvl2 && typeof lvl2 === "object") {
      if (Array.isArray(lvl2.data)) return lvl2.data as T[];
      if (Array.isArray(lvl2.items)) return lvl2.items as T[];
    }
  }
  return [];
};

// Un solo objeto (ej. /api/users/:id)
const unwrapOne = <T,>(raw: any): T | null => {
  if (!raw) return null;
  const lvl1 = raw?.data ?? raw?.item ?? raw;
  if (lvl1 && typeof lvl1 === "object" && !Array.isArray(lvl1)) {
    if ((lvl1 as any).data && typeof (lvl1 as any).data === "object" && !Array.isArray((lvl1 as any).data)) {
      return (lvl1 as any).data as T;
    }
    return lvl1 as T;
  }
  return null;
};

// Fetcher autenticado basado en la clave [url, token]
async function authedFetcher([url, token]: [string, string]) {
  if (!token) throw new Error("Missing access token");
  const full = url.startsWith("http") ? url : `${API_BASE}${url}`;
  const res = await fetch(full, {
    method: "GET",
    headers: buildHeaders(token),
    // credentials: "include", // habilítalo solo si tu backend usa cookies
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }
  return res.json();
}

/** Construye variantes de URL para filtrar por userId; la última es fallback sin filtro */
function buildChallengeUrls(userId: string) {
  const uid = encodeURIComponent(userId);
  return [
    `/api/challenges?userID=${uid}&page=1&limit=1000`,
    `/api/challenges?userId=${uid}&page=1&limit=1000`,
    `/api/challenges?user=${uid}&page=1&limit=1000`,
    `/api/challenges?page=1&limit=1000`, // fallback: traer todo
  ];
}

/** Filtro local robusto por userId */
function filterByUserId<T extends {
  userID?: unknown; userId?: unknown;
  user?: { id?: unknown; userID?: unknown } | null;
}>(list: T[], userId: string) {
  const target = String(userId).trim().toLowerCase();
  return list.filter((c) => {
    const cand = c.userID ?? c.userId ?? c.user?.userID ?? c.user?.id ?? "";
    return String(cand).trim().toLowerCase() === target;
  });
}

/* ========= Página interna ========= */
function UserDetailInner() {
  const router = useRouter();
  const { id: userId } = useParams<{ id: string }>();

  const { data: session, status } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const canFetch = status === "authenticated" && !!token;

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  /* ---- Usuario ---- */
  const {
    data: userRaw,
    isLoading: userLoading,
    error: userErr,
  } = useSWR(
    canFetch && userId ? [`/api/users/${userId}`, token!] : null,
    authedFetcher,
    { revalidateOnFocus: false }
  );

  const user = useMemo<User>(() => (unwrapOne<User>(userRaw) ?? {}) as User, [userRaw]);

  /* ---- Challenges del usuario ----
     1) Intenta con ?userID=?, ?userId=?, ?user=?
     2) Si no hay datos o el backend no filtra, trae todo y filtra local
  */
  const urls = useMemo(() => (userId ? buildChallengeUrls(userId) : []), [userId]);

  const {
    data: chRaw,
    isLoading: chLoading,
    error: chErr,
  } = useSWR(
    canFetch && urls.length ? [urls, token!] : null,
    async ([uList, tok]: [string[], string]) => {
      for (let i = 0; i < uList.length - 1; i++) {
        try {
          const j = await authedFetcher([uList[i], tok]);
          const arr = unwrapItems<Challenge>(j);
          if (arr.length > 0) return arr; // si trajo algo filtrado, úsalo
        } catch {
          // intenta siguiente variante
        }
      }
      // fallback: trae todo y filtra local
      const jf = await authedFetcher([uList[uList.length - 1], tok]);
      return unwrapItems<Challenge>(jf);
    },
    { revalidateOnFocus: false }
  );

  // Filtrado local por userId SIEMPRE (cubre caso backend no filtra)
  const challenges: Challenge[] = useMemo(() => {
    const list = Array.isArray(chRaw) ? (chRaw as Challenge[]) : [];
    return userId ? filterByUserId(list, userId) : [];
  }, [chRaw, userId]);

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
    { label: "Coupon Code", value: (user as any)?.couponCode ?? "-" },
    {
      label: "Status",
      value: user?.status ?? (user?.isConfirmed ? "active" : "unconfirmed"),
    },
    { label: "Is Verified", value: user?.isVerified ? "Yes" : "No" },
  ];

  const activityFields = [
    {
      label: "Updated Date",
      value: user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "-",
    },
    {
      label: "Registration",
      value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-",
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
    { key: "platform", label: "Platform", type: "normal" },
    { key: "status", label: "Status", type: "badge" },
    { key: "dateReceived", label: "Date", type: "normal" },
  ];

  const mapped = useMemo(
    () =>
      (challenges || []).map((c) => {
        const login = c?.brokerAccount?.login ?? "-";
        const platform = c?.brokerAccount?.platform ?? "-";
        const sizeRaw =
          c?.brokerAccount?.initialBalance ?? c?.dynamicBalance ?? null;

        const sizeNum =
          sizeRaw == null
            ? null
            : typeof sizeRaw === "number"
            ? sizeRaw
            : Number.isFinite(parseFloat(String(sizeRaw)))
            ? parseFloat(String(sizeRaw))
            : null;

        const when = (c as any).startDate || (c as any).createdAt || null;

        return {
          accountNumber: login || `${c.challengeID.slice(0, 8)}...`,
          accountType: c?.numPhase ? `${c.numPhase}-step` : "Challenge",
          accountSize: sizeNum != null ? `$${sizeNum.toLocaleString()}` : "-",
          balance: sizeNum != null ? `$${sizeNum.toLocaleString()}` : "-",
          platform,
          status: c?.status ?? (c?.isActive ? "Active" : "Inactive"),
          dateReceived: when ? new Date(when).toLocaleDateString() : "-",
        };
      }),
    [challenges]
  );

  const totalItems = mapped.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIdx = (page - 1) * pageSize;
  const rows = useMemo(
    () => mapped.slice(startIdx, startIdx + pageSize) as unknown as Record<string, unknown>[],
    [mapped, startIdx, pageSize]
  );

  const showAuthSpinner = status === "loading" || !token;

  return (
    <MainLayout>
      {showAuthSpinner ? (
        <LoadingSpinner
          size="md"
          text="Verificando Sesión"
          subtitle="Validando credenciales de usuario..."
          showProgress
        />
      ) : (
        <div className="min-h-screen p-3">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <button
                  className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300"
                  onClick={() => router.back()}
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Users
                </button>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">User ID</div>
                  <div className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-center">
                    {userId}
                  </div>
                </div>
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-center mb-3">
                  <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h3 className="text-sm font-semibold">Contact Information</h3>
                </div>
                <div className="space-y-2">
                  {contactFields.map((f, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">{f.label}:</span>
                      <span className="font-mono max-w-xs truncate" title={f.value}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-center mb-3">
                  <ClockIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2" />
                  <h3 className="text-sm font-semibold">Account Details</h3>
                </div>
                <div className="space-y-2">
                  {accountFields.map((f, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">{f.label}:</span>
                      <span className="font-mono max-w-xs truncate" title={f.value}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-center mb-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2" />
                  <h3 className="text-sm font-semibold">Recent Activity</h3>
                </div>
                <div className="space-y-2">
                  {activityFields.map((f, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">{f.label}:</span>
                      <span className="font-mono max-w-xs truncate" title={f.value}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabla challenges */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold">Prop Accounts</h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Linked challenges & broker accounts ({totalItems} total)
                </p>
              </div>

              <PaginatedCardTable
                columns={columns}
                rows={rows}
                isLoading={chLoading || userLoading}
                emptyText={
                  chErr?.message ||
                  userErr?.message ||
                  (!chLoading && mapped.length === 0 ? "This user has no challenges." : undefined)
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
      )}
    </MainLayout>
  );
}

/* ========= Wrapper ========= */
export default function Page() {
  return (
    <SessionProvider>
      <UserDetailInner />
    </SessionProvider>
  );
}
