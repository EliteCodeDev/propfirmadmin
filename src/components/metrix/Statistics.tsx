"use client";
import { useMemo } from "react";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  PercentBadgeIcon,
} from "@heroicons/react/24/outline";

type StatisticsProps = {
  tradingData: any[];
  data: {
    currentBalance: number;
    initialBalance: number;
    equity: number;
    totalPnl: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    lossRate: number;
    profitFactor: number;
    averageWin: number;
    averageLoss: number;
    highestWin: number;
    highestLoss: number;
    maxBalance: number;
    minBalance: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    tradingDays: number;
    todayPnl: number;
    lots: number;
    averageRRR: number;
    expectancy: number;
    avgHoldTime: number;
    profitLossRatio: number;
  };
  className?: string;
};

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
const formatPercentage = (value: number | null | undefined): string =>
  value == null || isNaN(value) ? "0.00%" : `${value.toFixed(2)}%`;

export default function Statistics({ tradingData, data, className = "" }: StatisticsProps) {
  const metrics = useMemo(() => data, [data]);

  const statisticsPairs = [
    {
      left: { label: "Balance", value: formatCurrency(metrics.currentBalance || 0), type: "neutral", icon: CurrencyDollarIcon },
      right: { label: "Equity", value: formatCurrency(metrics.equity || 0), type: "neutral", icon: ChartBarIcon },
    },
    {
      left: { label: "Net Profit", value: formatCurrency(metrics.totalPnl || 0), type: metrics.totalPnl && metrics.totalPnl >= 0 ? "positive" : "negative", icon: ArrowTrendingUpIcon },
      right: { label: "Today P/L", value: formatCurrency(metrics.todayPnl || 0), type: metrics.todayPnl && metrics.todayPnl >= 0 ? "positive" : "negative", icon: CalendarDaysIcon },
    },
    {
      left: { label: "Total Trades", value: (metrics.totalTrades || 0).toString(), type: "neutral", icon: ChartBarIcon },
      right: { label: "Win Rate", value: formatPercentage(metrics.winRate || 0), type: "neutral", icon: PercentBadgeIcon },
    },
    {
      left: { label: "Loss Rate", value: formatPercentage(metrics.lossRate || 0), type: "neutral", icon: PercentBadgeIcon },
      right: { label: "Avg Win", value: formatCurrency(metrics.averageWin || 0), type: "positive", icon: ArrowTrendingUpIcon },
    },
    {
      left: { label: "Avg Loss", value: formatCurrency(Math.abs(metrics.averageLoss || 0)), type: "negative", icon: ArrowTrendingDownIcon },
      right: { label: "Best Trade", value: formatCurrency(metrics.highestWin || 0), type: "positive", icon: ArrowTrendingUpIcon },
    },
    {
      left: { label: "Worst Trade", value: formatCurrency(Math.abs(metrics.highestLoss || 0)), type: "negative", icon: ArrowTrendingDownIcon },
      right: { label: "Risk/Reward", value: ((metrics.averageRRR && !isNaN(metrics.averageRRR)) ? metrics.averageRRR : 0).toFixed(2), type: "neutral", icon: ChartBarIcon },
    },
  ];

  const getValueColor = (type: string) => (type === "positive" ? "text-emerald-600 dark:text-emerald-400 font-bold" : type === "negative" ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-800 dark:text-slate-100 font-semibold");
  const getBg = (type: string) => (type === "positive" ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/40 dark:border-emerald-700/40" : type === "negative" ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200/40 dark:border-rose-700/40" : "bg-slate-50 dark:bg-zinc-800/50 border-slate-200/40 dark:border-slate-600/40");
  const getIconColor = (t: string) => (t === "positive" ? "text-emerald-600 dark:text-emerald-400" : t === "negative" ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400");
  const getIconBg = (t: string) => (t === "positive" ? "bg-emerald-100 dark:bg-emerald-900/30" : t === "negative" ? "bg-rose-100 dark:bg-rose-900/30" : "bg-slate-100 dark:bg-slate-700/50");

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <ChartBarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Trading Statistics</h2>
      </div>
      <div className={`bg-white dark:bg-zinc-800 rounded-lg shadow-md border dark:border-zinc-700 overflow-hidden ${className}`}>
        <div className="hidden md:block p-4">
          <div className="space-y-3">
            {statisticsPairs.map((pair, index) => (
              <div key={index} className="grid grid-cols-2 gap-4">
                <div className={`rounded-lg p-3 transition-all duration-200 hover:shadow-md border ${getBg(pair.left.type)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getIconBg(pair.left.type)}`}>
                        <pair.left.icon className={`w-5 h-5 ${getIconColor(pair.left.type)}`} />
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{pair.left.label}</span>
                    </div>
                    <span className={`text-xl ${getValueColor(pair.left.type)}`}>{pair.left.value}</span>
                  </div>
                </div>
                <div className={`rounded-lg p-3 transition-all duration-200 hover:shadow-md border ${getBg(pair.right.type)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getIconBg(pair.right.type)}`}>
                        <pair.right.icon className={`w-5 h-5 ${getIconColor(pair.right.type)}`} />
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{pair.right.label}</span>
                    </div>
                    <span className={`text-xl ${getValueColor(pair.right.type)}`}>{pair.right.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="md:hidden p-3 space-y-2">
          {statisticsPairs.flatMap((pair, i) => [
            { key: `${i}-left`, ...pair.left },
            { key: `${i}-right`, ...pair.right },
          ]).map((metric) => (
            <div key={(metric as any).key} className={`rounded-lg p-3 transition-all duration-200 hover:shadow-sm border ${getBg(metric.type)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getIconBg(metric.type)}`}>
                    <metric.icon className={`w-4 h-4 ${getIconColor(metric.type)}`} />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{metric.label}</span>
                </div>
                <span className={`text-lg ${getValueColor(metric.type)}`}>{metric.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
