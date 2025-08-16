"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  challengeTemplatesApi,
  type ChallengeCategory,
  type ChallengePlan,
  type ChallengeBalance,
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
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<
    number | null
  >(null);
  const [selectedRelationIndex, setSelectedRelationIndex] = useState<
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

  // Organizar datos en la estructura solicitada
  const organizedData = useMemo(() => {
    return categoriesValidation.safeMap((category) => {
      const categoryRelations = relationsValidation.safeFilter(
        (rel) => rel?.categoryID === category?.categoryID
      );

      return {
        category,
        relations: categoryRelations.map((relation) => {
          const plan = plansValidation.safeFind((p) => p?.planID === relation?.planID);
          const balance = relation?.balanceID
            ? balancesValidation.safeFind((b) => b?.balanceID === relation.balanceID)
            : null;
          const relStages = relationStagesValidation.safeFilter(
            (rs) => rs?.relationID === relation?.relationID
          );

          return {
            relation,
            plan,
            balance,
            stages: relStages
              .map((rs) => {
                const stage = stagesValidation.safeFind((s) => s?.stageID === rs?.stageID);
                return {
                  relationStage: rs,
                  stage,
                };
              })
              .filter((stageObj) => stageObj.stage)
              .sort(
                (a, b) =>
                  (a.relationStage?.numPhase || 0) -
                  (b.relationStage?.numPhase || 0)
              ),
          };
        }),
      };
    }).filter((cat) => cat.relations.length > 0);
  }, [
    categoriesValidation,
    relationsValidation,
    plansValidation,
    balancesValidation,
    stagesValidation,
    relationStagesValidation,
  ]);

  // Seleccionar la primera categoría por defecto cuando los datos estén listos
  useEffect(() => {
    if (organizedData.length > 0 && selectedCategoryIndex === null) {
      setSelectedCategoryIndex(0);
    }
  }, [organizedData, selectedCategoryIndex]);

  // Reset relación cuando cambie la categoría
  useEffect(() => {
    setSelectedRelationIndex(null);
  }, [selectedCategoryIndex]);

  // Obtener la categoría seleccionada
  const selectedCategory =
    selectedCategoryIndex !== null && organizedData.length > selectedCategoryIndex
      ? organizedData[selectedCategoryIndex]
      : null;

  // Obtener relaciones de la categoría seleccionada
  const relationOptions = selectedCategory?.relations || [];

  // Obtener la relación seleccionada
  const selectedRelation =
    selectedRelationIndex !== null && relationOptions.length > selectedRelationIndex
      ? relationOptions[selectedRelationIndex]
      : null;

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100">
        <div className="flex items-center justify-center h-32">
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin h-10 w-10 text-app-secondary mb-3" />
            <p className="text-app-secondary">Cargando datos...</p>
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
              className="bg-app-secondary hover:bg-app-secondary/90"
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
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 border-b-2 border-app-secondary pb-2 w-fit mx-auto">
          Categoría → Relación → Plan & Balance & Etapas
        </h2>

        {/* 1) CATEGORÍAS */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {organizedData.length === 0 ? (
            <span className="text-gray-500 dark:text-gray-400">
              No hay Categorías
            </span>
          ) : (
            organizedData.map((categoryObj, index) => {
              // Validar que categoryObj y category existen
              if (!categoryObj || !categoryObj.category) {
                return null;
              }
              
              return (
                <button
                  key={categoryObj.category.categoryID || index}
                  onClick={() => setSelectedCategoryIndex(index)}
                  className={cn(
                    "px-4 py-2 rounded-lg transition shadow-sm",
                    selectedCategoryIndex === index
                      ? "bg-app-secondary text-white"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  {categoryObj.category.name || 'Sin nombre'} ({categoryObj.relations?.length || 0})
                </button>
              );
            }).filter(Boolean)
          )}
        </div>

        {/* 2) RELACIONES */}
        {selectedCategory && (
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {relationOptions.length === 0 ? (
              <span className="text-gray-500 dark:text-gray-400">
                No hay Relaciones para esta Categoría
              </span>
            ) : (
              relationOptions.map((relationObj, index) => {
                // Validar que relationObj y relation existen
                if (!relationObj || !relationObj.relation) {
                  return null;
                }
                
                return (
                  <button
                    key={relationObj.relation.relationID || index}
                    onClick={() => setSelectedRelationIndex(index)}
                    className={cn(
                      "px-4 py-2 rounded-lg transition shadow-sm",
                      selectedRelationIndex === index
                        ? "bg-app-secondary text-white"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    Relación {relationObj.relation.relationID || 'N/A'} (
                    {relationObj.stages?.length || 0} etapas)
                  </button>
                );
              }).filter(Boolean)
            )}
          </div>
        )}

        {/* 3) PLAN & BALANCE */}
        {selectedRelation && (
          <div className="flex flex-col md:flex-row gap-6">
            {/* PLAN */}
            <Card className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 flex-1">
              <CardHeader>
                <CardTitle className="text-app-secondary dark:text-app-secondary">
                  Plan Relacionado
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRelation?.plan ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-app-secondary/90 dark:text-app-secondary">
                        Nombre:{" "}
                      </span>
                      {selectedRelation.plan.name || 'Sin nombre'}
                    </div>
                    {/* <div>
                      <span className="font-medium text-app-secondary/90 dark:text-app-secondary">
                        Creado:{" "}
                      </span>
                      {formatDate(selectedRelation.plan.createdAt)}
                    </div> */}
                  </div>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">
                    No hay Plan asociado
                  </span>
                )}
              </CardContent>
            </Card>

            {/* BALANCE */}
            <Card className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 flex-1">
              <CardHeader>
                <CardTitle className="text-app-secondary dark:text-app-secondary">
                  Balance Relacionado
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRelation?.balance ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-app-secondary/90 dark:text-app-secondary">
                        Nombre:{" "}
                      </span>
                      {selectedRelation.balance.name || 'Sin nombre'}
                    </div>
                    {/* <div>
                      <span className="font-medium text-app-secondary/90 dark:text-app-secondary">
                        Descripción:{" "}
                      </span>
                      {selectedRelation.balance.description || "—"}
                    </div> */}
                    {/* <div>
                      <span className="font-medium text-app-secondary/90 dark:text-app-secondary">
                        Creado:{" "}
                      </span>
                      {formatDate(selectedRelation.balance.createdAt)}
                    </div> */}
                  </div>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">
                    No hay Balance asociado
                  </span>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 4) ETAPAS */}
        {selectedRelation && selectedRelation.stages && selectedRelation.stages.length > 0 && (
          <div className="mt-8 space-y-6">
            {selectedRelation.stages.length === 1 ? (
              <div className="flex justify-center">
                <div className="w-full md:w-1/2">
                  <Card className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 w-full">
                    <CardHeader>
                      <CardTitle className="text-app-secondary dark:text-app-secondary">
                        Etapa{" "}
                        {selectedRelation.stages[0]?.relationStage?.numPhase || 'N/A'}:{" "}
                        {selectedRelation.stages[0]?.stage?.name || 'Sin nombre'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-app-secondary/90 dark:text-app-secondary">
                            Fase:{" "}
                          </span>
                          {selectedRelation.stages[0]?.relationStage?.numPhase ??
                            "—"}
                        </div>
                        {/* <div>
                          <span className="font-medium text-app-secondary/90 dark:text-app-secondary">
                            Descripción:{" "}
                          </span>
                          {selectedRelation.stages[0].stage?.description || "—"}
                        </div>
                        <div>
                          <span className="font-medium text-app-secondary/90 dark:text-app-secondary">
                            Creado:{" "}
                          </span>
                          {formatDate(
                            selectedRelation.stages[0].relationStage.createdAt
                          )}
                        </div> */}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : selectedRelation.stages.length === 2 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedRelation.stages.map((stageObj, index) => {
                  if (!stageObj || !stageObj.relationStage) {
                    return null;
                  }
                  
                  return (
                    <Card
                      key={stageObj.relationStage.relationStageID || index}
                      className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 w-full"
                    >
                      <CardHeader>
                        <CardTitle className="text-app-secondary dark:text-app-secondary">
                          Etapa {stageObj.relationStage?.numPhase || 'N/A'}:{" "}
                          {stageObj.stage?.name || 'Sin nombre'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-app-secondary/90 dark:text-app-secondary">
                              Fase:{" "}
                            </span>
                            {stageObj.relationStage?.numPhase ?? "—"}
                          </div>
                        {/* <div>
                          <span className="font-medium text-app-secondary/90 dark:text-app-secondary">
                            Descripción:{" "}
                          </span>
                          {stageObj.stage?.description || "—"}
                        </div>
                        <div>
                          <span className="font-medium text-app-secondary/90 dark:text-app-secondary">
                            Creado:{" "}
                          </span>
                          {formatDate(stageObj.relationStage.createdAt)}
                        </div> */}
                      </div>
                    </CardContent>
                     </Card>
                   );
                 }).filter(Boolean)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedRelation.stages.map((stageObj, index) => {
                  if (!stageObj || !stageObj.relationStage) {
                    return null;
                  }
                  
                  return (
                    <Card
                      key={stageObj.relationStage.relationStageID || index}
                      className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 w-full"
                    >
                      <CardHeader>
                        <CardTitle className="text-app-secondary dark:text-app-secondary">
                          Etapa {stageObj.relationStage?.numPhase || 'N/A'}:{" "}
                          {stageObj.stage?.name || 'Sin nombre'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-app-secondary/90 dark:text-app-secondary">
                              Fase:{" "}
                            </span>
                            {stageObj.relationStage?.numPhase ?? "—"}
                          </div>
                          {/* <div>
                            <span className="font-medium text-app-secondary/90 dark:text-app-secondary">
                              Descripción:{" "}
                            </span>
                            {stageObj.stage?.description || "—"}
                          </div>
                          <div>
                            <span className="font-medium text-app-secondary/90 dark:text-app-secondary">
                              Creado:{" "}
                            </span>
                            {formatDate(stageObj.relationStage.createdAt)}
                          </div> */}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }).filter(Boolean)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
