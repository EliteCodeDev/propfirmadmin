"use client";

import React, { useEffect, useState, useCallback } from "react";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/types";
import {
  ChallengeRelation,
  ChallengeCategory,
  ChallengePlan,
  ChallengeBalance,
  Addon,
} from "@/types/challenge-template";

import { challengeTemplatesApi } from "@/api/challenge-templates";
import { useArrayValidation } from "@/hooks/useArrayValidation";

import { toast } from "sonner";
import { Edit, Plus, Settings } from "lucide-react";
import BalanceSelectorModal from "./RelationBalancesModal";
import RelationStagesModal from "./RelationStagesModal";
import RelationAddonsModal from "./RelationAddonsModal";
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
import { Input } from "@/components/ui/input";
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
  categoryID: z
    .string()
    .uuid("Categoría inválida")
    .optional()
    .or(z.literal("")),
  planID: z.string().min(1, "El plan es requerido"),
  groupName: z.string().optional(),
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
  // Snapshot de balances específicos de la relación seleccionada (para el modal)
  const [relationBalancesSnapshot, setRelationBalancesSnapshot] = useState<
    ChallengeRelation["balances"]
  >([]);
  // Addons state
  const [addons, setAddons] = useState<Addon[]>([]);
  const [openAddonsModal, setOpenAddonsModal] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedRelationIdForAddons, setSelectedRelationIdForAddons] =
    useState<string | null>(null);
  const [relationAddonsSnapshot, setRelationAddonsSnapshot] = useState<
    ChallengeRelation["addons"]
  >([]);
  // Form
  const form = useForm<RelationFormData>({
    resolver: zodResolver(relationSchema),
    defaultValues: {
      categoryID: "",
      planID: "",
      groupName: "",
    },
  });

  // --------------------------------------------------
  // 1. Cargar datos al montar
  // --------------------------------------------------
  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        relationsData,
        categoriesData,
        plansData,
        balancesData,
        addonsData,
      ] = await Promise.all([
        challengeTemplatesApi.listRelationsComplete(),
        challengeTemplatesApi.listCategories(),
        challengeTemplatesApi.listPlans(),
        challengeTemplatesApi.listBalances(),
        challengeTemplatesApi.listAddons(),
      ]);

      setRelations(relationsData);
      setCategories(categoriesData);
      setPlans(plansData);
      setBalances(balancesData);
      setAddons(addonsData);
      // Cuando creamos una relación nueva, limpiar selección
      if (!editItem) {
        setSelectedBalanceIds([]);
        setSelectedAddonIds([]);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  }, [editItem]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // --------------------------------------------------
  // 2. Crear / Editar
  // --------------------------------------------------
  function handleOpenCreate() {
    setEditItem(null);
    form.reset({
      categoryID: "",
      planID: "",
      groupName: "",
    });
    setOpenModal(true);
    setSelectedBalanceIds([]);
    setSelectedRelationIdForBalances(null);
    setSelectedAddonIds([]);
    setSelectedRelationIdForAddons(null);
  }

  async function onSubmit(formValues: RelationFormData) {
    try {
      // Construir payload respetando opcionalidad de categoría
      const payload = {
        planID: formValues.planID,
        groupName: formValues.groupName || undefined,
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

  const handleOpenEdit = useCallback((item: {
    id: number;
    name: string;
    originalId?: string;
  }) => {
    const relation = relationsValidation.safeFind(
      (r) => r?.relationID === item.originalId
    );
    if (relation) {
      // Primero preparar todos los datos sin actualizar estado
      const formData = {
        categoryID: relation.categoryID || "",
        planID: relation.planID || "",
        groupName: relation.groupName || "",
      };
      const existingBalanceIds = relation.balances?.map((rb) => rb.balanceID) || [];
      const existingAddonIds = relation.addons?.map((ra) => ra.addonID) || [];
      
      // Luego actualizar el estado en batch para evitar re-renders múltiples
      setEditItem(relation);
      setSelectedBalanceIds(existingBalanceIds);
      setSelectedRelationIdForBalances(null);
      setSelectedAddonIds(existingAddonIds);
      setSelectedRelationIdForAddons(null);
      form.reset(formData);
      setOpenModal(true);
    }
  }, [relationsValidation, form]);

  const getCategoryName = (id: string) => {
    const category = categoriesValidation.safeFind((c) => c?.categoryID === id);
    return category?.name || "N/A";
  };

  const getPlanName = (id: string) => {
    const plan = plansValidation.safeFind((p) => p?.planID === id);
    return plan?.name || "N/A";
  };

  // --------------------------------------------------
  // 4. Procesar datos para la tabla
  // --------------------------------------------------
  const tableData = relationsValidation.safeMap((item, index) => {
    const categoryName = getCategoryName(item?.categoryID || "");
    const planName = getPlanName(item?.planID || "");
    const balanceText = item?.balances?.length
      ? ` (${item.balances.length} balances)`
      : "";
    // Cambiar a "Plan - Categoría" y evitar guion si no hay categoría
    const composedName =
      categoryName && categoryName !== "N/A"
        ? `${planName} - ${categoryName}${balanceText}`
        : `${planName}${balanceText}`;
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

  const renderActions = useCallback((row: Record<string, unknown>) => (
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
        onClick={async () => {
          const rid = String(row.originalId || "");
          try {
            // Buscar la relación en los datos ya cargados con listRelationsComplete
            const rel = relations.find(r => r.relationID === rid);
            if (rel) {
              const existingBalanceIds =
                rel?.balances?.map((rb) => rb.balanceID) || [];
              setRelationBalancesSnapshot(rel?.balances || []);
              setSelectedBalanceIds(existingBalanceIds);
              setSelectedRelationIdForBalances(rid);
              setOpenBalanceModal(true);
            } else {
              toast.error("No se pudo encontrar la relación");
            }
          } catch (e) {
            console.error(
              "Error cargando relación antes de abrir modal de balances",
              e
            );
            toast.error("No se pudo cargar la relación");
          }
        }}
        title="Agregar balance"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors"
        onClick={async () => {
          const rid = String(row.originalId || "");
          try {
            const rel = relations.find(r => r.relationID === rid);
            if (rel) {
              // Cargar el estado más reciente desde el backend para asegurar selección correcta
              try {
                const latest = await challengeTemplatesApi.listRelationAddons(rid);
                const existingAddonIds = latest.map((ra) => ra.addonID);
                setRelationAddonsSnapshot(latest);
                setSelectedAddonIds(existingAddonIds);
              } catch (fetchErr) {
                // Fallback a datos ya cargados si falla la petición
                const existingAddonIds = rel?.addons?.map((ra) => ra.addonID) || [];
                setRelationAddonsSnapshot(rel?.addons || []);
                setSelectedAddonIds(existingAddonIds);
              }
              setSelectedRelationIdForAddons(rid);
              setOpenAddonsModal(true);
            } else {
              toast.error("No se pudo encontrar la relación");
            }
          } catch (e) {
            console.error("Error cargando relación antes de abrir modal de addons", e);
            toast.error("No se pudo cargar la relación");
          }
        }}
        title="Agregar addon"
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
  ), [relations, handleOpenEdit]);

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
        key={selectedRelationIdForBalances || "relation-balances-modal"}
        open={openBalanceModal}
        relationName={
          selectedRelationIdForBalances
            ? (() => {
                const relation = relations.find(
                  (r) => r.relationID === selectedRelationIdForBalances
                );
                const categoryName = getCategoryName(
                  relation?.categoryID || ""
                );
                const planName = getPlanName(relation?.planID || "");
                const balanceText = relation?.balances?.length
                  ? ` (${relation.balances.length} balances)`
                  : "";
                return categoryName && categoryName !== "N/A"
                  ? `${planName} - ${categoryName}${balanceText}`
                  : `${planName}${balanceText}`;
              })()
            : ""
        }
        onOpenChange={setOpenBalanceModal}
        balances={balances}
        initialSelected={selectedBalanceIds}
        initialRelationBalances={
          relationBalancesSnapshot?.map((rb) => ({
            challengeBalanceID: rb.balanceID,
            price: rb.price,
            isActive: rb.isActive,
            hasDiscount: rb.hasDiscount,
            discount: rb.discount,
            wooID: rb.wooID,
          })) || []
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
                    item.hasDiscount && item.discount ? item.discount : "0",
                  wooID: item.wooID || undefined,
                }));
                await challengeTemplatesApi.createBalancesForRelation(
                  selectedRelationIdForBalances,
                  payload
                );
                toast.success("Balances actualizados en la relación");
                await loadAllData();
                // Refrescar snapshot de la relación recién modificada
                try {
                  // Recargar todos los datos para obtener la información actualizada
                  const refreshedRelations = await challengeTemplatesApi.listRelationsComplete();
                  setRelations(refreshedRelations);
                  const refreshed = refreshedRelations.find(r => r.relationID === selectedRelationIdForBalances);
                  setRelationBalancesSnapshot(refreshed?.balances || []);
                } catch {}
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

      {/* Modal selector de addons */}
      <RelationAddonsModal
        key={selectedRelationIdForAddons || "relation-addons-modal"}
        open={openAddonsModal}
        relationName={
          selectedRelationIdForAddons
            ? (() => {
                const relation = relations.find(
                  (r) => r.relationID === selectedRelationIdForAddons
                );
                const categoryName = getCategoryName(
                  relation?.categoryID || ""
                );
                const planName = getPlanName(relation?.planID || "");
                const addonsText = relation?.addons?.length
                  ? ` (${relation.addons.length} addons)`
                  : "";
                return categoryName && categoryName !== "N/A"
                  ? `${planName} - ${categoryName}${addonsText}`
                  : `${planName}${addonsText}`;
              })()
            : ""
        }
        onOpenChange={setOpenAddonsModal}
        addons={addons}
        initialSelected={selectedAddonIds}
        initialRelationAddons={
          relationAddonsSnapshot?.map((ra) => ({
            addonID: ra.addonID,
            price: ra.price,
            isActive: ra.isActive,
            hasDiscount: ra.hasDiscount,
            discount: ra.discount,
            wooID: ra.wooID,
          })) || []
        }
        onConfirmWithDetails={async (items) => {
          setSelectedAddonIds(items.map((i) => i.addonID));
          if (selectedRelationIdForAddons) {
            try {
              // Obtener el estado más reciente desde el backend para evitar duplicados por snapshot desactualizado
              const latest = await challengeTemplatesApi.listRelationAddons(
                selectedRelationIdForAddons
              );
              setRelationAddonsSnapshot(latest);

              const existingIds = new Set(latest.map((ra) => ra.addonID));
              const selectedIds = new Set(items.map((i) => i.addonID));

              const toDelete = Array.from(existingIds).filter((id) => !selectedIds.has(id));
              const toCreate = Array.from(selectedIds).filter((id) => !existingIds.has(id));
              const toUpdate = items
                .filter((i) => existingIds.has(i.addonID))
                .filter((i) => {
                  const ex = latest.find((ra) => ra.addonID === i.addonID);
                  return (
                    ex?.price !== i.price ||
                    ex?.isActive !== i.isActive ||
                    ex?.hasDiscount !== i.hasDiscount ||
                    ex?.discount !== i.discount ||
                    ex?.wooID !== i.wooID
                  );
                });

              // Borrados: ignorar 404 (ya borrado)
              await Promise.all(
                toDelete.map(async (id) => {
                  try {
                    await challengeTemplatesApi.deleteRelationAddon(
                      id,
                      selectedRelationIdForAddons
                    );
                  } catch (err: any) {
                    const status = err?.response?.status;
                    if (status === 404) return; // ya no existe
                    // Verificar estado real: si ya no aparece en backend, ignorar
                    try {
                      const now = await challengeTemplatesApi.listRelationAddons(
                        selectedRelationIdForAddons
                      );
                      const stillExists = now.some((ra) => ra.addonID === id);
                      if (!stillExists) return; // considerar borrado efectivo
                    } catch {}
                    throw err;
                  }
                })
              );

              // Creaciones: si el backend responde 400 "already exists", hacer fallback a update (idempotente)
              const duplicateHandled: string[] = [];
              await Promise.all(
                toCreate.map(async (id) => {
                  const cfg = items.find((i) => i.addonID === id);
                  try {
                    await challengeTemplatesApi.createRelationAddon({
                      addonID: id,
                      relationID: selectedRelationIdForAddons,
                      price: cfg?.price,
                      isActive: cfg?.isActive,
                      hasDiscount: cfg?.hasDiscount,
                      discount: cfg?.discount,
                      wooID: cfg?.wooID,
                    });
                  } catch (err: any) {
                    const status = err?.response?.status;
                    const message: string | undefined = err?.response?.data?.message;
                    if (
                      status === 400 &&
                      message &&
                      message.toLowerCase().includes("already exists")
                    ) {
                      await challengeTemplatesApi.updateRelationAddon(
                        id,
                        selectedRelationIdForAddons,
                        {
                          price: cfg?.price,
                          isActive: cfg?.isActive,
                          hasDiscount: cfg?.hasDiscount,
                          discount: cfg?.discount,
                          wooID: cfg?.wooID,
                        }
                      );
                      duplicateHandled.push(id);
                    } else {
                      throw err;
                    }
                  }
                })
              );

              // Actualizaciones
              await Promise.all(
                toUpdate.map((i) =>
                  challengeTemplatesApi.updateRelationAddon(
                    i.addonID,
                    selectedRelationIdForAddons,
                    {
                      price: i.price,
                      isActive: i.isActive,
                      hasDiscount: i.hasDiscount,
                      discount: i.discount,
                      wooID: i.wooID,
                    }
                  )
                )
              );

              if (duplicateHandled.length > 0) {
                const names = duplicateHandled
                  .map((id) => addons.find((a) => a.addonID === id)?.name || id)
                  .join(", ");
                toast.message(
                  `Algunos addons ya existían y fueron actualizados: ${names}`
                );
              }

              toast.success("Addons actualizados en la relación");
              // Refrescar datos y snapshot
              const refreshedRelations = await challengeTemplatesApi.listRelationsComplete();
              setRelations(refreshedRelations);
              const refreshed = refreshedRelations.find(
                (r) => r.relationID === selectedRelationIdForAddons
              );
              setRelationAddonsSnapshot(refreshed?.addons || []);
            } catch (e: any) {
              console.error("Error al actualizar relation addons:", e);
              const msg = e?.response?.data?.message || "No se pudo actualizar la relación";
              toast.error(msg);
            } finally {
              setSelectedRelationIdForAddons(null);
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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

              <FormField
                control={form.control}
                name="groupName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      Nombre del grupo
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ingresa el nombre del grupo (opcional)"
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </FormControl>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
