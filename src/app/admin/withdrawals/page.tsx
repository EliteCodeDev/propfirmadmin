"use client";

import MainLayout from "@/components/layouts/MainLayout";
import { ManagerHeader } from "@/components/challenge-templates/ManagerHeader";
import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/types";
import type { Withdrawal, WithdrawalStatus, PageResponse, HttpError } from "@/types";
import { apiBaseUrl } from "@/config";
import { withdrawalsApi } from "@/api/withdrawals";
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type LimitParam = number;
type Scope = "mine" | "all";

const API_BASE = apiBaseUrl.replace(/\/$/, "");

function Badge({ status }: { status: WithdrawalStatus | string }) {
  const up = String(status).toUpperCase();
  const cls =
    up === "PENDING"
      ? "bg-yellow-100 text-yellow-800"
      : up === "APPROVED"
      ? "bg-green-100 text-green-800"
      : up === "PAID"
      ? "bg-blue-100 text-blue-800"
      : up === "REJECTED"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";
  return (
    <span
      className={`px-1.5 py-[1px] rounded-full text-[10px] leading-tight font-normal ${cls}`}
    >
      {up}
    </span>
  );
}

// 🔹 Componente para mostrar wallet truncada con tooltip y botón de copia
function WalletCell({ wallet }: { wallet: string }) {
  const [showFull, setShowFull] = useState(false);
  const [copied, setCopied] = useState(false);
  
  if (!wallet || wallet === "-") {
    return <span className="text-gray-500">-</span>;
  }

  const truncated = wallet.length > 12 
    ? `${wallet.slice(0, 6)}...${wallet.slice(-6)}` 
    : wallet;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se active el onClick del span
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Resetear después de 2 segundos
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  return (
    <div className="relative group flex items-center gap-2">
      <span 
        className="cursor-pointer hover:text-blue-600 transition-colors"
        onClick={() => setShowFull(!showFull)}
        title="Click para ver completa"
      >
        {showFull ? wallet : truncated}
      </span>
      
      {/* Botón de copia */}
      <button
        onClick={handleCopy}
        className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
          copied ? 'text-green-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
        title={copied ? "¡Copiado!" : "Copiar wallet"}
      >
        {copied ? (
          <CheckIcon className="w-4 h-4" />
        ) : (
          <ClipboardDocumentIcon className="w-4 h-4" />
        )}
      </button>
      
      {/* Tooltip con la dirección completa */}
      <div className="invisible group-hover:visible absolute z-10 w-max max-w-xs px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-1">
        {wallet}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  );
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

type UnknownRecord = Record<string, unknown>;

/** 🔹 Ajustado para tu endpoint (data.data) */
function unwrapPage<T = UnknownRecord>(
  raw: unknown
): {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  const r = raw as UnknownRecord | undefined;
  const rootData = (r && (r as UnknownRecord)["data"]) as UnknownRecord | undefined;

  const items = (rootData?.["data"] as T[]) ?? [];

  const total =
    typeof rootData?.["total"] === "number" ? (rootData["total"] as number) : items.length;
  const page = typeof rootData?.["page"] === "number" ? (rootData["page"] as number) : 1;
  const limit =
    typeof rootData?.["limit"] === "number" ? (rootData["limit"] as number) : items.length;
  const totalPages =
    typeof rootData?.["totalPages"] === "number"
      ? (rootData["totalPages"] as number)
      : limit > 0
      ? Math.max(1, Math.ceil(total / limit))
      : 1;

  return { items, total, page, limit, totalPages };
}

function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  pending,
  onClose,
  onConfirm,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  pending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !pending && !v && onClose()}>
      <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 max-w-md mx-auto shadow-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white text-base font-semibold">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-xs">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="mt-2">{children}</div>
        <DialogFooter className="mt-4 flex gap-2">
          <button
            className="px-3 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            onClick={onClose}
            disabled={pending}
          >
            {cancelText}
          </button>
          <button
            className="px-3 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Procesando..." : confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function WithdrawalsInner() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [scope, setScope] = useState<Scope>("all");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<LimitParam>(10);
  const [status, setStatus] = useState<"" | WithdrawalStatus>("");
  const [email, setEmail] = useState<string>("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [rejectionDetail, setRejectionDetail] = useState("");

  const [logins, setLogins] = useState<Record<string, string>>({});
  const [brokerAccountIds, setBrokerAccountIds] = useState<Record<string, string>>({});

  const accessToken = session?.accessToken as string | undefined;

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (status) q.set("status", status);
    if (email) q.set("email", email);
    return q.toString();
  }, [page, limit, status, email]);

  const basePath = scope === "all" ? "/withdrawals" : "/withdrawals/my-withdrawals";
  const url = `${API_BASE}${basePath}?${query}`;

  const fetcher = async (u: string) => {
    const res = await fetch(u, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      credentials: "include",
    });
    if (!res.ok) {
      const text = await res.text();
      const err: HttpError = new Error(text || `Error ${res.status}`);
      err.status = res.status;
      err.body = text;
      throw err;
    }
    return res.json();
  };

  const { data, error, isLoading, mutate } = useSWR<PageResponse<Withdrawal>>(
    accessToken ? url : null,
    fetcher
  );

  const httpStatus: number | undefined = (() => {
    if (error && typeof error === "object" && error !== null) {
      const e = error as Partial<HttpError>;
      if (typeof e.status === "number") return e.status;
    }
    return undefined;
  })();

  useEffect(() => {
    if (httpStatus === 403 && scope === "all") {
      setScope("mine");
    }
  }, [httpStatus, scope]);

  useEffect(() => {
    if (authStatus === "unauthenticated" || (!accessToken && authStatus !== "loading")) {
      router.replace("/auth/login");
    }
  }, [authStatus, accessToken, router]);

  const pageObj = unwrapPage<Withdrawal>(data as unknown);
  const withdrawals = pageObj.items;
  const totalPages = pageObj.totalPages;
  const isServerErr = httpStatus === 500;

  // 🔹 Efecto para cargar logins de challenges
  useEffect(() => {
    async function fetchLogins() {
      const newLogins: Record<string, string> = {};
      const newIds: Record<string, string> = {};
      for (const w of withdrawals) {
        if (w.challengeID && (!logins[w.challengeID] || !brokerAccountIds[w.challengeID])) {
          try {
            const res = await fetch(`${API_BASE}/challenges/${w.challengeID}`, {
              headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            });
            if (res.ok) {
              const json = await res.json();
              const login = json.data?.brokerAccount?.login || "-";
              const accountId = json.data?.brokerAccount?.brokerAccountID || json.data?.brokerAccountID || "";
              newLogins[w.challengeID] = login;
              if (accountId) newIds[w.challengeID] = accountId;
            } else {
              newLogins[w.challengeID] = "-";
            }
          } catch {
            newLogins[w.challengeID] = "-";
          }
        }
      }
      const hasLogins = Object.keys(newLogins).length > 0;
      const hasIds = Object.keys(newIds).length > 0;
      if (hasLogins) setLogins((prev) => ({ ...prev, ...newLogins }));
      if (hasIds) setBrokerAccountIds((prev) => ({ ...prev, ...newIds }));
    }
    if (withdrawals.length) fetchLogins();
  }, [withdrawals, accessToken, logins]);

  async function approve(w: Withdrawal) {
    setSelected(w);
    setRejectionDetail("");
    setConfirmOpen(true);
  }

  async function reject(w: Withdrawal) {
    setSelected(w);
    setRejectionDetail("");
    setRejectOpen(true);
  }

  async function handleApproveConfirm() {
    if (!selected) return;
    try {
      setProcessing(true);
      await withdrawalsApi.updateStatus(selected.withdrawalID, { status: "approved" });
      setConfirmOpen(false);
      setSelected(null);
      await mutate();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  }

  async function handleRejectConfirm() {
    if (!selected) return;
    try {
      setProcessing(true);
      const payload: any = { status: "rejected" };
      if (rejectionDetail.trim()) payload.observation = rejectionDetail.trim();
      await withdrawalsApi.updateStatus(selected.withdrawalID, payload);
      setRejectOpen(false);
      setSelected(null);
      await mutate();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6 pt-4">
        <ManagerHeader title="Withdrawals" description="Manage withdrawal requests" />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 dark:text-gray-400">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as WithdrawalStatus | "");
                setPage(1);
              }}
              className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600/50 rounded-md bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 dark:text-gray-400">User email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setPage(1);
              }}
              placeholder="user@example.com"
              className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600/50 rounded-md bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
            />
          </div>

          <div className="text-sm text-gray-600 ml-auto">
            {`Showing ${withdrawals.length} records`}
          </div>
        </div>

        {/* Error messages */}
        {isServerErr && (
          <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
            The server returned 500. Ensure the <b>status</b> is sent in
            lowercase (<code>pending|approved|paid|rejected</code>).
          </div>
        )}

        {(() => {
          const columns: ColumnConfig[] = [
            {
              key: "userName",
              label: "Usuario",
              type: "link",
              linkUrl: (_value, row) => `/admin/users/${(row as any)?.__raw?.userID ?? (row as any)?.userID}`,
            },
            {
              key: "login",
              label: "Login",
              type: "link",
              linkUrl: (value, row) => {
                const w = (row as any)?.__raw as Withdrawal | undefined;
                const id = w?.challengeID ? brokerAccountIds[w.challengeID] : undefined;
                return id
                  ? `/admin/brokeraccounts/${id}`
                  : `/admin/brokeraccounts?login=${encodeURIComponent(String(value ?? ""))}`;
              },
            },
            // 🔹 Columna wallet con ancho reducido
            {
              key: "wallet",
              label: "Wallet",
              type: "normal",
              //width: "140px", // Ancho fijo reducido
              render: (value) => <WalletCell wallet={String(value)} />,
            },
            { key: "amount", label: "Amount", type: "normal" },
            {
              key: "status",
              label: "Status",
              type: "normal",
              render: (v) => <Badge status={String(v)} />,
            },
            { key: "observation", label: "Observation", type: "normal" },
          ];

          const rows = withdrawals.map((w) => ({
            __raw: w,
            userName: w.user
              ? `${w.user.firstName ?? ""} ${w.user.lastName ?? ""}`.trim() ||
                w.user.email ||
                w.userID
              : w.userID,
            login: w.challengeID ? logins[w.challengeID] || "Cargando..." : "-",
            challenge: w.challengeID || "-",
            wallet: w.wallet ?? "-",
            amount: money.format(Number(w.amount ?? 0)),
            status: w.status,
            observation: w.observation ? w.observation : "-",
          }));

          return (
            <PaginatedCardTable
              columns={columns}
              rows={rows}
              isLoading={isLoading}
              emptyText={error ? (error as Error).message : "No withdrawals."}
              actionsHeader="Actions"
              renderActions={(row) => {
                const w = row.__raw as Withdrawal;
                const canAct = String(w.status).toUpperCase() === "PENDING";
                return (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      className="px-2 py-1 text-[11px] rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                      disabled={!canAct}
                      onClick={() => approve(w)}
                    >
                      Approve
                    </button>
                    <button
                      className="px-2 py-1 text-[11px] rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                      disabled={!canAct}
                      onClick={() => reject(w)}
                    >
                      Reject
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
          );
        })()}

        {/* Confirm Modal */}
        <ConfirmModal
          open={confirmOpen}
          title="Complete withdrawal"
          description={
            selected
              ? `Mark withdrawal of ${money.format(Number(selected.amount))} as paid?`
              : undefined
          }
          pending={processing}
          onClose={() => !processing && setConfirmOpen(false)}
          onConfirm={handleApproveConfirm}
          confirmText="Complete"
        />

        {/* Reject Modal */}
        <ConfirmModal
          open={rejectOpen}
          title="Reject withdrawal"
          description={
            selected
              ? `Reject withdrawal of ${money.format(Number(selected.amount))}?`
              : undefined
          }
          pending={processing}
          onClose={() => !processing && setRejectOpen(false)}
          onConfirm={handleRejectConfirm}
          confirmText="Reject"
        >
          <div className="space-y-2">
            <label className="text-xs text-gray-600 dark:text-gray-300">
              Reason (optional)
            </label>
            <textarea
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Detail the reason for rejection"
              value={rejectionDetail}
              onChange={(e) => setRejectionDetail(e.target.value)}
              rows={3}
            />
          </div>
        </ConfirmModal>
      </div>
    </MainLayout>
  );
}