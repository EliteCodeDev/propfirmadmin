"use client";

import React, { useEffect, useState, useMemo } from "react";
import { challengeTemplatesApi } from "@/api/challenge-templates";
import {
  ChallengeCategory,
  ChallengePlan,
  ChallengeBalance,
  ChallengeRelation,
  ChallengeStage,
  RelationStage,
} from "@/types";
import { useArrayValidation } from "@/hooks/useArrayValidation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, RefreshCw, CheckCircle, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

import type { TemplateVisualizerProps } from "@/types";

export function TemplateVisualizer({}: TemplateVisualizerProps) {
  // Estado de datos
  const [categories, setCategories] = useState<ChallengeCategory[]>([]);
  const [plans, setPlans] = useState<ChallengePlan[]>([]);
  const [balances, setBalances] = useState<ChallengeBalance[]>([]);
  const [relations, setRelations] = useState<ChallengeRelation[]>([]);
  const [stages, setStages] = useState<ChallengeStage[]>([]);
  const [relationStages, setRelationStages] = useState<RelationStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de selección
  const [selectedPlan, setSelectedPlan] = useState<ChallengePlan | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<ChallengeCategory | null>(null);
  const [selectedBalance, setSelectedBalance] =
    useState<ChallengeBalance | null>(null);
  // Eliminado selectedRelation: usamos currentRelation directamente-+

  // Cargar todos los datos
  const loadAllData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const [
        categoriesData,
        plansData,
        balancesData,
        relationsData,
        stagesData,
        relationStagesData,
      ] = await Promise.all([
        challengeTemplatesApi.listCategories(),
        challengeTemplatesApi.listPlans(),
        challengeTemplatesApi.listBalances(),
        challengeTemplatesApi.listRelations(),
        challengeTemplatesApi.listStages(),
        challengeTemplatesApi.listRelationStages(),
      ]);

      setCategories(categoriesData);
      setPlans(plansData);
      setBalances(balancesData);
      setRelations(relationsData);
      setStages(stagesData);
      setRelationStages(relationStagesData);
    } catch (error: unknown) {
      console.error("Error al cargar datos:", error);
      setError(error instanceof Error ? error.message : "Error desconocido");
      toast.error("Error al cargar datos del visualizador");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Validaciones de arrays
  const categoriesValidation = useArrayValidation(categories);
  const relationsValidation = useArrayValidation(relations);
  const plansValidation = useArrayValidation(plans);
  const balancesValidation = useArrayValidation(balances);
  const stagesValidation = useArrayValidation(stages);
  const relationStagesValidation = useArrayValidation(relationStages);

  // Buscar relación basada en selecciones
  const currentRelation = useMemo(() => {
    if (!selectedPlan || !selectedCategory) return null;

    return relationsValidation.safeFind(
      (rel) =>
        rel?.planID === selectedPlan.planID &&
        rel?.categoryID === selectedCategory.categoryID
    );
  }, [selectedPlan, selectedCategory, relationsValidation]);

  // Obtener balances disponibles para la relación actual
  const availableBalances = useMemo(() => {
    if (!currentRelation?.balances) return [];

    return currentRelation.balances
      .map((rb) => {
        const balance = balancesValidation.safeFind(
          (b) => b?.balanceID === rb.balanceID
        );
        return {
          relationBalance: rb,
          balance,
        };
      })
      .filter((item) => item.balance);
  }, [currentRelation, balancesValidation]);

  // Obtener stages para la relación actual
  const relationStagesData = useMemo(() => {
    if (!currentRelation) return [];

    const relStages = relationStagesValidation.safeFilter(
      (rs) => rs?.relationID === currentRelation.relationID
    );

    return relStages
      .map((rs) => {
        const stage = stagesValidation.safeFind(
          (s) => s?.stageID === rs?.stageID
        );
        return {
          relationStage: rs,
          stage,
        };
      })
      .filter((stageObj) => stageObj.stage)
      .sort(
        (a, b) =>
          (a.relationStage?.numPhase || 0) - (b.relationStage?.numPhase || 0)
      );
  }, [currentRelation, relationStagesValidation, stagesValidation]);

  // Actualizar relación seleccionada cuando cambie la relación actual
  // Eliminado: ya no mantenemos selectedRelation en estado

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="text-red-500 text-lg mb-3">
            Error al cargar los datos
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button
            onClick={loadAllData}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-blue-100/20 to-indigo-100/20 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-10 w-24 h-24 bg-gradient-to-tr from-gray-100/30 to-blue-50/30 dark:from-gray-800/20 dark:to-blue-900/10 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-gradient-to-bl from-indigo-50/40 to-gray-50/40 dark:from-indigo-900/10 dark:to-gray-800/10 rounded-full blur-xl" />
      </div>

      <div className="relative z-10 p-6 space-y-8">
        {/* Compact Top Section */}
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-3xl p-8 space-y-6">
          {/* Top Row - Plans, Categories, and Balances */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Challenge Plans */}
            <div className="space-y-4">
              <h2 className="text-white text-lg font-semibold text-center">
                Challenge Plans
              </h2>
              <div className="flex gap-2 flex-wrap justify-center">
                {plansValidation.safeMap((plan, index) => (
                  <button
                    key={`plan-${plan?.planID ?? "unknown"}-${index}`}
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium transition-all duration-200 border-2 text-sm",
                      selectedPlan?.planID === plan?.planID
                        ? "bg-white text-indigo-900 border-white shadow-lg"
                        : "bg-transparent text-white border-white/30 hover:border-white/60 hover:bg-white/10"
                    )}
                  >
                    {plan?.name || "Sin nombre"}
                  </button>
                ))}
              </div>
            </div>

            {/* Challenge Category */}
            <div className="space-y-4">
              <h2 className="text-white text-lg font-semibold text-center">
                Challenge Category
              </h2>
              <div className="flex gap-2 flex-wrap justify-center">
                {categoriesValidation.safeMap((category, index) => (
                  <button
                    key={`category-${
                      category?.categoryID ?? "unknown"
                    }-${index}`}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium transition-all duration-200 border-2 text-sm",
                      selectedCategory?.categoryID === category?.categoryID
                        ? "bg-blue-500 text-white border-blue-500 shadow-lg"
                        : "bg-transparent text-white border-white/30 hover:border-white/60 hover:bg-white/10"
                    )}
                  >
                    {category?.name || "Sin nombre"}
                  </button>
                ))}
              </div>
            </div>

            {/* RelationBalances */}
            <div className="space-y-4">
              <h2 className="text-white text-lg font-semibold text-center">
                Balances
              </h2>
              <div className="flex gap-2 flex-wrap justify-center">
                {availableBalances.map((balanceDetail, index) => {
                  const isSelected =
                    selectedBalance?.balanceID ===
                    balanceDetail.balance?.balanceID;
                  // Show balance label (e.g., "200k") instead of price
                  const balanceLabel =
                    balanceDetail.balance?.name ||
                    (typeof balanceDetail.balance?.balance === "number"
                      ? balanceDetail.balance.balance.toLocaleString()
                      : "Sin balance");

                  return (
                    <button
                      key={`balance-${currentRelation?.relationID ?? "rel"}-${
                        balanceDetail.balance?.balanceID ?? "unknown"
                      }-${index}`}
                      onClick={() =>
                        setSelectedBalance(balanceDetail.balance || null)
                      }
                      className={cn(
                        "px-3 py-2 rounded-lg font-medium transition-all duration-200 border-2 text-sm",
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                          : "bg-transparent text-white border-white/30 hover:border-white/60 hover:bg-white/10"
                      )}
                    >
                      {balanceLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RelationStages Section */}
          {relationStagesData.length > 0 && (
            <div className="bg-blue-600 rounded-2xl p-6 space-y-6">
              <h2 className="text-white text-lg font-semibold text-center">
                Stages
              </h2>

              {/* Stages Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {relationStagesData.slice(0, 2).map((stageData, index) => (
                  <div
                    key={`relation-stage-${
                      stageData.relationStage?.relationStageID ?? "unknown"
                    }-${index}`}
                    className="text-center"
                  >
                    <h3 className="text-white text-2xl font-bold mb-2">
                      {stageData.stage?.name || "Sin nombre"}
                    </h3>
                    <p className="text-blue-200 text-sm">
                      (
                      {stageData.relationStage?.numPhase
                        ? `Phase ${stageData.relationStage.numPhase}`
                        : "No phase"}
                      )
                    </p>
                  </div>
                ))}
              </div>

              {/* Reward Cycles */}
              <div className="space-y-4">
                <h4 className="text-white text-center text-lg font-semibold">
                  Reward Cycles
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Tuesday 60%", checked: true },
                    { label: "Bi-weekly 80%", checked: true },
                    { label: "On Demand 90%", checked: true },
                    { label: "Monthly 100%", checked: true },
                  ].map((cycle, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-white"
                    >
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm">{cycle.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Balance Details */}
        {selectedBalance && (
          <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Balance Details: {selectedBalance.name}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {availableBalances
                .filter(
                  (bd) => bd.balance?.balanceID === selectedBalance.balanceID
                )
                .map((balanceDetail, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                          Price:
                        </span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          $
                          {balanceDetail.relationBalance?.price?.toLocaleString() ||
                            "0"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                          Status:
                        </span>
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2",
                            balanceDetail.relationBalance?.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-white"
                          )}
                        >
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              balanceDetail.relationBalance?.isActive
                                ? "bg-green-500"
                                : "bg-red-500"
                            )}
                          />
                          {balanceDetail.relationBalance?.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {balanceDetail.relationBalance?.hasDiscount && (
                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">
                            Discount:
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {balanceDetail.relationBalance?.discount || "N/A"}
                          </span>
                        </div>
                      )}
                      {balanceDetail.relationBalance?.wooID && (
                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">
                            WooCommerce ID:
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {balanceDetail.relationBalance.wooID}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
