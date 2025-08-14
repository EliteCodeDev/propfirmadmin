"use client";

import MainLayout from "@/components/layouts/MainLayout";
import LoadingSpinner from "@/components/common/loadingSpinner";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/components/common/tableComponent";
import CardComponent from "@/components/user/cardComponent";

import { useParams, useRouter } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";
import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";
import { UserIcon, ClockIcon, ExclamationTriangleIcon, ArrowLeftIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import EditUserModal from "@/components/user/EditUserModal";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");

type Challenge = {
    challengeID: string;
    status?: string;
    numPhase?: number;
    startDate?: string | null;
    dynamicBalance?: number | null;
    isActive?: boolean;
    brokerAccount?: { login?: string | null; platform?: string | null; initialBalance?: number | null } | null;
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
        address1?: string | null; city?: string | null; state?: string | null;
        country?: string | null; zipCode?: string | null;
    } | null;
};

const headers = (t?: string): HeadersInit => (t ? { Authorization: `Bearer ${t}` } : {});
const unwrap = <T,>(raw: any, fallback: any = null): T => (raw?.data ?? raw ?? fallback) as T;

function UserDetailInner() {
    const router = useRouter();
    const { id: userId } = useParams<{ id: string }>();

    // Hooks
    const { data: session, status } = useSession();
    const token = (session as any)?.accessToken as string | undefined;
    const [editOpen, setEditOpen] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/login");
    }, [status, router]);

    const fetcher = async (url: string) => {
        const res = await fetch(url, { headers: headers(token), credentials: "include" });
        if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
        return res.json();
    };

    // SWR con claves condicionales
    const { data: userRaw, isLoading: userLoading, error: userErr, mutate: mutateUser } =
        useSWR(token && userId ? `${API_BASE}/api/users/${userId}` : null, fetcher);

    const { data: chRaw, isLoading: chLoading, error: chErr } =
        useSWR(token && userId ? `${API_BASE}/api/challenges?userID=${userId}&page=1&limit=1000` : null, fetcher);

    // Estados de carga unificados
    const isInitialLoading = status === "loading" || !token;
    const isDataLoading = userLoading || chLoading;
    const hasErrors = userErr || chErr;

    // Derivados con useMemo
    const user = useMemo(() => unwrap<User>(userRaw, {}), [userRaw]);

    const challenges: Challenge[] = useMemo(() => {
        const lvl1 = chRaw?.data ?? chRaw ?? [];
        return Array.isArray(lvl1) ? lvl1 : Array.isArray(lvl1?.items) ? lvl1.items : [];
    }, [chRaw]);

    const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.username || "-";

    const contactFields = [
        { label: "Email", value: user?.email ?? "-" },
        { label: "Phone", value: user?.phone ?? "-" },
        { label: "Name", value: fullName },
        { label: "Address", value: [user?.address?.address1, user?.address?.city, user?.address?.state, user?.address?.country, user?.address?.zipCode].filter(Boolean).join(", ") || "-" },
    ];

    const accountFields = [
        { label: "Username", value: user?.username ?? "-" },
        { label: "Coupon Code", value: user?.couponCode ?? "-" },
        { label: "Status", value: user?.status ?? (user?.isConfirmed ? "active" : "unconfirmed") },
        { label: "Is Verified", value: user?.isVerified ? "Yes" : "No" },
    ];

    const activityFields = [
        { label: "Updated Date", value: user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "-" },
        { label: "Registration", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-" },
        { label: "Login Count", value: "-" },
    ];

    // Tabla
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

    const mapped = useMemo(() => (challenges || []).map((c) => {
        const login = c?.brokerAccount?.login ?? "-";
        const platform = c?.brokerAccount?.platform ?? "-";
        const size = c?.brokerAccount?.initialBalance ?? c?.dynamicBalance ?? "-";
        const start = c?.startDate ? new Date(c.startDate).toLocaleDateString() : "-";
        return {
            accountNumber: login || c.challengeID.slice(0, 8) + "...",
            accountType: c?.numPhase ? `${c.numPhase}-step` : "Challenge",
            accountSize: typeof size === 'number' ? `$${size.toLocaleString()}` : String(size),
            balance: typeof size === 'number' ? `$${size.toLocaleString()}` : String(size),
            platform,
            status: c?.status ?? (c?.isActive ? "Active" : "Inactive"),
            dateReceived: start,
        };
    }), [challenges]);

    const totalItems = mapped.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIdx = (page - 1) * pageSize;
    const rows = useMemo(
        () => mapped.slice(startIdx, startIdx + pageSize) as unknown as Record<string, unknown>[],
        [mapped, startIdx, pageSize]
    );

    // Carga inicial (sesión)
    if (isInitialLoading) {
        return (
            <LoadingSpinner
                size="md"
                text="Verificando Sesión"
                subtitle="Validando credenciales de usuario..."
                showProgress
                steps={[
                    'Verificando token de sesión...',
                    'Validando permisos de usuario...',
                    'Cargando configuración...',
                    'Preparando dashboard...'
                ]}
            />
        );
    }

    // Carga de datos
    if (isDataLoading && !user?.userID) {
        return (
            <MainLayout>
                <LoadingSpinner
                    size="md"
                    text="Cargando Usuario"
                    subtitle="Obteniendo información del usuario..."
                    showProgress
                    steps={[
                        'Consultando datos del usuario...',
                        'Cargando información de contacto...',
                        'Obteniendo historial de actividad...',
                        'Preparando vista de detalles...'
                    ]}
                />
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="min-h-screen  p-3 transition-colors duration-200">
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
                                <div className="text-xs text-gray-500 dark:text-gray-400">User ID</div>
                                <div className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-center">
                                    {userId}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cards de información */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                                                        <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center">
                                                                        <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                                                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Contact Information</h3>
                                                                </div>
                                                                <button
                                                                    className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                                    title="Edit user"
                                                                    aria-label="Edit user"
                                                                    onClick={() => setEditOpen(true)}
                                                                >
                                                                    <PencilSquareIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                                                                </button>
                                                        </div>
                            <div className="space-y-2">
                                {contactFields.map((field, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">{field.label}:</span>
                                        <span className="text-gray-900 dark:text-gray-100 font-mono text-right max-w-xs truncate" title={field.value}>
                                            {field.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                            <div className="flex items-center mb-3">
                                <ClockIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2" />
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Account Details</h3>
                            </div>
                            <div className="space-y-2">
                                {accountFields.map((field, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">{field.label}:</span>
                                        <span className="text-gray-900 dark:text-gray-100 font-mono text-right max-w-xs truncate" title={field.value}>
                                            {field.value === "Yes" || field.value === "active" ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                                                    {field.value}
                                                </span>
                                            ) : field.value === "No" || field.value === "unconfirmed" ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                                                    {field.value}
                                                </span>
                                            ) : (
                                                field.value
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                            <div className="flex items-center mb-3">
                                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2" />
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
                            </div>
                            <div className="space-y-2">
                                {activityFields.map((field, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">{field.label}:</span>
                                        <span className="text-gray-900 dark:text-gray-100 font-mono text-right max-w-xs truncate" title={field.value}>
                                            {field.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tabla compacta */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Prop Accounts</h2>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Linked challenges & broker accounts ({totalItems} total)
                            </p>
                        </div>

                        <PaginatedCardTable
                            columns={columns}
                            rows={rows}
                            isLoading={isDataLoading}
                            emptyText={hasErrors?.message || (!isDataLoading && mapped.length === 0 ? "No challenges found" : undefined)}
                            pagination={{
                                currentPage: page,
                                totalPages,
                                totalItems,
                                pageSize,
                                onPageChange: (p) => setPage(p),
                                onPageSizeChange: (n) => { setPage(1); setPageSize(n); },
                            }}
                        />
                    </div>
                </div>
            </div>
                        {editOpen && (
                            <EditUserModal
                                open={editOpen}
                                user={user as any}
                                onClose={() => setEditOpen(false)}
                                onSubmit={async (vals, uid) => {
                                    const payload: any = {
                                        username: vals.username,
                                        email: vals.email,
                                        firstName: vals.firstName,
                                        lastName: vals.lastName,
                                        phone: vals.phone,
                                        isConfirmed: vals.isConfirmed,
                                        isBlocked: vals.isBlocked,
                                        isVerified: vals.isVerified,
                                    };
                                    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
                                    const res = await fetch(`${API_BASE}/api/users/${uid}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                                        credentials: 'include',
                                        body: JSON.stringify(payload),
                                    });
                                    if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
                                    await mutateUser();
                                }}
                                title="Edit User"
                                submitLabel="Save"
                            />
                        )}
        </MainLayout>
    );
}

export default function Page() {
    return (
        <SessionProvider>
            <UserDetailInner />
            {/* Edit User Modal bound to current user data */}
            {/* We mount it here to share SessionProvider; visibility controlled inside */}
        </SessionProvider>
    );
}