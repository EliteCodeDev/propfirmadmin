"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { ChartBarIcon } from "@heroicons/react/24/outline";

type RangeKey = "D" | "W" | "M" | "Y" | "All" | "Custom";

// Simple demo data generator
function generateData(days = 7) {
  const now = new Date();
  const arr: { date: string; revenues: number; clients: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const revenues = Math.max(0, Math.round(Math.random() * 8000) / 100);
    const clients = Math.floor(Math.random() * 5);
    arr.push({ date: d.toISOString().slice(0, 10), revenues, clients });
  }
  return arr;
}

export default function PerformanceAnalytics() {
  const [range, setRange] = useState<RangeKey>("D");
  const [showCustom, setShowCustom] = useState(false);
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");

  const data = useMemo(() => {
    switch (range) {
      case "D":
        return generateData(7);
      case "W":
        return generateData(7 * 4);
      case "M":
        return generateData(30);
      case "Y":
        return generateData(365);
      case "All":
        return generateData(120);
      case "Custom":
        if (start && end) {
          const s = new Date(start);
          const e = new Date(end);
          const diff = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
          return generateData(Math.min(diff + 1, 365));
        }
        return [];
      default:
        return generateData(7);
    }
  }, [range, start, end]);

  const ranges: RangeKey[] = ["D", "W", "M", "Y", "All"];

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-gray-100/70 dark:border-gray-800/60 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/80 dark:bg-white/5 backdrop-blur-xl">
      {/* NOTE: we intentionally avoid decorative circles here per request */}
      <div className="relative p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-white/60 rounded-2xl shadow-md"><ChartBarIcon className="h-6 w-6 text-indigo-600" /></div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Performance Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400">Track your revenue and client metrics over time</p>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2"><span className="w-8 h-0.5 bg-blue-600 rounded-full" /> <span className="text-gray-600 dark:text-gray-300">Revenues</span></div>
                <div className="flex items-center gap-2"><span className="w-8 h-0.5 bg-gray-400 rounded-full" /> <span className="text-gray-600 dark:text-gray-300">Clients</span></div>
              </div>
            </div>
          </div>

          {/* Range toggles */}
          <div className="flex items-center gap-2">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => { setRange(r); setShowCustom(false); }}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${range === r ? "bg-indigo-600 text-white shadow" : "bg-white/70 dark:bg-transparent text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"}`}
              >
                {r}
              </button>
            ))}
            <button
              onClick={() => { setRange("Custom"); setShowCustom(true); }}
              className={`px-3 py-1.5 rounded-full text-sm transition ${range === "Custom" ? "bg-indigo-600 text-white shadow" : "bg-white/70 dark:bg-transparent text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Custom range bar */}
        {showCustom && (
          <div className="mt-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-transparent p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-gray-600 dark:text-gray-300">Start Date</span>
                <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/30 outline-none focus:ring-2 focus:ring-indigo-500" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-gray-600 dark:text-gray-300">End Date</span>
                <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/30 outline-none focus:ring-2 focus:ring-indigo-500" />
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCustom(false)} className="px-4 py-2 rounded-2xl text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">Cancel</button>
              <button onClick={() => setShowCustom(false)} className="px-4 py-2 rounded-2xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow">Apply</button>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="mt-6 h-[340px] w-full rounded-3xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-800/40 dark:to-gray-900/30">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} angle={-30} textAnchor="end" height={50} />
              <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v: number) => `$${v}`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }}
                formatter={(value: number | string, name: string) => [name === 'revenues' ? `$${value}` : value, name === 'revenues' ? 'Revenues' : 'Clients']}
              />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="revenues" name="Revenues" stroke="#2563EB" fill="url(#revGradient)" strokeWidth={2} />
              <Area yAxisId="right" type="monotone" dataKey="clients" name="Clients" stroke="#9CA3AF" fill="#9CA3AF22" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
