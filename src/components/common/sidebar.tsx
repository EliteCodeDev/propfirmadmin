"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  HomeIcon,
  UserGroupIcon,
  BanknotesIcon,
  TrophyIcon,
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
    href: "/dashboard", 
    icon: HomeIcon,
    description: "Panel principal"
  },
  { 
    name: "Challenges", 
    href: "/challenges", 
    icon: TrophyIcon,
    description: "Gestión de challenges"
  },
  { 
    name: "User Challenges", 
    href: "/user-challenges", 
    icon: TrophyIcon,
    description: "Desafíos de usuarios"
  },
  { 
    name: "Usuarios", 
    href: "/users", 
    icon: UserGroupIcon,
    description: "Lista de usuarios"
  },
  { 
    name: "Retiros", 
    href: "/withdrawals", 
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
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || username || email || "Usuario";
  const initials = (firstName?.[0] || username?.[0] || email?.[0] || "U").toUpperCase();
  const roleLabel = (() => {
    const roles = user?.roles as string[] | undefined;
    const singleRole = (user as unknown as { role?: { name?: string } })?.role?.name as string | undefined;
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
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
      // Asumimos la ruta existente '/profile'
      router.push('/profile');
      return;
    }
    setUserMenuOpen(!userMenuOpen);
  };

  return (
    <>
      {/* Mobile backdrop - solo visible en mobile cuando sidebar está expandido */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className={classNames(
        "fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 ease-in-out lg:relative",
        isCollapsed ? "w-16" : "w-64",
        "bg-white dark:bg-gray-900 shadow-xl border-r border-gray-200 dark:border-gray-700"
      )}>
        {/* Header */}
        <div className={classNames(
          "flex items-center h-16 bg-black shadow-sm  dark:border-gray-700",
          isCollapsed ? "px-2 justify-center" : "px-4 justify-between"
        )}>
          {!isCollapsed && process.env.NEXT_PUBLIC_LOGO_APP && (
            <div className="flex-1 mr-2">
              <img 
                src={process.env.NEXT_PUBLIC_LOGO_APP} 
                alt="Logo" 
                className="h-8 w-full object-contain"
              />
            </div>
          )}
          
          {!isCollapsed && !process.env.NEXT_PUBLIC_LOGO_APP && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PF</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                PropFirm
              </h1>
            </div>
          )}
          
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
          >
            {isCollapsed ? (
              <Bars3Icon className="h-5 w-5" />
            ) : (
              <XMarkIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className={classNames(
          "flex-1 py-4 overflow-x-visible",
          isCollapsed ? "overflow-y-visible" : "overflow-y-auto"
        )}>
          <nav className={classNames("space-y-1", isCollapsed ? "px-2" : "px-3")}>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavigation(item.href, e)}
                  className={classNames(
                    "group flex items-center text-sm font-medium rounded-xl transition-all duration-200 relative",
                    isCollapsed ? "p-2 justify-center" : "px-3 py-2.5",
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  )}
                  title={isCollapsed ? item.name : ""}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                  )}

                  <item.icon
                    className={classNames(
                      "flex-shrink-0 h-5 w-5 transition-colors duration-200",
                      isActive
                        ? "text-white"
                        : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300",
                      isCollapsed ? "" : "mr-3"
                    )}
                    aria-hidden="true"
                  />

                  {!isCollapsed && (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="truncate">{item.name}</span>
                          {item.badge && (
                            <span className={classNames(
                              "ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                              isActive 
                                ? "bg-white text-indigo-600"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className={classNames(
                          "text-xs mt-0.5 truncate",
                          isActive 
                            ? "text-indigo-100"
                            : "text-gray-500 dark:text-gray-400"
                        )}>
                          {item.description}
                        </p>
                      </div>
                      
                      {isActive && (
                        <ChevronRightIcon className="h-4 w-4 text-white ml-2" />
                      )}
                    </>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45" />
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Menu Section */}
        <div className={classNames(
          "border-t border-gray-200 dark:border-gray-700 relative",
          isCollapsed ? "p-2" : "p-4"
        )} ref={userMenuRef}>
          {/* Dropdown Menu */}
          {userMenuOpen && !isCollapsed && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
              >
                {theme === 'light' ? (
                  <MoonIcon className="h-4 w-4 mr-3" />
                ) : (
                  <SunIcon className="h-4 w-4 mr-3" />
                )}
                {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
              </button>

              <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />

              <button 
                onClick={() => router.push('/profile')} 
                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
              >
                <UserIcon className="h-4 w-4 mr-3" />
                Mi Perfil
              </button>

              <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />

              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 cursor-pointer"
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
              "group flex items-center w-full rounded-xl transition-all duration-200 relative",
              isCollapsed 
                ? "p-2 justify-center" 
                : "px-3 py-3",
        "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            )}
    title={isCollapsed ? "Perfil" : ""}
    aria-label={isCollapsed ? "Perfil" : "Menú de usuario"}
          >
            <div className="relative flex items-center">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{initials}</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full"></div>
              </div>

              {!isCollapsed && (
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{roleLabel}</p>
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

            {isCollapsed && (
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Perfil
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45" />
              </div>
            )}
          </button>

          {/* Menu colapsado */}
          {isCollapsed && (
            <div className="mt-2 space-y-1">
              <button
                onClick={toggleTheme}
                className="w-full p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 group relative cursor-pointer"
                title={theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
              >
                {theme === 'light' ? (
                  <MoonIcon className="h-5 w-5 mx-auto" />
                ) : (
                  <SunIcon className="h-5 w-5 mx-auto" />
                )}
                
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
              </button>

              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 group relative cursor-pointer"
                title="Cerrar sesión"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mx-auto" />
                
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Cerrar sesión
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}