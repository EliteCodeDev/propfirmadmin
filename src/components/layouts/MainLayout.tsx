"use client";

import { useState } from "react";
import Sidebar from "@/components/common/Sidebar";
import BreadcrumbBar from "@/components/common/BreadcrumbBar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebarCollapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar con estado controlado */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={handleSidebarToggle} 
      />

      {/* Contenido principal que se ajusta dinámicamente */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      } lg:ml-0`}>
        
        {/* BreadcrumbBar fijo en la parte superior */}
        <div className="flex-shrink-0">
          <BreadcrumbBar />
        </div>

        {/* Área de contenido con scroll y ancho máximo */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto p-4 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}