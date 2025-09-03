"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  HomeIcon,
  UserGroupIcon,
  BanknotesIcon,
  TrophyIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useTheme } from "../../hooks/useTheme";
import { LOGO_APP } from "@/config";

import type { NavigationItem, SidebarProps } from "@/types";

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: HomeIcon },
  { name: "Challenges", href: "/admin/challenges", icon: TrophyIcon },
  { name: "Challenge Templates", href: "/admin/challenge-templates", icon: DocumentTextIcon },
  { name: "Usuarios", href: "/admin/users", icon: UserGroupIcon },
  { name: "Verificaciones", href: "/admin/verifications", icon: ShieldCheckIcon },
  { name: "Broker Accounts", href: "/admin/brokeraccounts", icon: DocumentTextIcon },
  { name: "Retiros", href: "/admin/withdrawals", icon: BanknotesIcon },
  { name: "Correo", href: "/admin/correo", icon: EnvelopeIcon },
  { name: "Asignacion", href: "/admin/assignment", icon: UserPlusIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  const user = session?.user;
  const firstName = user?.firstName?.trim();
  const lastName = user?.lastName?.trim();
  const username = user?.username?.trim();
  const email = user?.email?.trim();
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    username ||
    email ||
    "Usuario";
  const initials = (
    firstName?.[0] ||
    username?.[0] ||
    email?.[0] ||
    "U"
  ).toUpperCase();
  const roleLabel = (() => {
    const roles = user?.roles as string[] | undefined;
    const singleRole = (user as unknown as { role?: { name?: string } })?.role
      ?.name as string | undefined;
    const candidate = roles?.[0] || singleRole;
    if (!candidate) return "Usuario";
    const normalized = candidate.replace(/[-_]/g, " ");
    return normalized.replace(/\b\w/g, (c) => c.toUpperCase());
  })();

  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onToggle?.();
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isCollapsed) setUserMenuOpen(false);
  }, [isCollapsed]);

  const handleUserButtonClick = () => {
    if (isCollapsed) return; // colapsado no abre dropdown
    setUserMenuOpen(!userMenuOpen);
  };

  return (
    <>
      {isHydrated && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div
        className={classNames(
          "fixed inset-y-0 left-0 z-30 flex flex-col h-screen transition-all duration-300 ease-in-out lg:relative",
          isCollapsed ? "w-16" : "w-64",
          "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 dark:border-gray-700/50"
        )}
      >
        {/* Header */}
        <div
          className={classNames(
            "flex items-center h-16 bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 shadow-lg border-b border-gray-700/50",
            isCollapsed ? "px-2 justify-center" : "px-4 justify-between"
          )}
        >
          {!isCollapsed && LOGO_APP && (
            <div className="flex-1 mr-2">
              <div className="relative h-8 w-full">
                <Image
                  src={LOGO_APP}
                  alt="Logo"
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 256px"
                  priority
                />
              </div>
            </div>
          )}

          {!isCollapsed && !LOGO_APP && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">PF</span>
              </div>
              <h1 className="text-xl font-bold text-white">PropFirm</h1>
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer backdrop-blur-sm"
          >
            {isCollapsed ? (
              <Bars3Icon className="h-5 w-5" />
            ) : (
              <XMarkIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 min-h-0 py-4 overflow-x-visible overflow-y-auto">
          <nav className={classNames("space-y-2", isCollapsed ? "px-2" : "px-3")}>
            {navigation.map((item, index) => {
              // ✅ Condición corregida
              const isActive =
                item.href === "/admin/dashboard"
                  ? pathname === "/admin/dashboard"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              const showDivider = index === 0 || index === 2;

              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={false} // ✅ evita redirecciones raras
                    className={classNames(
                      "group flex items-center text-sm font-medium rounded-xl transition-all duration-300 ease-out relative overflow-hidden",
                      isCollapsed ? "p-3 justify-center" : "px-4 py-3",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-500/20 transform scale-[1.02]"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-700 hover:text-gray-900 dark:hover:text-white hover:shadow-md"
                    )}
                    title={isCollapsed ? item.name : ""}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-indigo-400/20 animate-pulse" />
                    )}

                    <item.icon
                      className={classNames(
                        "flex-shrink-0 h-5 w-5 transition-all duration-300 relative z-10",
                        isActive
                          ? "text-white drop-shadow-sm"
                          : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200",
                        isCollapsed ? "" : "mr-3"
                      )}
                      aria-hidden="true"
                    />

                    {!isCollapsed && (
                      <>
                        <div className="flex-1 relative z-10">
                          <div className="flex items-center justify-between">
                            <span className="truncate font-medium">{item.name}</span>
                          </div>
                        </div>
                        {isActive && (
                          <ChevronRightIcon className="h-4 w-4 text-white ml-2 relative z-10 drop-shadow-sm" />
                        )}
                      </>
                    )}

                    {isCollapsed && (
                      <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl backdrop-blur-sm">
                        {item.name}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45" />
                      </div>
                    )}
                  </Link>

                  {showDivider && (
                    <div className={classNames("my-4", isCollapsed ? "px-2" : "px-4")}>
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-400 dark:via-gray-600 to-transparent opacity-60"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Menu Section */}
        <div
          className={classNames(
            "border-t border-gray-200/50 dark:border-gray-700/50 relative bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50 flex-shrink-0",
            isCollapsed ? "p-2" : "p-4"
          )}
          ref={userMenuRef}
        >
          {userMenuOpen && !isCollapsed && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 py-2 z-50">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all rounded-lg"
              >
                {theme === "light" ? (
                  <MoonIcon className="h-4 w-4 mr-3 text-indigo-500" />
                ) : (
                  <SunIcon className="h-4 w-4 mr-3 text-amber-500" />
                )}
                {theme === "light" ? "Modo Oscuro" : "Modo Claro"}
              </button>

              <div className="h-px bg-gray-200 dark:bg-gray-600 my-2" />

              <Link
                href="/admin/profile"
                prefetch={false}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all rounded-lg"
              >
                <UserIcon className="h-4 w-4 mr-3 text-blue-500" />
                Mi Perfil
              </Link>

              <div className="h-px bg-gray-200 dark:bg-gray-600 my-2" />

              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="w-full flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all rounded-lg"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                Cerrar Sesión
              </button>
            </div>
          )}

          <button
            onClick={handleUserButtonClick}
            className={classNames(
              "group flex items-center w-full rounded-xl transition-all duration-300 relative overflow-hidden",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3",
              "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            )}
          >
            <div className="relative flex items-center">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-sm">{initials}</span>
                </div>
              </div>
              {!isCollapsed && (
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {roleLabel}
                      </p>
                    </div>
                    <div className="ml-2">
                      {userMenuOpen ? (
                        <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
