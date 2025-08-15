"use client";

import React, { useEffect, useState } from "react";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/components/common/tableComponent";
import {
  challengeTemplatesApi,
  type ChallengeCategory,
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

// Validación
const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoriesManagerProps {
  pageSize: number;
}

export function CategoriesManager({ pageSize }: CategoriesManagerProps) {
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
        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleDelete(row)}
        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
    <div className="p-4 space-y-4 bg-white">
      {/* Header con botón de crear */}

      <div className="space-y-4">
        <div className="flex items-center gap-3 justify-between px-6">
            <Button
              onClick={handleOpenCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-all ease-in-out duration-300" />
              Crear Categoría
            </Button>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg px-4 py-2 text-white shadow-sm">
              <div className="text-xs font-medium">Total Categorías</div>
              <div className="text-lg font-bold">{totalItems}</div>
            </div>
          </div>
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
              onPageSizeChange: (n) => { setPage(1); },
            }}
          />
      </div>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-white dark:bg-black text-zinc-800 dark:text-white border border-[var(--app-secondary)]/70 dark:border-blue-500 max-w-md mx-auto shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-[var(--app-secondary)] dark:text-blue-400 text-sm sm:text-base md:text-lg font-semibold">
              {editItem ? "Editar" : "Crear"} categoría
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
                        placeholder="Nombre de la categoría"
                        className="bg-white dark:bg-transparent border border-zinc-300 dark:border-gray-700 text-zinc-800 dark:text-white text-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
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
