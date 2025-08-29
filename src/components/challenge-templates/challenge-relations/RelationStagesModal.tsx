"use client";

import React, { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { Edit, Plus, X, Trash2 } from "lucide-react";
import { challengeTemplatesApi } from "@/api/challenge-templates";
import {
  StageRule,
  ChallengeStage,
  RelationStage,
  StageParameter,
} from "@/types/challenge-template";
import { useArrayValidation } from "@/hooks/useArrayValidation";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/types";

// Esquema de validación para parámetros
const parameterSchema = z.object({
  ruleID: z.string().min(1, "La regla es requerida"),
  relationStageID: z.string().min(1, "La etapa de relación es requerida"),
  ruleValue: z.union([
    z.string().min(1, "El valor es requerido"),
    z.number(),
    z.boolean(),
  ]),
  isActive: z.boolean().optional(),
});

type ParameterFormData = z.infer<typeof parameterSchema>;

interface RelationStagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relationID: string;
  relationName?: string;
}

export default function RelationStagesModal({
  open,
  onOpenChange,
  relationID,
  relationName,
}: RelationStagesModalProps) {
  // Helper: remove balance count suffix e.g., " (3 balances)" from relationName for submodal titles
  const stripBalancesSuffix = (name?: string) =>
    (name || "").replace(/\s*\(\d+\s+balances\)\s*$/i, "").trim();
  const displayRelationName = stripBalancesSuffix(relationName);

  // Estados
  const [rules, setRules] = useState<StageRule[]>([]);
  const [stages, setStages] = useState<ChallengeStage[]>([]);
  const [relationStages, setRelationStages] = useState<RelationStage[]>([]);
  const [parameters, setParameters] = useState<StageParameter[]>([]);
  const [openParameterModal, setOpenParameterModal] = useState(false);
  const [editParameter, setEditParameter] = useState<StageParameter | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Estados para añadir stages
  const [openAddStageModal, setOpenAddStageModal] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [isAddingStages, setIsAddingStages] = useState(false);

  // Form para parámetros
  const form = useForm<ParameterFormData>({
    resolver: zodResolver(parameterSchema),
    defaultValues: {
      ruleID: "",
      relationStageID: "",
      ruleValue: "",
      isActive: true,
    },
  });

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (open && relationID) {
      loadData();
    }
  }, [open, relationID]);

  const loadData = async () => {
    if (!relationID) return;

    try {
      setIsLoading(true);
      const [rulesData, stagesData, relationStagesData] = await Promise.all([
        challengeTemplatesApi.listRules(),
        challengeTemplatesApi.listStages(),
        challengeTemplatesApi.listRelationStages(relationID),
      ]);

      setRules(rulesData);
      setStages(stagesData);
      setRelationStages(relationStagesData);

      // Cargar parámetros para todas las etapas de relación
      await loadParameters(relationStagesData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  };

  const loadParameters = async (relationStagesData: RelationStage[]) => {
    try {
      const allParameters: StageParameter[] = [];

      for (const relationStage of relationStagesData) {
        const params =
          await challengeTemplatesApi.listParametersByRelationStage(
            relationStage.relationStageID
          );
        allParameters.push(...params);
      }

      setParameters(allParameters);
    } catch (error) {
      console.error("Error al cargar parámetros:", error);
      toast.error("Error al cargar parámetros");
    }
  };

  // Validaciones
  const rulesValidation = useArrayValidation(rules);
  const stagesValidation = useArrayValidation(stages);
  const relationStagesValidation = useArrayValidation(relationStages);
  const parametersValidation = useArrayValidation(parameters);

  // Helpers para obtener nombres
  const getRuleName = (ruleID: string) => {
    const rule = rulesValidation.safeFind((r) => r?.ruleID === ruleID);
    return rule?.ruleName || rule?.ruleSlug || "N/A";
  };

  const getStageName = (relationStageID: string) => {
    const relationStage = relationStagesValidation.safeFind(
      (rs) => rs?.relationStageID === relationStageID
    );
    if (!relationStage) return "N/A";

    const stage = stagesValidation.safeFind(
      (s) => s?.stageID === relationStage.stageID
    );
    return stage?.name || "N/A";
  };

  // Funciones CRUD para parámetros
  const handleCreateParameter = () => {
    setEditParameter(null);
    form.reset({
      ruleID: "",
      relationStageID: "",
      ruleValue: "",
      isActive: true,
    });
    setOpenParameterModal(true);
  };

  const handleEditParameter = (parameter: StageParameter) => {
    setEditParameter(parameter);
    form.reset({
      ruleID: parameter.ruleID,
      relationStageID: parameter.relationStageID,
      ruleValue: parameter.ruleValue,
      isActive: parameter.isActive ?? true,
    });
    setOpenParameterModal(true);
  };

  const handleDeleteParameter = async (parameter: StageParameter) => {
    try {
      await challengeTemplatesApi.deleteParameter(
        parameter.ruleID,
        parameter.relationStageID
      );
      toast.success("Parámetro eliminado exitosamente");
      await loadData();
    } catch (error) {
      console.error("Error al eliminar parámetro:", error);
      toast.error("Error al eliminar parámetro");
    }
  };

  const handleSave = async () => {
    // Ya no es necesario guardar cambios aquí porque:
    // - Las RelationStages se crean/eliminan individualmente
    // - Los parámetros se crean/editan/eliminan individualmente
    // - Todos los cambios se persisten inmediatamente
    toast.success("Todos los cambios han sido guardados");
    onOpenChange(false);
  };

  const onSubmitParameter = async (formValues: ParameterFormData) => {
    try {
      const payload = {
        ruleID: formValues.ruleID,
        relationStageID: formValues.relationStageID,
        ruleValue: formValues.ruleValue,
        isActive: formValues.isActive ?? true,
      };

      if (editParameter) {
        // Editar
        await challengeTemplatesApi.updateParameter(
          editParameter.ruleID,
          editParameter.relationStageID,
          payload
        );
        toast.success("Parámetro editado exitosamente");
      } else {
        // Crear
        await challengeTemplatesApi.createParameter(payload);
        toast.success("Parámetro creado exitosamente");
      }

      setOpenParameterModal(false);
      
      // Recargar parámetros de la etapa específica si está abierto el modal
      if (selectedRelationStage) {
        const params = await challengeTemplatesApi.listParametersByRelationStage(
          selectedRelationStage.relationStageID
        );
        setStageParameters(params);
      }
      
      // Recargar todos los datos
      await loadData();
    } catch (error) {
      console.error("Error al guardar parámetro:", error);
      toast.error("Error al guardar parámetro");
    }
  };

  // Configuración de la tabla para etapas de relación
  const stageColumns: ColumnConfig[] = [
    { key: "id", label: "ID", type: "normal" },
    { key: "stageName", label: "Etapa", type: "normal" },
    { key: "numPhase", label: "Fase", type: "normal" },
    { key: "parametersCount", label: "Parámetros", type: "normal" },
  ];

  // Procesar datos para la tabla de etapas
  const stageTableData = relationStagesValidation.safeMap(
    (relationStage, index) => {
      const stage = stagesValidation.safeFind(
        (s) => s?.stageID === relationStage?.stageID
      );
      const stageParameters = parametersValidation.safeFilter(
        (param) => param?.relationStageID === relationStage?.relationStageID
      );

      return {
        id: index + 1,
        stageName: stage?.name || "N/A",
        numPhase: relationStage?.numPhase || "N/A",
        parametersCount: stageParameters.length,
        originalData: relationStage,
      };
    }
  );

  // Paginación para etapas
  const totalPages = Math.max(1, Math.ceil(stageTableData.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedStageRows = stageTableData.slice(
    startIndex,
    startIndex + pageSize
  );

  const renderStageActions = (row: Record<string, unknown>) => {
    const relationStage = row.originalData as RelationStage;
    return (
      <div className="flex items-center justify-center gap-2">
        <button
          className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          onClick={() => handleManageStageParameters(relationStage)}
          title="Gestionar parámetros de esta etapa"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          onClick={() => handleDeleteRelationStage(relationStage)}
          title="Eliminar etapa de la relación"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  // Estado para gestionar parámetros de una etapa específica
  const [selectedRelationStage, setSelectedRelationStage] =
    useState<RelationStage | null>(null);
  const [openStageParametersModal, setOpenStageParametersModal] =
    useState(false);
  const [stageParameters, setStageParameters] = useState<StageParameter[]>([]);

  const handleManageStageParameters = async (relationStage: RelationStage) => {
    setSelectedRelationStage(relationStage);
    try {
      const params = await challengeTemplatesApi.listParametersByRelationStage(
        relationStage.relationStageID
      );
      setStageParameters(params);
      setOpenStageParametersModal(true);
    } catch (error) {
      console.error("Error al cargar parámetros de la etapa:", error);
      toast.error("Error al cargar parámetros de la etapa");
    }
  };

  const handleCreateParameterForStage = () => {
    if (!selectedRelationStage) return;
    setEditParameter(null);
    form.reset({
      ruleID: "",
      relationStageID: selectedRelationStage.relationStageID,
      ruleValue: "",
      isActive: true,
    });
    setOpenParameterModal(true);
  };

  const handleEditParameterForStage = (parameter: StageParameter) => {
    setEditParameter(parameter);
    form.reset({
      ruleID: parameter.ruleID,
      relationStageID: parameter.relationStageID,
      ruleValue: parameter.ruleValue,
      isActive: parameter.isActive ?? true,
    });
    setOpenParameterModal(true);
  };

  const handleDeleteParameterForStage = async (parameter: StageParameter) => {
    try {
      await challengeTemplatesApi.deleteParameter(
        parameter.ruleID,
        parameter.relationStageID
      );
      toast.success("Parámetro eliminado exitosamente");
      // Recargar parámetros de la etapa
      if (selectedRelationStage) {
        const params =
          await challengeTemplatesApi.listParametersByRelationStage(
            selectedRelationStage.relationStageID
          );
        setStageParameters(params);
      }
      await loadData();
    } catch (error) {
      console.error("Error al eliminar parámetro:", error);
      toast.error("Error al eliminar parámetro");
    }
  };

  // Funciones para añadir stages
  const handleAddStages = () => {
    setSelectedStages([]);
    setOpenAddStageModal(true);
  };

  const handleStageSelection = (stageID: string, checked: boolean) => {
    if (checked) {
      setSelectedStages((prev) => [...prev, stageID]);
    } else {
      setSelectedStages((prev) => prev.filter((id) => id !== stageID));
    }
  };

  const handleCreateRelationStages = async () => {
    if (selectedStages.length === 0) {
      toast.error("Selecciona al menos una etapa");
      return;
    }

    try {
      setIsAddingStages(true);

      // Crear RelationStages individuales
      for (let i = 0; i < selectedStages.length; i++) {
        const stageID = selectedStages[i];
        await challengeTemplatesApi.createRelationStage({
          stageID,
          relationID,
          numPhase: i + 1, // Asignar fase secuencial
        });
      }

      toast.success("Etapas añadidas exitosamente");
      setOpenAddStageModal(false);
      await loadData();
    } catch (error) {
      console.error("Error al añadir etapas:", error);
      toast.error("Error al añadir etapas");
    } finally {
      setIsAddingStages(false);
    }
  };

  // Obtener stages disponibles (que no están ya en la relación)
  const getAvailableStages = () => {
    const usedStageIDs = relationStages.map((rs) => rs.stageID);
    return stages.filter((stage) => !usedStageIDs.includes(stage.stageID));
  };

  const handleDeleteRelationStage = async (relationStage: RelationStage) => {
    try {
      await challengeTemplatesApi.deleteRelationStage(
        relationStage.relationStageID
      );
      toast.success("Etapa eliminada de la relación exitosamente");
      await loadData();
    } catch (error) {
      console.error("Error al eliminar etapa de la relación:", error);
      toast.error("Error al eliminar etapa de la relación");
    }
  };

  // Configuración de tabla para parámetros de una etapa específica
  const parameterColumns: ColumnConfig[] = [
    { key: "id", label: "ID", type: "normal" },
    { key: "rule", label: "Regla", type: "normal" },
    { key: "value", label: "Valor", type: "normal" },
    { key: "active", label: "Activo", type: "normal" },
  ];

  const stageParameterTableData = stageParameters.map((param, index) => ({
    id: index + 1,
    rule: getRuleName(param.ruleID),
    value: String(param.ruleValue),
    active: param.isActive ? "Sí" : "No",
    originalData: param,
  }));

  const renderParameterActions = (row: Record<string, unknown>) => {
    const parameter = row.originalData as StageParameter;
    return (
      <div className="flex items-center justify-center gap-2">
        <button
          className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          onClick={() => handleEditParameterForStage(parameter)}
          title="Editar parámetro"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          onClick={() => handleDeleteParameterForStage(parameter)}
          title="Eliminar parámetro"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto shadow-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white text-lg font-semibold">
              {relationName
                ? `${relationName}`
                : "Gestiona las etapas y sus parámetros para esta relación"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
              Gestiona las etapas y sus parámetros para este challenge
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información de etapas */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Etapas del Challenge ({relationStages.length})
              </h3>
              <Button
                onClick={handleAddStages}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
                disabled={getAvailableStages().length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir Etapas
              </Button>
            </div>

            {/* Tabla de etapas de relación */}
            <div className="rounded-lg">
              <PaginatedCardTable
                columns={stageColumns}
                rows={paginatedStageRows}
                isLoading={isLoading}
                emptyText="No hay etapas disponibles para esta relación"
                actionsHeader="Acciones"
                renderActions={renderStageActions}
                pagination={{
                  currentPage: page,
                  totalPages,
                  totalItems: stageTableData.length,
                  pageSize,
                  onPageChange: setPage,
                  onPageSizeChange: () => {},
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cerrar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para gestionar parámetros de una etapa específica */}
      <Dialog
        open={openStageParametersModal}
        onOpenChange={setOpenStageParametersModal}
      >
        <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto shadow-lg rounded-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white text-lg font-semibold">
              {displayRelationName || relationName || "Gestionar Parámetros de Etapa"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
              {selectedRelationStage
                ? `Etapa: ${getStageName(
                    selectedRelationStage.relationStageID
                  )} - Fase ${selectedRelationStage.numPhase}`
                : "Gestiona los parámetros de esta etapa"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Botón para crear nuevo parámetro */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Parámetros ({stageParameters.length})
              </h3>
              <Button
                onClick={handleCreateParameterForStage}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Parámetro
              </Button>
            </div>

            {/* Tabla de parámetros */}
            <div className="rounded-lg">
              <PaginatedCardTable
                columns={parameterColumns}
                rows={stageParameterTableData}
                isLoading={isLoading}
                emptyText="No hay parámetros disponibles para esta etapa"
                actionsHeader="Acciones"
                renderActions={renderParameterActions}
                pagination={{
                  currentPage: 1,
                  totalPages: 1,
                  totalItems: stageParameterTableData.length,
                  pageSize: 10,
                  onPageChange: () => {},
                  onPageSizeChange: () => {},
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenStageParametersModal(false)}
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para crear/editar parámetros */}
      <Dialog open={openParameterModal} onOpenChange={setOpenParameterModal}>
        <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 max-w-lg mx-auto shadow-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white text-lg font-semibold">
              {displayRelationName || relationName || (editParameter ? "Editar Parámetro" : "Crear Parámetro")}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
              {editParameter
                ? "Modifica los datos del parámetro"
                : "Ingresa los datos para crear un nuevo parámetro"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitParameter)}
              className="space-y-4"
            >
              

              {selectedRelationStage ? (
                // Mostrar etapa seleccionada como solo lectura
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                    Etapa de Relación
                  </FormLabel>
                  <FormControl>
                    <Input
                      value={`${getStageName(selectedRelationStage.relationStageID)} (Fase ${selectedRelationStage.numPhase || "N/A"})`}
                      readOnly
                      className="bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                    />
                  </FormControl>
                </FormItem>
              ) : (
                // Selector normal cuando no hay etapa predefinida
                <FormField
                  control={form.control}
                  name="relationStageID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                        Etapa de Relación
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                            <SelectValue placeholder="Selecciona una etapa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          {relationStagesValidation.safeMap((relationStage) => {
                            if (!relationStage?.relationStageID) return null;
                            const stage = stagesValidation.safeFind(
                              (s) => s?.stageID === relationStage.stageID
                            );
                            return (
                              <SelectItem
                                key={relationStage.relationStageID}
                                value={relationStage.relationStageID}
                                className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                {stage?.name || "Sin nombre"} (Fase{" "}
                                {relationStage.numPhase || "N/A"})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-600 dark:text-red-400" />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="ruleID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      Regla
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectValue placeholder="Selecciona una regla" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        {rulesValidation.safeMap((rule) =>
                          rule?.ruleID ? (
                            <SelectItem
                              key={rule.ruleID}
                              value={rule.ruleID}
                              className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              {rule.ruleName || rule.ruleSlug || "Sin nombre"}
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
                name="ruleValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      Valor
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={String(field.value || "")}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Intentar convertir a número si es posible
                          const numValue = Number(value);
                          if (!isNaN(numValue) && value !== "") {
                            field.onChange(numValue);
                          } else {
                            field.onChange(value);
                          }
                        }}
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                        placeholder="Ingresa el valor de la regla"
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                        Activo
                      </FormLabel>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Determina si el parámetro está activo
                      </div>
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

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenParameterModal(false)}
                  className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {editParameter ? "Guardar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal para añadir stages */}
      <Dialog open={openAddStageModal} onOpenChange={setOpenAddStageModal}>
        <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto shadow-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white text-lg font-semibold">
              {displayRelationName || relationName || "Añadir Etapas"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
              Selecciona las etapas que deseas añadir a esta relación
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {getAvailableStages().length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No hay etapas disponibles para añadir
              </div>
            ) : (
              <div className="space-y-2">
                {getAvailableStages().map((stage) => (
                  <div
                    key={stage.stageID}
                    className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <input
                      type="checkbox"
                      id={`stage-${stage.stageID}`}
                      checked={selectedStages.includes(stage.stageID)}
                      onChange={(e) =>
                        handleStageSelection(stage.stageID, e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label
                      htmlFor={`stage-${stage.stageID}`}
                      className="flex-1 text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                    >
                      {stage.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenAddStageModal(false)}
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateRelationStages}
              disabled={selectedStages.length === 0 || isAddingStages}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAddingStages
                ? "Añadiendo..."
                : `Añadir ${selectedStages.length} Etapa${
                    selectedStages.length !== 1 ? "s" : ""
                  }`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
