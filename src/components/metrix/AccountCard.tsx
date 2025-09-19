"use client";

import {
  CurrencyDollarIcon,
  ChartBarIcon,
  IdentificationIcon,
  CalendarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";
// Removed useTranslations import - admin uses English only

interface AccountCardProps {
  challengeData: {
    status: string;
    phase: number;
    balance: {
      initialBalance: number;
      currentBalance: number;
      dailyBalance?: number;
    };
    equity: number;
    login: string;
    startDate: Date;
    lastUpdate: Date;
    endDate?: Date;
  };
  className?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "text-blue-600 dark:text-blue-400";
    case "PASSED":
      return "text-green-600 dark:text-green-400";
    case "FAILED":
      return "text-red-600 dark:text-red-400";
    case "COMPLETED":
      return "text-purple-600 dark:text-purple-400";
    case "CANCELLED":
      return "text-zinc-500 dark:text-zinc-400";
    default:
      return "text-zinc-500 dark:text-zinc-400";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "In Progress";
    case "PASSED":
      return "Approved";
    case "FAILED":
      return "Disapproved";
    case "COMPLETED":
      return "Withdrawable";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

export default function AccountCard({
  challengeData,
  className = "",
}: AccountCardProps) {
  const {
    balance,
    equity,
    startDate,
    lastUpdate,
    endDate,
    phase,
    status,
    login,
  } = challengeData;
  console.log("challengeData", challengeData);
  const profitLoss = equity - balance.initialBalance;
  const isProfit = profitLoss >= 0;
  // Removed useTranslations - admin uses English only

  // Use dailyBalance if available, otherwise fallback to currentBalance
  const currentBalanceToShow = balance.dailyBalance ?? balance.currentBalance;

  const DataItem = ({
    icon,
    label,
    value,
    valueClass = "text-zinc-900 dark:text-white",
    iconClass = "text-zinc-400",
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    valueClass?: string;
    iconClass?: string;
  }) => {
    const Icon = icon;
    return (
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center space-x-2">
          <Icon className={`h-4 w-4 ${iconClass}`} />
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {label}
          </span>
        </div>
        <div className="flex-1 mx-3 border-b border-dotted border-zinc-300 dark:border-zinc-600"></div>
        <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center space-x-2 pb-1 ">
        <IdentificationIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Account
          <span className="text-zinc-500 dark:text-zinc-400 text-sm font-normal ml-2">
            #{login}
          </span>
        </h2>
      </div>

      <div className={className}>
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {/* Content - Single Column */}
          <div className="px-6">
            <div className="grid grid-cols-1">
              <DataItem
                icon={ChartBarIcon}
                label="Phase"
                value={`Phase ${phase}`}
                valueClass="text-purple-600 dark:text-purple-400"
                iconClass="text-purple-500 dark:text-purple-400"
              />

              <DataItem
                icon={ClockIcon}
                label="Status"
                value={getStatusText(status)}
                valueClass={getStatusColor(status)}
                iconClass={getStatusColor(status)}
              />

              <DataItem
                icon={BanknotesIcon}
                label="Account Size"
                value={formatCurrency(balance.initialBalance)}
                iconClass="text-emerald-500 dark:text-emerald-400"
              />

              <DataItem
                icon={CurrencyDollarIcon}
                label="Balance"
                value={formatCurrency(balance.currentBalance)}
                iconClass="text-blue-500 dark:text-blue-400"
              />

              <DataItem
                icon={PresentationChartLineIcon}
                label="Equity"
                value={formatCurrency(equity)}
                iconClass="text-indigo-500 dark:text-indigo-400"
              />

              <DataItem
                icon={ArrowTrendingUpIcon}
                label="Total P&L"
                value={`${isProfit ? "+" : ""}${formatCurrency(profitLoss)}`}
                valueClass={
                  isProfit
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }
                iconClass={
                  isProfit
                    ? "text-green-500 dark:text-green-400"
                    : "text-red-500 dark:text-red-400"
                }
              />

              <DataItem
                icon={CalendarIcon}
                label="Start Date"
                value={formatDate(startDate)}
                iconClass="text-orange-500 dark:text-orange-400"
              />

              <DataItem
                icon={ClockIcon}
                label="Last Update"
                value={formatDate(lastUpdate)}
                iconClass="text-amber-500 dark:text-amber-400"
              />

              <DataItem
                icon={CalendarIcon}
                label="End Date"
                value={endDate ? formatDate(endDate) : "Ongoing"}
                iconClass="text-rose-500 dark:text-rose-400"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
