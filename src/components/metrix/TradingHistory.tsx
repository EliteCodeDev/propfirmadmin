// src/components/metrix/TradingHistory.tsx
'use client';

import React, { useState, useMemo } from 'react';
// Removed useTranslations import - admin uses English only
import {
  BarChart,
  Clock,
  ArrowUp,
  ArrowDown,
  Activity,
  Target,
  Timer
} from 'lucide-react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { Position, TradingHistoryProps } from '@/types/metrix';

type SortField = 'closeTime' | 'symbol' | 'profit' | 'volume';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'profit' | 'loss' | 'buy' | 'sell';

const formatDuration = (openTime: string, closeTime?: string): string => {
  if (!closeTime) return '--';
  try {
    const start = new Date(openTime);
    const end = new Date(closeTime);
    const diffMs = end.getTime() - start.getTime();

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  } catch {
    return '--';
  }
};

const getTradeProperty = (trade: Position, newProp: string, legacyProp: string): any => {
  return (trade as any)[newProp] !== undefined ? (trade as any)[newProp] : (trade as any)[legacyProp];
};

const formatDateTime = (dateString: string): { date: string; time: string } => {
  try {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
  } catch {
    return { date: dateString, time: '' };
  }
};

const getTradeType = (trade: Position): string => {
  const type = getTradeProperty(trade, 'Type', 'type');
  if (typeof type === 'string') return type.toUpperCase();
  return type === 0 ? 'BUY' : 'SELL';
};

const calculateTotalProfit = (trade: Position): number => {
  const profit = getTradeProperty(trade, 'Profit', 'profit') || 0;
  const commission = getTradeProperty(trade, 'Commission', 'commission') || 0;
  const swap = getTradeProperty(trade, 'Swap', 'swap') || 0;
  return profit + commission + swap;
};

const getActionColor = (trade: Position) => {
  const type = getTradeProperty(trade, 'Type', 'type');
  const isBuy = (typeof type === 'string' && type.toUpperCase() === 'BUY') || type === 0;
  return isBuy
    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
    : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
};

const getTradeTypeNumber = (trade: Position): number => {
  const type = getTradeProperty(trade, 'Type', 'type');
  if (typeof type === 'string') return type.toUpperCase() === 'BUY' ? 0 : 1;
  return type;
};

const getProfitColor = (profit: number) => {
  return profit >= 0
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';
};

const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(Number(num))) {
    return '0.00';
  }
  return Number(num).toFixed(2);
};

