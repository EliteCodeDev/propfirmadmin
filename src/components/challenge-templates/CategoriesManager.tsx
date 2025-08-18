"use client";

import React, { useEffect, useState } from "react";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/types";
import { type ChallengeCategory } from "@/types/challenge-template";
import { challengeTemplatesApi } from "@/api/challenge-templates";

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
import { Edit, Trash2, Plus } from "lucide-react";
import { ManagerHeader } from "./ManagerHeader";

// Validación
const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

import type { CategoriesManagerProps } from "@/types";

export function CategoriesManager({ pageSize = 10 }: CategoriesManagerProps) {
  // Estado
  const [categories, setCategories] = useState<ChallengeCategory[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState<ChallengeCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Form
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  });

  // Columnas para la tabla
  const columns: ColumnConfig[] = [
    { key: "id", label: "ID", type: "normal" },
    { key: "name", label: "Nombre", type: "normal" },
  ];

  // --------------------------------------------------
  // 1. Cargar datos al montar
  // --------------------------------------------------
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const data = await challengeTemplatesApi.listCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      toast.error("Error al cargar categorías");
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

  function handleOpenEdit(row: Record<string, unknown>) {
    const category = categoriesValidation.safeFind(
      (cat) => cat?.categoryID === row.categoryID
    );
    if (category) {
      setEditItem(category);
      form.reset({
        name: category.name || "",
      });
      setOpenModal(true);
    }
  }

  async function handleDelete(row: Record<string, unknown>) {
    if (confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
      try {
        await challengeTemplatesApi.deleteCategory(String(row.categoryID));
        toast.success("Categoría eliminada exitosamente");
        await loadCategories();
      } catch (error) {
        console.error("Error al eliminar:", error);
        toast.error("Error al eliminar la categoría");
      }
    }
  }

  async function onSubmit(formValues: CategoryFormData) {
    try {
      if (editItem) {
        // Editar
        await challengeTemplatesApi.updateCategory(
          editItem.categoryID,
          formValues
        );
        toast.success("Categoría editada exitosamente");
      } else {
        // Crear
        await challengeTemplatesApi.createCategory(formValues);
        toast.success("Categoría creada exitosamente");
      }
      setOpenModal(false);
      await loadCategories(); // Refrescar datos
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Ocurrió un error al guardar");
    }
  }

  // --------------------------------------------------
  // 3. Validación y procesamiento de datos para la tabla
  // --------------------------------------------------
  const categoriesValidation = useArrayValidation(categories);

  const tableData = categoriesValidation.safeMap((item, index) => ({
    id: index + 1,
    name: item?.name || "Sin nombre",
    categoryID: item?.categoryID || "", // Mantener para operaciones internas
  }));

  const totalItems = tableData.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Función para renderizar acciones
  const renderActions = (row: Record<string, unknown>) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleOpenEdit(row)}
        className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleDelete(row)}
        className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        title="Eliminar"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  // --------------------------------------------------
  // 4. Render
  // --------------------------------------------------
  return (
    <div className="space-y-4 bg-white dark:bg-gray-800 transition-colors duration-200">
      <ManagerHeader
        title="Categorías"
        description="Gestiona las categorías disponibles para los challenges"
        buttonText="Crear Categoría"
        onCreateClick={handleOpenCreate}
        totalCount={totalItems}
        showTotalCount={false}
      />
      <div className="space-y-4">
        <PaginatedCardTable
          columns={columns}
          rows={tableData}
          isLoading={isLoading}
          emptyText="No hay categorías disponibles"
          renderActions={renderActions}
          actionsHeader="Acciones"
          pagination={{
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems,
            pageSize: pageSize,
            onPageChange: (p) => setPage(p),
            onPageSizeChange: (n) => {
              setPage(1);
            },
          }}
        />
      </div>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 max-w-md mx-auto shadow-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white text-sm sm:text-base md:text-lg font-semibold">
              {editItem ? "Editar" : "Crear"} categoría
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
                        placeholder="Nombre de la categoría"
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
    </div>
  );
}
