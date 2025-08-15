"use client";

import React, { useEffect, useState } from "react";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/components/common/tableComponent";
import {
  challengeTemplatesApi,
  type ChallengePlan,
} from "@/api/challenge-templates";

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

// Validación
const planSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  isActive: z.boolean().optional(),
  wooID: z.number().optional(),
});

type PlanFormData = z.infer<typeof planSchema>;

interface PlansManagerProps {
  pageSize: number;
}

export function PlansManager({ pageSize }: PlansManagerProps) {
  // Estado
  const [plans, setPlans] = useState<ChallengePlan[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState<ChallengePlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

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
    try {
      const response = await fetch(`/api/server/challenge-templates/plans/${planId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPlans(plans.filter((plan) => plan.planID !== planId));
        toast.success("Plan eliminado correctamente");
      } else {
        toast.error("Error al eliminar el plan");
      }
    } catch (error) {
      toast.error("Error al eliminar el plan");
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
    <div className="flex space-x-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleEdit(plan)}
        className="h-8 w-8 p-0"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleDelete(plan.planID)}
        className="h-8 w-8 p-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  // Procesar datos para la tabla
  const tableData = plans.map((plan, index) => ({
    id: index + 1, // Número secuencial para la tabla
    name: plan.name,
    actions: plan
  }));

  // Total de páginas para paginación
  const totalPages = Math.ceil(plans.length / pageSize);

  // Paginación de datos
  const startIndex = (page - 1) * pageSize;
  const paginatedData = tableData.slice(startIndex, startIndex + pageSize);

  // --------------------------------------------------
  // 4. Render
  // --------------------------------------------------
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Gestión de Planes</h2>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Crear Plan
          </Button>
        </div>
        <div className="flex justify-center py-8">
          <div className="text-muted-foreground">Cargando planes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white space-y-6 pt py-4 px-6">
        <div className="flex justify-end items-center pr-2">
          <Button 
            onClick={() => {
              setEditItem(null);
              form.reset({ name: "", isActive: true });
              setOpenModal(true);
            }}
            className="group "
          >
            <Plus className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
            Crear Plan
          </Button>
        </div>

        <PaginatedCardTable
          columns={columns}
          rows={paginatedData}
          isLoading={false}
          renderActions={(data) => renderActions(data.actions as ChallengePlan)}
          pagination={{
            currentPage: page,
            totalPages: totalPages,
            totalItems: plans.length,
            pageSize: pageSize,
            onPageChange: setPage,
            onPageSizeChange: () => {} // No cambio de tamaño de página por ahora
          }}
        />
      </div>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Editar Plan" : "Crear Plan"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Plan</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Ingrese el nombre del plan"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="wooID">ID WooCommerce (opcional)</Label>
              <Input
                id="wooID"
                type="number"
                {...form.register("wooID", {
                  setValueAs: (value) => value === "" ? undefined : Number(value)
                })}
                placeholder="ID del producto en WooCommerce"
              />
              {form.formState.errors.wooID && (
                <p className="text-sm text-red-500">
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
              <Label htmlFor="isActive">Plan Activo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editItem ? "Actualizar" : "Crear"} Plan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