export default function TradingHistory({ trades, className = '' }: TradingHistoryProps) {
  // Removed useTranslations - admin uses English only
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('closeTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredAndSortedTrades = useMemo(() => {
    // Incluir tanto posiciones cerradas como abiertas
    let filtered = trades; // No filtrar por closeTime para incluir posiciones abiertas

    if (searchTerm) {
      filtered = filtered.filter(trade => {
        const symbol = getTradeProperty(trade, 'Symbol', 'symbol');
        const comment = getTradeProperty(trade, 'Commentary', 'comment');
        return symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (comment && comment.toLowerCase().includes(searchTerm.toLowerCase()));
      });
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(trade => {
        const totalProfit = calculateTotalProfit(trade);
        const typeNumber = getTradeTypeNumber(trade);
        switch (filterType) {
          case 'profit': return totalProfit > 0;
          case 'loss': return totalProfit < 0;
          case 'buy': return typeNumber === 0;
          case 'sell': return typeNumber === 1;
          default: return true;
        }
      });
    }

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      switch (sortField) {
        case 'closeTime':
          // Usar TimeClose si existe, sino TimeOpen para posiciones abiertas
          aValue = new Date(getTradeProperty(a, 'TimeClose', 'closeTime') || getTradeProperty(a, 'TimeOpen', 'openTime') || 0).getTime();
          bValue = new Date(getTradeProperty(b, 'TimeClose', 'closeTime') || getTradeProperty(b, 'TimeOpen', 'openTime') || 0).getTime();
          break;
        case 'symbol':
          aValue = getTradeProperty(a, 'Symbol', 'symbol');
          bValue = getTradeProperty(b, 'Symbol', 'symbol');
          break;
        case 'profit': aValue = calculateTotalProfit(a); bValue = calculateTotalProfit(b); break;
        case 'volume':
          aValue = getTradeProperty(a, 'Volume', 'volume');
          bValue = getTradeProperty(b, 'Volume', 'volume');
          break;
        default:
          // Usar TimeClose si existe, sino TimeOpen para posiciones abiertas
          aValue = getTradeProperty(a, 'TimeClose', 'closeTime') || getTradeProperty(a, 'TimeOpen', 'openTime');
          bValue = getTradeProperty(b, 'TimeClose', 'closeTime') || getTradeProperty(b, 'TimeOpen', 'openTime');
      }
      return sortDirection === 'asc'
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1);
    });

    return filtered;
  }, [trades, searchTerm, filterType, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const stats = useMemo(() => {
    // Incluir tanto posiciones cerradas como abiertas
    const allTrades = trades; // Todas las posiciones (abiertas y cerradas)
    const profitableTrades = allTrades.filter(trade => calculateTotalProfit(trade) > 0);
    const losingTrades = allTrades.filter(trade => calculateTotalProfit(trade) < 0);
    const buyTrades = allTrades.filter(trade => getTradeTypeNumber(trade) === 0);
    const sellTrades = allTrades.filter(trade => getTradeTypeNumber(trade) === 1);

    return {
      all: allTrades.length,
      profitable: profitableTrades.length,
      losing: losingTrades.length,
      buy: buyTrades.length,
      sell: sellTrades.length,
      totalProfit: allTrades.reduce((sum, trade) => sum + calculateTotalProfit(trade), 0),
      totalVolume: allTrades.reduce((sum, trade) => sum + getTradeProperty(trade, 'Volume', 'volume'), 0),
      winRate: allTrades.length > 0 ? (profitableTrades.length / allTrades.length) * 100 : 0
    };
  }, [trades]);

  if (!trades || trades.length === 0) {
    return (
      <>
        <h2 className="text-base font-semibold flex items-center mb-6">
          <BarChart className="w-5 h-5 mr-2 text-blue-600" />
          Trading History
        </h2>
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md border border-gray-200 dark:border-zinc-700">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No trading positions available</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <ArrowUpIcon className="h-3 w-3 ml-1 inline" /> :
      <ArrowDownIcon className="h-3 w-3 ml-1 inline" />;
  };

  return (
    <>
      {/* TÍTULO PRINCIPAL */}
      <h2 className="text-base font-semibold flex items-center mb-6">
        <BarChart className="w-5 h-5 mr-2 text-blue-600" />
        Trading History
      </h2>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md dark:border-zinc-700">

        {/* FILTROS CON BOTONES Y CONTADORES */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-600'
                }`}
              onClick={() => setFilterType('all')}
            >
              {`All (${stats.all})`}
            </button>

            <button
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                filterType === 'profit'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-600'
                }`}
              onClick={() => setFilterType('profit')}
            >
              {`Profit (${stats.profitable})`}
            </button>

            <button
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                filterType === 'loss'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-600'
                }`}
              onClick={() => setFilterType('loss')}
            >
              {`Loss (${stats.losing})`}
            </button>

            <button
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                filterType === 'buy'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-600'
                }`}
              onClick={() => setFilterType('buy')}
            >
              {`BUY (${stats.buy})`}
            </button>

            <button
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                filterType === 'sell'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-600'
                }`}
              onClick={() => setFilterType('sell')}
            >
              {`SELL (${stats.sell})`}
            </button>
          </div>

          {/* BARRA DE BÚSQUEDA */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by symbol or comment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* CONTENIDO DE LA TABLA */}
        {filteredAndSortedTrades.length === 0 ? (
          <div className="text-center p-8">
            <div className="text-gray-400 mb-2">
              <Target className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              No {filterType === 'all' ? '' : filterType === 'profit' ? 'profitable' : filterType === 'loss' ? 'losing' : filterType} positions to show.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[75vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-700 sticky top-0">
                <tr className="border-b border-gray-200 dark:border-zinc-600">
                  <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Type</th>
                  <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Open</th>
                  <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Close</th>
                  <th
                    onClick={() => handleSort('volume')}
                    className="text-center p-3 font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-600 transition-colors"
                  >
                    Volume <SortIcon field="volume" />
                  </th>
                  <th
                    onClick={() => handleSort('symbol')}
                    className="text-center p-3 font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-600 transition-colors"
                  >
                    Symbol <SortIcon field="symbol" />
                  </th>
                  <th
                    onClick={() => handleSort('profit')}
                    className="text-center p-3 font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-600 transition-colors"
                  >
                    P&L <SortIcon field="profit" />
                  </th>
                  <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Duration</th>
                  <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
                </tr>
              </thead>

              <tbody className='text-center'>
                {filteredAndSortedTrades
                  .sort((a, b) => {
                    // Usar TimeClose si existe, sino TimeOpen para posiciones abiertas
                    const aTime = getTradeProperty(a, 'TimeClose', 'closeTime') || getTradeProperty(a, 'TimeOpen', 'openTime');
                    const bTime = getTradeProperty(b, 'TimeClose', 'closeTime') || getTradeProperty(b, 'TimeOpen', 'openTime');
                    return new Date(bTime || 0).getTime() - new Date(aTime || 0).getTime();
                  })
                  .map((trade, index) => {
                    const totalProfit = calculateTotalProfit(trade);
                    const openTime = getTradeProperty(trade, 'TimeOpen', 'openTime') || '';
                    const closeTime = getTradeProperty(trade, 'TimeClose', 'closeTime') || '';
                    const openDateTime = formatDateTime(openTime);
                    const closeDateTime = formatDateTime(closeTime);
                    const duration = formatDuration(openTime, closeTime);
                    const tradeKey = getTradeProperty(trade, 'OrderId', 'ticket') || index;
                    const typeNumber = getTradeTypeNumber(trade);

                    return (
                      <tr
                        key={tradeKey}
                        className={`border-b border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-zinc-800' : 'bg-gray-25 dark:bg-zinc-750'
                          }`}
                      >
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getActionColor(trade)}`}>
                            {typeNumber === 0 ? (
                              <ArrowUp className="w-3 h-3 mr-1" />
                            ) : (
                              <ArrowDown className="w-3 h-3 mr-1" />
                            )}
                            {getTradeType(trade)}
                          </span>
                        </td>

                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          <div className="text-xs">{openDateTime.date}</div>
                          <div className="text-xs font-mono">{openDateTime.time}</div>
                        </td>

                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          {closeTime ? (
                            <>
                              <div className="text-xs">{closeDateTime.date}</div>
                              <div className="text-xs font-mono">{closeDateTime.time}</div>
                            </>
                          ) : (
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">OPEN</div>
                          )}
                        </td>

                        <td className="p-3 font-medium text-gray-900 dark:text-white">
                          {formatNumber(getTradeProperty(trade, 'Volume', 'volume'))}
                        </td>

                        <td className="p-3 font-medium text-gray-900 dark:text-white">
                          {getTradeProperty(trade, 'Symbol', 'symbol')}
                        </td>

                        <td className="p-3">
                          <div className={`font-bold ${getProfitColor(totalProfit)}`}>
                            {totalProfit > 0 ? '+' : ''}{formatNumber(totalProfit)}
                          </div>
                          {((getTradeProperty(trade, 'Commission', 'commission') && getTradeProperty(trade, 'Commission', 'commission') !== 0) || (getTradeProperty(trade, 'Swap', 'swap') && getTradeProperty(trade, 'Swap', 'swap') !== 0)) && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Swap: {formatNumber(getTradeProperty(trade, 'Swap', 'swap') || 0)} / Comisión: {formatNumber(getTradeProperty(trade, 'Commission', 'commission') || 0)}
                            </div>
                          )}
                        </td>

                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          {closeTime ? duration : (
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Running</div>
                          )}
                        </td>

                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTradeProperty(trade, 'TimeClose', 'closeTime')
                              ? 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300'
                              : 'bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200'
                            }`}>
                            <Clock className="w-3 h-3 mr-1" />
                            {getTradeProperty(trade, 'TimeClose', 'closeTime') ? 'Closed' : 'Open'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}