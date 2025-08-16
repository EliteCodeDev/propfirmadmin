"use client";

import { useState } from "react";
import Sidebar from "@/components/common/sidebar";
import BreadcrumbBar from "@/components/common/BreadcrumbBar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem("sidebarCollapsed");
      return saved === "true";
    } catch {
      return false;
    }
  });

  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebarCollapsed", String(next));
      } catch {}
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
        <BreadcrumbBar />
      </div>

      {/* Solo aquí vive el scroll */}
      <main className="col-start-2 row-start-2 min-h-0 overflow-y-auto">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
