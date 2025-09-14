// src/components/dashboard/Statistics.tsx
import { useMemo } from "react";
// Removed useTranslations import - admin uses English only
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  PercentBadgeIcon,
} from "@heroicons/react/24/outline";
import { StatsData, TotalData, TodayData, GeneralData, MetricsData, StatisticsProps } from '@/types/metrix';

// Type definitions moved to @/types

// Utilidades para cálculos
const calculateWinRate = (
  winningTrades: number,
  totalTrades: number
): number => {
  return totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
};

const calculateProfitFactor = (
  totalWins: number,
  totalLosses: number
): number => {
  return totalLosses !== 0
    ? Math.abs(totalWins / totalLosses)
    : totalWins > 0
      ? Infinity
      : 0;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0.00%";
  }
  return `${value.toFixed(2)}%`;
};

export default function Statistics({
  tradingData,
  data,
  metricsData,
  className = "",
}: StatisticsProps) {
  // Removed useTranslations - admin uses English only

  // Helper functions for consistent data handling
  const getTradeProperty = (trade: any, property: string) => {
    const propertyMap: { [key: string]: string[] } = {
      profit: ["Profit", "profit"],
      volume: ["Volume", "volume", "Lots", "lots"],
      timeOpen: ["TimeOpen", "timeOpen", "OpenTime", "openTime"],
      timeClose: ["TimeClose", "timeClose", "CloseTime", "closeTime"],
      symbol: ["Symbol", "symbol"],
      type: ["Type", "type", "TradeType", "tradeType"],
    };

    const possibleNames = propertyMap[property] || [property];
    for (const name of possibleNames) {
      if (trade[name] !== undefined && trade[name] !== null) {
        return trade[name];
      }
    }
    return null;
  };

  const calculateTradingDays = (trades: any[]): number => {
    if (!trades || trades.length === 0) return 0;

    const tradingDates = new Set<string>();

    trades.forEach((trade) => {
      const timeClose = getTradeProperty(trade, "timeClose");
      const timeOpen = getTradeProperty(trade, "timeOpen");

      const tradeTime = timeClose || timeOpen;

      if (tradeTime) {
        const date = new Date(tradeTime).toDateString();
        tradingDates.add(date);
      }
    });

    return tradingDates.size;
  };

  const calculateMaxDrawdown = (
    trades: any[],
    initialBalance: number = 100000
  ): { amount: number; percentage: number } => {
    if (!trades || trades.length === 0) return { amount: 0, percentage: 0 };

    const sortedTrades = [...trades].sort((a, b) => {
      const timeA =
        getTradeProperty(a, "timeClose") ||
        getTradeProperty(a, "timeOpen") ||
        0;
      const timeB =
        getTradeProperty(b, "timeClose") ||
        getTradeProperty(b, "timeOpen") ||
        0;
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });

    let runningBalance = initialBalance;
    let maxBalance = initialBalance;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;

    sortedTrades.forEach((trade) => {
      const profit = getTradeProperty(trade, "profit") || 0;
      runningBalance += Number(profit);

      if (runningBalance > maxBalance) {
        maxBalance = runningBalance;
      }

      const currentDrawdown = maxBalance - runningBalance;
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
        maxDrawdownPercent =
          maxBalance > 0 ? (currentDrawdown / maxBalance) * 100 : 0;
      }
    });

    return { amount: maxDrawdown, percentage: maxDrawdownPercent };
  };

  const calculateTodayPnL = (trades: any[]): number => {
    if (!trades || trades.length === 0) return 0;

    const today = new Date().toDateString();

    return trades.reduce((total, trade) => {
      const timeClose = getTradeProperty(trade, "timeClose");
      const timeOpen = getTradeProperty(trade, "timeOpen");

      const tradeDate = timeClose
        ? new Date(timeClose).toDateString()
        : timeOpen
          ? new Date(timeOpen).toDateString()
          : null;

      if (tradeDate === today) {
        const profit = getTradeProperty(trade, "profit") || 0;
        return total + Number(profit);
      }

      return total;
    }, 0);
  };

  // Calcular métricas combinadas o usar datos directos
  const metrics = useMemo(() => {
    // Priorizar datos del seed si están disponibles
    if (data && Object.keys(data).length > 0) {
      const currentBalance = data.currentBalance;
      const initialBalance = data.initialBalance;

      // ✅ Net Profit real basado en equity
      const equity = Number(data.equity ?? currentBalance ?? 0);
      const netProfit = equity - Number(initialBalance ?? 0);

      let calculatedTradingDays = data.tradingDays || 0;
      let calculatedMaxDrawdown = data.maxDrawdown || 0;
      let calculatedMaxDrawdownPercent = data.maxDrawdownPercent || 0;
      let calculatedTodayPnL = data.todayPnl || 0;

      if (tradingData && tradingData.length > 0) {
        // Solo recalcular si no hay datos del backend
        if (!data.tradingDays) {
          calculatedTradingDays = calculateTradingDays(tradingData);
        }
        const drawdown = calculateMaxDrawdown(tradingData, initialBalance);
        calculatedMaxDrawdown = drawdown.amount;
        calculatedMaxDrawdownPercent = drawdown.percentage;
        calculatedTodayPnL = calculateTodayPnL(tradingData);
      }

      return {
        currentBalance,
        initialBalance,
        equity: data.equity || currentBalance,
        totalPnl: netProfit,
        totalTrades: data.totalTrades || 0,
        winningTrades: data.winningTrades || 0,
        losingTrades: data.losingTrades || 0,
        winRate: data.winRate || 0,
        lossRate: data.lossRate || 0,
        profitFactor: data.profitFactor || 0,
        averageWin: data.averageWin || 0,
        averageLoss: data.averageLoss || 0,
        highestWin: data.highestWin || 0,
        highestLoss: data.highestLoss || 0,
        tradingDays: calculatedTradingDays,
        maxDrawdown: calculatedMaxDrawdown,
        maxDrawdownPercent: calculatedMaxDrawdownPercent,
        maxBalance: data.maxBalance || currentBalance,
        minBalance: data.minBalance || currentBalance,
        dailyStartingBalance: data.dailyStartingBalance || currentBalance,
        todayPnl: calculatedTodayPnL,
        lots: data.lots || 0,
        averageRRR: data.averageRRR || 0,
        expectancy: data.expectancy || 0,
        avgHoldTime: data.avgHoldTime || 0,
        profitLossRatio: data.profitLossRatio || 0,
      };
    }

    // Fallback: calcular métricas desde tradingData si no hay datos del seed
    if (tradingData && tradingData.length > 0) {
      const totalTrades = tradingData.length;

      const profits = tradingData.map((trade) =>
        Number(getTradeProperty(trade, "profit") || 0)
      );
      const volumes = tradingData.map((trade) =>
        Number(getTradeProperty(trade, "volume") || 0)
      );

      const winningTrades = profits.filter((profit) => profit > 0).length;
      const losingTrades = profits.filter((profit) => profit < 0).length;
      const totalPnl = profits.reduce((sum, profit) => sum + profit, 0);
      const totalWins = profits
        .filter((profit) => profit > 0)
        .reduce((sum, profit) => sum + profit, 0);
      const totalLosses = Math.abs(
        profits
          .filter((profit) => profit < 0)
          .reduce((sum, profit) => sum + profit, 0)
      );
      const totalVolume = volumes.reduce((sum, volume) => sum + volume, 0);

      const winRate = calculateWinRate(winningTrades, totalTrades);
      const lossRate = 100 - winRate;
      const averageWin = winningTrades > 0 ? totalWins / winningTrades : 0;
      const averageLoss = losingTrades > 0 ? totalLosses / losingTrades : 0;
      const expectancy = totalTrades > 0 ? totalPnl / totalTrades : 0;
      const profitLossRatio = averageLoss > 0 ? averageWin / averageLoss : 0;

      const initialBalance = 100000;
      const currentBalance = initialBalance + totalPnl;

      const tradingDays = calculateTradingDays(tradingData);
      const drawdown = calculateMaxDrawdown(tradingData, initialBalance);
      const todayPnl = calculateTodayPnL(tradingData);

      let runningBalance = initialBalance;
      let maxBalance = initialBalance;
      let minBalance = initialBalance;

      profits.forEach((profit) => {
        runningBalance += profit;
        if (runningBalance > maxBalance) maxBalance = runningBalance;
        if (runningBalance < minBalance) minBalance = runningBalance;
      });

      return {
        currentBalance,
        initialBalance,
        equity: currentBalance,
        totalPnl,
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        lossRate,
        profitFactor: calculateProfitFactor(totalWins, totalLosses),
        averageWin,
        averageLoss,
        highestWin: profits.length > 0 ? Math.max(...profits) : 0,
        highestLoss: profits.length > 0 ? Math.min(...profits) : 0,
        tradingDays,
        maxDrawdown: drawdown.amount,
        maxDrawdownPercent: drawdown.percentage,
        maxBalance,
        minBalance,
        dailyStartingBalance: currentBalance,
        todayPnl,
        lots: totalVolume,
        averageRRR: profitLossRatio,
        expectancy,
        avgHoldTime: 0,
        profitLossRatio,
      };
    }

    if (metricsData) {
      return {
        currentBalance: metricsData.total?.balance || 0,
        initialBalance: metricsData.total?.initialBalance || 100000,
        equity: metricsData.total?.equity || metricsData.total?.balance || 0,
        totalPnl: metricsData.total?.pnl || 0,
        totalTrades: metricsData.total?.trades || 0,
        winningTrades: metricsData.total?.winningTrades || 0,
        losingTrades: metricsData.total?.losingTrades || 0,
        winRate: metricsData.general?.winRate || 0,
        lossRate: metricsData.general?.lossRate || 0,
        profitFactor: metricsData.general?.profitFactor || 0,
        averageWin: metricsData.total?.averageWin || 0,
        averageLoss: metricsData.total?.averageLoss || 0,
        highestWin: metricsData.total?.highestWin || 0,
        highestLoss: metricsData.total?.highestLoss || 0,
        tradingDays: metricsData.general?.tradingDays || 0,
        maxDrawdown: metricsData.general?.maxDrawdown || 0,
        maxDrawdownPercent: metricsData.general?.maxDrawdownPercent || 0,
        maxBalance: metricsData.total?.maxBalance || 0,
        minBalance: metricsData.total?.minBalance || 0,
        dailyStartingBalance: metricsData.today?.dailyStartingBalance || 0,
        todayPnl: metricsData.today?.pnl || 0,
        lots: metricsData.total?.lots || 0,
        averageRRR: metricsData.general?.averageRRR || 0,
        expectancy: metricsData.general?.expectancy || 0,
        avgHoldTime: metricsData.general?.avgHoldTime || 0,
        profitLossRatio: metricsData.general?.profitLossRatio || 0,
      };
    }

    return data || {};
  }, [tradingData, data, metricsData]);

  // Configuración de datos en pares para dos columnas
  const statisticsPairs = [
    {
      left: {
        label: 'Balance',
        value: formatCurrency(metrics.currentBalance || 0),
        type: "neutral",
        icon: CurrencyDollarIcon,
      },
      right: {
        label: 'Equity',
        value: formatCurrency(metrics.equity || 0),
        type: "neutral",
        icon: ChartBarIcon,
      },
    },
    {
      left: {
        label: 'Net Profit',
        value: formatCurrency(metrics.totalPnl || 0),
        type:
          metrics.totalPnl && metrics.totalPnl >= 0 ? "positive" : "negative",
        icon: ArrowTrendingUpIcon,
      },
      right: {
        label: 'Total P&L',
        value: formatCurrency(metrics.todayPnl || 0),
        type:
          metrics.todayPnl && metrics.todayPnl >= 0 ? "positive" : "negative",
        icon: CalendarDaysIcon,
      },
    },
    {
      left: {
        label: 'Total Trades',
        value: (metrics.totalTrades || 0).toString(),
        type: "neutral",
        icon: ChartBarIcon,
      },
      right: {
        label: 'Win Rate',
        value: formatPercentage(metrics.winRate || 0),
        type: "neutral",
        icon: PercentBadgeIcon,
      },
    },
    {
      left: {
        label: 'Loss Rate',
        value: formatPercentage(metrics.lossRate || 0),
        type: "neutral",
        icon: PercentBadgeIcon,
      },
      right: {
        label: 'Avg Win',
        value: formatCurrency(metrics.averageWin || 0),
        type: "positive",
        icon: ArrowTrendingUpIcon,
      },
    },
    {
      left: {
        label: 'Avg Loss',
        value: formatCurrency(Math.abs(metrics.averageLoss || 0)),
        type: "negative",
        icon: ArrowTrendingDownIcon,
      },
      right: {
        label: 'Best Trade',
        value: formatCurrency(metrics.highestWin || 0),
        type: "positive",
        icon: ArrowTrendingUpIcon,
      },
    },
    {
      left: {
        label: 'Worst Trade',
        value: formatCurrency(Math.abs(metrics.highestLoss || 0)),
        type: "negative",
        icon: ArrowTrendingDownIcon,
      },
      right: {
        label: 'Risk-Reward Ratio',
        value: ((metrics.averageRRR && !isNaN(metrics.averageRRR)) ? metrics.averageRRR : 0).toFixed(2),
        type: "neutral",
        icon: ChartBarIcon,
      },
    },
  ];

  const getValueColor = (type: string) => {
    switch (type) {
      case "positive":
        return "text-emerald-600 dark:text-emerald-400 font-bold";
      case "negative":
        return "text-rose-600 dark:text-rose-400 font-bold";
      default:
        return "text-slate-800 dark:text-slate-100 font-semibold";
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case "positive":
        return "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200/40 dark:border-emerald-700/40 shadow-emerald-100/50 dark:shadow-emerald-900/20";
      case "negative":
        return "bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30 border border-rose-200/40 dark:border-rose-700/40 shadow-rose-100/50 dark:shadow-rose-900/20";
      default:
        return "bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-zinc-800/50 border border-slate-200/40 dark:border-slate-600/40 shadow-slate-100/50 dark:shadow-slate-900/20";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "positive":
        return "text-emerald-600 dark:text-emerald-400";
      case "negative":
        return "text-rose-600 dark:text-rose-400";
      default:
        return "text-slate-600 dark:text-slate-400";
    }
  };

  const getIconBackground = (type: string) => {
    switch (type) {
      case "positive":
        return "bg-emerald-100 dark:bg-emerald-900/30";
      case "negative":
        return "bg-rose-100 dark:bg-rose-900/30";
      default:
        return "bg-slate-100 dark:bg-slate-700/50";
    }
  };

  return (
    <>
      {/* TÍTULO PRINCIPAL */}
      <div className="flex items-center gap-2 mb-4">
        <ChartBarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-100">
          Trading Statistics
        </h2>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md border border-slate-200 dark:border-zinc-700 overflow-hidden">
        {/* Desktop: Two Column Grid Layout */}
        <div className="hidden md:block p-4">
          <div className="space-y-3">
            {statisticsPairs.map((pair, index) => (
              <div key={index} className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div
                  className={`rounded-lg p-3 transition-all duration-200 hover:shadow-md ${getBackgroundColor(
                    pair.left.type
                  )}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getIconBackground(pair.left.type)}`}>
                        <pair.left.icon className={`w-5 h-5 ${getIconColor(pair.left.type)}`} />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          {pair.left.label}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xl ${getValueColor(
                          pair.left.type
                        )}`}
                      >
                        {pair.left.value}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div
                  className={`rounded-lg p-3 transition-all duration-200 hover:shadow-md ${getBackgroundColor(
                    pair.right.type
                  )}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getIconBackground(pair.right.type)}`}>
                        <pair.right.icon className={`w-5 h-5 ${getIconColor(pair.right.type)}`} />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          {pair.right.label}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xl ${getValueColor(
                          pair.right.type
                        )}`}
                      >
                        {pair.right.value}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: Single Column Card Layout */}
        <div className="md:hidden p-3 space-y-2">
          {statisticsPairs
            .flatMap((pair, index) => [
              {
                key: `${index}-left`,
                ...pair.left,
              },
              {
                key: `${index}-right`,
                ...pair.right,
              },
            ])
            .map((metric) => (
              <div
                key={metric.key}
                className={`rounded-lg p-3 transition-all duration-200 hover:shadow-sm ${getBackgroundColor(
                  metric.type
                )}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${getIconBackground(
                        metric.type
                      )}`}
                    >
                      <metric.icon className={`w-4 h-4 ${getIconColor(metric.type)}`} />
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {metric.label}
                    </span>
                  </div>
                  <span
                    className={`text-lg ${getValueColor(
                      metric.type
                    )}`}
                  >
                    {metric.value}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
