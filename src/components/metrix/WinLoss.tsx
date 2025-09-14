// src/components/metrix/WinLoss.tsx
'use client';

import React, { useMemo } from 'react';
// Removed useTranslations import - admin uses English only
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ChartPieIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { WinLossPosition, WinLossProps, WinLossStats, SymbolStats } from '@/types/metrix';

// Type definitions moved to @/types

// Colors for charts
const COLORS = {
  win: '#10b981',
  loss: '#ef4444',
  neutral: '#6b7280'
};

const PIE_COLORS = [COLORS.win, COLORS.loss];

// Safe number formatting function
const safeToFixed = (value: any, decimals: number = 2): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0.' + '0'.repeat(decimals);
  }
  return Number(value).toFixed(decimals);
};

// Custom tooltip for bar chart
const WinLossBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
            <span className="font-medium ml-2" style={{ color: entry.color }}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom tooltip for bar chart
const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
            <span className="font-medium ml-2" style={{ color: entry.color }}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom tooltip for pie chart
const WinLossPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 dark:text-white">
          {data.name}: {data.value} ({safeToFixed(data.payload.percentage, 1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export default function WinLoss({ metaStats, closedPositions, className = '' }: WinLossProps) {
  // Removed useTranslations - admin uses English only

  // Calculate win/loss statistics
  const stats = useMemo((): WinLossStats => {
    if (!closedPositions || closedPositions.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        lossRate: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        profitFactor: 0,
        expectancy: 0
      };
    }

    // Use metaStats if available, otherwise calculate from closedPositions
    if (metaStats && metaStats.averageMetrics) {
      const { averageMetrics } = metaStats;
      
      // Calculate largest win/loss from closedPositions
      const profits = closedPositions.map(pos => pos.Profit || 0);
      const largestWin = profits.length > 0 ? Math.max(...profits.filter(p => p > 0)) : 0;
      const largestLoss = profits.length > 0 ? Math.abs(Math.min(...profits.filter(p => p < 0))) : 0;
      
      const totalWinAmount = averageMetrics.winningTrades * averageMetrics.averageProfit;
      const totalLossAmount = averageMetrics.losingTrades * Math.abs(averageMetrics.averageLoss);
      const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0;
      const expectancy = averageMetrics.totalTrades > 0 ? (totalWinAmount - totalLossAmount) / averageMetrics.totalTrades : 0;
      
      return {
        totalTrades: averageMetrics.totalTrades,
        winningTrades: averageMetrics.winningTrades,
        losingTrades: averageMetrics.losingTrades,
        winRate: averageMetrics.winRate,
        lossRate: averageMetrics.lossRate,
        averageWin: averageMetrics.averageProfit,
        averageLoss: Math.abs(averageMetrics.averageLoss),
        largestWin,
        largestLoss,
        profitFactor,
        expectancy
      };
    }
    
    // Fallback: calculate from closedPositions
    const totalTrades = closedPositions.length;
    
    const winningTrades = closedPositions.filter(pos => {
      const totalProfit = (pos.Profit || 0) + (pos.Commission || 0) + (pos.Swap || 0);
      return totalProfit > 0;
    });
    
    const losingTrades = closedPositions.filter(pos => {
      const totalProfit = (pos.Profit || 0) + (pos.Commission || 0) + (pos.Swap || 0);
      return totalProfit < 0;
    });

    const winCount = winningTrades.length;
    const lossCount = losingTrades.length;
    
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    const lossRate = totalTrades > 0 ? (lossCount / totalTrades) * 100 : 0;

    const totalWinAmount = winningTrades.reduce((sum, pos) => {
      return sum + (pos.Profit || 0) + (pos.Commission || 0) + (pos.Swap || 0);
    }, 0);
    
    const totalLossAmount = Math.abs(losingTrades.reduce((sum, pos) => {
      return sum + (pos.Profit || 0) + (pos.Commission || 0) + (pos.Swap || 0);
    }, 0));

    const averageWin = winCount > 0 ? totalWinAmount / winCount : 0;
    const averageLoss = lossCount > 0 ? totalLossAmount / lossCount : 0;

    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(pos => 
      (pos.Profit || 0) + (pos.Commission || 0) + (pos.Swap || 0)
    )) : 0;
    
    const largestLoss = losingTrades.length > 0 ? Math.abs(Math.min(...losingTrades.map(pos => 
      (pos.Profit || 0) + (pos.Commission || 0) + (pos.Swap || 0)
    ))) : 0;

    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0;
    const expectancy = totalTrades > 0 ? (totalWinAmount - totalLossAmount) / totalTrades : 0;

    return {
      totalTrades,
      winningTrades: winCount,
      losingTrades: lossCount,
      winRate,
      lossRate,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      profitFactor,
      expectancy
    };
  }, [metaStats, closedPositions]);

  // Calculate symbol statistics
  const symbolStats = useMemo((): SymbolStats[] => {
    if (!closedPositions || closedPositions.length === 0) return [];

    const symbolMap = new Map<string, {
      trades: any[];
      totalProfit: number;
    }>();

    closedPositions.forEach(pos => {
      const symbol = pos.Symbol;
      const profit = (pos.Profit || 0) + (pos.Commission || 0) + (pos.Swap || 0);
      
      if (!symbolMap.has(symbol)) {
        symbolMap.set(symbol, { trades: [], totalProfit: 0 });
      }
      
      const symbolData = symbolMap.get(symbol)!;
      symbolData.trades.push(pos);
      symbolData.totalProfit += profit;
    });

    return Array.from(symbolMap.entries()).map(([symbol, data]) => {
      const wins = data.trades.filter(pos => {
        const profit = (pos.Profit || 0) + (pos.Commission || 0) + (pos.Swap || 0);
        return profit > 0;
      }).length;
      
      const losses = data.trades.length - wins;
      const winRate = data.trades.length > 0 ? (wins / data.trades.length) * 100 : 0;
      const averageProfit = data.trades.length > 0 ? data.totalProfit / data.trades.length : 0;

      return {
        symbol,
        trades: data.trades.length,
        wins,
        losses,
        winRate,
        totalProfit: data.totalProfit,
        averageProfit
      };
    }).sort((a, b) => b.trades - a.trades);
  }, [closedPositions]);

  // Prepare data for charts
  const pieData = [
    { 
      name: 'Wins', 
      value: stats.winningTrades, 
      percentage: stats.winRate 
    },
    { 
      name: 'Losses', 
      value: stats.losingTrades, 
      percentage: stats.lossRate 
    }
  ];

  const symbolBarData = symbolStats.slice(0, 8).map(stat => ({
    symbol: stat.symbol,
    Wins: stat.wins,
    Losses: stat.losses
  }));

  const barData = symbolStats.slice(0, 8).map(stat => ({
    symbol: stat.symbol,
    Wins: stat.wins,
    Losses: stat.losses
  }));

  if (!closedPositions || closedPositions.length === 0) {
    return (
      <div className={className}>
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md dark:border-zinc-700 dark:shadow-black p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No trading data available</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex items-center space-x-2 mb-6">
            <ChartPieIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Win/Loss Analysis
            </h2>
          </div>
    <div className={className}>
      {/* Header */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md dark:border-zinc-700 dark:shadow-black">
        <div className="p-6">
          {/* Main Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <ChartBarIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Trades
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.totalTrades}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Win Rate
                </span>
              </div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {safeToFixed(stats.winRate, 1)}%
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrophyIcon className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Profit Factor
                </span>
              </div>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {safeToFixed(stats.profitFactor, 2)}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <CurrencyDollarIcon className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Expectancy
                </span>
              </div>
              <p className={`text-xl font-bold ${
                stats.expectancy >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                ${safeToFixed(stats.expectancy, 2)}
              </p>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400 block">Avg Win</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                ${safeToFixed(stats.averageWin, 2)}
              </span>
            </div>

            <div className="text-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400 block">Avg Loss</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                ${safeToFixed(stats.averageLoss, 2)}
              </span>
            </div>

            <div className="text-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400 block">Best Trade</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                ${safeToFixed(stats.largestWin, 2)}
              </span>
            </div>

            <div className="text-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400 block">Worst Trade</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                ${safeToFixed(stats.largestLoss, 2)}
              </span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="border-t border-gray-200 dark:border-zinc-700 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Win/Loss Distribution */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ChartPieIcon className="h-4 w-4 text-blue-600 mr-2" />
                Win/Loss Distribution
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${safeToFixed(percentage, 1)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<WinLossPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Symbol Performance */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ChartBarIcon className="h-4 w-4 text-blue-600 mr-2" />
                Top Symbols Performance
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" className="text-gray-300 dark:text-zinc-600" />
                    <XAxis 
                      dataKey="symbol" 
                      tick={{ fontSize: 10 }}
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      className="text-gray-600 dark:text-gray-400"
                    />
                                          <Tooltip content={<WinLossBarTooltip />} />
                    <Bar dataKey="Wins" fill={COLORS.win} />
                    <Bar dataKey="Losses" fill={COLORS.loss} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Symbol Statistics Table */}
        {symbolStats.length > 0 && (
          <div className="border-t border-gray-200 dark:border-zinc-700 p-6">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
              Symbols Performance Details
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-600">
                    <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400"> Symbol </th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Trades</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Wins</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Losses</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Win Rate</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Total P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {symbolStats.slice(0, 8).map((stat, index) => (
                    <tr key={stat.symbol} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-zinc-700/50' : ''}>
                      <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">
                        {stat.symbol}
                      </td>
                      <td className="py-2 px-3 text-center text-gray-600 dark:text-gray-400">
                        {stat.trades}
                      </td>
                      <td className="py-2 px-3 text-center text-green-600 dark:text-green-400">
                        {stat.wins}
                      </td>
                      <td className="py-2 px-3 text-center text-red-600 dark:text-red-400">
                        {stat.losses}
                      </td>
                      <td className="py-2 px-3 text-center text-gray-600 dark:text-gray-400">
                        {safeToFixed(stat.winRate, 1)}%
                      </td>
                      <td className={`py-2 px-3 text-right font-medium ${
                        stat.totalProfit >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        ${safeToFixed(stat.totalProfit, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
    
  );
}