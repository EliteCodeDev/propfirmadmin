"use client";

import React, { useState } from "react";
import { BalancesManager } from "./BalancesManager";
import { AddonsManager } from "./AddonsManager";
import type { ProductsManagerProps } from "@/types";

export function ProductsManager({ pageSize = 10 }: ProductsManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<"balances" | "addons">(
    "balances"
  );

  return (
    <div className="space-y-6 bg-white dark:bg-gray-800 transition-colors duration-200">
      {/* Sub-tabs minimalistas: Balances / Addons */}
      <div className="px-6 pt-4">
        <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 shadow-sm p-1">
          <button
            onClick={() => setActiveSubTab("balances")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === "balances"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Balances
          </button>
          <button
            onClick={() => setActiveSubTab("addons")}
            className={`ml-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === "addons"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Addons
          </button>
        </div>
      </div>

      <div className="px-0">
        {activeSubTab === "balances" ? (
          <BalancesManager pageSize={pageSize} />
        ) : (
          <AddonsManager pageSize={pageSize} />
        )}
      </div>
    </div>
  );
}