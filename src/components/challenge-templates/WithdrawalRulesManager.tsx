"use client";

import React, { useEffect, useState } from "react";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/types";
import { WithdrawalRule } from "@/types/challenge-template";
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
const withdrawalRuleSchema = z.object({
  ruleType: z.enum(["number", "percentage", "boolean", "string"], {
    error: "El tipo de regla es requerido",
  }),
  nameRule: z.string().min(1, "El nombre es requerido"),
  // slugRule se genera automáticamente a partir del nombre
  descriptionRule: z.string().optional(),
});

type WithdrawalRuleFormData = z.infer<typeof withdrawalRuleSchema>;

interface WithdrawalRulesManagerProps {
  pageSize?: number;
}

export function WithdrawalRulesManager({ pageSize = 10 }: WithdrawalRulesManagerProps) {
  // Estado
  const [rules, setRules] = useState<WithdrawalRule[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState<WithdrawalRule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSizeLocal, setPageSizeLocal] = useState(pageSize);

  // Form
  const form = useForm<WithdrawalRuleFormData>({
    resolver: zodResolver(withdrawalRuleSchema),
    defaultValues: {
      ruleType: "number",
      nameRule: "",
      descriptionRule: "",
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
      const rulesData = await challengeTemplatesApi.listWithdrawalRules();
      setRules(rulesData);
    } catch (error) {
      console.error("Error al cargar reglas de retiro:", error);
      toast.error("Error al cargar reglas de retiro");
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
      nameRule: "",
      descriptionRule: "",
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
        nameRule: rule.nameRule || "",
        descriptionRule: rule.descriptionRule || "",
      });
      setOpenModal(true);
    }
  }

  async function onSubmit(formValues: WithdrawalRuleFormData) {
    try {
      const slug = slugify(formValues.nameRule || "");
      const payload = {
        ruleType: formValues.ruleType,
        nameRule: formValues.nameRule,
        slugRule: slug,
        descriptionRule: formValues.descriptionRule || undefined,
      };

      if (editItem) {
        // Editar
        await challengeTemplatesApi.updateWithdrawalRule(editItem.ruleID, payload);
        toast.success("Regla de retiro editada exitosamente");
      } else {
        // Crear
        await challengeTemplatesApi.createWithdrawalRule(payload);
        toast.success("Regla de retiro creada exitosamente");
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

  // Helper para generar slugs desde el nombre
  const slugify = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita acentos
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-") // reemplaza no alfanum por '-'
      .replace(/^-+|-+$/g, ""); // elimina guiones al inicio/fin

  // Valor de slug derivado (solo lectura)
  const nameValue = form.watch("nameRule");

  const getslugRuleLabel = (type: string) => {
    const typeLabels = {
      number: "Número",
      percentage: "Porcentaje",
      boolean: "Booleano",
      string: "Texto",
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  // --------------------------------------------------
  // 4. Datos para la tabla
  // --------------------------------------------------
  const tableData = rulesValidation.safeMap((item, index) => ({
    id: index + 1,
    name: item?.nameRule || "Sin nombre",
    type: getslugRuleLabel(item?.ruleType || ""),
    description: item?.descriptionRule || "Sin descripción",
    originalId: item?.ruleID || "",
  }));

  const columns: ColumnConfig[] = [
    { key: "id", label: "ID", type: "normal" },
    { key: "name", label: "Nombre", type: "normal" },
    { key: "type", label: "Tipo", type: "normal" },
    { key: "description", label: "Descripción", type: "normal" },
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
        title="Editar regla de retiro"
      >
        <Edit className="h-4 w-4" />
      </button>
    </div>
  );

  // --------------------------------------------------
  // 5. Render
  // --------------------------------------------------
  return (
    <>
      <ManagerHeader
        title="Reglas de Retiro"
        description="Gestiona las reglas de retiro disponibles para los challenges"
        buttonText="Crear regla de retiro"
        onCreateClick={handleOpenCreate}
        totalCount={rules.length}
        showTotalCount={false}
      />

      <div className="px-6">
        <PaginatedCardTable
          columns={columns}
          rows={paginatedRows}
          isLoading={isLoading}
          emptyText="No hay reglas de retiro disponibles"
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
              {editItem ? "Editar" : "Crear"} regla de retiro
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base">
              {editItem
                ? "Modifica los datos y confirma para guardar cambios."
                : "Ingresa los datos para crear una nueva regla de retiro."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-3 mt-3"
            >
              <FormField
                control={form.control}
                name="nameRule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      Nombre
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nombre de la regla"
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">El slug se genera automáticamente.</p>
                    <FormMessage className="text-red-600 dark:text-red-400" />
                  </FormItem>
                )}
              />
              {/* Vista previa del slug (solo lectura) */}
              <FormItem>
                <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">Slug</FormLabel>
                <FormControl>
                  <Input
                    value={slugify(nameValue || "")}
                    disabled
                    readOnly
                    className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm"
                  />
                </FormControl>
              </FormItem>

              <FormField
                control={form.control}
                name="ruleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      Tipo de regla
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="percentage">Porcentaje</SelectItem>
                        <SelectItem value="boolean">Booleano</SelectItem>
                        <SelectItem value="string">Texto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-600 dark:text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descriptionRule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      Descripción (opcional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Descripción de la regla"
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
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
  );
}