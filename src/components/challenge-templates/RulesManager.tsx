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

// Helpers
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const BASIC_SLUG_SUGGESTIONS = [
  "profit-target",
  "daily-drawdown",
  "max-drawdown",
  "trading-days",
];

// Validación
const ruleSchema = z.object({
  ruleType: z.enum(["number", "percentage", "boolean", "string"], {
    error: "Rule type is required",
  }),
  ruleName: z.string().optional(),
  descriptionRule: z.string().optional(),
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
  const [selectedSlug, setSelectedSlug] = useState<string>("");

  // Form
  const form = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      ruleType: "number",
      ruleName: "",
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
      const rulesData = await challengeTemplatesApi.listRules();
      setRules(rulesData);
    } catch (error) {
      console.error("Failed to load rules:", error);
      toast.error("Failed to load rules");
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
      descriptionRule: "",
    });
    setSelectedSlug("");
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
        descriptionRule: rule.descriptionRule || "",
      });
      setSelectedSlug(rule.slugRule || "");
      setOpenModal(true);
    }
  }

  async function onSubmit(formValues: RuleFormData) {
    try {
      // Determinar slug a enviar
      const computedFromName = slugify(formValues.ruleName || "");
      const finalSlug = selectedSlug || computedFromName;

      if (!finalSlug) {
        toast.error("Select or enter a slug for the rule");
        return;
      }

      const payload = {
        ruleType: formValues.ruleType,
        ruleName: formValues.ruleName || undefined,
        ruleDescription: formValues.descriptionRule || undefined,
        ruleSlug: finalSlug,
      };

      if (editItem) {
        // Editar
        await challengeTemplatesApi.updateRule(editItem.ruleID, payload);
        toast.success("Rule updated successfully");
      } else {
        // Crear
        await challengeTemplatesApi.createRule(payload);
        toast.success("Rule created successfully");
      }
      setOpenModal(false);
      await loadRules(); // Refrescar datos
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("An error occurred while saving");
    }
  }

  // --------------------------------------------------
  // 3. Validaciones y helpers
  // --------------------------------------------------
  const rulesValidation = useArrayValidation(rules);

  const getRuleTypeLabel = (type: string) => {
    const typeLabels = {
      number: "Number",
      percentage: "Percentage",
      boolean: "Boolean",
      string: "Text",
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  // --------------------------------------------------
  // 4. Procesar datos para la tabla
  // --------------------------------------------------
  const tableData = rulesValidation.safeMap((item, index) => {
    const typeLabelText = getRuleTypeLabel(item?.ruleType || "");
  const nameText = item?.ruleName || "Untitled";
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
    { key: "name", label: "Name", type: "normal" },
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
        title="Edit rule"
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
    title="Stage Rules"
    description="Manage the rules that can be applied to challenge stages."
    buttonText="Create Rule"
        onCreateClick={handleOpenCreate}
        totalCount={rules.length}
        showTotalCount={false}
      />

      <div className="px-6">
        <PaginatedCardTable
          columns={columns}
          rows={paginatedRows}
          isLoading={isLoading}
          emptyText="No rules available"
          actionsHeader="Actions"
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
              {editItem ? "Edit" : "Create"} rule
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base">
              {editItem
                ? "Modify the data and confirm to save changes."
                : "Enter the data to create a new rule."}
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
                      Rule type
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <SelectItem
                          value="number"
                          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Number
                        </SelectItem>
                        <SelectItem
                          value="percentage"
                          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Percentage
                        </SelectItem>
                        <SelectItem
                          value="boolean"
                          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Boolean
                        </SelectItem>
                        <SelectItem
                          value="string"
                          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Text
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-600 dark:text-red-400" />
                  </FormItem>
                )}
              />

              {/* Slug sugerencias */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                    Rule slug
                  </FormLabel>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Select one of the basics or enter a custom one
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {BASIC_SLUG_SUGGESTIONS.map((slug) => {
                    const isActive = selectedSlug === slug;
                    return (
                      <Button
                        key={slug}
                        type="button"
                        variant={isActive ? "default" : "outline"}
                        className={`h-7 px-2 text-xs ${
                          isActive
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        }`}
                        onClick={() => setSelectedSlug(slug)}
                      >
                        {slug}
                      </Button>
                    );
                  })}
                </div>

                <div className="mt-2">
                  <Input
                    value={selectedSlug}
                    onChange={(e) => setSelectedSlug(slugify(e.target.value))}
                    placeholder="E.g., profit-target"
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Lowercase letters, numbers and hyphens only.
                  </p>
                  <div className="mt-1 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Selected slug: </span>
                    <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                      {selectedSlug || "—"}
                    </code>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="ruleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      Rule name (optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="E.g., Daily Drawdown Rule"
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </FormControl>
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
                      Description (optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="E.g., Maximum daily loss allowed"
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
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 dark:bg-emerald-600 text-white hover:bg-emerald-700 dark:hover:bg-emerald-700 px-3 py-2 text-sm shadow-sm"
                >
                  {editItem ? "Save" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
