"use client";

import React, { useEffect, useState } from "react";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig, RelationBalance } from "@/types";
import {
  ChallengeRelation,
  ChallengeCategory,
  ChallengePlan,
  ChallengeBalance,
} from "@/types/challenge-template";

import { challengeTemplatesApi } from "@/api/challenge-templates";
import { useArrayValidation } from "@/hooks/useArrayValidation";

import { toast } from "sonner";
import { Edit, Plus, Settings } from "lucide-react";
import BalanceSelectorModal from "./RelationBalancesModal";
import RelationStagesModal from "./RelationStagesModal";
import { ManagerHeader } from "../ManagerHeader";

// shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

// Validación
const relationSchema = z.object({
  categoryID: z.string().uuid("Categoría inválida").optional().or(z.literal("")),
  planID: z.string().min(1, "El plan es requerido"),
});

type RelationFormData = z.infer<typeof relationSchema>;

import type { RelationsManagerProps } from "@/types";

export function RelationsManager({ pageSize = 10 }: RelationsManagerProps) {
  // Estado
  const [relations, setRelations] = useState<ChallengeRelation[]>([]);
  const [categories, setCategories] = useState<ChallengeCategory[]>([]);
  const [plans, setPlans] = useState<ChallengePlan[]>([]);
  const [balances, setBalances] = useState<ChallengeBalance[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState<ChallengeRelation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSizeLocal, setPageSizeLocal] = useState(pageSize);
  const [openBalanceModal, setOpenBalanceModal] = useState(false);
  const [selectedBalanceIds, setSelectedBalanceIds] = useState<string[]>([]);
  const [selectedRelationIdForBalances, setSelectedRelationIdForBalances] =
    useState<string | null>(null);
  const [openStagesModal, setOpenStagesModal] = useState(false);
  const [selectedRelationForStages, setSelectedRelationForStages] = useState<{
    id: string;
    name: string;
  }>({
    id: "",
    name: "",
  });

  // Form
  const form = useForm<RelationFormData>({
    resolver: zodResolver(relationSchema),
    defaultValues: {
      categoryID: "",
      planID: "",
    },
  });

  // --------------------------------------------------
  // 1. Cargar datos al montar
  // --------------------------------------------------
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [relationsData, categoriesData, plansData, balancesData] =
        await Promise.all([
          challengeTemplatesApi.listRelations(),
          challengeTemplatesApi.listCategories(),
          challengeTemplatesApi.listPlans(),
          challengeTemplatesApi.listBalances(),
        ]);

      setRelations(relationsData);
      setCategories(categoriesData);
      setPlans(plansData);
      setBalances(balancesData);
      // Cuando creamos una relación nueva, limpiar selección
      if (!editItem) setSelectedBalanceIds([]);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // 2. Crear / Editar
  // --------------------------------------------------
  function handleOpenCreate() {
    setEditItem(null);
    form.reset({
      categoryID: "",
      planID: "",
    });
    setOpenModal(true);
    setSelectedBalanceIds([]);
    setSelectedRelationIdForBalances(null);
  }

  function handleOpenEdit(item: {
    id: number;
    name: string;
    originalId?: string;
  }) {
    const relation = relationsValidation.safeFind(
      (r) => r?.relationID === item.originalId
    );
    if (relation) {
      setEditItem(relation);
      form.reset({
        categoryID: relation.categoryID || "",
        planID: relation.planID || "",
      });
      // Mapear los balances existentes de la relación
      const existingBalanceIds =
        relation.balances?.map((rb) => rb.balanceID) || [];
      setSelectedBalanceIds(existingBalanceIds);
      setOpenModal(true);
      setSelectedRelationIdForBalances(null);
    }
  }

  async function onSubmit(formValues: RelationFormData) {
    try {
      // Construir payload respetando opcionalidad de categoría
      const payload = {
        planID: formValues.planID,
        ...(formValues.categoryID ? { categoryID: formValues.categoryID } : {}),
      };
      if (editItem) {
        // Editar
        console.log("Editando relación:", editItem.relationID, payload);
        await challengeTemplatesApi.updateRelation(
          editItem.relationID,
          payload
        );
        toast.success("Relación editada exitosamente");
      } else {
        // Crear
        await challengeTemplatesApi.createRelation(payload);
        toast.success("Relación creada exitosamente");
      }
      setOpenModal(false);
      await loadAllData(); // Refrescar datos
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Ocurrió un error al guardar");
    }
  }

  // --------------------------------------------------
  // 3. Validaciones y helpers para obtener nombres
  // --------------------------------------------------
  const relationsValidation = useArrayValidation(relations);
  const categoriesValidation = useArrayValidation(categories);
  const plansValidation = useArrayValidation(plans);
  const balancesValidation = useArrayValidation(balances);

  const getCategoryName = (id: string) => {
    const category = categoriesValidation.safeFind((c) => c?.categoryID === id);
    return category?.name || "N/A";
  };

  const getPlanName = (id: string) => {
    const plan = plansValidation.safeFind((p) => p?.planID === id);
    return plan?.name || "N/A";
  };

  const getBalanceAmount = (id: string) => {
    const balance = balancesValidation.safeFind((b) => b?.balanceID === id);
    return balance ? `$${balance.balance?.toLocaleString()}` : "N/A";
  };

  // --------------------------------------------------
  // 4. Procesar datos para la tabla
  // --------------------------------------------------
  const tableData = relationsValidation.safeMap((item, index) => {
    const categoryName = getCategoryName(item?.categoryID || "");
    const planName = getPlanName(item?.planID || "");
    const balanceText = item?.balances?.length ? ` (${item.balances.length} balances)` : "";
    // Cambiar a "Plan - Categoría" y evitar guion si no hay categoría
    const composedName = categoryName && categoryName !== "N/A" ? `${planName} - ${categoryName}${balanceText}` : `${planName}${balanceText}`;
    return {
      id: index + 1,
      name: composedName,
      originalId: item?.relationID || "",
    };
  });

  // Columnas para la tabla (solo ID y Nombre)
  const columns: ColumnConfig[] = [
    { key: "id", label: "ID", type: "normal" },
    { key: "name", label: "Nombre", type: "normal" },
  ];

  // Paginación
  const totalPages = Math.max(1, Math.ceil(tableData.length / pageSizeLocal));
  const startIndex = (page - 1) * pageSizeLocal;
  const paginatedRows = tableData.slice(startIndex, startIndex + pageSizeLocal);

  const renderActions = (row: Record<string, unknown>) => (
    <div className="flex items-center justify-center gap-2">
      <button
        className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        onClick={() =>
          handleOpenEdit({
            id: Number(row.id),
            name: String(row.name || ""),
            originalId: String(row.originalId || ""),
          })
        }
        title="Editar relación"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
        onClick={() => {
          const rid = String(row.originalId || "");
          const rel = relations.find((r) => r.relationID === rid);
          const existingBalanceIds =
            rel?.balances?.map((rb) => rb.balanceID) || [];
          setSelectedBalanceIds(existingBalanceIds);
          setSelectedRelationIdForBalances(rid);
          setOpenBalanceModal(true);
        }}
        title="Agregar balance"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
        onClick={() => {
          const rid = String(row.originalId || "");
          const relationName = String(row.name || "");
          setSelectedRelationForStages({ id: rid, name: relationName });
          setOpenStagesModal(true);
        }}
        title="Gestionar parámetros de stages"
      >
        <Settings className="h-4 w-4" />
      </button>
    </div>
  );

  // --------------------------------------------------
  // 5. Render
  // --------------------------------------------------
  return (
    <div className="bg-white dark:bg-gray-800 transition-colors duration-200">
      <ManagerHeader
        title="Challenges"
        description="Gestiona las relaciones entre planes, categorias, balances y fases."
        buttonText="Crear relación"
        onCreateClick={handleOpenCreate}
        totalCount={relations.length}
        showTotalCount={false}
      />

      <div className="px-6">
        <PaginatedCardTable
          columns={columns}
          rows={paginatedRows}
          isLoading={isLoading}
          emptyText="No hay relaciones disponibles"
          actionsHeader="Acciones"
          renderActions={renderActions}
          pagination={{
            currentPage: page,
            totalPages,
            totalItems: tableData.length,
            pageSize: pageSizeLocal,
            onPageChange: setPage,
            onPageSizeChange: (n) => {
              setPageSizeLocal(n);
              setPage(1);
            },
          }}
        />
      </div>

      {/* Modal selector de balances */}
      <BalanceSelectorModal
        open={openBalanceModal}
        onOpenChange={setOpenBalanceModal}
        balances={balances}
        initialSelected={selectedBalanceIds}
        initialRelationBalances={
          selectedRelationIdForBalances
            ? relations.find(
                (r) => r.relationID === selectedRelationIdForBalances
              )?.balances?.map(balance => ({
                challengeBalanceID: balance.balanceID,
                price: balance.price,
                isActive: balance.isActive,
                hasDiscount: balance.hasDiscount,
                discount: balance.discount,
                wooID: balance.wooID
              })) || []
            : []
        }
        onConfirmWithDetails={async (items) => {
          setSelectedBalanceIds(items.map((item) => item.challengeBalanceID));
          if (selectedRelationIdForBalances) {
            try {
              if (items.length === 0) {
                toast.message(
                  "No seleccionaste balances. No se hicieron cambios."
                );
              } else {
                // Crear el payload correcto según el DTO del backend
                const payload = items.map((item) => ({
                  challengeBalanceID: item.challengeBalanceID,
                  price: item.price || 0,
                  isActive: item.isActive ?? true,
                  hasDiscount: item.hasDiscount ?? false,
                  discount:
                    item.hasDiscount && item.discount
                      ? item.discount
                      : "0",
                  wooID: item.wooID || undefined,
                }));
                await challengeTemplatesApi.createBalancesForRelation(
                  selectedRelationIdForBalances,
                  payload
                );
                toast.success("Balances actualizados en la relación");
                await loadAllData();
              }
            } catch (e) {
              console.error("Error al actualizar relation balances:", e);
              toast.error("No se pudo actualizar la relación");
            } finally {
              setSelectedRelationIdForBalances(null);
            }
          }
        }}
      />

      {/* Modal para gestionar parámetros de stages */}
      <RelationStagesModal
        open={openStagesModal}
        onOpenChange={setOpenStagesModal}
        relationID={selectedRelationForStages?.id}
        relationName={selectedRelationForStages?.name}
      />

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 max-w-lg mx-auto shadow-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white text-sm sm:text-base md:text-lg font-semibold">
              {editItem ? "Editar" : "Crear"} relación
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base">
              {editItem
                ? "Modifica los datos y confirma para guardar cambios."
                : "Ingresa los datos para crear un nuevo registro."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-3 mt-3"
            >
              {/* Plan primero */}
              <FormField
                control={form.control}
                name="planID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      Plan
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <SelectValue placeholder="Selecciona un plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        {plansValidation.safeMap((plan) =>
                          plan?.planID ? (
                            <SelectItem
                              key={plan.planID}
                              value={plan.planID}
                              className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              {plan?.name || "Sin nombre"}
                            </SelectItem>
                          ) : null
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-600 dark:text-red-400" />
                  </FormItem>
                )}
              />

              {/* Categoría después y opcional */}
              <FormField
                control={form.control}
                name="categoryID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      Categoría (opcional)
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        {categoriesValidation.safeMap((category) =>
                          category?.categoryID ? (
                            <SelectItem
                              key={category.categoryID}
                              value={category.categoryID}
                              className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              {category?.name || "Sin nombre"}
                            </SelectItem>
                          ) : null
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-600 dark:text-red-400" />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenModal(false)}
                  className="px-3 py-2 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 dark:bg-emerald-600 text-white hover:bg-emerald-700 dark:hover:bg-emerald-700 px-3 py-2 text-sm shadow-sm"
                >
                  {editItem ? "Guardar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
