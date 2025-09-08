"use client";

import MainLayout from "@/components/layouts/MainLayout";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useMemo } from "react";
import useSWR from "swr";
import { apiBaseUrl } from "@/config";
import { useParams, useRouter } from "next/navigation";
import type { BrokerAccount } from "@/types";

const API_BASE = apiBaseUrl.replace(/\/$/, "");

function unwrapItem<T = Record<string, unknown>>(raw: unknown): T | null {
  if (!raw) return null;
  const lvl1Data = (raw as { data?: unknown })?.data;
  if (lvl1Data && typeof lvl1Data === "object") return lvl1Data as T;
  if (raw && typeof raw === "object") return raw as T;
  return null;
}

function BrokerAccountInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = useMemo(() => String(params?.id ?? ""), [params]);

  const accessToken = session?.accessToken as string | undefined;
  const url = id ? `${API_BASE}/broker-accounts/${id}` : null;

  const fetcher = async (u: string) => {
    const res = await fetch(u, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
    return res.json();
  };

  const { data, error, isLoading } = useSWR(url && accessToken ? url : null, fetcher);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login");
  }, [status, router]);

  const account = unwrapItem<BrokerAccount>(data as unknown);

  return (
    <MainLayout>
      <div className="p-6 space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Broker Account</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Detalle de la cuenta del broker (solo lectura)</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40"
          >
            Volver
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">Cargando…</div>
        ) : error ? (
          <div className="p-6 rounded-lg border border-red-200 bg-red-50 text-red-700">
            {(error as Error).message || "Error al cargar la cuenta"}
          </div>
        ) : !account ? (
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">No se encontró la cuenta</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Información básica</h2>
              <div className="space-y-2 text-sm">
                <Field label="BrokerAccountID" value={account.brokerAccountID} />
                <Field label="Login" value={account.login} />
                <Field label="Platform" value={account.platform ?? "-"} />
                <Field label="Server" value={account.server ?? "-"} />
                <Field label="Server IP" value={account.serverIp ?? "-"} />
                <Field label="Used" value={account.isUsed ? "Yes" : "No"} />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Detalles</h2>
              <div className="space-y-2 text-sm">
                <Field label="Investor Password" value={account.investorPass ?? "-"} />
                 <Field label="Initial Balance" value={
                   typeof account.innitialBalance === "number" ?
                     new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(account.innitialBalance) :
                     account.innitialBalance != null ? String(account.innitialBalance) : "-"
                 } />
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function Field({ label, value, masked = false }: { label: string; value: string | number; masked?: boolean }) {
  const display = masked && value && value !== "-" ? "••••••" : String(value ?? "-");
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-gray-100">{display}</span>
    </div>
  );
}

export default function BrokerAccountPage() {
  return (
    <SessionProvider>
      <BrokerAccountInner />
    </SessionProvider>
  );
}