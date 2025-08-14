import type { PropsWithChildren, ReactNode } from "react";
import Sidebar from "@/components/common/sidebar/Sidebar";

type DashboardLayoutProps = PropsWithChildren<{
  /** Slot opcional para un Header (breadcrumbs, buscador, etc.) */
  header?: ReactNode;
  /** Clases extra para el <main> si necesitas personalizar por página */
  className?: string;
}>;

export function DashboardLayout({ children, header, className }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {/* Link de accesibilidad para saltar al contenido */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow dark:focus:bg-gray-800"
      >
        Saltar al contenido principal
      </a>

      {/* Sidebar fijo */}
      <Sidebar aria-label="Barra lateral de navegación" />

      {/* Contenedor principal (header opcional + contenido con scroll) */}
      <div className="flex flex-1 flex-col">
        {header ? (
          <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:bg-gray-900/70">
            {header}
          </header>
        ) : null}

        <main
          id="main-content"
          role="main"
          className={`flex-1 overflow-y-auto p-4 ${className ?? ""}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
