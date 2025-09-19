"use client";

import React, { useMemo, useState } from "react";
import {
  TrophyIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { ObjectivesProps, ObjectiveStatus } from "@/types/metrix";
// Removed useTranslations import - admin uses English only

// Minimal Icons
// Safe number formatting function
const safeToFixed = (value: any, decimals: number = 1): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "0." + "0".repeat(decimals);
  }
  return Number(value).toFixed(decimals);
};

const Icon = {
  Check: () => (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5 text-green-500"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  ),
  X: () => (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5 text-red-500"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Info: () => (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5 text-gray-400"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

// Progress bar
const ProgressBar = ({ percentage }: { percentage: number }) => {
  const pct = Math.min(100, Math.max(0, percentage));
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-green-400 to-blue-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

// Text color
const getResultTextColor = (
  percentage: number,
  type: string,
  estado: boolean
) => {
  if (!estado) return "text-red-400";
  const pct = Math.min(100, Math.max(0, percentage));
  if (type === "days" || type === "profit") {
    if (pct < 50) return "text-red-400";
    if (pct < 80) return "text-yellow-500";
    return "text-green-500";
  } else {
    if (pct < 50) return "text-green-500";
    if (pct < 80) return "text-yellow-500";
    return "text-red-400";
  }
};

export default function Objectives({
  tradingData,
  rulesParams,
  className = "",
  metaStats,
}: Pick<
  ObjectivesProps,
  "tradingData" | "rulesParams" | "className" | "metaStats"
>) {
  console.log("tradingData", tradingData);
  const [expanded, setExpanded] = useState<number | null>(null);

  const objectives = useMemo((): ObjectiveStatus[] => {
    if (!tradingData || !rulesParams) return [];

    const initialBalance = tradingData.balance?.initialBalance || 0;
    const dailyBalance =
      tradingData.balance?.dailyBalance || tradingData.equity || 0;
    const equity = tradingData.equity || tradingData.currentBalance || 0;
    const currentProfit = equity - initialBalance;

    const objs: ObjectiveStatus[] = [];

    // === PROFIT TARGET ===
    if (rulesParams.profitTarget > 0) {
      const targetAmount = (initialBalance * rulesParams.profitTarget) / 100;
      const progress =
        targetAmount > 0
          ? Math.min((currentProfit / targetAmount) * 100, 100)
          : 0;
      const status =
        currentProfit >= targetAmount
          ? "completed"
          : currentProfit > 0
          ? "in_progress"
          : "pending";

      objs.push({
        id: "profit_target",
        title: "Profit Target",
        description: `Target $${targetAmount.toLocaleString()} (${
          rulesParams.profitTarget
        }%). Current: $${currentProfit.toLocaleString()}`,
        current: currentProfit,
        target: targetAmount,
        unit: "$",
        status,
        progress,
        icon: <TrophyIcon className="h-4 w-4" />,
        color: status === "completed" ? "text-green-600" : "text-blue-600",
        type: "profit",
      });
    }

    // === MAX DRAWDOWN ===
    if (rulesParams.maxDrawdown > 0) {
      const maxDrawdownAmount =
        (initialBalance * rulesParams.maxDrawdown) / 100;
      const currentDrawdown = Math.max(0, initialBalance - equity);
      const progress =
        maxDrawdownAmount > 0
          ? Math.min((currentDrawdown / maxDrawdownAmount) * 100, 100)
          : 0;
      const status =
        currentDrawdown >= maxDrawdownAmount
          ? "failed"
          : progress > 0
          ? "in_progress"
          : "pending";

      objs.push({
        id: "max_drawdown",
        title: "Max Total Loss",
        description: `Max loss $${maxDrawdownAmount.toLocaleString()} (${
          rulesParams.maxDrawdown
        }%). Current: $${currentDrawdown.toLocaleString()}`,
        current: currentDrawdown,
        target: maxDrawdownAmount,
        unit: "$",
        status,
        progress,
        icon: <ExclamationTriangleIcon className="h-4 w-4" />,
        color: status === "failed" ? "text-red-600" : "text-orange-600",
        type: "loss",
      });
    }

    // === DAILY DRAWDOWN ===
    if (rulesParams.dailyDrawdown > 0) {
      const maxDailyLoss = (dailyBalance * rulesParams.dailyDrawdown) / 100;
      const currentDailyLoss = Math.max(0, dailyBalance - equity);
      const progress =
        maxDailyLoss > 0
          ? Math.min((currentDailyLoss / maxDailyLoss) * 100, 100)
          : 0;
      const status =
        currentDailyLoss >= maxDailyLoss
          ? "failed"
          : progress > 0
          ? "in_progress"
          : "pending";

      objs.push({
        id: "daily_loss",
        title: "Max Daily Loss",
        description: `Max daily loss $${maxDailyLoss.toLocaleString()} (${
          rulesParams.dailyDrawdown
        }%). Current: $${currentDailyLoss.toLocaleString()}`,
        current: currentDailyLoss,
        target: maxDailyLoss,
        unit: "$",
        status,
        progress,
        icon: <ExclamationTriangleIcon className="h-4 w-4" />,
        color: status === "failed" ? "text-red-600" : "text-yellow-600",
        type: "loss",
      });
    }

    // === TRADING DAYS ===
    if (rulesParams.tradingDays > 0) {
      const targetDays = rulesParams.tradingDays;
      const currentDays = metaStats?.tradingDays || 0; // si no tienes contador, queda en 0
      const progress =
        targetDays > 0 ? Math.min((currentDays / targetDays) * 100, 100) : 100;
      const status =
        currentDays >= targetDays
          ? "completed"
          : currentDays > 0
          ? "in_progress"
          : "pending";

      objs.push({
        id: "min_trading_days",
        title: "Min Trading Days",
        description: `Target ${targetDays} days. Current: ${currentDays}`,
        current: currentDays,
        target: targetDays,
        unit: " days",
        status,
        progress,
        icon: <ClockIcon className="h-4 w-4" />,
        color: status === "completed" ? "text-green-600" : "text-purple-600",
        type: "days",
      });
    }

    return objs;
  }, [tradingData, rulesParams]);

  if (objectives.length === 0) {
    return (
      <div className={className}>
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 text-center">
          <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            No objectives defined
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="font-semibold text-base dark:text-white mb-4">Goals</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {objectives.map((obj, idx) => (
          <div
            key={obj.id}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow-md dark:text-white"
          >
            <div className="p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-2">
                  <span className="text-blue-400 font-medium text-sm block truncate">
                    {obj.title}
                  </span>
                  <span className="text-gray-400 text-xs block mt-1">
                    Required:{" "}
                    {obj.unit === "$"
                      ? `$${obj.target.toLocaleString()}`
                      : `${obj.target}${obj.unit}`}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-medium text-sm">
                  {obj.unit === "$"
                    ? `$${obj.current.toLocaleString()}`
                    : `${obj.current}${obj.unit}`}
                </span>
                <span className="text-xs">
                  {safeToFixed(Math.min(100, obj.progress), 1)}%
                </span>
              </div>
              <ProgressBar percentage={obj.progress} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
