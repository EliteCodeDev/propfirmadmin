"use client";

import React, { useEffect, useState } from "react";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/components/common/tableComponent";
import {
  challengeTemplatesApi,
  type ChallengeRelation,
  type ChallengeCategory,
  type ChallengePlan,
  type ChallengeBalance,
} from "@/api/challenge-templates";
import { useArrayValidation } from "@/hooks/useArrayValidation";

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
import { toast } from "sonner";
import { Edit, Plus } from "lucide-react";
import BalanceSelectorModal from "./BalanceSelectorModal";

// Validación
const relationSchema = z.object({
  categoryID: z.string().min(1, "La categoría es requerida"),
  planID: z.string().min(1, "El plan es requerido"),
  balanceID: z.string().optional(),
});

type RelationFormData = z.infer<typeof relationSchema>;

interface RelationsManagerProps {
  pageSize: number;
}

export function RelationsManager({ pageSize }: RelationsManagerProps) {
  // Estado
  const [relations, setRelations] = useState<ChallengeRelation[]>([]);
  const [categories, setCategories] = useState<ChallengeCategory[]>([]);
  const [plans, setPlans] = useState<ChallengePlan[]>([]);
  const [balances, setBalances] = useState<ChallengeBalance[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState<ChallengeRelation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [openBalanceModal, setOpenBalanceModal] = useState(false);
  const [selectedBalanceIds, setSelectedBalanceIds] = useState<string[]>([]);
  const [selectedRelationIdForBalances, setSelectedRelationIdForBalances] = useState<string | null>(null);

  // Form
  const form = useForm<RelationFormData>({
    resolver: zodResolver(relationSchema),
    defaultValues: {
      categoryID: "",
      planID: "",
  balanceID: undefined,
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
  balanceID: undefined,
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
    const relation = relationsValidation.safeFind((r) => r?.relationID === item.originalId);
    if (relation) {
      setEditItem(relation);
      form.reset({
        categoryID: relation.categoryID || "",
        planID: relation.planID || "",
        balanceID: relation.balanceID || undefined,
      });
      // Si la relación tiene stages/balances asociados en el backend, podrías mapearlos aquí.
      setSelectedBalanceIds(relation.balanceID ? [relation.balanceID] : []);
      setOpenModal(true);
  setSelectedRelationIdForBalances(null);
    }
  }

  async function onSubmit(formValues: RelationFormData) {
    try {
      // No enviar balanceID vacío/"none"
      const payload = {
        categoryID: formValues.categoryID,
        planID: formValues.planID,
        ...(formValues.balanceID && formValues.balanceID !== "none" && formValues.balanceID.trim() !== ""
          ? { balanceID: formValues.balanceID }
          : {}),
        // Lista de balances seleccionados en el modal (si el backend soporta múltiples, cambia la clave a balancesIDs)
        // balancesIDs: selectedBalanceIds,
      };
      if (editItem) {
        // Editar
        await challengeTemplatesApi.updateRelation(editItem.relationID, payload);
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
    const balanceAmount = getBalanceAmount(item?.balanceID || "");

    return {
      id: index + 1,
      name: `${categoryName} - ${planName}${
        balanceAmount !== "N/A" ? ` - ${balanceAmount}` : ""
      }`,
      originalId: item?.relationID || "",
    };
  });

  // Columnas para la tabla (solo ID y Nombre)
  const columns: ColumnConfig[] = [
    { key: "id", label: "ID", type: "normal" },
    { key: "name", label: "Nombre", type: "normal" },
  ];

  // Paginación
  const totalPages = Math.max(1, Math.ceil(tableData.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedRows = tableData.slice(startIndex, startIndex + pageSize);

  const renderActions = (row: Record<string, unknown>) => (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
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
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => {
          const rid = String(row.originalId || "");
          const rel = relations.find(r => r.relationID === rid);
          setSelectedBalanceIds(rel?.balanceID ? [rel.balanceID] : []);
          setSelectedRelationIdForBalances(rid);
          setOpenBalanceModal(true);
        }}
        title="Agregar balance"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
        {/* Selector de balances (opcional) */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-700 dark:text-gray-300">Agregar balances (opcional)</div>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpenBalanceModal(true)}>
            <Plus className="h-4 w-4 mr-1" /> Seleccionar
          </Button>
        </div>
        {selectedBalanceIds.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedBalanceIds.map((id) => {
              const b = balances.find((x) => x.balanceID === id);
              if (!b) return null;
              return (
                <span key={id} className="px-2 py-1 rounded-full text-xs border border-zinc-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                  {b.name} {typeof b.balance === "number" ? `- $${b.balance.toLocaleString()}` : ""}
                </span>
              );
            })}
          </div>
        )}


  // --------------------------------------------------
  // 5. Render
  // --------------------------------------------------
  return (
    <div>
      {/* Encabezado mínimo para mantener botón de creación, sin tocar otros cards/diseños */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Relaciones</h2>
        <Button onClick={handleOpenCreate} className="group">
          <Plus className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
          Crear relación
        </Button>
      </div>

      <PaginatedCardTable
        columns={columns}
        rows={paginatedRows}
        isLoading={isLoading}
        actionsHeader="Acciones"
        renderActions={renderActions}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems: tableData.length,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: () => {},
        }}
      />

      {/* Modal selector de balances */}
      
      <BalanceSelectorModal
        open={openBalanceModal}
        onOpenChange={setOpenBalanceModal}
        balances={balances}
        initialSelected={selectedBalanceIds}
        onConfirm={async (ids) => {
          setSelectedBalanceIds(ids);
          if (selectedRelationIdForBalances) {
            try {
              if (ids.length === 0) {
                toast.message("No seleccionaste balances. No se hicieron cambios.");
              } else {
                await challengeTemplatesApi.updateRelation(selectedRelationIdForBalances, { balanceID: ids[0] });
                toast.success("Balance agregado a la relación");
                await loadAllData();
              }
            } catch (e) {
              toast.error("No se pudo actualizar la relación");
            } finally {
              setSelectedRelationIdForBalances(null);
            }
          }
        }}
      />

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-white dark:bg-black text-zinc-800 dark:text-white border border-[var(--app-secondary)]/70 dark:border-blue-500 max-w-lg mx-auto shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-[var(--app-secondary)] dark:text-blue-400 text-sm sm:text-base md:text-lg font-semibold">
              {editItem ? "Editar" : "Crear"} relación
            </DialogTitle>
            <DialogDescription className="text-zinc-600 dark:text-gray-300 text-xs sm:text-sm md:text-base">
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
              <FormField
                control={form.control}
                name="categoryID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--app-secondary)] dark:text-blue-500 text-sm">
                      Categoría
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-transparent border border-zinc-300 dark:border-gray-700 text-zinc-800 dark:text-white text-sm">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoriesValidation.safeMap((category) => 
                          category?.categoryID ? (
                            <SelectItem
                              key={category.categoryID}
                              value={category.categoryID}
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

              <FormField
                control={form.control}
                name="planID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--app-secondary)] dark:text-blue-500 text-sm">
                      Plan
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-transparent border border-zinc-300 dark:border-gray-700 text-zinc-800 dark:text-white text-sm">
                          <SelectValue placeholder="Selecciona un plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {plansValidation.safeMap((plan) => 
                          plan?.planID ? (
                            <SelectItem key={plan.planID} value={plan.planID}>
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

              {/*<FormField
                control={form.control}
                name="balanceID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--app-secondary)] dark:text-blue-500 text-sm">
                      Balance (opcional)
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-transparent border border-zinc-300 dark:border-gray-700 text-zinc-800 dark:text-white text-sm">
                          <SelectValue placeholder="Selecciona un balance (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin balance</SelectItem>
                        {balancesValidation.safeMap((balance) => 
                          balance?.balanceID ? (
                            <SelectItem
                              key={balance.balanceID}
                              value={balance.balanceID}
                            >
                              {balance?.name || "Sin nombre"} - $
                              {balance?.balance?.toLocaleString() || 0}
                            </SelectItem>
                          ) : null
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-600 dark:text-red-400" />
                  </FormItem>
                )}
              />*/}

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenModal(false)}
                  className="px-3 py-1 text-sm bg-white dark:bg-transparent border border-zinc-300 dark:border-gray-700 text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-[var(--app-secondary)] dark:bg-blue-500 text-black hover:bg-[var(--app-secondary)]/90 dark:hover:bg-blue-400 px-3 py-1 text-sm shadow-sm"
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
