"use client";

import MainLayout from "@/components/layouts/MainLayout";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import { ManagerHeader } from "@/components/challenge-templates/ManagerHeader";
import type { ColumnConfig } from "@/types";
import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Challenge, PageResponse } from "@/types";
import { apiBaseUrl } from "@/config";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TrashIcon } from "@heroicons/react/24/outline";

type LimitParam = number;

const API_BASE = apiBaseUrl.replace(/\/$/, "");

// Función para calcular la posición inteligente del dropdown
const calculateDropdownPosition = (
  buttonRect: DOMRect,
  dropdownWidth = 200,
  dropdownHeight = 150
) => {
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

function ChallengesInner() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<LimitParam>(10);
  const [status, setStatus] = useState<string>("");

  // 🔎 Nuevos filtros
  const [userFilter, setUserFilter] = useState<string>("");
  const [loginFilter, setLoginFilter] = useState<string>("");

  // Estados para modales y dropdown de acciones
  const [showDisapprovalModal, setShowDisapprovalModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showAntiChuchoModal, setShowAntiChuchoModal] = useState(false);

  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );
  const [disapprovalReason, setDisapprovalReason] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Estados de loading para cada acción
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [isLoadingApproval, setIsLoadingApproval] = useState(false);
  const [isLoadingDisapproval, setIsLoadingDisapproval] = useState(false);
  const [isLoadingAntiChucho, setIsLoadingAntiChucho] = useState(false);

  const accessToken = session?.accessToken as string | undefined;

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (status) q.set("status", status);
    // Backend accepts: userID (UUID), search (email/username/fullname), login (broker login)
    const userVal = userFilter.trim();
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (userVal && uuidRegex.test(userVal)) {
      q.set("userID", userVal);
    } else if (userVal) {
      q.set("search", userVal);
    }
    const loginVal = loginFilter.trim();
    if (loginVal) q.set("login", loginVal);
    return q.toString();
  }, [page, limit, status, userFilter, loginFilter]);

  const url = `${API_BASE}/challenges?${query}`;

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

  const { data, error, isLoading, mutate } = useSWR<PageResponse<Challenge>>(
    accessToken ? url : null,
    fetcher
  );

  useEffect(() => {
    if (
      authStatus === "unauthenticated" ||
      (!accessToken && authStatus !== "loading")
    ) {
      router.replace("/auth/login");
    }
  }, [authStatus, accessToken, router]);

  // Funciones de manejo de acciones
  const handleSendCredentials = async (challenge: Challenge) => {
    if (!accessToken) return;


    setIsLoadingCredentials(true);
    try {
      const response = await fetch(
        `${API_BASE}/challenges/${challenge.challengeID}/send-credentials`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );


      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error al enviar credenciales: ${response.status} - ${errorText}`
        );
      }

      // Show success notification
      toast.success("Credentials sent successfully");

      // Reload data
      mutate();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error sending credentials");
    } finally {
      setIsLoadingCredentials(false);
      setShowCredentialsModal(false);
    }
  };

  const handleApprove = async (challenge: Challenge) => {
    if (!accessToken) return;


    setIsLoadingApproval(true);
    try {
      const response = await fetch(
        `${API_BASE}/challenges/${challenge.challengeID}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );


      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error al aprobar challenge: ${response.status} - ${errorText}`
        );
      }

      // Show success notification
      toast.success("Challenge approved successfully");

      // Reload data
      mutate();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error approving challenge");
    } finally {
      setIsLoadingApproval(false);
      setShowApprovalModal(false);
    }
  };

  const confirmDisapproval = async () => {
    if (!selectedChallenge || !accessToken || !disapprovalReason.trim()) return;


    setIsLoadingDisapproval(true);
    try {
      const response = await fetch(
        `${API_BASE}/challenges/${selectedChallenge.challengeID}/disapprove`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ observation: disapprovalReason.trim() }),
          credentials: "include",
        }
      );


      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error al desaprobar challenge: ${response.status} - ${errorText}`
        );
      }

      // Show success notification
      toast.success("Challenge disapproved successfully");

      // Reload data
      mutate();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error disapproving challenge");
    } finally {
      setIsLoadingDisapproval(false);
      closeDisapprovalModal();
    }
  };

  const handleAntiChuchoDelete = async (challenge: Challenge) => {
    if (!accessToken) return;
    setIsLoadingAntiChucho(true);
    try {
      const res = await fetch(
        `${API_BASE}/challenges/${challenge.challengeID}/anti-chucho-delete`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        }
      );
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }
    toast.success("Anticucho deleted successfully");
      mutate();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar especial");
    } finally {
      setIsLoadingAntiChucho(false);
      setShowAntiChuchoModal(false);
      setSelectedChallenge(null);
    }
  };

  // Funciones auxiliares para cerrar modales
  const closeCredentialsModal = () => {
    setShowCredentialsModal(false);
    setSelectedChallenge(null);
  };

  const closeApprovalModal = () => {
    setShowApprovalModal(false);
    setSelectedChallenge(null);
  };

  const closeDisapprovalModal = () => {
    setShowDisapprovalModal(false);
    setSelectedChallenge(null);
    setDisapprovalReason("");
  };

  const closeAntiChuchoModal = () => {
    setShowAntiChuchoModal(false);
    setSelectedChallenge(null);
  };

  // useEffect para manejo de eventos de dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".dropdown-container")) {
        setDropdownOpen(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDropdownOpen(null);
      }
    };

    const handleScroll = (event: Event) => {
      // Solo cerrar si el scroll ocurre FUERA del dropdown
      const dropdowns = document.querySelectorAll('.dropdown-container');
      let insideDropdown = false;
      if (event.target instanceof Node) {
        dropdowns.forEach((el) => {
          if (el.contains(event.target as Node)) {
            insideDropdown = true;
          }
        });
      }
      if (!insideDropdown && dropdownOpen) {
        setDropdownOpen(null);
      }
    };

    const handleResize = () => {
      if (dropdownOpen) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [dropdownOpen]);

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

  const pageObj = unwrapPage<Challenge>(data as unknown);
  const challenges = pageObj.items;
  const totalPages = pageObj.totalPages;
  const offset = (page - 1) * limit;

  const columns: ColumnConfig[] = [
    { key: "serial", label: "ID", type: "normal" },
    {
      key: "user",
      label: "User",
      type: "link",
      linkUrl: (_value, row) =>
        `/admin/users/${
          (row as any)?.__raw?.userID ?? (row as any)?.userID ?? ""
        }`,
    },
    {
      key: "login",
      label: "Login",
      type: "link",
      linkUrl: (_value, row) => {
        const r: any = row as any;
        const challengeID = r?.__raw?.challengeID ?? r?.challengeID;
        if (challengeID) return `/admin/challenges/${challengeID}`;
        return "#";
      },
    },
    { key: "platform", label: "Platform", type: "normal" },
    { key: "numPhase", label: "Phase", type: "normal" },
    //{ key: "dynamicBalance", label: "Dyn. Balance", type: "normal" },
    { key: "status", label: "Status", type: "normal" },
    { key: "isActive", label: "Active", type: "normal" },
    { key: "startDate", label: "Start", type: "normal" },
    { key: "endDate", label: "End", type: "normal" },
    {
      key: "actions",
      label: "Actions",
      type: "normal",
      render: (value, row) => value as React.ReactNode,
    },
  ];

  const rows: Record<string, unknown>[] = challenges.map((c, idx) => {
    const serial = offset + idx + 1;
    const userName = c.user
      ? `${c.user.firstName ?? ""} ${c.user.lastName ?? ""}`.trim() ||
        c.user.email ||
        c.userID
      : c.userID;
    const login = c.brokerAccount?.login ?? "-";
    const platform = c.brokerAccount?.platform ?? "-";
    const dynBal = c.dynamicBalance != null ? String(c.dynamicBalance) : "-";
    const start = c.startDate
      ? new Date(c.startDate).toLocaleDateString()
      : "-";
    const end = c.endDate ? new Date(c.endDate).toLocaleDateString() : "-";

    const challengeId = c.challengeID;
    const isDropdownOpen = dropdownOpen === challengeId;

    const actionsComponent = (
      <div className="dropdown-container relative">
        <button
          data-challenge-id={c.challengeID}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            if (dropdownOpen === c.challengeID) {
              setDropdownOpen(null);
            } else {
              const rect = e.currentTarget.getBoundingClientRect();
              const position = calculateDropdownPosition(rect);
              setDropdownPosition(position);
              setDropdownOpen(c.challengeID);
            }
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          type="button"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
          Actions
          <svg
            className={`w-4 h-4 transform transition-transform duration-200 ${
              dropdownOpen === c.challengeID ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown menu mejorado con posicionamiento inteligente */}
        {dropdownOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(null)}
          >
            <div
              className="absolute bg-white dark:bg-gray-800 border border-gray-200  dark:border-gray-600 rounded-lg shadow-sm z-50 min-w-[200px] max-w-[250px] dropdown-container animate-in fade-in-0 zoom-in-95 duration-100"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                maxHeight: "200px",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const id = dropdownOpen;
                    setDropdownOpen(null);
                    if (id) router.push(`/admin/challenges/${id}`);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                  type="button"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span className="truncate">Ver</span>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const challenge = challenges.find(
                      (c) => c.challengeID === dropdownOpen
                    );
                    if (challenge) {
                      setSelectedChallenge(challenge);
                      setShowCredentialsModal(true);
                    }
                    setDropdownOpen(null);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-300 transition-colors duration-150"
                  type="button"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="truncate">Send Credentials</span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const challenge = challenges.find(
                      (c) => c.challengeID === dropdownOpen
                    );
                    if (challenge) {
                      setSelectedChallenge(challenge);
                      setShowApprovalModal(true);
                    }
                    setDropdownOpen(null);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-300 transition-colors duration-150"
                  type="button"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="truncate">Approve Challenge</span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const challenge = challenges.find(
                      (c) => c.challengeID === dropdownOpen
                    );
                    if (challenge) {
                      setSelectedChallenge(challenge);
                      setShowDisapprovalModal(true);
                    }
                    setDropdownOpen(null);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300 transition-colors duration-150"
                  type="button"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span className="truncate">Disapprove Challenge</span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const challenge = challenges.find(
                      (c) => c.challengeID === dropdownOpen
                    );
                    if (challenge) {
                      setSelectedChallenge(challenge);
                      setShowAntiChuchoModal(true);
                    }
                    setDropdownOpen(null);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-300 transition-colors duration-150"
                  type="button"
                >
                  <TrashIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Delete Anticucho</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );

    return {
      __raw: c,
      userID: c.userID,
      serial,
      user: userName,
      login,
      platform,
      numPhase: c.numPhase ?? "-",
      dynamicBalance: dynBal,
      status: c.status ?? "-",
      isActive: c.isActive ? "Sí" : "No",
      startDate: start,
      endDate: end,
      actions: actionsComponent,
    };
  });

  // Backend now supports search and login; no need for client-side filtering
  const rowsFiltered = rows;

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        <ManagerHeader
          title="Challenges"
          description="Manage and monitor all user challenges"
          totalCount={pageObj.total}
          showTotalCount={true}
        />

        {/* Send Credentials Modal */}
        {showCredentialsModal && selectedChallenge && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Send Credentials</h3>
              <p className="text-gray-600 mb-4">
                Do you confirm sending credentials for this challenge?
              </p>
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p>
                  <strong>Challenge ID:</strong> {selectedChallenge.challengeID}
                </p>
                <p>
                  <strong>User:</strong>{" "}
                  {selectedChallenge.user
                    ? `${selectedChallenge.user.firstName || ""} ${
                        selectedChallenge.user.lastName || ""
                      }`.trim() || selectedChallenge.user.email
                    : selectedChallenge.userID}
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeCredentialsModal}
                  disabled={isLoadingCredentials}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendCredentials(selectedChallenge)}
                  disabled={isLoadingCredentials}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isLoadingCredentials ? "Sending..." : "Send Credentials"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approve Challenge Modal */}
        {showApprovalModal && selectedChallenge && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Approve Challenge</h3>
              <p className="text-gray-600 mb-4">
                Do you confirm the approval of this challenge?
              </p>
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p>
                  <strong>Challenge ID:</strong> {selectedChallenge.challengeID}
                </p>
                <p>
                  <strong>User:</strong>{" "}
                  {selectedChallenge.user
                    ? `${selectedChallenge.user.firstName || ""} ${
                        selectedChallenge.user.lastName || ""
                      }`.trim() || selectedChallenge.user.email
                    : selectedChallenge.userID}
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeApprovalModal}
                  disabled={isLoadingApproval}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApprove(selectedChallenge)}
                  disabled={isLoadingApproval}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isLoadingApproval ? "Approving..." : "Approve Challenge"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Disapprove Challenge Modal */}
        {showDisapprovalModal && selectedChallenge && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Disapprove Challenge
              </h3>
              <p className="text-gray-600 mb-4">
                Provide a reason for disapproval:
              </p>
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p>
                  <strong>Challenge ID:</strong> {selectedChallenge.challengeID}
                </p>
                <p>
                  <strong>User:</strong>{" "}
                  {selectedChallenge.user
                    ? `${selectedChallenge.user.firstName || ""} ${
                        selectedChallenge.user.lastName || ""
                      }`.trim() || selectedChallenge.user.email
                    : selectedChallenge.userID}
                </p>
              </div>
              <textarea
                value={disapprovalReason}
                onChange={(e) => setDisapprovalReason(e.target.value)}
                placeholder="Write the reason for disapproval..."
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 min-h-[100px] resize-vertical"
                disabled={isLoadingDisapproval}
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDisapprovalModal}
                  disabled={isLoadingDisapproval}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDisapproval}
                  disabled={isLoadingDisapproval || !disapprovalReason.trim()}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isLoadingDisapproval
                    ? "Disapproving..."
                    : "Disapprove Challenge"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Delete Anticucho */}
        {showAntiChuchoModal && selectedChallenge && (
          <Dialog open={showAntiChuchoModal} onOpenChange={setShowAntiChuchoModal}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Anticucho Delete</DialogTitle>
                <DialogDescription>
                  This will delete the challenge and its associated broker (if any), as well as all related dependencies.
                </DialogDescription>
              </DialogHeader>
              <div className="mb-4 p-3 bg-gray-900 rounded">
                <p>
                  <strong>Challenge ID:</strong> {selectedChallenge?.challengeID}
                </p>
                <p>
                  <strong>Login:</strong> {selectedChallenge?.brokerAccount?.login || "-"}
                </p>
              </div>
              <DialogFooter>
                <button
                  type="button"
                  onClick={() => {
                    setShowAntiChuchoModal(false);
                    setSelectedChallenge(null);
                  }}
                  disabled={isLoadingAntiChucho}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => selectedChallenge && handleAntiChuchoDelete(selectedChallenge)}
                  disabled={isLoadingAntiChucho}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {isLoadingAntiChucho ? "Deleting..." : "Delete"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end flex-wrap">
            <div className="w-full sm:w-48">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                User
              </label>
              <input
                type="text"
                placeholder="Name, email or ID"
                className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Login
              </label>
              <input
                type="text"
                placeholder="Login..."
                className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={loginFilter}
                onChange={(e) => {
                  setLoginFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
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
          rows={rowsFiltered}
          isLoading={isLoading}
          emptyText={error ? (error as Error).message : "No challenges found."}
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
      </div>
    </MainLayout>
  );
}

export default function ChallengesPage() {
  return <ChallengesInner />;
}
