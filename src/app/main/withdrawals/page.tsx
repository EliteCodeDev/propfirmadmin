"use client";

import MainLayout from "@/components/layouts/MainLayout";
import { ManagerHeader } from "@/components/challenge-templates/ManagerHeader";
import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/types";
import type { Withdrawal, WithdrawalStatus, PageResponse, HttpError } from "@/types";
import { apiBaseUrl } from "@/config";
import { withdrawalsApi } from "@/api/withdrawals";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Removed ClipboardIcon import as Withdrawal ID column is removed

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

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

type UnknownRecord = Record<string, unknown>;

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
  const dataField = (r && (r as UnknownRecord)["data"]) as unknown;
  const layer: UnknownRecord | unknown[] | undefined =
    dataField && !Array.isArray(dataField) ? (dataField as UnknownRecord) : r;

  let items: T[] = [];
  if (layer && typeof layer === "object" && !Array.isArray(layer)) {
    const maybeData = (layer as UnknownRecord)["data"] as unknown;
    const maybeItems = (layer as UnknownRecord)["items"] as unknown;
    if (Array.isArray(maybeData)) items = maybeData as T[];
    else if (Array.isArray(maybeItems)) items = maybeItems as T[];
  } else if (Array.isArray(layer)) {
    items = layer as T[];
  }

  const total =
    layer &&
    typeof layer === "object" &&
    typeof (layer as UnknownRecord)["total"] === "number"
      ? ((layer as UnknownRecord)["total"] as number)
      : items.length;
  const page =
    layer &&
    typeof layer === "object" &&
    typeof (layer as UnknownRecord)["page"] === "number"
      ? ((layer as UnknownRecord)["page"] as number)
      : 1;
  const limit =
    layer &&
    typeof layer === "object" &&
    typeof (layer as UnknownRecord)["limit"] === "number"
      ? ((layer as UnknownRecord)["limit"] as number)
      : items.length;
  const totalPages =
    typeof (layer as any)?.totalPages === "number"
      ? (layer as any).totalPages
      : limit > 0
      ? Math.max(1, Math.ceil(total / limit))
      : 1;

  return { items, total, page, limit, totalPages };
}

function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
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
          <DialogTitle className="text-gray-900 dark:text-white text-base font-semibold">{title}</DialogTitle>
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

