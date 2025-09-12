"use client";
import React, { useState, useMemo } from "react";
import { BarChart, Clock, ArrowUp, ArrowDown, Target } from "lucide-react";

type Position = Record<string, any>;
type SortField = "closeTime" | "symbol" | "profit" | "volume";
type SortDirection = "asc" | "desc";
type FilterType = "all" | "profit" | "loss" | "buy" | "sell";

const get = (t: Position, prop: string, fallback?: string) => t[prop] ?? t[fallback || prop];
const getTypeNumber = (t: Position) => {
  const v = get(t, "Type", "type");
  if (typeof v === "string") return v.toUpperCase() === "BUY" ? 0 : 1;
  return v;
};
const totalProfit = (t: Position) => (Number(get(t, "Profit", "profit") || 0) + Number(get(t, "Commission", "commission") || 0) + Number(get(t, "Swap", "swap") || 0));
const profitColor = (n: number) => (n >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400");
const actionPill = (t: Position) => (getTypeNumber(t) === 0 ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300");
const fmt2 = (n: any) => (n == null || isNaN(Number(n)) ? "0.00" : Number(n).toFixed(2));

export default function TradingHistory({ trades, className = "" }: { trades: Position[]; className?: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortField, setSortField] = useState<SortField>("closeTime");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const filteredAndSorted = useMemo(() => {
    let list = trades || [];
    if (searchTerm) {
      list = list.filter((t) => {
        const s = (get(t, "Symbol", "symbol") || "").toString().toLowerCase();
        const c = (get(t, "Commentary", "comment") || "").toString().toLowerCase();
        const q = searchTerm.toLowerCase();
        return s.includes(q) || c.includes(q);
      });
    }
    if (filterType !== "all") {
      list = list.filter((t) => {
        const p = totalProfit(t);
        const type = getTypeNumber(t);
        switch (filterType) {
          case "profit":
            return p > 0;
          case "loss":
            return p < 0;
          case "buy":
            return type === 0;
          case "sell":
            return type === 1;
          default:
            return true;
        }
      });
    }
    list.sort((a, b) => {
      const av =
        sortField === "symbol"
          ? get(a, "Symbol", "symbol")
          : sortField === "profit"
          ? totalProfit(a)
          : sortField === "volume"
          ? get(a, "Volume", "volume")
          : new Date(get(a, "TimeClose", "closeTime") || get(a, "TimeOpen", "openTime") || 0).getTime();
      const bv =
        sortField === "symbol"
          ? get(b, "Symbol", "symbol")
          : sortField === "profit"
          ? totalProfit(b)
          : sortField === "volume"
          ? get(b, "Volume", "volume")
          : new Date(get(b, "TimeClose", "closeTime") || get(b, "TimeOpen", "openTime") || 0).getTime();
      return sortDirection === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [trades, searchTerm, filterType, sortField, sortDirection]);

  const stats = useMemo(() => {
    const all = trades || [];
    const profitable = all.filter((t) => totalProfit(t) > 0);
    const losing = all.filter((t) => totalProfit(t) < 0);
    const buy = all.filter((t) => getTypeNumber(t) === 0);
    const sell = all.filter((t) => getTypeNumber(t) === 1);
    return {
      all: all.length,
      profitable: profitable.length,
      losing: losing.length,
      buy: buy.length,
      sell: sell.length,
    };
  }, [trades]);

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    else {
      setSortField(f);
      setSortDirection("desc");
    }
  };

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

  return (
    <>
      <h2 className="text-base font-semibold flex items-center mb-6">
        <BarChart className="w-5 h-5 mr-2 text-blue-600" />
        Trading History
      </h2>
      <div className={`bg-white dark:bg-zinc-800 rounded-lg shadow-md dark:border-zinc-700 ${className}`}>
        <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex flex-wrap gap-2 mb-4">
            {([
              ["all", `All (${stats.all})`],
              ["profit", `Profit (${stats.profitable})`],
              ["loss", `Loss (${stats.losing})`],
              ["buy", `Buy (${stats.buy})`],
              ["sell", `Sell (${stats.sell})`],
            ] as [FilterType, string][]).map(([key, label]) => (
              <button key={key} className={`px-4 py-2 rounded text-sm font-medium transition-colors ${filterType === key ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-600"}`} onClick={() => setFilterType(key)}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by symbol or comment…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-4 py-2 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[75vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-700 sticky top-0">
              <tr className="border-b border-gray-200 dark:border-zinc-600">
                <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Type</th>
                <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Open</th>
                <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Close</th>
                <th onClick={() => handleSort("volume")} className="text-center p-3 font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-600 transition-colors">Volume</th>
                <th onClick={() => handleSort("symbol")} className="text-center p-3 font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-600 transition-colors">Symbol</th>
                <th onClick={() => handleSort("profit")} className="text-center p-3 font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-600 transition-colors">P/L</th>
                <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {filteredAndSorted.map((t, idx) => {
                const p = totalProfit(t);
                const open = get(t, "TimeOpen", "openTime") || "";
                const close = get(t, "TimeClose", "closeTime") || "";
                const typeNum = getTypeNumber(t);
                const key = get(t, "OrderId", "ticket") || idx;
                return (
                  <tr key={key} className={`border-b border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors ${idx % 2 === 0 ? "bg-white dark:bg-zinc-800" : "bg-gray-25 dark:bg-zinc-750"}`}>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${actionPill(t)}`}>
                        {typeNum === 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                        {typeof get(t, "Type", "type") === "string" ? String(get(t, "Type", "type")).toUpperCase() : typeNum === 0 ? "BUY" : "SELL"}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-gray-900 dark:text-white">{open ? new Date(open).toLocaleString() : "--"}</td>
                    <td className="p-3 font-medium text-gray-900 dark:text-white">{close ? new Date(close).toLocaleString() : <span className="text-blue-600 dark:text-blue-400 font-medium">OPEN</span>}</td>
                    <td className="p-3 font-medium text-gray-900 dark:text-white">{fmt2(get(t, "Volume", "volume"))}</td>
                    <td className="p-3 font-medium text-gray-900 dark:text-white">{get(t, "Symbol", "symbol")}</td>
                    <td className="p-3"><div className={`font-bold ${profitColor(p)}`}>{p > 0 ? "+" : ""}{fmt2(p)}</div></td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${get(t, "TimeClose", "closeTime") ? "bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300" : "bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200"}`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {get(t, "TimeClose", "closeTime") ? "CLOSED" : "OPEN"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
