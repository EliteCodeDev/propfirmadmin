"use client";
import React, { useEffect, useMemo, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { AdminMetrixData, PositionLike } from "@/types/metrix";

function formatCurrency(n: number) {
  return `$${new Intl.NumberFormat("en-US").format(Math.round(n))}`;
}

function toClosedTrades(all: PositionLike[]): { date: string; pnl: number }[] {
  const closed = all.filter(t => (t.TimeClose || t.closeTime));
  const sorted = closed.sort((a, b) => new Date((a.TimeClose || a.closeTime)!).getTime() - new Date((b.TimeClose || b.closeTime)!).getTime());
  return sorted.map(t => {
    const profit = (t.Profit ?? t.profit ?? 0) + (t.Commission ?? t.commission ?? 0) + (t.Swap ?? t.swap ?? 0);
    const time = (t.TimeClose || t.closeTime) as string;
    const date = time.includes("T") ? time.split("T")[0] : (time.split(" ")[0] || time);
    return { date, pnl: profit };
  });
}

export default function TradingChart({ data }: { data: AdminMetrixData }) {
  const { initialBalance, trades, refs } = data;
  const profitTargetAmount = useMemo(() => (refs.profitTargetPercent || 0) * initialBalance / 100, [refs.profitTargetPercent, initialBalance]);
  const maxDrawdownAmount = useMemo(() => (refs.maxDrawdownPercent || 0) * initialBalance / 100, [refs.maxDrawdownPercent, initialBalance]);

  const series = useMemo(() => {
    const closed = toClosedTrades(trades);
    let running = initialBalance;
    const points: { date: string; balance: number }[] = [];

    if (closed.length === 0) {
      const today = new Date().toISOString().split("T")[0];
      return [{ date: today, balance: initialBalance }];
    }

    // initial point
    points.push({ date: closed[0].date, balance: initialBalance });
    closed.forEach(c => {
      running += c.pnl;
      points.push({ date: c.date, balance: running });
    });
    return points;
  }, [trades, initialBalance]);

  const minY = useMemo(() => Math.min(...series.map(p => p.balance), initialBalance - 100), [series, initialBalance]);
  const maxY = useMemo(() => Math.max(...series.map(p => p.balance), initialBalance + 100), [series, initialBalance]);

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-4">
      <div className="text-sm font-medium mb-2">Account Balance</div>
      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer>
          <LineChart data={series} margin={{ top: 10, bottom: 10, left: 0, right: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" hide />
            <YAxis tickFormatter={formatCurrency} domain={[minY * 0.98, maxY * 1.02]} />
            <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
            <Legend />
            <Line type="monotone" dataKey="balance" stroke="#e4b833" strokeWidth={2} dot={false} name="Balance" />
            <ReferenceLine y={initialBalance + profitTargetAmount} stroke="#10B981" strokeDasharray="4 4" label="Profit Target" />
            <ReferenceLine y={initialBalance - maxDrawdownAmount} stroke="#EF4444" strokeDasharray="4 4" label="Max Drawdown" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