function WithdrawalsInner() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  // Estado
  const [scope, setScope] = useState<Scope>("all");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<LimitParam>(10);
  const [status] = useState<"" | WithdrawalStatus>("");
  const [email, setEmail] = useState<string>("");

  // Modales y estado de acciones
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [rejectionDetail, setRejectionDetail] = useState("");

  const accessToken = session?.accessToken as string | undefined;

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (status) q.set("status", status); // minúsculas a UI; backend tolera mayúsculas en API propia axios
    if (email) q.set("email", email);
    return q.toString();
  }, [page, limit, status, email]);

  const basePath =
    scope === "all"
      ? "/withdrawals" // requiere rol admin
      : "/withdrawals/my-withdrawals";

  const url = `${API_BASE}${basePath}?${query}`;

  const fetcher = async (u: string) => {
    const res = await fetch(u, {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
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

  // Derivar httpStatus de forma estable
  const httpStatus: number | undefined = (() => {
    if (error && typeof error === "object" && error !== null) {
      const e = error as Partial<HttpError>;
      if (typeof e.status === "number") return e.status;
    }
    return undefined;
  })();

  // Si el usuario no tiene permisos para ver "Todos (admin)", alterna automáticamente a "Mis retiros"
  useEffect(() => {
    if (httpStatus === 403 && scope === "all") {
      setScope("mine");
    }
  }, [httpStatus, scope]);

  // Redirección si no hay sesión
  useEffect(() => {
    if (authStatus === "unauthenticated" || (!accessToken && authStatus !== "loading")) {
      router.replace("/auth/login");
    }
  }, [authStatus, accessToken, router]);

  if (
    authStatus === "loading" ||
    (!accessToken && authStatus !== "unauthenticated")
  ) {
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

  const pageObj = unwrapPage<Withdrawal>(data as unknown);
  const withdrawals = pageObj.items;
  const totalPages = pageObj.totalPages;
  const offset = (page - 1) * limit;
  const isServerErr = httpStatus === 500;

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
      await withdrawalsApi.updateStatus(selected.withdrawalID, { status: "paid" });
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
      // Si el backend requiere rejectionDetail, lo enviamos cuando se provee.
      const payload: any = { status: "rejected" };
      if (rejectionDetail.trim()) payload.rejectionDetail = rejectionDetail.trim();
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
        <ManagerHeader
          title="Retiros"
          description="Gestión de solicitudes de retiro"
        />

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 dark:text-gray-400">Ámbito</label>
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as Scope);
                setPage(1);
              }}
              className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600/50 rounded-md bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
            >
              <option value="all">Todos (admin)</option>
              <option value="mine">Mis retiros</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 dark:text-gray-400">Email usuario</label>
            <input
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setPage(1);
              }}
              placeholder="usuario@correo.com"
              className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600/50 rounded-md bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
            />
          </div>

          <div className="text-sm text-gray-600 ml-auto">
            {`Mostrando ${withdrawals.length} registros`}
          </div>
        </div>

        {/* Mensajes de error */}
        {isServerErr && (
          <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
            El servidor devolvió 500. Asegúrate de enviar <b>status</b> en
            minúsculas (<code>pending|approved|paid|rejected</code>) y revisa los
            logs del backend.
          </div>
        )}

        {(() => {
          const columns: ColumnConfig[] = [
            { key: "serial", label: "ID", type: "normal" },
            { key: "createdAt", label: "Fecha", type: "normal" },
            {
              key: "amount",
              label: "Monto",
              type: "normal",
              render: (v) => String(v),
            },
            { key: "wallet", label: "Wallet", type: "normal" },
            { key: "challenge", label: "Desafío", type: "normal" },
            {
              key: "status",
              label: "Estado",
              type: "normal",
              render: (v) => <Badge status={String(v)} />,
            },
            { key: "observation", label: "Observación", type: "normal" },
            ...(scope === "all"
              ? [
                  {
                    key: "userName",
                    label: "Usuario",
                    type: "normal",
                  } as ColumnConfig,
                ]
              : []),
          ];

          const rows = withdrawals.map((w, idx) => ({
            __raw: w,
            serial: offset + idx + 1,
            createdAt: w.createdAt ? new Date(w.createdAt).toLocaleString() : "-",
            amount: money.format(Number(w.amount ?? 0)),
            wallet: w.wallet ?? "-",
            challenge: w.challenge?.name || w.challengeID || "-",
            status: w.status,
            observation: w.observation ? w.observation : "-",
            userName:
              scope === "all"
                ? w.user
                  ? `${w.user.firstName ?? ""} ${w.user.lastName ?? ""}`.trim() ||
                    w.user.email ||
                    w.userID
                  : w.userID
                : undefined,
          }));

          return (
            <PaginatedCardTable
              columns={columns}
              rows={rows}
              isLoading={isLoading}
              emptyText={error ? (error as Error).message : "No hay retiros."}
              actionsHeader="Acciones"
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
                      Completar
                    </button>
                    <button
                      className="px-2 py-1 text-[11px] rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                      disabled={!canAct}
                      onClick={() => reject(w)}
                    >
                      Rechazar
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

        {/* Modal de Confirmación para Aprobar */}
        <ConfirmModal
          open={confirmOpen}
          title="Completar retiro"
          description={selected ? `Marcar como pagado el retiro de ${money.format(Number(selected.amount))}?` : undefined}
          pending={processing}
          onClose={() => !processing && setConfirmOpen(false)}
          onConfirm={handleApproveConfirm}
          confirmText="Completar"
        />

        {/* Modal de Rechazo */}
        <ConfirmModal
          open={rejectOpen}
          title="Rechazar retiro"
          description={selected ? `Rechazar retiro de ${money.format(Number(selected.amount))}?` : undefined}
          pending={processing}
          onClose={() => !processing && setRejectOpen(false)}
          onConfirm={handleRejectConfirm}
          confirmText="Rechazar"
        >
          <div className="space-y-2">
            <label className="text-xs text-gray-600 dark:text-gray-300">Motivo (opcional)</label>
            <textarea
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Detalle del motivo de rechazo"
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

export default function WithdrawalsPage() {
  return (
    <SessionProvider>
      <WithdrawalsInner />
    </SessionProvider>
  );
}
