"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/common/Sidebar";
//import BreadcrumbBar from "@/components/common/BreadcrumbBar";
import { Toaster } from "sonner";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  // Inicializar siempre con false para evitar hydration mismatch
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Cargar el estado del localStorage después de la hidratación
  useEffect(() => {
    setIsHydrated(true);
    try {
      const saved = localStorage.getItem("sidebarCollapsed");
      if (saved === "true") {
        setSidebarCollapsed(true);
      }
    } catch {
      // Si falla el acceso a localStorage, mantener valor por defecto
    }
  }, []);

  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (isHydrated) {
        try {
          localStorage.setItem("sidebarCollapsed", String(next));
        } catch {}
      }
      return next;
    });
  };

  return (
    <div
      className={`grid h-dvh overflow-hidden bg-gray-100 dark:bg-gray-900 transition-all duration-300 ease-in-out ${
        sidebarCollapsed
          ? "grid-cols-[4rem_1fr] grid-rows-[auto_1fr]"
          : "grid-cols-[16rem_1fr] grid-rows-[auto_1fr]"
      }`}
    >
      {/* Sidebar fija (sin scroll propio) */}
      <div className="row-span-2 min-h-0">
        <Sidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />
      </div>

      {/* Breadcrumb fijo arriba (fuera del contenedor que scrollea) */}
      <div className="col-start-2 row-start-1">
        {/* <BreadcrumbBar /> */}
      </div>

      {/* Solo aquí vive el scroll */}
      <main className="col-start-2 row-start-2 min-h-0 overflow-y-auto">
        <div className="w-full">{children}</div>
      </main>

      <Toaster position="top-right" richColors />
    </div>
  );
}
