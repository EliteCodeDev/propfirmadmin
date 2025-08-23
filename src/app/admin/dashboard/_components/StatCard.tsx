"use client";

import { ReactNode } from "react";
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon, MinusSmallIcon } from "@heroicons/react/24/outline";

type Variant = "indigo" | "blue" | "emerald" | "pink" | "red" | "gray";

const variantMap: Record<Variant, { bg: string; text: string; border: string; underlineFrom: string; underlineTo: string; hoverText: string }> = {
  indigo: {
    bg: "from-blue-50 to-indigo-50 dark:from-indigo-900/20 dark:to-blue-900/10",
    text: "text-indigo-600 dark:text-indigo-300",
    border: "border-gray-200/50 dark:border-gray-700/50",
    underlineFrom: "from-indigo-500",
    underlineTo: "to-blue-500",
    hoverText: "group-hover:text-indigo-700",
  },
  blue: {
    bg: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/10",
    text: "text-blue-600 dark:text-blue-300",
    border: "border-gray-200/50 dark:border-gray-700/50",
    underlineFrom: "from-blue-500",
    underlineTo: "to-cyan-500",
    hoverText: "group-hover:text-blue-700",
  },
  emerald: {
    bg: "from-green-50 to-emerald-50 dark:from-emerald-900/20 dark:to-green-900/10",
    text: "text-emerald-600 dark:text-emerald-300",
    border: "border-gray-200/50 dark:border-gray-700/50",
    underlineFrom: "from-emerald-500",
    underlineTo: "to-green-500",
    hoverText: "group-hover:text-emerald-700",
  },
  pink: {
    bg: "from-red-50 to-pink-50 dark:from-rose-900/20 dark:to-red-900/10",
    text: "text-pink-600 dark:text-pink-300",
    border: "border-gray-200/50 dark:border-gray-700/50",
    underlineFrom: "from-pink-500",
    underlineTo: "to-rose-500",
    hoverText: "group-hover:text-pink-700",
  },
  red: {
    bg: "from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/10",
    text: "text-red-600 dark:text-red-300",
    border: "border-gray-200/50 dark:border-gray-700/50",
    underlineFrom: "from-red-500",
    underlineTo: "to-rose-500",
    hoverText: "group-hover:text-red-700",
  },
  gray: {
    bg: "from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/10",
    text: "text-slate-600 dark:text-slate-300",
    border: "border-gray-200/50 dark:border-gray-700/50",
    underlineFrom: "from-indigo-500",
    underlineTo: "to-blue-500",
    hoverText: "group-hover:text-slate-700",
  },
};

export function StatCard({
  label,
  value,
  icon,
  variant = "indigo",
  delay = 0,
  delta,
  deltaColor = "red",
  deltaDirection = "down",
  size = "md",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  variant?: Variant;
  delay?: number;
  delta?: string; // e.g., "92.59%"
  deltaColor?: "red" | "emerald" | "gray";
  deltaDirection?: "up" | "down" | "flat";
  size?: "sm" | "md";
}) {
  const v = variantMap[variant];
  const isSm = size === "sm";
  const deltaStyles =
    deltaColor === "emerald"
      ? {
          text: "text-emerald-700",
          bg: "bg-emerald-100/80",
          border: "border-emerald-200",
        }
      : deltaColor === "gray"
      ? { text: "text-slate-700", bg: "bg-slate-100/80", border: "border-slate-200" }
      : { text: "text-red-700", bg: "bg-red-100/80", border: "border-red-200" };

  return (
    <div className="transform transition-all duration-300 hover:scale-105" style={{ animationDelay: `${delay}ms` }}>
      <div className={`group relative overflow-hidden rounded-3xl border ${v.border} shadow-xl hover:shadow-2xl transition-all duration-500 text-sm bg-white/80 dark:bg-white/5 backdrop-blur-xl`}>
        {/* subtle noise + gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${v.bg} opacity-30 group-hover:opacity-50 transition-opacity duration-300`} />
        {/* decorative circles */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-6 w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full" />
          <div className="absolute bottom-2 left-4 w-8 h-8 bg-gray-400 rounded-full" />
        </div>

        <div className={isSm ? "relative p-4" : "relative p-6"}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Icon + label */}
              <div className={isSm ? "flex items-center gap-2.5 mt-2.5 mb-2.5" : "flex items-center gap-3 mt-4 mb-4"}>
                <div className={isSm ? "p-2 bg-white/60 rounded-2xl shadow-md transition-transform duration-300" : "p-3 bg-white/60 rounded-2xl shadow-md transition-transform duration-300"}>{icon}</div>
                <div>
                  <p className={isSm ? "text-xs font-medium text-gray-600 dark:text-gray-300 leading-tight" : "text-sm font-medium text-gray-600 dark:text-gray-300 leading-tight"}>{label}</p>
                  <div className={`${isSm ? "w-6" : "w-8"} h-0.5 bg-gradient-to-r ${v.underlineFrom} ${v.underlineTo} rounded-full mt-1`} />
                </div>
              </div>

              {/* Value */}
              <div className="mb-3">
                <h3 className={`${isSm ? "text-2xl" : "text-3xl"} font-bold text-gray-900 dark:text-gray-100 ${v.hoverText} transition-colors duration-300`}>{value}</h3>
              </div>
            </div>

            {/* Optional delta badge */}
            {delta && (
              <div className={`flex items-center gap-1 ${isSm ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"} rounded-2xl font-semibold shadow-md border ${deltaStyles.text} ${deltaStyles.bg} ${deltaStyles.border}`}>
                {deltaDirection === "up" ? (
                  <ArrowTrendingUpIcon className={isSm ? "h-3.5 w-3.5" : "h-4 w-4"} />
                ) : deltaDirection === "flat" ? (
                  <MinusSmallIcon className={isSm ? "h-3.5 w-3.5" : "h-4 w-4"} />
                ) : (
                  <ArrowTrendingDownIcon className={isSm ? "h-3.5 w-3.5" : "h-4 w-4"} />
                )}
                <span>{delta}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
