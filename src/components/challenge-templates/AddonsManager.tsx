"use client";

import React, { useEffect, useMemo, useState } from "react";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/types";
import type { Addon } from "@/types/challenge-template";
import { challengeTemplatesApi } from "@/api/challenge-templates";

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
import { Edit, Plus, Trash2 } from "lucide-react";
import { ManagerHeader } from "./ManagerHeader";

// Validación
const addonSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slugRule: z.string().optional(),
  valueType: z.enum(['number', 'boolean', 'percentage']).optional(),
  isActive: z.boolean().optional(),
  hasDiscount: z.boolean().optional(),
  discount: z.number().min(0, "Debe ser >= 0").optional(),
});

type AddonFormData = z.infer<typeof addonSchema>;

import type { AddonsManagerProps } from "@/types";

function formatAmount(n?: number) {
  if (n == null) return "-";
  try {
    return n.toLocaleString("es-ES", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    });
  } catch {
    return String(n);
  }
}

export function AddonsManager({ pageSize = 10 }: AddonsManagerProps) {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Addon | null>(null);
  const [page, setPage] = useState(1);
  const [pageSizeLocal, setPageSizeLocal] = useState(pageSize);

  const form = useForm<AddonFormData>({
    resolver: zodResolver(addonSchema),
    defaultValues: {
      name: "",
      slugRule: "",
      valueType: 'number',
      isActive: true,
      hasDiscount: false,
      discount: 0,
    },
  });

  const resetForm = () => {
    form.reset({
      name: "",
      slugRule: "",
      valueType: 'number',
      isActive: true,
      hasDiscount: false,
      discount: 0,
    });
    setEditing(null);
  };

  const fetchAddons = async () => {
    setLoading(true);
    try {
      const data = await challengeTemplatesApi.listAddons();
      setAddons(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("No se pudieron cargar los addons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ColumnConfig[] = useMemo(
    () => [
      { key: "id", label: "ID" },
      { key: "name", label: "Nombre" },
      { key: "isActive", label: "Activo" },
      { key: "discount", label: "Descuento" },
    ],
    []
  );

  async function onSubmit(values: AddonFormData) {
    try {
      const payload = {
        name: values.name,
        slugRule: values.slugRule || undefined,
        valueType: values.valueType || 'number',
        isActive: values.isActive ?? true,
        hasDiscount: values.hasDiscount ?? false,
        discount: values.hasDiscount ? values.discount ?? 0 : 0,
      };

      if (editing) {
        await challengeTemplatesApi.updateAddon(editing.addonID, payload);
        toast.success("Addon actualizado");
      } else {
        await challengeTemplatesApi.createAddon(payload);
        toast.success("Addon creado");
      }
      setOpenModal(false);
      resetForm();
      fetchAddons();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo guardar el addon");
    }
  }

  const tableRows: Record<string, unknown>[] = useMemo(
    () =>
      addons.map((a, idx) => ({
        id: idx + 1,
        name: a.name,
        isActive: a.isActive ? "Sí" : "No",
        discount: a.hasDiscount ? `Sí (${a.discount ?? 0}%)` : "No",
        originalId: a.addonID,
      })),
    [addons]
  );

  const totalPages = Math.ceil(tableRows.length / pageSizeLocal) || 1;
  const pageStart = (page - 1) * pageSizeLocal;
  const pageRows = tableRows.slice(pageStart, pageStart + pageSizeLocal);

  return (
    <div className="space-y-4">
      <ManagerHeader
        title="Addons"
        description="Gestiona tus addons disponibles"
        buttonText="Nuevo Addon"
        onCreateClick={() => {
          resetForm();
          setOpenModal(true);
        }}
      />

      <PaginatedCardTable
        columns={columns}
        rows={pageRows}
        isLoading={loading}
        actionsHeader="Acciones"
        renderActions={(row) => {
          const originalId = String(
            (row as Record<string, unknown>).originalId || ""
          );
          const addon = addons.find((a) => a.addonID === originalId);
          if (!addon) return null;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(addon);
                  form.reset({
                    name: addon.name,
                    slugRule: addon.slugRule || "",
                    valueType: addon.valueType || 'number',
                    isActive: addon.isActive ?? true,
                    hasDiscount: addon.hasDiscount ?? false,
                    discount: addon.discount ?? 0,
                  });
                  setOpenModal(true);
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  try {
                    await challengeTemplatesApi.deleteAddon(addon.addonID);
                    toast.success("Addon eliminado");
                    fetchAddons();
                  } catch (e) {
                    console.error(e);
                    toast.error("No se pudo eliminar el addon");
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        }}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems: tableRows.length,
          pageSize: pageSizeLocal,
          onPageChange: setPage,
          onPageSizeChange: (n) => {
            setPageSizeLocal(n);
            setPage(1);
          },
        }}
      />

      {/* Modal de creación/edición */}
      <Dialog
        open={openModal}
        onOpenChange={setOpenModal}
      >
        <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Addon" : "Nuevo Addon"}
            </DialogTitle>
            <DialogDescription>
              Completa la información del addon.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre del addon"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slugRule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug Rule (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Regla slug del addon"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valueType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Valor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de valor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="boolean">Booleano</SelectItem>
                        <SelectItem value="percentage">Porcentaje</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Activo</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label>{field.value ? "Sí" : "No"}</Label>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasDiscount"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>¿Tiene descuento?</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label>{field.value ? "Sí" : "No"}</Label>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descuento (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={!form.watch("hasDiscount")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">{editing ? "Guardar" : "Crear"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
