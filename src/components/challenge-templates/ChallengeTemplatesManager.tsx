"use client";

import React, { useState } from "react";
import { CategoriesManager } from "./CategoriesManager";
import { PlansManager } from "./PlansManager";
import { BalancesManager } from "./BalancesManager";
import { RelationsManager } from "./RelationsManager";
import { StagesManager } from "./StagesManager";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/types";
import { useArrayValidation } from "@/hooks/useArrayValidation";
import { Settings, PackageIcon, Layers, Link, Eye, Folder } from "lucide-react";

type TabType =
  | "categories"
  | "plans"
  | "balances"
  | "relations"
  | "stages"
  | "visualizer";

interface ChallengeTemplatesManagerProps {
  pageSize?: number;
}

export function ChallengeTemplatesManager({ pageSize: initialPageSize = 10 }: ChallengeTemplatesManagerProps = {}) {
  const [activeTab, setActiveTab] = useState<TabType>("visualizer");
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(1);

  // Datos de ejemplo para la tabla
  const templateColumns: ColumnConfig[] = [
    { key: "id", label: "ID", type: "normal" },
    { key: "name", label: "Nombre", type: "normal" },
    { key: "category", label: "Categoría", type: "normal" },
    { key: "plan", label: "Plan", type: "normal" },
    { key: "balance", label: "Balance", type: "normal" },
    { key: "status", label: "Estado", type: "normal" },
    { key: "created", label: "Creado", type: "normal" },
  ];

  const templateData = [
    {
      id: "1",
      name: "Template 1",
      category: "Premium",
      plan: "Starter Plan",
      balance: "$10,000",
      status: "Activo",
      created: "2025-01-15",
    },
    {
      id: "2",
      name: "Template 2",
      category: "Basic",
      plan: "Pro Plan",
      balance: "$25,000",
      status: "Inactivo",
      created: "2025-01-10",
    },
    {
      id: "3",
      name: "Template 3",
      category: "Advanced",
      plan: "Enterprise Plan",
      balance: "$50,000",
      status: "Activo",
      created: "2025-01-05",
    },
  ];

  const totalItems = templateData.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const tabs = [
    {
      id: "visualizer" as TabType,
      label: "Visualizador",
      icon: <Eye className="w-4 h-4" />,
    },
    {
      id: "categories" as TabType,
      label: "Categorías",
      icon: <Folder className="w-4 h-4" />,
    },
    {
      id: "plans" as TabType,
      label: "Planes",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: "balances" as TabType,
      label: "Balances",
      icon: <PackageIcon className="w-4 h-4" />,
    },
    {
      id: "relations" as TabType,
      label: "Relaciones",
      icon: <Link className="w-4 h-4" />,
    },
    {
      id: "stages" as TabType,
      label: "Stages",
      icon: <Layers className="w-4 h-4" />,
    },
  ];

  const tabsValidation = useArrayValidation(tabs);

  const renderTabContent = () => {
    switch (activeTab) {
      case "visualizer":
        return (
          <PaginatedCardTable
            columns={templateColumns}
            rows={templateData}
            isLoading={false}
            emptyText="No hay templates disponibles"
            pagination={{
              currentPage: page,
              totalPages: totalPages,
              totalItems: totalItems,
              pageSize: pageSize,
              onPageChange: (p) => setPage(p),
              onPageSizeChange: (n) => {
                setPage(1);
                setPageSize(n);
              },
            }}
          />
        );
      case "categories":
        return <CategoriesManager pageSize={pageSize} />;
      case "plans":
        return <PlansManager pageSize={pageSize} />;
      case "balances":
        return <BalancesManager pageSize={pageSize} />;
      case "relations":
        return <RelationsManager pageSize={pageSize} />;
      case "stages":
        return <StagesManager pageSize={pageSize} />;
      default:
        return (
          <PaginatedCardTable
            columns={templateColumns}
            rows={templateData}
            isLoading={false}
            emptyText="No hay templates disponibles"
            pagination={{
              currentPage: page,
              totalPages: totalPages,
              totalItems: totalItems,
              pageSize: pageSize,
              onPageChange: (p) => setPage(p),
              onPageSizeChange: (n) => {
                setPage(1);
                setPageSize(n);
              },
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen dark:bg-gray-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Challenge Templates Manager
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Gestiona plantillas, categorías, planes y configuraciones de
                challenges
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Page Size Control - Show for non-visualizer tabs */}
              {activeTab !== "visualizer" && (
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/30 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                  <span className="text-gray-700 dark:text-gray-300 font-medium text-sm whitespace-nowrap">
                    Filas por página:
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              )}
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <Settings className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Container */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Tabs Navigation */}
          <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
            {tabsValidation.safeMap((tab, index) => (
              <button
                key={tab?.id || `tab-${index}`}
                onClick={() => setActiveTab(tab?.id || "visualizer")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 relative border-b-2 ${
                  activeTab === tab?.id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent"
                }`}
              >
                <span
                  className={`${
                    activeTab === tab?.id
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-500"
                  }`}
                >
                  {tab?.icon}
                </span>
                {tab?.label || "Tab"}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}