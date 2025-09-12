"use client";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { challengesApi } from "@/api/challenges";
import TradingChart from "@/components/metrix/TradingChart";
import AccountCard from "@/components/metrix/AccountCard";
import Objectives from "@/components/metrix/Objectives";
import Statistics from "@/components/metrix/Statistics";
import TradingHistory from "@/components/metrix/TradingHistory";
import MainLayout from "@/components/layouts/MainLayout";
import type { AdminMetrixData, PositionLike } from "@/types/metrix";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

function Loading() {
  return (
    <div className="py-10 text-center text-sm text-zinc-500">Loading challenge data…</div>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="py-10 text-center">
      <div className="text-red-600 mb-3">{message}</div>
      {onRetry && (
        <button className="px-3 py-1.5 bg-blue-600 text-white rounded" onClick={onRetry}>Retry</button>
      )}
    </div>
  );
}

function toNumberSafe(v: unknown, fallback = 0): number {
  if (v == null) return fallback;
  const n = Number((v as any).toString?.().replace?.(/[^0-9.-]/g, "") ?? v);
  return Number.isFinite(n) ? n : fallback;
}

export default function AdminChallengeMetrixPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = (params?.challengeId as string) || "";

  const { data, error, mutate, isLoading } = useSWR(
    challengeId ? ["admin-challenge-with-details", challengeId] : null,
    async () => {
      const raw = await challengesApi.getWithDetails(challengeId);
      const details = (raw as any).details || {};

      const initialBalance = toNumberSafe(details.balance?.initialBalance, 0);
      const currentBalance = toNumberSafe(details.balance?.currentBalance, initialBalance);

      // Equity may come malformed (strings with extra dots)
      const rawEquity = details.metaStats?.equity ?? currentBalance;
      const equity = toNumberSafe(rawEquity, currentBalance);

      const open: PositionLike[] = details.positions?.openPositions || [];
      const closed: PositionLike[] = details.positions?.closedPositions || [];
      const trades: PositionLike[] = [...open, ...closed];

      const refs = {
        profitTargetPercent: (details.rulesParams?.profitTarget as number) ?? 0,
        maxDrawdownPercent: (details.rulesParams?.maxDrawdown as number) ?? 0,
      };

      const metrix: AdminMetrixData = {
        initialBalance,
        currentBalance,
        equity,
        trades,
        refs,
      };

      return { metrix, raw, details } as any;
    }
  );

  const content = (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header compacto */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200"
              onClick={() => router.back()}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Challenges
            </button>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">Challenge ID</div>
              <div className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-center">
                {challengeId}
              </div>
            </div>
          </div>
        </div>

        {/* Carga y errores */}
        {!challengeId && <ErrorView message="Invalid challengeId" />}
        {error && (
          <ErrorView message="Failed to load challenge" onRetry={() => mutate()} />
        )}
  {(isLoading || !data) && <Loading />}

        {/* Card con la gráfica */}
        {data && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Account Balance</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Balance progression, profit target and drawdown reference</p>
            </div>
            <div className="p-4">
              <TradingChart data={data.metrix} />
            </div>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 order-2 lg:order-1">
              <AccountCard
                challengeData={{
                  login: (data.raw as any)?.brokerAccount?.login || "",
                  status: (data.raw as any)?.status || "",
                  phase: (data.raw as any)?.numPhase || 0,
                  balance: { initialBalance: data.metrix.initialBalance, currentBalance: data.metrix.currentBalance },
                  equity: data.metrix.equity,
                  startDate: new Date((data.raw as any)?.startDate || new Date()),
                  lastUpdate: new Date((data.details as any)?.lastUpdate || new Date()),
                  endDate: (data.raw as any)?.endDate ? new Date((data.raw as any)?.endDate) : undefined,
                }}
                className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700"
              />
            </div>

            <div className="lg:col-span-2 order-1 lg:order-2">
              {(() => {
                const d: any = data.details || {};
                const rulesParams = d.rulesParams || d.riskValidation || {};
                const rulesValidation = d.rulesValidation || d.rulesEvaluation || {};
                const dailyBalance = Number(d?.balance?.dailyBalance) || data.metrix.currentBalance;
                const maxDd = Math.abs(rulesValidation?.maxDrawdown?.drawdown || 0);
                return (
                  <Objectives
                    tradingData={{
                      initialBalance: data.metrix.initialBalance,
                      currentBalance: data.metrix.currentBalance,
                      dailyBalance,
                      equity: data.metrix.equity,
                      profit: data.metrix.equity - data.metrix.initialBalance,
                      drawdown: maxDd,
                      maxDrawdown: maxDd,
                    }}
                    rulesParams={rulesParams}
                    rulesValidation={rulesValidation}
                    className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6"
                  />
                );
              })()}
            </div>
          </div>
        )}

        {data && (
          <Statistics
            tradingData={data.metrix.trades}
            data={{
              currentBalance: data.metrix.currentBalance,
              initialBalance: data.metrix.initialBalance,
              equity: data.metrix.equity,
              totalPnl: data.metrix.currentBalance - data.metrix.initialBalance,
              totalTrades: (data.details as any)?.metaStats?.averageMetrics?.totalTrades || (data.details as any)?.metaStats?.numTrades || 0,
              winningTrades: (data.details as any)?.metaStats?.averageMetrics?.winningTrades || 0,
              losingTrades: (data.details as any)?.metaStats?.averageMetrics?.losingTrades || 0,
              winRate: (data.details as any)?.metaStats?.averageMetrics?.winRate || 0,
              lossRate: (data.details as any)?.metaStats?.averageMetrics?.lossRate || 0,
              profitFactor: (data.details as any)?.metaStats?.averageMetrics?.profitFactor || 0,
              averageWin: (data.details as any)?.metaStats?.averageMetrics?.averageProfit || 0,
              averageLoss: (data.details as any)?.metaStats?.averageMetrics?.averageLoss || 0,
              highestWin: (data.details as any)?.metaStats?.averageMetrics?.highestWin || 0,
              highestLoss: (data.details as any)?.metaStats?.averageMetrics?.highestLoss || 0,
              maxBalance: (() => {
                const raw = (data.details as any)?.metaStats?.maxMinBalance?.maxBalance || 0;
                const clean = Number(String(raw).replace(/[^0-9.-]/g, ""));
                return Number.isFinite(clean) ? clean : data.metrix.currentBalance;
              })(),
              minBalance: Number((data.details as any)?.metaStats?.maxMinBalance?.minBalance || data.metrix.currentBalance),
              maxDrawdown: Math.abs((data.details as any)?.rulesValidation?.maxDrawdown?.drawdown || 0),
              maxDrawdownPercent: Math.abs((data.details as any)?.rulesValidation?.maxDrawdown?.drawdownPercent || 0),
              tradingDays: Number((data.details as any)?.rulesValidation?.tradingDays?.numDays || 0),
              todayPnl: Number((data.details as any)?.metaStats?.todayPnl || 0),
              lots: Number((data.details as any)?.metaStats?.lots || 0),
              averageRRR: Number((data.details as any)?.metaStats?.averageMetrics?.averageRRR || 0),
              expectancy: Number((data.details as any)?.metaStats?.averageMetrics?.expectancy || 0),
              avgHoldTime: Number((data.details as any)?.metaStats?.averageMetrics?.avgHoldTime || 0),
              profitLossRatio: Number((data.details as any)?.metaStats?.averageMetrics?.profitLossRatio || 0),
            }}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border dark:border-zinc-700"
          />
        )}

        {data && (
          <TradingHistory trades={data.metrix.trades} className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border dark:border-zinc-700" />
        )}
      </div>
    </div>
  );

  return <MainLayout>{content}</MainLayout>;
}
