"use client";

import React, { useEffect, useState } from "react";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/types";
import { StageRule } from "@/types/challenge-template";
import { challengeTemplatesApi } from "@/api/challenge-templates";
import { useArrayValidation } from "@/hooks/useArrayValidation";
import { toast } from "sonner";
import { Edit } from "lucide-react";
import { ManagerHeader } from "./ManagerHeader";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
const ruleSchema = z.object({
  ruleType: z.enum(["number", "percentage", "boolean", "string"], {
    error: "El tipo de regla es requerido",
  }),
  ruleName: z.string().optional(),
  ruleDescription: z.string().optional(),
});

type RuleFormData = z.infer<typeof ruleSchema>;

interface RulesManagerProps {
  pageSize?: number;
}

export function RulesManager({ pageSize = 10 }: RulesManagerProps) {
  // Estado
  const [rules, setRules] = useState<StageRule[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState<StageRule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSizeLocal, setPageSizeLocal] = useState(pageSize);

  // Form
  const form = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      ruleType: "number",
      ruleName: "",
      ruleDescription: "",
    },
  });

  // --------------------------------------------------
  // 1. Cargar datos al montar
  // --------------------------------------------------
  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setIsLoading(true);
      const rulesData = await challengeTemplatesApi.listRules();
      setRules(rulesData);
    } catch (error) {
      console.error("Error al cargar reglas:", error);
      toast.error("Error al cargar reglas");
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
      ruleType: "number",
      ruleName: "",
      ruleDescription: "",
    });
    setOpenModal(true);
  }

  function handleOpenEdit(item: {
    id: number;
    name: string;
    originalId?: string;
  }) {
    const rule = rulesValidation.safeFind((r) => r?.ruleID === item.originalId);
    if (rule) {
      setEditItem(rule);
      form.reset({
        ruleType: rule.ruleType as
          | "number"
          | "percentage"
          | "boolean"
          | "string",
        ruleName: rule.ruleName || "",
        ruleDescription: rule.ruleDescription || "",
      });
      setOpenModal(true);
    }
  }

  async function onSubmit(formValues: RuleFormData) {
    try {
      const payload = {
        ruleType: formValues.ruleType,
        ruleName: formValues.ruleName || undefined,
        ruleDescription: formValues.ruleDescription || undefined,
        ruleSlug: formValues.ruleName?.toLowerCase().replace(/\s+/g, "-") || "",
      };

      if (editItem) {
        // Editar
        await challengeTemplatesApi.updateRule(editItem.ruleID, payload);
        toast.success("Regla editada exitosamente");
      } else {
        // Crear
        await challengeTemplatesApi.createRule(payload);
        toast.success("Regla creada exitosamente");
      }
      setOpenModal(false);
      await loadRules(); // Refrescar datos
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Ocurrió un error al guardar");
    }
  }

  // --------------------------------------------------
  // 3. Validaciones y helpers
  // --------------------------------------------------
  const rulesValidation = useArrayValidation(rules);

  const getRuleTypeLabel = (type: string) => {
    const typeLabels = {
      number: "Número",
      percentage: "Porcentaje",
      boolean: "Booleano",
      string: "Texto",
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  // --------------------------------------------------
  // 4. Procesar datos para la tabla
  // --------------------------------------------------
  const tableData = rulesValidation.safeMap((item, index) => {
    const typeLabelText = getRuleTypeLabel(item?.ruleType || "");
    const nameText = item?.ruleName || "Sin nombre";
    const displayName = `${nameText} (${typeLabelText})`;

    return {
      id: index + 1,
      name: displayName,
      originalId: item?.ruleID || "",
    };
  });

  // Columnas para la tabla
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
        title="Editar regla"
      >
        <Edit className="h-4 w-4" />
      </button>
    </div>
  );

  // --------------------------------------------------
  // 5. Render
  // --------------------------------------------------
  return (
    <div className="bg-white dark:bg-gray-800 transition-colors duration-200">
      <ManagerHeader
        title="Reglas de Stage"
        description="Gestiona las reglas que se pueden aplicar a los stages de los challenges."
        buttonText="Crear regla"
        onCreateClick={handleOpenCreate}
        totalCount={rules.length}
        showTotalCount={false}
      />

      <div className="px-6">
        <PaginatedCardTable
          columns={columns}
          rows={paginatedRows}
          isLoading={isLoading}
          emptyText="No hay reglas disponibles"
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
        <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 max-w-lg mx-auto shadow-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white text-sm sm:text-base md:text-lg font-semibold">
              {editItem ? "Editar" : "Crear"} regla
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base">
              {editItem
                ? "Modifica los datos y confirma para guardar cambios."
                : "Ingresa los datos para crear una nueva regla."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-3 mt-3"
            >
              <FormField
                control={form.control}
                name="ruleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      Tipo de regla
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <SelectItem
                          value="number"
                          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Número
                        </SelectItem>
                        <SelectItem
                          value="percentage"
                          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Porcentaje
                        </SelectItem>
                        <SelectItem
                          value="boolean"
                          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Booleano
                        </SelectItem>
                        <SelectItem
                          value="string"
                          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Texto
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-600 dark:text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ruleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      Nombre de la regla (opcional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: Daily Drawdown Rule"
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </FormControl>
                    <FormMessage className="text-red-600 dark:text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ruleDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      Descripción (opcional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Ej: Máxima pérdida diaria permitida"
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
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
    </div>
  );
}
