"use client";

import React, { useEffect, useState } from "react";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/components/common/tableComponent";
import {
  challengeTemplatesApi,
  type ChallengeBalance,
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
import { Edit, Plus } from "lucide-react";

// Validación
const balanceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  balance: z.number().min(0, "El balance debe ser mayor o igual a 0").optional(),
  isActive: z.boolean().optional(),
  hasDiscount: z.boolean().optional(),
  discount: z.string().optional(),
});

type BalanceFormData = z.infer<typeof balanceSchema>;

interface BalancesManagerProps {
  pageSize: number;
}

export function BalancesManager({ pageSize }: BalancesManagerProps) {
  // Estado
  const [balances, setBalances] = useState<ChallengeBalance[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState<ChallengeBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Form
  const form = useForm<BalanceFormData>({
    resolver: zodResolver(balanceSchema),
    defaultValues: { name: "", balance: 0, isActive: true, hasDiscount: false, discount: "" },
  });

  // --------------------------------------------------
  // 1. Cargar datos al montar
  // --------------------------------------------------
  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    try {
      setIsLoading(true);
      const data = await challengeTemplatesApi.listBalances();
      setBalances(data);
    } catch (error) {
      console.error("Error al cargar balances:", error);
      toast.error("Error al cargar balances");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // 2. Crear / Editar
  // --------------------------------------------------
  function handleOpenCreate() {
    setEditItem(null);
    form.reset({ name: "", balance: 0, isActive: true, hasDiscount: false, discount: "" });
    setOpenModal(true);
  }

  function handleOpenEdit(item: { id: number; name: string; precio?: number; originalId?: string }) {
    const balance = balancesValidation.safeFind(
      (b) => b?.balanceID === item.originalId || b?.balance === item.precio
    );
    if (balance) {
      setEditItem(balance);
      form.reset({
        name: balance.name || "",
        balance: balance.balance || 0,
        isActive: balance.isActive ?? true,
        hasDiscount: balance.hasDiscount ?? false,
        discount: balance.discount || "",
      });
      setOpenModal(true);
    }
  }

  async function onSubmit(formValues: BalanceFormData) {
    try {
      if (editItem) {
        // Editar
        await challengeTemplatesApi.updateBalance(editItem.balanceID, formValues);
        toast.success("Balance editado exitosamente");
      } else {
        // Crear
        await challengeTemplatesApi.createBalance(formValues);
        toast.success("Balance creado exitosamente");
      }
      setOpenModal(false);
      await loadBalances(); // Refrescar datos
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Ocurrió un error al guardar");
    }
  }

  // --------------------------------------------------
  // 3. Validación y procesamiento de datos para la tabla
  // --------------------------------------------------
  const balancesValidation = useArrayValidation(balances);
  
  const tableData = balancesValidation.safeMap((item, index) => ({
    id: index + 1, // Número secuencial para la tabla
    name: item?.name || "Sin nombre", // Mostrar el nombre del balance
    precio: item?.balance || 0, // Para mostrar en la columna precio
    originalId: item?.balanceID || "", // Guardamos el ID real para operaciones
  }));

  // Columnas para la tabla (ID, Nombre, Precio)
  const columns: ColumnConfig[] = [
    { key: "id", label: "ID", type: "normal" },
    { key: "name", label: "Nombre", type: "normal" },
    { key: "precio", label: "Precio", type: "normal" },
    { key: "aa", label: "aa", type: "normal" }
  ];

  // Paginación
  const totalPages = Math.max(1, Math.ceil(tableData.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedRows = tableData.slice(startIndex, startIndex + pageSize);

  const renderActions = (row: Record<string, unknown>) => (
    <div className="flex items-center justify-center">
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() =>
          handleOpenEdit({
            id: Number(row.id),
            name: String(row.name || ""),
            precio: Number(row.precio || 0),
            originalId: String(row.originalId || ""),
          })
        }
      >
        <Edit className="h-4 w-4" />
      </Button>
    </div>
  );

  // --------------------------------------------------
  // 4. Render
  // --------------------------------------------------
  return (
    <div>
      {/* Encabezado mínimo para mantener botón de creación, sin tocar otros cards/diseños */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Balances</h2>
        <Button onClick={handleOpenCreate} className="group">
          <Plus className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
          Crear balance
        </Button>
      </div>

      <PaginatedCardTable
        columns={columns}
        rows={paginatedRows}
        isLoading={isLoading}
        actionsHeader="Acciones"
        renderActions={renderActions}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems: tableData.length,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: () => {},
        }}
      />

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-white dark:bg-black text-zinc-800 dark:text-white border border-[var(--app-secondary)]/70 dark:border-blue-500 max-w-md mx-auto shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-[var(--app-secondary)] dark:text-blue-400 text-sm sm:text-base md:text-lg font-semibold">
              {editItem ? "Editar" : "Crear"} balance
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
                        placeholder="Nombre del balance"
                        className="bg-white dark:bg-transparent border border-zinc-300 dark:border-gray-700 text-zinc-800 dark:text-white text-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
                      />
                    </FormControl>
                    <FormMessage className="text-red-600 dark:text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--app-secondary)] dark:text-blue-500 text-sm">
                      Balance (opcional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Monto del balance"
                        className="bg-white dark:bg-transparent border border-zinc-300 dark:border-gray-700 text-zinc-800 dark:text-white text-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
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
