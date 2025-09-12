"use client";
import { useMemo, useState, ReactNode } from "react";
import { TrophyIcon, ExclamationTriangleIcon, ClockIcon } from "@heroicons/react/24/outline";

type ObjectivesProps = {
  tradingData: {
    initialBalance: number;
    currentBalance: number;
    dailyBalance: number;
    equity: number;
    profit: number;
    drawdown: number;
    maxDrawdown: number;
  };
  rulesParams: {
    profitTarget?: number;
    dailyDrawdown?: number;
    maxDrawdown?: number;
    tradingDays?: number;
  };
  rulesValidation?: any;
  className?: string;
};

type ObjectiveStatus = {
  id: string;
  title: string;
  description?: string;
  current: number;
  target: number;
  unit: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  progress: number;
  icon: ReactNode;
  color: string;
  type: "profit" | "loss" | "days";
};

const safeToFixed = (value: any, decimals: number = 1): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "0." + "0".repeat(decimals);
  }
  return Number(value).toFixed(decimals);
};

const ProgressBar = ({ percentage }: { percentage: number }) => {
  const pct = Math.min(100, Math.max(0, percentage));
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1 overflow-hidden">
      <div className="h-2 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-green-400 to-blue-500" style={{ width: `${pct}%` }} />
    </div>
  );
};

const getResultTextColor = (percentage: number, type: string, ok: boolean) => {
  if (!ok) return "text-red-400";
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

export default function Objectives({ tradingData, rulesParams, rulesValidation, className = "" }: ObjectivesProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const objectives = useMemo<ObjectiveStatus[]>(() => {
    if (!tradingData || !rulesParams) return [];

    const initialBalance = tradingData.initialBalance || 0;
    const equity = tradingData.equity || 0;
    const currentProfit = equity - initialBalance;
    const dailyBalance = tradingData.dailyBalance || equity;

    const objs: ObjectiveStatus[] = [];

    if (rulesParams.profitTarget !== undefined) {
      const pct = rulesParams.profitTarget;
      const target = (initialBalance * pct) / 100;
      const progress = target > 0 ? Math.min((currentProfit / target) * 100, 100) : 0;
      const completed = rulesValidation?.profitTarget?.status || currentProfit >= target;
      const status: ObjectiveStatus["status"] = completed ? "completed" : currentProfit > 0 ? "in_progress" : "pending";
      objs.push({
        id: "profit_target",
        title: "Profit Target",
        description: `Target $${target.toLocaleString()} (${pct}%). Current: $${currentProfit.toLocaleString()}`,
        current: currentProfit,
        target,
        unit: "$",
        status,
        progress,
        icon: <TrophyIcon className="h-4 w-4" />,
        color: status === "completed" ? "text-green-600" : "text-blue-600",
        type: "profit",
      });
    }

    if (rulesParams.maxDrawdown !== undefined) {
      const pct = rulesParams.maxDrawdown;
      const target = (initialBalance * pct) / 100;
      const current = Math.abs(rulesValidation?.maxDrawdown?.drawdown || tradingData.maxDrawdown || 0);
      const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
      let status: ObjectiveStatus["status"] = "pending";
      if (rulesValidation?.maxDrawdown?.status === false) status = "failed";
      else if (pct === 0 && current > 0) status = "failed";
      else if (current >= target && target > 0) status = "failed";
      else if (current > target * 0.8) status = "in_progress";
      objs.push({
        id: "max_drawdown",
        title: "Max Total Loss",
        description: `Max loss $${target.toLocaleString()} (${pct}%). Current: $${current.toLocaleString()}`,
        current,
        target,
        unit: "$",
        status,
        progress,
        icon: <ExclamationTriangleIcon className="h-4 w-4" />,
        color: status === "failed" ? "text-red-600" : "text-orange-600",
        type: "loss",
      });
    }

    if (rulesParams.dailyDrawdown !== undefined) {
      const pct = rulesParams.dailyDrawdown;
      const target = (dailyBalance * pct) / 100;
      const current = Math.abs(rulesValidation?.dailyDrawdown?.drawdown || 0);
      const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
      let status: ObjectiveStatus["status"] = "pending";
      if (rulesValidation?.dailyDrawdown?.status === false) status = "failed";
      else if (pct === 0 && current > 0) status = "failed";
      else if (current >= target && target > 0) status = "failed";
      else if (current > target * 0.8) status = "in_progress";
      objs.push({
        id: "daily_loss",
        title: "Max Daily Loss",
        description: `Max daily loss $${target.toLocaleString()} (${pct}%). Current: $${current.toLocaleString()}`,
        current,
        target,
        unit: "$",
        status,
        progress,
        icon: <ExclamationTriangleIcon className="h-4 w-4" />,
        color: status === "failed" ? "text-red-600" : "text-yellow-600",
        type: "loss",
      });
    }

    if (rulesParams.tradingDays !== undefined) {
      const target = rulesParams.tradingDays;
      const current = rulesValidation?.tradingDays?.numDays || 0;
      const progress = target > 0 ? Math.min((current / target) * 100, 100) : 100;
      let status: ObjectiveStatus["status"] = "pending";
      if (rulesValidation?.tradingDays?.status) status = "completed";
      else if (target === 0) status = "completed";
      else if (current >= target) status = "completed";
      else if (current > 0) status = "in_progress";
      objs.push({
        id: "min_trading_days",
        title: "Min Trading Days",
        description: target === 0 ? "No minimum days required" : `Target ${target} days. Current: ${current}`,
        current,
        target,
        unit: " days",
        status,
        progress,
        icon: <ClockIcon className="h-4 w-4" />,
        color: status === "completed" ? "text-green-600" : "text-purple-600",
        type: "days",
      });
    }

    return objs;
  }, [tradingData, rulesParams, rulesValidation]);

  if (objectives.length === 0) {
    return (
      <div className={className}>
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 text-center">
          <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-xs">Loading objectives...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="font-semibold text-base dark:text-white mb-4">Goals</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {objectives.map((obj, idx) => (
          <div key={obj.id} className="bg-white dark:bg-zinc-800 rounded-lg shadow-md dark:text-white">
            <div className="p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-2">
                  <span className="text-blue-400 font-medium text-sm block truncate">{obj.title}</span>
                  <span className="text-gray-400 text-xs block mt-1">
                    Required: {obj.unit === "$" ? `$${obj.target.toLocaleString()}` : `${obj.target}${obj.unit}`}
                  </span>
                </div>
                <button onClick={() => setExpanded(expanded === idx ? null : idx)} className="text-gray-400 hover:text-gray-300">
                  <ClockIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className={`${getResultTextColor(obj.progress, obj.type, obj.status !== "failed")} font-medium text-sm`}>
                  {obj.unit === "$" ? `$${obj.current.toLocaleString()}` : `${obj.current}${obj.unit}`}
                </span>
                <div className="flex items-center">
                  <span className={`mr-2 text-xs ${obj.status === "failed" ? "text-red-400" : obj.status === "completed" ? "text-green-400" : "text-yellow-400"}`}>
                    {safeToFixed(Math.min(100, obj.progress), 1)}%
                  </span>
                  {obj.icon}
                </div>
              </div>

              <ProgressBar percentage={obj.progress} />
            </div>

            {expanded === idx && obj.description && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-600 dark:text-gray-300 text-xs">{obj.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
