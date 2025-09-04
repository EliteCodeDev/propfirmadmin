'use client';

import { useState, useEffect } from 'react';
import { StatCard } from './StatCard';
import { SectionCard } from './SectionCard';
import PerformanceAnalytics from './PerformanceAnalytics';
import { BanknotesIcon, ChartBarIcon, UserGroupIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import DashboardApi from '@/api/dashboard';
import { DashboardStats, TopSellingPlan } from '@/types/dashboard';

interface DashboardContentProps {
  initialData?: DashboardStats | null;
}

export default function DashboardContent({ initialData }: DashboardContentProps) {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(initialData || null);
  const [topPlans, setTopPlans] = useState<TopSellingPlan[]>([]);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [statsData, plansData] = await Promise.all([
        DashboardApi.getStats(),
        DashboardApi.getTopPlans()
      ]);

      setDashboardData(statsData);
      setTopPlans(plansData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchDashboardData();
    }
  }, [initialData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white text-gray-900">Dashboard</h1>
          {lastUpdated && (
            <p className="text-xs dark:text-white text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="flex flex-col space-y-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="xl:col-span-2 lg:col-span-1">
            <StatCard
              size="sm"
              label="Total Users"
              value={dashboardData?.totalUsers?.toString() || "0"}
              variant="indigo"
              delay={0}
              icon={<UserGroupIcon className="h-6 w-6 text-indigo-600" />}
            />
          </div>
          <div className="xl:col-span-2 lg:col-span-1">
            <StatCard
              size="sm"
              label="Total Orders"
              value={dashboardData?.totalOrders?.toString() || "0"}
              variant="blue"
              delay={100}
              icon={<ChartBarIcon className="h-6 w-6 text-blue-600" />}
            />
          </div>
          <div className="xl:col-span-2 lg:col-span-1">
            <StatCard
              size="sm"
              label="Total Sales"
              value={`$${dashboardData?.totalSales?.toFixed(2) || "0.00"}`}
              variant="emerald"
              delay={200}
              icon={<BanknotesIcon className="h-6 w-6 text-emerald-600" />}
            />
          </div>

          {/* <div className="xl:col-span-2 lg:col-span-1">
            <StatCard
              size="sm"
              label="Monthly Users"
              value={dashboardData?.monthlyUsers?.toString() || "0"}
              variant="gray"
              delay={300}
              delta={dashboardData?.userGrowth ? `${dashboardData.userGrowth.percentage.toFixed(1)}%` : undefined}
              deltaColor={dashboardData?.userGrowth?.direction === 'up' ? 'emerald' : 'red'}
              deltaDirection={dashboardData?.userGrowth?.direction || 'down'}
              icon={<UserGroupIcon className="h-6 w-6 text-indigo-600" />}
            />
          </div>
          <div className="xl:col-span-2 lg:col-span-1">
            <StatCard
              size="sm"
              label="Monthly Orders"
              value={dashboardData?.monthlyOrders?.toString() || "0"}
              variant="gray"
              delay={400}
              delta={dashboardData?.orderGrowth ? `${dashboardData.orderGrowth.percentage.toFixed(1)}%` : undefined}
              deltaColor={dashboardData?.orderGrowth?.direction === 'up' ? 'emerald' : 'red'}
              deltaDirection={dashboardData?.orderGrowth?.direction || 'down'}
              icon={<ChartBarIcon className="h-6 w-6 text-indigo-600" />}
            />
          </div>
          <div className="xl:col-span-2 lg:col-span-1">
            <StatCard
              size="sm"
              label="Monthly Sales"
              value={`$${dashboardData?.monthlySales?.toFixed(2) || "0.00"}`}
              variant="gray"
              delay={500}
              delta={dashboardData?.salesGrowth ? `${dashboardData.salesGrowth.percentage.toFixed(1)}%` : undefined}
              deltaColor={dashboardData?.salesGrowth?.direction === 'up' ? 'emerald' : 'red'}
              deltaDirection={dashboardData?.salesGrowth?.direction || 'down'}
              icon={<BanknotesIcon className="h-6 w-6 text-indigo-600" />}
            />
          </div>*/}
        </div> 

        {/* Bottom row - financial metrics (wider) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="xl:col-span-1">
            <StatCard
              size="sm"
              label="Withdrawable Profits"
              value={`$${dashboardData?.withdrawableProfits?.toFixed(2) || "0.00"}`}
              variant="emerald"
              delay={600}
              icon={<BanknotesIcon className="h-6 w-6 text-emerald-600" />}
            />
          </div>
          <div className="xl:col-span-1">
            <StatCard
              size="sm"
              label="Payouts"
              value={`$${dashboardData?.payouts?.toFixed(2) || "0.00"}`}
              variant="indigo"
              delay={700}
              icon={<BanknotesIcon className="h-6 w-6 text-indigo-600" />}
            />
          </div>
        </div>

        Analytics Section
        <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
          <div className="xl:col-span-1">
            <PerformanceAnalytics />
          </div>
          {/* <div className="xl:col-span-1">
            <SectionCard>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Best Selling Plans this Month</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topPlans.map((plan, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {plan.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {plan.sales}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${plan.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div> */}
        </div>
      </div>
    </div>
  );
}