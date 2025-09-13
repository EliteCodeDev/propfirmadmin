"use client";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { challengesApi } from "@/api/challenges";
import TradingChart from "@/components/metrix/TradingChart";
import AccountCard from "@/components/metrix/AccountCard";
import Objectives from "@/components/metrix/Objectives";
import Statistics from "@/components/metrix/Statistics";
import TradingHistory from "@/components/metrix/TradingHistory";
import WinLoss from "@/components/metrix/WinLoss";
import MainLayout from "@/components/layouts/MainLayout";
import type { AdminMetrixData, PositionLike, Position, RulesValidation, RulesParams } from "@/types/metrix";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

function Loading() {
  return (
    <div className="py-10 text-center text-sm text-zinc-500">
      Loading challenge data…
    </div>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="py-10 text-center">
      <div className="text-red-600 mb-3">{message}</div>
      {onRetry && (
        <button
          className="px-3 py-1.5 bg-blue-600 text-white rounded"
          onClick={onRetry}
        >
          Retry
        </button>
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
      const challenge = await challengesApi.getWithDetails(challengeId);
      const details = challenge.details || {};

      // Balance y equity
      const initialBalance = toNumberSafe(
        details.balance?.initialBalance || challenge.brokerAccount?.innitialBalance,
      );
      const currentBalance = toNumberSafe(
        details.balance?.currentBalance || challenge.dynamicBalance,
        initialBalance
      );
      const dailyBalance = toNumberSafe(details.balance?.dailyBalance, currentBalance);

      const rawEquity = details.metaStats?.equity ?? currentBalance;
      const equity = toNumberSafe(rawEquity, currentBalance);

      // Positions - transformar PositionLike a Position para compatibilidad de tipos
      const open: PositionLike[] = details.positions?.openPositions || [];
      const closed: PositionLike[] = details.positions?.closedPositions || [];

      const closedTrades: Position[] = closed.map((trade): Position => ({
        ...trade,
        OrderId: String(trade.OrderId || trade.ticket || ''),
        Symbol: trade.Symbol || trade.symbol || '',
        Type: String(trade.Type || trade.type || ''),
        Volume: Number(trade.Volume || trade.volume || 0),
        OpenPrice: Number(trade.OpenPrice || trade.openPrice || 0),
        ClosePrice: Number(trade.ClosePrice || trade.closePrice || 0),
        TimeOpen: trade.TimeOpen || trade.openTime || '',
        TimeClose: trade.TimeClose || trade.closeTime || '',
        Profit: Number(trade.Profit || trade.profit || 0),
        Commission: Number(trade.Commission || trade.commission || 0),
        Swap: Number(trade.Swap || trade.swap || 0),
        Commentary: trade.Commentary || trade.comment || ''
      }));
      const allPositions = [...open, ...closed].map((trade): any => ({
        ...trade,
        OrderId: String(trade.OrderId || trade.ticket || ''),
        Symbol: trade.Symbol || trade.symbol || '',
        Type: trade.Type !== undefined ? Number(trade.Type) : Number(trade.type ?? -1), 
        Volume: Number(trade.Volume || trade.volume || 0),
        OpenPrice: Number(trade.OpenPrice || trade.openPrice || 0),
        ClosePrice: Number(trade.ClosePrice || trade.closePrice || 0),
        TimeOpen: trade.TimeOpen || trade.openTime || '',
        TimeClose: trade.TimeClose || trade.closeTime || '',
        Profit: Number(trade.Profit || trade.profit || 0),
        Commission: Number(trade.Commission || trade.commission || 0),
        Swap: Number(trade.Swap || trade.swap || 0),
        Commentary: trade.Commentary || trade.comment || ''
      }));

      // Rules
      const refs = {
        profitTargetPercent: details.rulesParams?.profitTarget ?? 0,
        maxDrawdownPercent: details.rulesParams?.maxDrawdown ?? 0,
      };

      const metrix: AdminMetrixData = {
        initialBalance,
        currentBalance,
        equity,
        trades: closedTrades,
        refs,
      };

      return { challenge, details, metrix, allPositions, dailyBalance };
    }
  );

  if (!challengeId) return <ErrorView message="Invalid challengeId" />;
  if (error) return <ErrorView message="Failed to load challenge" onRetry={() => mutate()} />;
  if (isLoading || !data) return <MainLayout><Loading /></MainLayout>;

  const { challenge, details, metrix, allPositions, dailyBalance } = data;
  const rv = details?.rulesValidation as RulesValidation | undefined;
  const rp = details?.rulesParams as RulesParams | undefined;
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 transition-colors duration-200 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
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

          {/* Layout principal: Chart + AccountCard */}
          <div className="flex flex-col lg:flex-row lg:gap-6">
            <div className="lg:w-2/3">
              <TradingChart
                allTrades={metrix.trades}
                initialBalance={metrix.initialBalance}
                maxDrawdownReference={metrix.refs.maxDrawdownPercent}
                profitTargetReference={metrix.refs.profitTargetPercent}
              />
            </div>
            <div className="lg:w-1/3">
              <AccountCard
                challengeData={{
                  login: challenge.brokerAccount?.login || "",
                  status: challenge.status || "",
                  phase: challenge.numPhase || 0,
                  balance: {
                    initialBalance: Number(challenge.brokerAccount?.innitialBalance || 0),
                    currentBalance: Number(challenge.dynamicBalance || 0),
                    dailyBalance,
                  },
                  equity: metrix.equity,
                  startDate: new Date(challenge.startDate || new Date()),
                  lastUpdate: new Date(details?.lastUpdate || new Date()),
                  endDate: challenge.endDate ? new Date(challenge.endDate) : undefined,
                }}
                className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700"
              />
            </div>
          </div>

          {/* Objectives */}
          <Objectives
            tradingData={{
              trades: metrix.trades,
              balance: {
                dailyBalance,       
                initialBalance: metrix.initialBalance,
              },
              currentBalance: metrix.currentBalance,
              equity: metrix.equity,
              profit: metrix.equity - metrix.initialBalance,
              drawdown: Math.abs(rp?.maxDrawdown ?? 0),
              maxDrawdown: Math.abs(rp?.maxDrawdown ?? 0),
              profitTarget: rp?.profitTarget ?? 0,
            }}
            rulesParams={{
              profitTarget: rp?.profitTarget ?? 0,
              dailyDrawdown: rp?.dailyDrawdown ?? 0,
              maxDrawdown: rp?.maxDrawdown ?? 0,
              tradingDays: rp?.tradingDays ?? 0,
              lossPerTrade: rp?.lossPerTrade ?? 0,
              inactiveDays: rp?.inactiveDays ?? 0,
            }}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6"
          />

          {/* Win/Loss */}
          {details.metaStats && (
            <WinLoss
              metaStats={details.metaStats}
              closedPositions={details.positions?.closedPositions || []}
              className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700"
            />
          )}

          {/* Statistics */}
          <Statistics
            tradingData={details.positions?.closedPositions || []}
            data={{
              // Balances
              currentBalance: metrix.currentBalance,
              initialBalance: metrix.initialBalance,
              equity: metrix.equity,

              // Profit total correcto (usando equity, no currentBalance)
              totalPnl: metrix.equity - metrix.initialBalance,

              // Trades
              totalTrades: details.positions?.closedPositions?.length || 0,
              winningTrades:
                details.positions?.closedPositions?.filter(t => t.Profit > 0).length || 0,
              losingTrades:
                details.positions?.closedPositions?.filter(t => t.Profit < 0).length || 0,

              // Ratios
              winRate:
                details.positions?.closedPositions?.length
                  ? (details.positions.closedPositions.filter(t => t.Profit > 0).length /
                    details.positions.closedPositions.length) *
                  100
                  : 0,
              lossRate:
                details.positions?.closedPositions?.length
                  ? (details.positions.closedPositions.filter(t => t.Profit < 0).length /
                    details.positions.closedPositions.length) *
                  100
                  : 0,

              // Valores adicionales
              highestWin: Math.max(
                ...(details.positions?.closedPositions?.map(t => t.Profit) || [0])
              ),
              highestLoss: Math.min(
                ...(details.positions?.closedPositions?.map(t => t.Profit) || [0])
              ),
              todayPnl: details.metaStats?.todayPnl || 0,
              lots: details.metaStats?.lots || 0,

              // Fallbacks
              profitFactor: 0,
              averageWin: 0,
              averageLoss: 0,
              maxBalance: Number(details.metaStats?.maxMinBalance?.maxBalance) || metrix.equity,
              minBalance: Number(details.metaStats?.maxMinBalance?.minBalance) || metrix.equity,

              tradingDays: 0,
            }}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border dark:border-zinc-700"
          />



          {/* Trading History */}
          <TradingHistory
            trades={allPositions}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border dark:border-zinc-700"
          />
        </div>
      </div>
    </MainLayout>
  );
}
