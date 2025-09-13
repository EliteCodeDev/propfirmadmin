// src/components/metrix/TradingChart.tsx
"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  TooltipItem
} from "chart.js";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Position, ChartDataItem, TradingChartProps, ChartStats } from '@/types/metrix';
// Removed useTranslations import - admin uses English only
// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function TradingChart({
  allTrades,
  initialBalance,
  maxDrawdownReference = 0, // This should be percentage
  profitTargetReference = 0, // This should be percentage
  className = ""
}: TradingChartProps) {
  const [data, setData] = useState<ChartDataItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState("dark");

  // Debug what values are being passed to the component
  console.log('🔍 TradingChart Props Debug:', {
    initialBalance,
    initialBalanceType: typeof initialBalance,
    maxDrawdownReference,
    profitTargetReference,
    allTradesLength: allTrades?.length || 0
  });

  // Calculate actual amounts from percentages (same as Objectives component)
  const profitTargetAmount = useMemo(() => {
    const amount = (initialBalance * profitTargetReference) / 100;
    console.log('🎯 Profit Target Calculation:', {
      profitTargetPercentage: profitTargetReference,
      initialBalance: initialBalance,
      initialBalanceType: typeof initialBalance,
      profitTargetAmount: amount,
      finalProfitTargetLine: initialBalance + amount
    });
    return amount;
  }, [initialBalance, profitTargetReference]);

  const maxDrawdownAmount = useMemo(() => {
    const amount = (initialBalance * maxDrawdownReference) / 100;
    console.log('📉 Max Drawdown Calculation:', {
      maxDrawdownPercentage: maxDrawdownReference,
      initialBalance: initialBalance,
      maxDrawdownAmount: amount,
      finalMaxDrawdownLine: initialBalance - amount
    });
    return amount;
  }, [initialBalance, maxDrawdownReference]);

  // Theme detection
  useEffect(() => {
    setIsClient(true);
    const storedTheme = typeof window !== 'undefined'
      ? localStorage.getItem("theme") || "dark"
      : "dark";
    setTheme(storedTheme);

    const checkTheme = () => {
      if (typeof window !== 'undefined') {
        const currentTheme = localStorage.getItem("theme") || "dark";
        if (currentTheme !== theme) {
          setTheme(currentTheme);
        }
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "theme") {
        setTheme(event.newValue || "dark");
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener("storage", handleStorageChange);
      const intervalId = setInterval(checkTheme, 500);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        clearInterval(intervalId);
      };
    }
  }, [theme]);

  // Format time for display
  const formatTime = useCallback((timeString: string): string => {
    try {
      const date = new Date(timeString);
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  }, []);

  // Process trades data for chart
  const processTradesForChart = useCallback((
    trades: Position[],
    initialBal: number,
    profitTargetAmt: number,
    maxDrawdownAmt: number
  ): ChartDataItem[] => {
    if (!trades || trades.length === 0) {
      return [];
    }

    // Filtrar solo trades cerrados y ordenar por fecha de cierre
    const closedTrades = trades
      .filter(trade => trade.TimeClose)
      .sort((a, b) => new Date(a.TimeClose!).getTime() - new Date(b.TimeClose!).getTime());

    if (closedTrades.length === 0) {
      return [{
        date: new Date().toISOString().split('T')[0],
        balance: initialBal,
        max_drawdown: initialBal - maxDrawdownAmt, // initialBalance - maxDrawdownAmount
        profit_target: initialBal + profitTargetAmt, // initialBalance + profitTargetAmount
        formattedTime: formatTime(new Date().toISOString())
      }];
    }

    let runningBalance = initialBal;
    const balanceData: ChartDataItem[] = [];

    // Punto inicial
    const firstTradeDate = closedTrades[0].TimeClose!;
    balanceData.push({
      date: firstTradeDate.split(' ')[0] || firstTradeDate.split('T')[0],
      balance: initialBal,
      max_drawdown: initialBal - maxDrawdownAmt, // initialBalance - maxDrawdownAmount
      profit_target: initialBal + profitTargetAmt, // initialBalance + profitTargetAmount
      formattedTime: formatTime(firstTradeDate)
    });

    // Procesar cada trade cerrado
    closedTrades.forEach(trade => {
      const tradeProfit = trade.Profit + (trade.Commission || 0) + (trade.Swap || 0);
      runningBalance += tradeProfit;
      const tradeDate = trade.TimeClose!;
      
      balanceData.push({
        date: tradeDate.split(' ')[0] || tradeDate.split('T')[0],
        balance: runningBalance,
        max_drawdown: initialBal - maxDrawdownAmt, // initialBalance - maxDrawdownAmount
        profit_target: initialBal + profitTargetAmt, // initialBalance + profitTargetAmount
        formattedTime: formatTime(tradeDate)
      });
    });

    return balanceData;
  }, [formatTime]);

  // Process trades data for chart
  useEffect(() => {
    console.log('📊 Chart Data Processing:', {
      initialBalance,
      profitTargetAmount,
      maxDrawdownAmount,
      expectedProfitTargetLine: initialBalance + profitTargetAmount,
      expectedMaxDrawdownLine: initialBalance - maxDrawdownAmount
    });

    if (!allTrades || allTrades.length === 0) {
      // Si no hay trades, crear un punto inicial
      const initialPoint = {
        date: new Date().toISOString().split('T')[0],
        balance: initialBalance,
        max_drawdown: initialBalance - maxDrawdownAmount, // initialBalance - maxDrawdownAmount
        profit_target: initialBalance + profitTargetAmount, // initialBalance + profitTargetAmount
        formattedTime: formatTime(new Date().toISOString())
      };
      console.log('📈 Initial Point (No Trades):', initialPoint);
      setData([initialPoint]);
      return;
    }

    const chartData = processTradesForChart(
      allTrades,
      initialBalance,
      profitTargetAmount,
      maxDrawdownAmount
    );
    console.log('📈 Final Chart Data:', chartData);
    setData(chartData);
  }, [allTrades, initialBalance, profitTargetAmount, maxDrawdownAmount, formatTime, processTradesForChart]);

  // Calculate statistics
  const stats = useMemo((): ChartStats | null => {
    if (!data || data.length === 0) return null;

    const balanceData = data.filter(item => item.balance !== undefined);
    if (balanceData.length === 0) return null;

    const currentBalance = balanceData[balanceData.length - 1].balance || 0;
    const totalReturn = ((currentBalance - initialBalance) / initialBalance) * 100;

    // Calculate max drawdown from balance data
    let peakBalance = initialBalance;
    let maxDrawdown = 0;

    balanceData.forEach(item => {
      const balance = item.balance || 0;
      if (balance > peakBalance) {
        peakBalance = balance;
      }
      const currentDrawdown = ((peakBalance - balance) / peakBalance) * 100;
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
      }
    });

    // Calculate trades statistics from allTrades
    const closedTrades = allTrades.filter(trade => trade.TimeClose);
    const profitableTrades = closedTrades.filter(trade => {
      const totalProfit = trade.Profit + (trade.Commission || 0) + (trade.Swap || 0);
      return totalProfit > 0;
    }).length;
    const losingTrades = closedTrades.length - profitableTrades;

    return {
      currentBalance,
      totalReturn,
      maxDrawdown,
      totalTrades: closedTrades.length,
      profitableTrades,
      losingTrades
    };
  }, [data, initialBalance, allTrades]);

  // Y-axis formatter
  const yFormatter = (tick: number): string => {
    if (typeof tick === "number") {
      return `$${new Intl.NumberFormat("en-US").format(tick)}`;
    }
    return "";
  };

  // Line styles configuration
  const lineStyles = {
    balance: {
      color: "#e4b833",
      dash: [] as number[],
      pointRadius: 2,
      pointHoverRadius: 6,
    },
    max_drawdown: {
      color: "#EF4444",
      dash: [5, 5] as number[],
      pointRadius: 0,
      pointHoverRadius: 0,
    },
    profit_target: {
      color: "#10B981",
      dash: [5, 5] as number[],
      pointRadius: 0,
      pointHoverRadius: 0,
    },
  };

  // Find reference values
  const findReferenceValue = (category: string): number | null => {
    for (let i = 0; i < data.length; i++) {
      const value = data[i][category as keyof ChartDataItem];
      if (value !== null && value !== undefined && typeof value === 'number') {
        return value;
      }
    }
    return null;
  };

  const maxDrawdownValue = findReferenceValue("max_drawdown");
  const profitTargetValue = findReferenceValue("profit_target");

  // Chart data configuration
  const categories = ["balance", "max_drawdown", "profit_target"];
  const chartData: ChartData<'line'> = {
    labels: data.map((item) => item.formattedTime || item.date),
    datasets: categories.map((cat) => {
      const style = lineStyles[cat as keyof typeof lineStyles] || {
        color: theme === "dark" ? "#A1A1AA" : "#52525B",
        dash: [] as number[],
        pointRadius: 0,
        pointHoverRadius: 0,
      };

      let categoryData: (number | null)[];
      if (cat === "max_drawdown" && maxDrawdownValue !== null) {
        categoryData = new Array(data.length).fill(maxDrawdownValue);
      } else if (cat === "profit_target" && profitTargetValue !== null) {
        categoryData = new Array(data.length).fill(profitTargetValue);
      } else {
        categoryData = data.map((item) => {
          const value = item[cat as keyof ChartDataItem];
          return typeof value === 'number' ? value : null;
        });
      }

      return {
        label: cat,
        data: categoryData,
        borderColor: style.color,
        backgroundColor: "transparent",
        borderDash: style.dash,
        borderWidth: 2,
        pointRadius: style.pointRadius,
        pointHoverRadius: style.pointHoverRadius,
        spanGaps: true,
        ...(cat === "max_drawdown" || cat === "profit_target"
          ? {
            fill: false,
            tension: 0,
          }
          : {}),
      };
    }),
  };

  // Calculate Y-axis range
  const allValues: number[] = [];
  data.forEach((row) => {
    categories.forEach((cat) => {
      const val = row[cat as keyof ChartDataItem];
      if (typeof val === "number") allValues.push(val);
    });
  });
  if (maxDrawdownValue !== null) allValues.push(maxDrawdownValue);
  if (profitTargetValue !== null) allValues.push(profitTargetValue);
  if (allValues.length === 0) allValues.push(initialBalance - 1000, initialBalance + 1000);

  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const paddingFactor = 0.05;
  const range = maxVal - minVal;
  const suggestedMin = minVal - range * paddingFactor;
  const suggestedMax = maxVal + range * paddingFactor;

  // Theme styles
  const themeStyles = {
    dark: {
      backgroundColor: "#27272a",
      textColor: "rgba(255, 255, 255, 0.6)",
      gridColor: "rgba(255, 255, 255, 0.08)",
      legendColor: "rgba(255, 255, 255, 0.8)",
      tooltip: {
        backgroundColor: "rgba(39, 39, 42, 0.95)",
        titleColor: "#F4F4F5",
        bodyColor: "#D4D4D8",
        borderColor: "rgba(113, 113, 122, 0.3)",
      },
    },
    light: {
      backgroundColor: "#FFFFFF",
      textColor: "rgba(55, 65, 81, 0.6)",
      gridColor: "rgba(0, 0, 0, 0.08)",
      legendColor: "rgba(55, 65, 81, 0.8)",
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#18181B",
        bodyColor: "#52525B",
        borderColor: "rgba(161, 161, 170, 0.3)",
      },
    },
  };

  const currentTheme = themeStyles[theme as keyof typeof themeStyles] || themeStyles.dark;
  // Removed useTranslations - admin uses English only
  // Chart options
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 10,
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: currentTheme.tooltip.backgroundColor,
        titleColor: currentTheme.tooltip.titleColor,
        bodyColor: currentTheme.tooltip.bodyColor,
        borderColor: currentTheme.tooltip.borderColor,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        titleFont: {
          size: 13,
          //weight: '600'
        },
        bodyFont: {
          size: 12,
          weight: 'normal'
        },
        callbacks: {
          title: (context: TooltipItem<'line'>[]) => {
            return context[0].label;
          },
          label: (context: TooltipItem<'line'>) => {
            const { datasetIndex, parsed } = context;
            const category = categories[datasetIndex];

            if (category === "balance") {
              return `Balance: ${yFormatter(parsed.y)}`;
            } else if (category === "max_drawdown") {
              return `Max Drawdown: ${yFormatter(parsed.y)}`;
            } else if (category === "profit_target") {
              return `Profit Target: ${yFormatter(parsed.y)}`;
            }
            return "";
          },
          labelColor: (context: TooltipItem<'line'>) => {
            const { datasetIndex } = context;
            const category = categories[datasetIndex];
            const style = lineStyles[category as keyof typeof lineStyles];
            
            return {
              borderColor: style?.color || "#e4b833",
              backgroundColor: style?.color || "#e4b833",
              borderWidth: 1,
              borderRadius: 2
            };
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: currentTheme.gridColor,
        },
        ticks: {
          color: currentTheme.textColor,
          display: false,
        },
      },
      y: {
        suggestedMin,
        suggestedMax,
        grid: {
          color: currentTheme.gridColor,
          lineWidth: 1,
        },
        ticks: {
          color: currentTheme.textColor,
          callback: function (value: string | number) {
            return yFormatter(Number(value));
          },
        },
      },
    },
  };

  if (!data || data.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-96 bg-white dark:bg-zinc-800 rounded-lg shadow-md dark:border-zinc-700 dark:shadow-black">
          <div className="text-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No trading data available to display</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="text-base font-semibold mb-2">
        Account Balance
      </p>
      <div className={className}>
        {/* Chart */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md dark:border-zinc-700 dark:shadow-black p-4">
          <div style={{ width: "100%", height: "400px" }}>
            <Line data={chartData} options={options} />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center space-x-6 mt-4 text-sm">
            {categories.map((cat) => {
              const style = lineStyles[cat as keyof typeof lineStyles] || {
                color: currentTheme.textColor,
                dash: [] as number[],
              };
              const borderStyle = style.dash.length
                ? `2px dashed ${style.color}`
                : `2px solid ${style.color}`;

              let displayName = cat.replace(/_/g, " ");
              if (cat === "max_drawdown") {
                displayName = 'Max Drawdown';
              }
              if (cat === "profit_target") {
                displayName = 'Profit Target';
              }
              if (cat === "balance") {
                displayName = 'Balance';
              }

              return (
                <div key={cat} className="flex items-center space-x-2">
                  <div
                    style={{
                      width: "20px",
                      height: "2px",
                      border: borderStyle,
                    }}
                  />
                  <span 
                    className="capitalize"
                    style={{ color: currentTheme.legendColor }}
                  >
                    {displayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}