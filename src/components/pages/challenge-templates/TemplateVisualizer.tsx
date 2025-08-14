"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  challengeTemplatesApi,
  type ChallengeCategory,
  type ChallengePlan,
  type ChallengeBalance,
  type RelationBalance,
  type ChallengeRelation,
  type ChallengeStage,
  type RelationStage,
} from "@/api/challenge-templates";
import { useArrayValidation } from "@/hooks/useArrayValidation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateVisualizerProps {
  pageSize?: number;
}

// Tipos locales para organizar los datos y evitar 'any' implícitos
type OrganizedBalance = {
  relationBalance: RelationBalance;
  balance: ChallengeBalance;
};

// Algunos endpoints devuelven isActive en stages aunque no esté en la interfaz base
type ChallengeStageExtended = ChallengeStage & { isActive?: boolean };

type OrganizedStage = {
  relationStage: RelationStage;
  stage: ChallengeStageExtended;
};

type OrganizedCategory = {
  categoryID: string;
  category: ChallengeCategory | null;
  balances: OrganizedBalance[];
  stages: OrganizedStage[];
};

type OrganizedPlan = {
  plan: ChallengePlan;
  categories: OrganizedCategory[];
};

// Función para formatear la fecha en dd/mm/aaaa
// function formatDate(dateString?: string) {
//   if (!dateString) return "—";
//   const date = new Date(dateString);
//   const day = String(date.getDate()).padStart(2, "0");
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const year = date.getFullYear();
//   return `${day}/${month}/${year}`;
// }

// // Función para formatear valores porcentuales
// function formatPercentage(value?: number | null) {
//   if (value === null || value === undefined) {
//     return "—";
//   }
//   return `${value}%`;
// }

