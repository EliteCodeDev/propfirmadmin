"use client";

import React, { useState } from "react";
import { CategoriesManager } from "./CategoriesManager";
import { PlansManager } from "./PlansManager";
import { BalancesManager } from "./BalancesManager";
import { RelationBalancesManager } from "./RelationBalancesManager";
import { RelationsManager } from "./RelationsManager";
import { RelationStagesManager } from "./RelationStagesManager";
import { StagesManager } from "./StagesManager";
import { TemplateVisualizer } from "./TemplateVisualizer";
import { RowsPerPage } from "@/components/ui/RowsPerPage";
import { useArrayValidation } from "@/hooks/useArrayValidation";
import {
  Settings,
  PackageIcon,
  Layers,
  Link,
  Eye,
  Folder,
  DollarSign,
} from "lucide-react";

type TabType =
  | "categories"
  | "plans"
  | "balances"
  | "relationBalances"
  | "relations"
  | "relationStages"
  | "stages"
  | "visualizer";

export function ChallengeTemplatesManager() {
  const [activeTab, setActiveTab] = useState<TabType>("visualizer");
  const [pageSize, setPageSize] = useState(10);

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
      id: "relationBalances" as TabType,
      label: "Balances de Relación",
      icon: <DollarSign className="w-4 h-4" />,
    },
    {
      id: "relations" as TabType,
      label: "Relaciones",
      icon: <Link className="w-4 h-4" />,
    },
    {
      id: "relationStages" as TabType,
      label: "Relación Etapas",
      icon: <Layers className="w-4 h-4" />,
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
        return <TemplateVisualizer pageSize={pageSize} />;
      case "categories":
        return <CategoriesManager pageSize={pageSize} />;
      case "plans":
        return <PlansManager pageSize={pageSize} />;
      case "balances":
        return <BalancesManager pageSize={pageSize} />;
      case "relationBalances":
        return <RelationBalancesManager pageSize={pageSize} />;
      case "relations":
        return <RelationsManager pageSize={pageSize} />;
      case "relationStages":
        return <RelationStagesManager pageSize={pageSize} />;
      case "stages":
        return <StagesManager pageSize={pageSize} />;
      default:
        return <TemplateVisualizer />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-700">
        {tabsValidation.safeMap((tab) => (
          <button
            key={tab?.id || "default"}
            onClick={() => setActiveTab(tab?.id || "visualizer")}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${
              activeTab === tab?.id
                ? "bg-[var(--app-secondary)] text-black border-b-2 border-[var(--app-secondary)]"
                : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            }`}
          >
            {tab?.icon}
            {tab?.label || "Tab"}
          </button>
        ))}
      </div>

      {/* Page Size Control - Only show for non-visualizer tabs */}
      {activeTab !== "visualizer" && (
        <div className="flex justify-end">
          <div className="flex items-center gap-3 bg-white/60 dark:bg-zinc-800/60 px-4 py-2 rounded-lg shadow-sm backdrop-blur-sm">
            <span className="text-zinc-700 dark:text-zinc-300 font-medium text-sm whitespace-nowrap">
              Filas por página:
            </span>
            <RowsPerPage pageSize={pageSize} onPageSizeChange={setPageSize} />
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white/40 dark:bg-zinc-800/40 rounded-xl shadow-md backdrop-blur-sm overflow-hidden">
        {renderTabContent()}
      </div>
    </div>
  );
}
