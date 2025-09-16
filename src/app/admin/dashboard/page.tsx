// src/app/admin/dashboard/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import MainLayout from "@/components/layouts/MainLayout";
import DashboardContent from "./_components/DashboardContent";
import DashboardApi from "@/api/dashboard";
import { DashboardStats } from "@/types/dashboard";
import { BellIcon, ChartBarIcon, CogIcon } from "lucide-react";
import { DocumentChartBarIcon } from "@heroicons/react/24/outline";

async function getDashboardData(): Promise<DashboardStats | null> {
  try {
    const data = await DashboardApi.getStats();
    return data;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return null;
  }
}

// Componente Header del Dashboard
function DashboardHeader({
  session,
  dashboardData,
}: {
  session: any;
  dashboardData: DashboardStats | null;
}) {
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
      ? "Good afternoon"
      : "Good evening";
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="px-6 py-8">
                {/* Greeting and navigation */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg transition-colors duration-200">
                <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200 flex justify-between">
                  {greeting}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 capitalize transition-colors duration-200">
                  {currentDate}
                </p>
              </div>
            </div>

            {/* Quick summary */}
            <div className="mt-4">
              {dashboardData && (
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300 transition-colors duration-200">
                      <strong className="text-gray-900 dark:text-white">
                        {dashboardData.totalUsers?.toLocaleString() || "0"}
                      </strong>{" "}
                      registered users
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300 transition-colors duration-200">
                      <strong className="text-gray-900 dark:text-white">
                        {dashboardData.totalOrders?.toLocaleString() || "0"}
                      </strong>{" "}
                      orders processed
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300 transition-colors duration-200">
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        $
                        {dashboardData.totalSales?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        }) || "0.00"}
                      </strong>{" "}
                      in total sales
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  // Fetch dashboard data
  const dashboardData = await getDashboardData();

  return (
    <MainLayout>
      {/* Dashboard Header */}
      <DashboardHeader session={session} dashboardData={dashboardData} />

      {/* Main Content */}
      <div className="p-6 bg-gray-50 dark:bg-gray-800 min-h-screen transition-colors duration-200">
        <DashboardContent initialData={dashboardData} />
      </div>
    </MainLayout>
  );
}