export function TemplateVisualizer({}: TemplateVisualizerProps) {
  // Estado de datos
  const [categories, setCategories] = useState<ChallengeCategory[]>([]);
  const [plans, setPlans] = useState<ChallengePlan[]>([]);
  const [balances, setBalances] = useState<ChallengeBalance[]>([]);
  const [relationBalances, setRelationBalances] = useState<RelationBalance[]>(
    []
  );
  const [relations, setRelations] = useState<ChallengeRelation[]>([]);
  const [stages, setStages] = useState<ChallengeStage[]>([]);
  const [relationStages, setRelationStages] = useState<RelationStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de selección
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number | null>(
    null
  );
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<
    number | null
  >(null);

  // Cargar todos los datos
  const loadAllData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const [
        categoriesData,
        plansData,
        balancesData,
        relationBalancesData,
        relationsData,
        stagesData,
        relationStagesData,
      ] = await Promise.all([
        challengeTemplatesApi.listCategories(),
        challengeTemplatesApi.listPlans(),
        challengeTemplatesApi.listBalances(),
        challengeTemplatesApi.listRelationBalances(),
        challengeTemplatesApi.listRelations(),
        challengeTemplatesApi.listStages(),
        challengeTemplatesApi.listRelationStages(),
      ]);

      setCategories(categoriesData);
      setPlans(plansData);
      setBalances(balancesData);
      setRelationBalances(relationBalancesData);
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
  const relationBalancesValidation = useArrayValidation(relationBalances);
  const stagesValidation = useArrayValidation(stages);
  const relationStagesValidation = useArrayValidation(relationStages);

  // Organizar datos en la nueva estructura: Plan -> Categoría -> Balances y Fases
  const organizedData: OrganizedPlan[] = useMemo(() => {
    return plansValidation
      .safeMap((plan) => {
        // Obtener todas las relaciones para este plan
        const planRelations = relationsValidation.safeFilter(
          (rel) => rel?.planID === plan?.planID
        );

        // Agrupar por categoría
        const categoriesMap = new Map<
          string,
          {
            category: ChallengeCategory | null;
            balances: OrganizedBalance[];
            stages: OrganizedStage[];
          }
        >();

        planRelations.forEach((relation) => {
          const categoryID = relation?.categoryID || "no-category";
          const category =
            categoryID !== "no-category"
              ? categoriesValidation.safeFind(
                  (c) => c?.categoryID === categoryID
                ) ?? null
              : null;

          if (!categoriesMap.has(categoryID)) {
            categoriesMap.set(categoryID, {
              category,
              balances: [],
              stages: [],
            });
          }

          const categoryData = categoriesMap.get(categoryID)!;

          // Obtener balances para esta relación
          const relationBalancesForRelation =
            relationBalancesValidation.safeFilter(
              (rb) => rb?.relationID === relation?.relationID
            );

          relationBalancesForRelation.forEach((relBalance) => {
            const balance = balancesValidation.safeFind(
              (b) => b?.balanceID === relBalance?.balanceID
            );
            if (balance) {
              categoryData.balances.push({
                relationBalance: relBalance as RelationBalance,
                balance: balance as ChallengeBalance,
              });
            }
          });

          // Obtener stages para esta relación
          const relationStagesForRelation = relationStagesValidation.safeFilter(
            (rs) => rs?.relationID === relation?.relationID
          );

          relationStagesForRelation.forEach((relStage) => {
            const stage = stagesValidation.safeFind(
              (s) => s?.stageID === relStage?.stageID
            );
            if (stage) {
              categoryData.stages.push({
                relationStage: relStage as RelationStage,
                stage: stage as ChallengeStageExtended,
              });
            }
          });
        });

        // Convertir el Map a array y ordenar stages por fase
        const categoriesArray: OrganizedCategory[] = Array.from(
          categoriesMap.entries()
        ).map(([categoryID, data]) => ({
          categoryID,
          category: data.category,
          balances: data.balances,
          stages: [...data.stages].sort(
            (a, b) =>
              (a.relationStage?.numPhase || 0) -
              (b.relationStage?.numPhase || 0)
          ),
        }));

        return {
          plan: plan as ChallengePlan,
          categories: categoriesArray,
        };
      })
      .filter((planObj) => planObj.categories.length > 0);
  }, [
    balancesValidation,
    categoriesValidation,
    plansValidation,
    relationBalancesValidation,
    relationStagesValidation,
    relationsValidation,
    stagesValidation,
  ]);

  // Seleccionar el primer plan por defecto cuando los datos estén listos
  useEffect(() => {
    if (organizedData.length > 0 && selectedPlanIndex === null) {
      setSelectedPlanIndex(0);
    }
  }, [organizedData, selectedPlanIndex]);

  // Reset categoría cuando cambie el plan
  useEffect(() => {
    setSelectedCategoryIndex(null);
  }, [selectedPlanIndex]);

  // Obtener el plan seleccionado
  const selectedPlan =
    selectedPlanIndex !== null && organizedData.length > selectedPlanIndex
      ? organizedData[selectedPlanIndex]
      : null;

  // Obtener categorías del plan seleccionado
  const categoryOptions = selectedPlan?.categories || [];

  // Obtener la categoría seleccionada
  const selectedCategory =
    selectedCategoryIndex !== null &&
    categoryOptions.length > selectedCategoryIndex
      ? categoryOptions[selectedCategoryIndex]
      : null;

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100">
        <div className="flex items-center justify-center h-32">
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin h-10 w-10 text-blue-500 mb-3" />
            <p className="text-blue-500">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100">
        <div className="flex items-center justify-center h-32">
          <div className="flex flex-col items-center">
            <div className="text-red-500 text-lg mb-3">
              Error al cargar los datos
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button
              onClick={loadAllData}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100">
      <div className="max-w-7xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 border-b-2 border-blue-500 pb-2 w-fit mx-auto">
          Plan → Categoría → Balances & Etapas
        </h2>

        {/* 1) PLANES */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {organizedData.length === 0 ? (
            <span className="text-gray-500 dark:text-gray-400">
              No hay Planes
            </span>
          ) : (
            organizedData
              .map((planObj, index) => {
                // Validar que planObj y plan existen
                if (!planObj || !planObj.plan) {
                  return null;
                }

                return (
                  <button
                    key={planObj.plan.planID || index}
                    onClick={() => setSelectedPlanIndex(index)}
                    className={cn(
                      "px-4 py-2 rounded-lg transition shadow-sm",
                      selectedPlanIndex === index
                        ? "bg-blue-500 text-white"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    {planObj.plan.name || "Sin nombre"} (
                    {planObj.categories?.length || 0})
                  </button>
                );
              })
              .filter(Boolean)
          )}
        </div>

        {/* 2) CATEGORÍAS */}
        {selectedPlan && (
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {categoryOptions.length === 0 ? (
              <span className="text-gray-500 dark:text-gray-400">
                No hay Categorías para este Plan
              </span>
            ) : (
              categoryOptions
                .map((categoryObj, index) => {
                  // Validar que categoryObj existe
                  if (!categoryObj) {
                    return null;
                  }

                  const categoryName =
                    categoryObj.category?.name || "Sin categoría";
                  const totalItems =
                    (categoryObj.balances?.length || 0) +
                    (categoryObj.stages?.length || 0);

                  return (
                    <button
                      key={categoryObj.categoryID || index}
                      onClick={() => setSelectedCategoryIndex(index)}
                      className={cn(
                        "px-4 py-2 rounded-lg transition shadow-sm",
                        selectedCategoryIndex === index
                          ? "bg-green-500 text-white"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      {categoryName} ({totalItems})
                    </button>
                  );
                })
                .filter(Boolean)
            )}
          </div>
        )}

        {/* 3) BALANCES Y ETAPAS */}
        {selectedCategory && (
          <div className="space-y-6">
            {/* BALANCES */}
            {selectedCategory.balances &&
              selectedCategory.balances.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 text-center">
                    Balances Disponibles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedCategory.balances.map((balanceObj, index) => {
                      if (!balanceObj || !balanceObj.balance) {
                        return null;
                      }

                      return (
                        <Card
                          key={
                            balanceObj.relationBalance?.relationBalanceID ||
                            index
                          }
                          className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                        >
                          <CardHeader>
                            <CardTitle className="text-green-500 dark:text-green-400 text-lg">
                              {balanceObj.balance.name || "Sin nombre"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-green-500/90 dark:text-green-300">
                                  Balance:
                                </span>
                                $
                                {balanceObj.balance.balance?.toLocaleString() ||
                                  0}
                              </div>
                              <div>
                                <span className="font-medium text-green-500/90 dark:text-green-300">
                                  Precio:
                                </span>
                                $
                                {balanceObj.relationBalance?.price?.toLocaleString() ||
                                  0}
                              </div>
                              {balanceObj.relationBalance?.hasDiscount && (
                                <div>
                                  <span className="font-medium text-green-500/90 dark:text-green-300">
                                    Descuento:
                                  </span>
                                  {balanceObj.relationBalance.discount || 0}%
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-green-500/90 dark:text-green-300">
                                  Estado:
                                </span>
                                <span
                                  className={cn(
                                    "px-2 py-1 rounded text-xs",
                                    balanceObj.relationBalance?.isActive
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  )}
                                >
                                  {balanceObj.relationBalance?.isActive
                                    ? "Activo"
                                    : "Inactivo"}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* ETAPAS */}
            {selectedCategory.stages && selectedCategory.stages.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 text-center">
                  Etapas Configuradas
                </h3>
                {selectedCategory.stages.length === 1 ? (
                  // Una sola etapa - tarjeta centrada
                  <div className="flex justify-center">
                    <Card className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 w-full max-w-md">
                      <CardHeader>
                        <CardTitle className="text-purple-500 dark:text-purple-400">
                          Etapa{" "}
                          {selectedCategory.stages[0].relationStage?.numPhase ||
                            1}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-purple-500/90 dark:text-purple-300">
                              Nombre:
                            </span>{" "}
                            {selectedCategory.stages[0].stage?.name ||
                              "Sin nombre"}
                          </div>
                          <div>
                            <span className="font-medium text-purple-500/90 dark:text-purple-300">
                              Fase:
                            </span>{" "}
                            {selectedCategory.stages[0].relationStage
                              ?.numPhase || 0}
                          </div>
                          <div>
                            <span className="font-medium text-purple-500/90 dark:text-purple-300">
                              Estado:
                            </span>{" "}
                            <span
                              className={cn(
                                "px-2 py-1 rounded text-xs",
                                selectedCategory.stages[0].stage?.isActive
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              )}
                            >
                              {selectedCategory.stages[0].stage?.isActive
                                ? "Activo"
                                : "Inactivo"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : selectedCategory.stages.length === 2 ? (
                  // Dos etapas - lado a lado
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedCategory.stages.map((stageObj, index) => {
                      if (!stageObj || !stageObj.stage) {
                        return null;
                      }

                      return (
                        <Card
                          key={stageObj.relationStage?.relationStageID || index}
                          className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                        >
                          <CardHeader>
                            <CardTitle className="text-purple-500 dark:text-purple-400">
                              Etapa{" "}
                              {stageObj.relationStage?.numPhase || index + 1}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-purple-500/90 dark:text-purple-300">
                                  Nombre:
                                </span>{" "}
                                {stageObj.stage.name || "Sin nombre"}
                              </div>
                              <div>
                                <span className="font-medium text-purple-500/90 dark:text-purple-300">
                                  Fase:
                                </span>{" "}
                                {stageObj.relationStage?.numPhase || 0}
                              </div>
                              <div>
                                <span className="font-medium text-purple-500/90 dark:text-purple-300">
                                  Estado:
                                </span>{" "}
                                <span
                                  className={cn(
                                    "px-2 py-1 rounded text-xs",
                                    stageObj.stage.isActive
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  )}
                                >
                                  {stageObj.stage.isActive
                                    ? "Activo"
                                    : "Inactivo"}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  // Más de dos etapas - grid responsivo
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedCategory.stages.map((stageObj, index) => {
                      if (!stageObj || !stageObj.stage) {
                        return null;
                      }

                      return (
                        <Card
                          key={stageObj.relationStage?.relationStageID || index}
                          className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                        >
                          <CardHeader>
                            <CardTitle className="text-purple-500 dark:text-purple-400">
                              Etapa{" "}
                              {stageObj.relationStage?.numPhase || index + 1}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-purple-500/90 dark:text-purple-300">
                                  Nombre:
                                </span>{" "}
                                {stageObj.stage.name || "Sin nombre"}
                              </div>
                              <div>
                                <span className="font-medium text-purple-500/90 dark:text-purple-300">
                                  Fase:
                                </span>{" "}
                                {stageObj.relationStage?.numPhase || 0}
                              </div>
                              <div>
                                <span className="font-medium text-purple-500/90 dark:text-purple-300">
                                  Estado:
                                </span>{" "}
                                <span
                                  className={cn(
                                    "px-2 py-1 rounded text-xs",
                                    stageObj.stage.isActive
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  )}
                                >
                                  {stageObj.stage.isActive
                                    ? "Activo"
                                    : "Inactivo"}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
