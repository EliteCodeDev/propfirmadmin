// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MainLayout from "@/components/layouts/MainLayout";
import { StatCard } from "./_components/StatCard";
import { SectionCard } from "./_components/SectionCard";
import PerformanceAnalytics from "./_components/PerformanceAnalytics";
import { BanknotesIcon, ChartBarIcon, UserGroupIcon } from "@heroicons/react/24/outline";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <MainLayout>
      <div className="relative w-full h-full p-6">
        {/* subtle decorative gradients */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 rounded-full blur-3xl" />
          <div className="absolute bottom-40 left-10 w-24 h-24 bg-gradient-to-tr from-gray-100/40 to-blue-50/40 rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-gradient-to-bl from-indigo-50/50 to-gray-50/50 rounded-full blur-xl" />
        </div>

        <div className="flex flex-col space-y-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <div className="xl:col-span-2 lg:col-span-1"><StatCard size="sm" label="Total Users" value="140" variant="indigo" delay={0} icon={<UserGroupIcon className="h-6 w-6 text-indigo-600" />} /></div>
            <div className="xl:col-span-2 lg:col-span-1"><StatCard size="sm" label="Total Orders" value="122" variant="blue" delay={100} icon={<ChartBarIcon className="h-6 w-6 text-blue-600" />} /></div>
            <div className="xl:col-span-2 lg:col-span-1"><StatCard size="sm" label="Total Sales" value="$5909.18" variant="emerald" delay={200} icon={<BanknotesIcon className="h-6 w-6 text-emerald-600" />} /></div>

            <div className="xl:col-span-2 lg:col-span-1"><StatCard size="sm" label="Monthly Users" value="2" variant="gray" delay={300} delta="92.59%" deltaColor="red" deltaDirection="down" icon={<UserGroupIcon className="h-6 w-6 text-indigo-600" />} /></div>
            <div className="xl:col-span-2 lg:col-span-1"><StatCard size="sm" label="Monthly Orders" value="5" variant="gray" delay={400} delta="88.37%" deltaColor="red" deltaDirection="down" icon={<ChartBarIcon className="h-6 w-6 text-indigo-600" />} /></div>
            <div className="xl:col-span-2 lg:col-span-1"><StatCard size="sm" label="Monthly Sales" value="$0" variant="gray" delay={500} delta="0%" deltaColor="red" deltaDirection="down" icon={<BanknotesIcon className="h-6 w-6 text-indigo-600" />} /></div>
          </div>

          {/* Bottom row - financial metrics (wider) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="xl:col-span-1"><StatCard size="sm" label="Withdrawable Profits" value="$16065" variant="emerald" delay={600} icon={<BanknotesIcon className="h-6 w-6 text-emerald-600" />} /></div>
            <div className="xl:col-span-1"><StatCard size="sm" label="Payouts" value="$68520" variant="indigo" delay={700} icon={<BanknotesIcon className="h-6 w-6 text-indigo-600" />} /></div>
          </div>

          {/* Two big sections */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="xl:col-span-2">
              <PerformanceAnalytics />
            </div>

            <div className="xl:col-span-2">
              <SectionCard>
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl"><ChartBarIcon className="h-6 w-6 text-indigo-600" /></div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Best Selling Plans this Month</h3>
                    <p className="text-gray-600 dark:text-gray-400">Track your top performing plans and revenue</p>
                  </div>
                </div>
                {/* Table placeholder */}
                <div className="bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-800/40 dark:to-gray-900/30 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="p-8 text-gray-400">Table placeholder</div>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
