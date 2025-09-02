"use client";

import React, { useEffect, useState } from "react";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import { ColumnConfig } from "@/types";
import { challengeTemplatesApi } from "@/api/challenge-templates";
import { ChallengePlan } from "@/types";
import { CategoriesManager } from "./CategoriesManager";

// shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Edit, Trash2, Plus } from "lucide-react";
import { ManagerHeader } from "./ManagerHeader";

// Validación
const planSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  isActive: z.boolean().optional(),
  wooID: z.number().optional(),
});

type PlanFormData = z.infer<typeof planSchema>;

import type { PlansManagerProps } from "@/types";

export function PlansManager({ pageSize = 10 }: PlansManagerProps) {
  // Estado
  const [plans, setPlans] = useState<ChallengePlan[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState<ChallengePlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSizeLocal, setPageSizeLocal] = useState(pageSize);
  const [activeSubTab, setActiveSubTab] = useState<"plans" | "categories">(
    "plans"
  );

  // Form
  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: "", isActive: true },
  });

  // Columnas para la tabla - Solo ID, Nombre
  const columns: ColumnConfig[] = [
    { key: "id", label: "ID", type: "normal" },
    { key: "name", label: "Nombre", type: "normal" },
  ];

  // --------------------------------------------------
  // 1. Cargar datos al montar
  // --------------------------------------------------
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const data = await challengeTemplatesApi.listPlans();
      setPlans(data);
    } catch (error) {
      console.error("Error al cargar planes:", error);
      toast.error("Error al cargar planes");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // 2. Funciones de CRUD
  // --------------------------------------------------
  const handleEdit = (plan: ChallengePlan) => {
    setEditItem(plan);
    form.reset({
      name: plan.name,
      wooID: plan.wooID || undefined,
      isActive: plan.isActive,
    });
    setOpenModal(true);
  };

  const handleDelete = async (planId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este plan?")) {
      try {
        const response = await fetch(
          `/api/server/challenge-templates/plans/${planId}`,
          {
            method: "DELETE",
          }
        );
        if (response.ok) {
          setPlans(plans.filter((plan) => plan.planID !== planId));
          toast.success("Plan eliminado correctamente");
        } else {
          toast.error("Error al eliminar el plan");
        }
      } catch (error) {
        toast.error("Error al eliminar el plan: " + error);
      }
    }
  };

  async function onSubmit(formValues: PlanFormData) {
    try {
      if (editItem) {
        // Editar
        await challengeTemplatesApi.updatePlan(editItem.planID, formValues);
        toast.success("Plan editado exitosamente");
      } else {
        // Crear
        await challengeTemplatesApi.createPlan(formValues);
        toast.success("Plan creado exitosamente");
      }
      setOpenModal(false);
      await loadPlans(); // Refrescar datos
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Ocurrió un error al guardar");
    }
  }

  // --------------------------------------------------
  // 3. Funciones para las acciones
  // --------------------------------------------------
  const renderActions = (plan: ChallengePlan) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleEdit(plan)}
        className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleDelete(plan.planID)}
        className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        title="Eliminar"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  // Procesar datos para la tabla
  const tableData = plans.map((plan, index) => ({
    id: index + 1, // Número secuencial para la tabla
    name: plan.name,
    actions: plan,
  }));

  // Total de páginas para paginación
  const totalPages = Math.ceil(plans.length / pageSizeLocal);

  // Paginación de datos
  const startIndex = (page - 1) * pageSizeLocal;
  const paginatedData = tableData.slice(startIndex, startIndex + pageSizeLocal);

  // --------------------------------------------------
  // 4. Render
  // --------------------------------------------------
  if (isLoading && activeSubTab === "plans") {
    return (
      <div className="space-y-6 bg-white dark:bg-gray-800 p-6 transition-colors duration-200">
        {/* Sub-tabs */}
        <div className="px-0">
          <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 shadow-sm p-1">
            <button
              onClick={() => setActiveSubTab("plans")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSubTab === "plans"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Planes
            </button>
            <button
              onClick={() => setActiveSubTab("categories")}
              className={`ml-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSubTab !== "plans"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Categorías
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Planes
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Cargando planes...
            </p>
          </div>
          <Button disabled className="bg-gray-400 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Crear Plan
          </Button>
        </div>
        <div className="flex justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Cargando planes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white dark:bg-gray-800 transition-colors duration-200">
      {/* Sub-tabs minimalistas: Planes / Categorías */}
      <div className="px-6 pt-4">
        <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 shadow-sm p-1">
          <button
            onClick={() => setActiveSubTab("plans")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === "plans"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Planes
          </button>
          <button
            onClick={() => setActiveSubTab("categories")}
            className={`ml-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === "categories"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Categorías
          </button>
        </div>
      </div>

      {activeSubTab === "plans" ? (
        <>
          <div className="space-y-6 p-6">
            {/* Header */}
            <ManagerHeader
              title="Gestión de Planes"
              description="Administra los planes disponibles para los challenges"
              buttonText="Crear Plan"
              onCreateClick={() => {
                setEditItem(null);
                form.reset({ name: "", isActive: true });
                setOpenModal(true);
              }}
              totalCount={plans.length}
              showTotalCount={false}
            />

            <PaginatedCardTable
              columns={columns}
              rows={paginatedData}
              isLoading={false}
              emptyText="No hay planes disponibles"
              actionsHeader="Acciones"
              renderActions={(data) => renderActions(data.actions as ChallengePlan)}
              pagination={{
                currentPage: page,
                totalPages: totalPages,
                totalItems: plans.length,
                pageSize: pageSizeLocal,
                onPageChange: setPage,
                onPageSizeChange: (n) => {
                  setPageSizeLocal(n);
                  setPage(1);
                },
              }}
            />
          </div>

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 sm:max-w-[425px] shadow-lg rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white text-lg font-semibold">
                  {editItem ? "Editar Plan" : "Crear Plan"}
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                  {editItem
                    ? "Modifica los datos del plan y confirma para guardar cambios."
                    : "Ingresa los datos para crear un nuevo plan."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Nombre del Plan
                  </Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Ingrese el nombre del plan"
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="wooID"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    ID WooCommerce (opcional)
                  </Label>
                  <Input
                    id="wooID"
                    type="number"
                    {...form.register("wooID", {
                      setValueAs: (value) =>
                        value === "" ? undefined : Number(value),
                    })}
                    placeholder="ID del producto en WooCommerce"
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {form.formState.errors.wooID && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.wooID.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Controller
                    name="isActive"
                    control={form.control}
                    render={({ field }) => (
                      <Switch
                        id="isActive"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label
                    htmlFor="isActive"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Plan Activo
                  </Label>
                </div>

                <DialogFooter className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenModal(false)}
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 dark:bg-emerald-600 text-white hover:bg-emerald-700 dark:hover:bg-emerald-700 shadow-sm"
                  >
                    {editItem ? "Actualizar" : "Crear"} Plan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="px-0">
          <CategoriesManager pageSize={pageSizeLocal} />
        </div>
      )}
    </div>
  );
}
