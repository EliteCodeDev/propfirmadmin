"use client";

import React, { useEffect, useState } from "react";
import { ChallengeTable } from "@/components/ui/ChallengeTable";
import {
  challengeTemplatesApi,
  type ChallengePlan,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

  // Form
  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: "", isActive: true },
  });

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
  // 2. Crear / Editar
  // --------------------------------------------------
  function handleOpenCreate() {
    setEditItem(null);
    form.reset({ name: "", isActive: true });
    setOpenModal(true);
  }

  function handleOpenEdit(item: {
    id: number;
    name: string;
    originalId?: string;
  }) {
    const plan = plansValidation.safeFind(
      (p) => p?.planID === item.originalId || p?.name === item.name
    );
    if (plan) {
      setEditItem(plan);
      form.reset({
        name: plan.name || "",
        isActive: plan.isActive ?? true,
        wooID: plan.wooID,
      });
      setOpenModal(true);
    }
  }

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
  // 3. Validación y procesamiento de datos para la tabla
  // --------------------------------------------------
  const plansValidation = useArrayValidation(plans);

  const tableData = plansValidation.safeMap((item, index) => ({
    id: index + 1, // Número secuencial para la tabla
    name: item?.name || "Sin nombre",
    originalId: item?.planID || "", // Guardamos el ID real para operaciones
  }));

  // --------------------------------------------------
  // 4. Render
  // --------------------------------------------------
  return (
    <div>
      <ChallengeTable
        title="Planes"
        data={tableData}
        pageSize={pageSize}
        onCreate={handleOpenCreate}
        onEdit={handleOpenEdit}
        isLoading={isLoading}
      />

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-white dark:bg-black text-zinc-800 dark:text-white border border-[var(--app-secondary)]/70 dark:border-blue-500 max-w-md mx-auto shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-[var(--app-secondary)] dark:text-blue-400 text-sm sm:text-base md:text-lg font-semibold">
              {editItem ? "Editar" : "Crear"} plan
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--app-secondary)] dark:text-blue-500 text-sm">
                      Nombre
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nombre del plan"
                        className="bg-white dark:bg-transparent border border-zinc-300 dark:border-gray-700 text-zinc-800 dark:text-white text-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
                      />
                    </FormControl>
                    <FormMessage className="text-red-600 dark:text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-[var(--app-secondary)] dark:text-blue-500 text-sm">
                        Activo
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wooID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--app-secondary)] dark:text-blue-500 text-sm">
                      WooCommerce ID (opcional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="ID de WooCommerce"
                        className="bg-white dark:bg-transparent border border-zinc-300 dark:border-gray-700 text-zinc-800 dark:text-white text-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage className="text-red-600 dark:text-red-400" />
                  </FormItem>
                )}
              />

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
