"use client";

import React, { useEffect, useState } from "react";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/types";
import { challengeTemplatesApi } from "@/api/challenge-templates";
import { ChallengeStage } from "@/types";
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
import { Input } from "@/components/ui/input";
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
import { Edit } from "lucide-react";
import { ManagerHeader } from "./ManagerHeader";
import { RulesManager } from "./RulesManager";

// Validación
const stageSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
});

type StageFormData = z.infer<typeof stageSchema>;

import type { StagesManagerProps } from "@/types";

export function StagesManager({ pageSize = 10 }: StagesManagerProps) {
  // Estado
  const [stages, setStages] = useState<ChallengeStage[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState<ChallengeStage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSizeLocal, setPageSizeLocal] = useState(pageSize);
  const [activeSubTab, setActiveSubTab] = useState<"stages" | "rules">(
    "stages"
  );

  // Form
  const form = useForm<StageFormData>({
    resolver: zodResolver(stageSchema),
    defaultValues: { name: "" },
  });

  // --------------------------------------------------
  // 1. Cargar datos al montar
  // --------------------------------------------------
  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    try {
      setIsLoading(true);
      const data = await challengeTemplatesApi.listStages();
      setStages(data);
    } catch (error) {
      console.error("Error al cargar etapas:", error);
      toast.error("Error al cargar etapas");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // 2. Crear / Editar
  // --------------------------------------------------
  function handleOpenCreate() {
    setEditItem(null);
    form.reset({ name: "" });
    setOpenModal(true);
  }

  function handleOpenEdit(item: {
    id: number;
    name: string;
    originalId?: string;
  }) {
    const stage = stagesValidation.safeFind(
      (s) => s?.stageID === item.originalId || s?.name === item.name
    );
    if (stage) {
      setEditItem(stage);
      form.reset({
        name: stage.name || "",
      });
      setOpenModal(true);
    }
  }

  async function onSubmit(formValues: StageFormData) {
    try {
      if (editItem) {
        // Editar
        await challengeTemplatesApi.updateStage(editItem.stageID, formValues);
        toast.success("Etapa editada exitosamente");
      } else {
        // Crear
        await challengeTemplatesApi.createStage(formValues);
        toast.success("Etapa creada exitosamente");
      }
      setOpenModal(false);
      await loadStages(); // Refrescar datos
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Ocurrió un error al guardar");
    }
  }

  // --------------------------------------------------
  // 3. Validación y procesamiento de datos para la tabla
  // --------------------------------------------------
  const stagesValidation = useArrayValidation(stages);

  const tableData = stagesValidation.safeMap((item, index) => ({
    id: index + 1, // Número secuencial para la tabla
    name: item?.name || "Sin nombre",
    originalId: item?.stageID || "", // Guardamos el ID real para operaciones
  }));

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
    <div className="flex items-center justify-center">
      <button
        className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        onClick={() =>
          handleOpenEdit({
            id: Number(row.id),
            name: String(row.name || ""),
            originalId: String(row.originalId || ""),
          })
        }
        title="Editar etapa"
      >
        <Edit className="h-4 w-4" />
      </button>
    </div>
  );

  // --------------------------------------------------
  // 4. Render
  // --------------------------------------------------
  return (
    <div className="bg-white dark:bg-gray-800 transition-colors duration-200">
      {/* Sub-tabs minimalistas: Etapas / Rules */}
      <div className="px-6 pt-4">
        <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 shadow-sm p-1">
          <button
            onClick={() => setActiveSubTab("stages")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === "stages"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Etapas
          </button>
          <button
            onClick={() => setActiveSubTab("rules")}
            className={`ml-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === "rules"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Rules
          </button>
        </div>
      </div>

      {activeSubTab === "stages" ? (
        <>
          <ManagerHeader
            title="Etapas"
            description="Gestiona las etapas disponibles para los challenges"
            buttonText="Crear etapa"
            onCreateClick={handleOpenCreate}
            totalCount={stages.length}
            showTotalCount={false}
          />

          <div className="px-6">
            <PaginatedCardTable
              columns={columns}
              rows={paginatedRows}
              isLoading={isLoading}
              emptyText="No hay etapas disponibles"
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

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 max-w-md mx-auto shadow-lg rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white text-sm sm:text-base md:text-lg font-semibold">
                  {editItem ? "Editar" : "Crear"} etapa
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
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                          Nombre
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Nombre de la etapa"
                            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </FormControl>
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
        </>
      ) : (
        <div className="px-0">
          <RulesManager pageSize={pageSizeLocal} />
        </div>
      )}
    </div>
  );
}
