"use client";

import React, { useEffect, useState } from "react";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/types";
import { type ChallengeBalance } from "@/types/challenge-template";
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
import { Edit } from "lucide-react";
import { ManagerHeader } from "./ManagerHeader";

// Validación
const balanceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  balance: z
    .number()
    .min(0, "El balance debe ser mayor o igual a 0")
    .optional(),
  isActive: z.boolean().optional(),
  hasDiscount: z.boolean().optional(),
  discount: z.string().optional(),
});

type BalanceFormData = z.infer<typeof balanceSchema>;

import type { BalancesManagerProps } from "@/types";

export function BalancesManager({ pageSize = 10 }: BalancesManagerProps) {
  // Estado
  const [balances, setBalances] = useState<ChallengeBalance[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState<ChallengeBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Form
  const form = useForm<BalanceFormData>({
    resolver: zodResolver(balanceSchema),
    defaultValues: {
      name: "",
      balance: 0,
      isActive: true,
      hasDiscount: false,
      discount: "",
    },
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
    form.reset({
      name: "",
      balance: 0,
      isActive: true,
      hasDiscount: false,
      discount: "",
    });
    setOpenModal(true);
  }

  function handleOpenEdit(item: {
    id: number;
    name: string;
    balance?: number;
    originalId?: string;
  }) {
    const balance = balancesValidation.safeFind(
      (b) => b?.balanceID === item.originalId || b?.balance === item.balance
    );
    if (balance) {
      setEditItem(balance);
      form.reset({
        name: balance.name || "",
        balance: typeof balance.balance === "number" ? balance.balance : Number(balance.balance ?? 0),
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
        await challengeTemplatesApi.updateBalance(
          editItem.balanceID,
          formValues
        );
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
    balance: item?.balance || 0, // Para mostrar en la columna balance
    originalId: item?.balanceID || "", // Guardamos el ID real para operaciones
  }));

  // Columnas para la tabla (ID, Nombre, balance)
  const columns: ColumnConfig[] = [
    { key: "id", label: "ID", type: "normal" },
    { key: "name", label: "Nombre", type: "normal" },
    { key: "balance", label: "Balance", type: "normal" },
    // { key: "aa", label: "aa", type: "normal" },
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
        className="h-8 w-8 p-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        onClick={() =>
          handleOpenEdit({
            id: Number(row.id),
            name: String(row.name || ""),
            balance: Number(row.balance || 0),
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
    <div className="bg-white dark:bg-gray-800 transition-colors duration-200">
      <ManagerHeader
        title="Balances"
        description="Gestiona los balances disponibles para los challenges"
        buttonText="Crear balance"
        onCreateClick={handleOpenCreate}
        totalCount={balances.length}
        showTotalCount={false}
      />

      <div className="px-6">
        <PaginatedCardTable
          columns={columns}
          rows={paginatedRows}
          isLoading={isLoading}
          emptyText="No hay balances disponibles"
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
      </div>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 max-w-md mx-auto shadow-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white text-sm sm:text-base md:text-lg font-semibold">
              {editItem ? "Editar" : "Crear"} balance
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
              noValidate
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
                        placeholder="Nombre del balance"
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <FormLabel className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      Balance (opcional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Monto del balance"
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) => {
                          const raw = e.target.value;
                          const normalized = raw.replace(",", ".");
                          const parsed = parseFloat(normalized);
                          field.onChange(Number.isNaN(parsed) ? undefined : parsed);
                        }}
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
