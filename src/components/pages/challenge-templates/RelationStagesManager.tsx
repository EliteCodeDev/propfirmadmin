"use client";

import React, { useEffect, useState } from "react";
import { ChallengeTable } from "@/components/ui/ChallengeTable";
import {
  challengeTemplatesApi,
  type RelationStage,
  type ChallengeRelation,
  type ChallengeStage,
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
import { toast } from "sonner";

// Validación
const relationStageSchema = z.object({
  relationID: z.string().min(1, "La relación es requerida"),
  stageID: z.string().min(1, "El stage es requerido"),
  numPhase: z.number().min(1, "El número de fase debe ser mayor a 0"),
});

type RelationStageFormData = z.infer<typeof relationStageSchema>;

interface RelationStagesManagerProps {
  pageSize: number;
}

export function RelationStagesManager({ pageSize }: RelationStagesManagerProps) {
  // Estado
  const [relationStages, setRelationStages] = useState<RelationStage[]>([]);
  const [relations, setRelations] = useState<ChallengeRelation[]>([]);
  const [stages, setStages] = useState<ChallengeStage[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState<RelationStage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form
  const form = useForm<RelationStageFormData>({
    resolver: zodResolver(relationStageSchema),
    defaultValues: {
      relationID: "",
      stageID: "",
      numPhase: 1,
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
      const [relationStagesData, relationsData, stagesData] =
        await Promise.all([
          challengeTemplatesApi.listRelationStages(),
          challengeTemplatesApi.listRelations(),
          challengeTemplatesApi.listStages(),
        ]);

      setRelationStages(relationStagesData);
      setRelations(relationsData);
      setStages(stagesData);
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
      relationID: "",
      stageID: "",
      numPhase: 1,
    });
    setOpenModal(true);
  }

  function handleOpenEdit(item: {
    id: number;
    name: string;
    originalId?: string;
  }) {
    const relationStage = relationStagesValidation.safeFind(
      (rs) => rs?.relationStageID === item.originalId
    );
    if (relationStage) {
      setEditItem(relationStage);
      form.reset({
        relationID: relationStage.relationID || "",
        stageID: relationStage.stageID || "",
        numPhase: relationStage.numPhase || 1,
      });
      setOpenModal(true);
    }
  }

  async function onSubmit(formValues: RelationStageFormData) {
    try {
      // Validar que no exista ya una relación con la misma fase
      const existingRelationStage = relationStagesValidation.safeFind(
        (rs) =>
          rs?.relationID === formValues.relationID &&
          rs?.numPhase === formValues.numPhase &&
          rs?.relationStageID !== editItem?.relationStageID
      );

      if (existingRelationStage) {
        toast.error(
          `Ya existe un stage con la fase ${formValues.numPhase} para esta relación`
        );
        return;
      }

      if (editItem) {
        // Editar
        await challengeTemplatesApi.updateRelationStage(
          editItem.relationStageID,
          formValues
        );
        toast.success("Relación de stage editada exitosamente");
      } else {
        // Crear
        await challengeTemplatesApi.createRelationStage(formValues);
        toast.success("Relación de stage creada exitosamente");
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
  const relationStagesValidation = useArrayValidation(relationStages);
  const relationsValidation = useArrayValidation(relations);
  const stagesValidation = useArrayValidation(stages);

  const getRelationName = (id: string) => {
    const relation = relationsValidation.safeFind((r) => r?.relationID === id);
    if (!relation) return "N/A";
    
    // Construir nombre de la relación
    const categoryName = relation.category?.name || "Sin categoría";
    const planName = relation.plan?.name || "Sin plan";
    return `${categoryName} - ${planName}`;
  };

  const getStageName = (id: string) => {
    const stage = stagesValidation.safeFind((s) => s?.stageID === id);
    return stage?.name || "N/A";
  };

  // --------------------------------------------------
  // 4. Procesar datos para la tabla
  // --------------------------------------------------
  const tableData = relationStagesValidation.safeMap((item, index) => {
    const relationName = getRelationName(item?.relationID || "");
    const stageName = getStageName(item?.stageID || "");
    const phase = item?.numPhase || 0;

    return {
      id: index + 1,
      name: `${relationName} - Fase ${phase}: ${stageName}`,
      originalId: item?.relationStageID || "",
    };
  });

  // --------------------------------------------------
  // 5. Render
  // --------------------------------------------------
  return (
    <div>
      <ChallengeTable
        title="Relaciones de Stages"
        data={tableData}
        pageSize={pageSize}
        onCreate={handleOpenCreate}
        onEdit={handleOpenEdit}
        isLoading={isLoading}
      />

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-white dark:bg-black text-zinc-800 dark:text-white border border-[var(--app-secondary)]/70 dark:border-blue-500 max-w-lg mx-auto shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-[var(--app-secondary)] dark:text-blue-400 text-sm sm:text-base md:text-lg font-semibold">
              {editItem ? "Editar" : "Crear"} relación de stage
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
                name="relationID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--app-secondary)] dark:text-blue-500 text-sm">
                      Relación
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-transparent border border-zinc-300 dark:border-gray-700 text-zinc-800 dark:text-white text-sm">
                          <SelectValue placeholder="Selecciona una relación" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relationsValidation.safeMap((relation) =>
                          relation?.relationID ? (
                            <SelectItem
                              key={relation.relationID}
                              value={relation.relationID}
                            >
                              {getRelationName(relation.relationID)}
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
                name="stageID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--app-secondary)] dark:text-blue-500 text-sm">
                      Stage
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-transparent border border-zinc-300 dark:border-gray-700 text-zinc-800 dark:text-white text-sm">
                          <SelectValue placeholder="Selecciona un stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stagesValidation.safeMap((stage) =>
                          stage?.stageID ? (
                            <SelectItem key={stage.stageID} value={stage.stageID}>
                              {stage?.name || "Sin nombre"}
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
                name="numPhase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--app-secondary)] dark:text-blue-500 text-sm">
                      Número de Fase
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ej: 1, 2, 3..."
                        className="bg-white dark:bg-transparent border border-zinc-300 dark:border-gray-700 text-zinc-800 dark:text-white text-sm"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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