"use client";

import { useMemo, useState, useEffect } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import DashboardApi from '@/api/dashboard';
import { DashboardAnalytics } from "@/types/dashboard";

type RangeKey = "D" | "W" | "M" | "Y" | "All" | "Custom";

interface DataPoint {
  date: string;
  revenues: number;
  clients: number;
}

export default function PerformanceAnalytics() {
  const [range, setRange] = useState<RangeKey>("D");
  const [showCustom, setShowCustom] = useState(false);
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [analyticsData, setAnalyticsData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data from backend
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await DashboardApi.getAnalytics();
        setAnalyticsData(data);
      } catch (err) {
        if (err instanceof Error && err.message.includes('401')) {
          setError('Authentication required. Please log in to view analytics data.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
        }
        console.error('Error fetching analytics:', err);
        // Set empty data structure to prevent crashes
        setAnalyticsData({
          userRegistrations: [],
          orderVolume: [],
          withdrawalRequests: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const data = useMemo(() => {
    if (!analyticsData) return [];

    // Combine all data sources
    const allDates = new Set([
      ...analyticsData.orderVolume.map(item => item.date),
      ...analyticsData.userRegistrations.map(item => item.date),
      ...analyticsData.withdrawalRequests.map(item => item.date)
    ]);

    const combinedData = Array.from(allDates).map(date => {
      const orderData = analyticsData.orderVolume.find(item => item.date === date);
      const userData = analyticsData.userRegistrations.find(item => item.date === date);
      const withdrawalData = analyticsData.withdrawalRequests.find(item => item.date === date);

      return {
        date,
        revenues: orderData?.amount || 0,
        clients: userData?.count || 0
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Filter data based on selected range
    const now = new Date();
    let filteredData = combinedData;

    switch (range) {
      case 'D':
        const today = now.toISOString().split('T')[0];
        filteredData = combinedData.filter(item => item.date === today);
        break;
      case 'W':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredData = combinedData.filter(item => new Date(item.date) >= weekAgo);
        break;
      case 'M':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredData = combinedData.filter(item => new Date(item.date) >= monthAgo);
        break;
      case 'Y':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        filteredData = combinedData.filter(item => new Date(item.date) >= yearAgo);
        break;
      case 'Custom':
        if (start && end) {
          filteredData = combinedData.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= new Date(start) && itemDate <= new Date(end);
          });
        }
        break;
      case 'All':
      default:
        filteredData = combinedData;
        break;
    }

    return filteredData;
  }, [analyticsData, range, start, end]);

  //console.log(data);

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

        {/* Loading and Error States */}
        {loading && (
          <div className="mt-6 h-[340px] w-full rounded-3xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-800/40 dark:to-gray-900/30 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Cargando datos de analytics...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 h-[340px] w-full rounded-3xl border border-red-200 dark:border-red-800 p-4 sm:p-6 bg-gradient-to-br from-red-50/50 to-white/50 dark:from-red-800/40 dark:to-gray-900/30 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="text-red-600 dark:text-red-400 font-medium mb-2">
                {error.includes('Authentication') ? '🔒 Authentication Required' : '⚠️ Error Loading Data'}
              </div>
              <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</p>
              {error.includes('Authentication') && (
                <div className="mb-3 text-sm text-red-600 dark:text-red-400">
                  Please log in to view analytics data
                </div>
              )}
              <button 
                onClick={() => window.location.reload()} 
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {error.includes('Authentication') ? 'Refresh Page' : 'Reintentar'}
              </button>
            </div>
          </div>
        )}

        {/* Chart */}
        {!loading && !error && (
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
        )}
      </div>
    </div>
  );
}
