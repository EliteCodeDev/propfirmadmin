"use client";

import { useState } from "react";
import Sidebar from "@/components/common/sidebar";
import BreadcrumbBar from "@/components/common/BreadcrumbBar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800">
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

        {/* Área de contenido con scroll */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}