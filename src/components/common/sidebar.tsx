"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
} from "@heroicons/react/24/outline";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useTheme } from "../../hooks/useTheme";
import { LOGO_APP } from "@/config";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/main/dashboard",
    icon: HomeIcon,
    description: "Panel principal",
  },
  {
    name: "Challenges",
    href: "/main/challenges",
    icon: TrophyIcon,
    description: "Gestión de challenges",
  },
  {
    name: "Challenge Templates",
    href: "/main/challenge-templates",
    icon: DocumentTextIcon,
    description: "Plantillas de challenges",
  },
  {
    name: "Usuarios",
    href: "/main/users",
    icon: UserGroupIcon,
    description: "Lista de usuarios",
  },
  {
    name: "Broker Accounts",
    href: "/main/brokeraccounts",
    icon: DocumentTextIcon,
    description: "Gestión de cuentas de broker",
  },
  {
    name: "Retiros",
    href: "/main/withdrawals",
    icon: BanknotesIcon,
    description: "Gestión de retiros",
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  // Sincronizar con el estado externo
  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  // Derive user display data from session
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

  // Cerrar el menú de usuario cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isCollapsed) {
      setUserMenuOpen(false);
    }
  }, [isCollapsed]);

  // Handler para navegación con prevención de problemas
  const handleNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault();

    // Evitar navegación duplicada si ya estamos en la ruta
    if (pathname === href) {
      return;
    }

    // Usar router.push para navegación programática
    router.push(href);
  };

  // Click handler para el botón de usuario: navegar cuando está colapsado, desplegar menú cuando está expandido
  const handleUserButtonClick = () => {
    if (isCollapsed) {
      // Asumimos la ruta existente '/main/profile'
      router.push("/main/profile");
      return;
    }
    setUserMenuOpen(!userMenuOpen);
  };

  return (
    <>
      {/* Mobile backdrop - solo visible en mobile cuando sidebar está expandido */}
      {!isCollapsed && (
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

        {/* Navigation (scrollable area) */}
        <div className="flex-1 min-h-0 py-4 overflow-x-visible overflow-y-auto">
          <nav
            className={classNames("space-y-2", isCollapsed ? "px-2" : "px-3")}
          >
            {navigation.map((item, index) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const showDivider = index === 0 || index === 2; // Después de Dashboard y Challenge Templates

              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    onClick={(e) => handleNavigation(item.href, e)}
                    className={classNames(
                      "group flex items-center text-sm font-medium rounded-xl transition-all duration-300 ease-out relative overflow-hidden",
                      isCollapsed ? "p-3 justify-center" : "px-4 py-3",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-500/20 transform scale-[1.02]"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-700 hover:text-gray-900 dark:hover:text-white hover:shadow-md"
                    )}
                    title={isCollapsed ? item.name : ""}
                  >
                    {/* Active glow effect */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-indigo-400/20 animate-pulse" />
                    )}

                    {/* Active indicator - Adaptativo para modo claro/oscuro */}
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-gray-800 dark:bg-white rounded-r-full shadow-lg" />
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
                            <span className="truncate font-medium">
                              {item.name}
                            </span>
                            {item.badge && (
                              <span
                                className={classNames(
                                  "ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                  isActive
                                    ? "bg-white/20 text-white backdrop-blur-sm"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p
                            className={classNames(
                              "text-xs mt-0.5 truncate",
                              isActive
                                ? "text-blue-100 dark:text-purple-100"
                                : "text-gray-500 dark:text-gray-400"
                            )}
                          >
                            {item.description}
                          </p>
                        </div>

                        {isActive && (
                          <ChevronRightIcon className="h-4 w-4 text-white ml-2 relative z-10 drop-shadow-sm" />
                        )}
                      </>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl backdrop-blur-sm">
                        {item.name}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45" />
                      </div>
                    )}
                  </Link>

                  {/* Separador entre secciones - Mejorado para modo claro */}
                  {showDivider && (
                    <div
                      className={classNames(
                        "my-4",
                        isCollapsed ? "px-2" : "px-4"
                      )}
                    >
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-400 dark:via-gray-600 to-transparent opacity-60"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Menu Section (fixed bottom area) */}
        <div
          className={classNames(
            "border-t border-gray-200/50 dark:border-gray-700/50 relative bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50 flex-shrink-0",
            isCollapsed ? "p-2" : "p-4"
          )}
          ref={userMenuRef}
        >
          {/* Dropdown Menu */}
          {userMenuOpen && !isCollapsed && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 py-2 z-50">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 cursor-pointer rounded-lg mx-1"
              >
                {theme === "light" ? (
                  <MoonIcon className="h-4 w-4 mr-3 text-indigo-500" />
                ) : (
                  <SunIcon className="h-4 w-4 mr-3 text-amber-500" />
                )}
                {theme === "light" ? "Modo Oscuro" : "Modo Claro"}
              </button>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent my-2" />

              <button
                onClick={() => router.push("/main/profile")}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 cursor-pointer rounded-lg mx-1"
              >
                <UserIcon className="h-4 w-4 mr-3 text-blue-500" />
                Mi Perfil
              </button>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent my-2" />

              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="w-full flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-25 dark:hover:from-red-900/20 dark:hover:to-red-800/20 transition-all duration-200 cursor-pointer rounded-lg mx-1"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                Cerrar Sesión
              </button>
            </div>
          )}

          {/* User Button */}
          <button
            onClick={handleUserButtonClick}
            className={classNames(
              "group flex items-center w-full rounded-xl transition-all duration-300 relative overflow-hidden",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3",
              "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-700 cursor-pointer hover:shadow-md"
            )}
            title={isCollapsed ? "Perfil" : ""}
            aria-label={isCollapsed ? "Perfil" : "Menú de usuario"}
          >
            <div className="relative flex items-center">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/20 dark:ring-gray-700/50">
                  <span className="text-white font-semibold text-sm drop-shadow-sm">
                    {initials}
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-gray-900 rounded-full shadow-sm"></div>
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
                        <ChevronUpIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isCollapsed && (
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl backdrop-blur-sm">
                Perfil
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45" />
              </div>
            )}
          </button>

          {/* Menu colapsado */}
          {isCollapsed && (
            <div className="mt-2 space-y-2">
              <button
                onClick={toggleTheme}
                className="w-full p-3 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200 group relative cursor-pointer hover:shadow-md"
                title={theme === "light" ? "Modo Oscuro" : "Modo Claro"}
              >
                {theme === "light" ? (
                  <MoonIcon className="h-5 w-5 mx-auto text-indigo-500" />
                ) : (
                  <SunIcon className="h-5 w-5 mx-auto text-amber-500" />
                )}

                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl backdrop-blur-sm">
                  {theme === "light" ? "Modo Oscuro" : "Modo Claro"}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45" />
                </div>
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="w-full p-3 rounded-xl text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-25 dark:hover:from-red-900/20 dark:hover:to-red-800/20 transition-all duration-200 group relative cursor-pointer hover:shadow-md"
                title="Cerrar sesión"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mx-auto" />

                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl backdrop-blur-sm">
                  Cerrar sesión
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
