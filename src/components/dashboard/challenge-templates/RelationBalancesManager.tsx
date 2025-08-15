"use client";

import React, { useEffect, useState } from "react";
import { ChallengeTable } from "@/components/ui/ChallengeTable";
import {
  challengeTemplatesApi,
  type RelationBalance,
  type ChallengeRelation,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// Validación
const relationBalanceSchema = z.object({
  balanceID: z.string().min(1, "El ID de balance es requerido"),
  relationID: z.string().min(1, "El ID de relación es requerido"),
  price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  isActive: z.boolean().optional(),
  hasDiscount: z.boolean().optional(),
  discount: z.number().min(0).max(100).optional(),
});

type RelationBalanceFormData = z.infer<typeof relationBalanceSchema>;

interface RelationBalancesManagerProps {
  pageSize: number;
}

export function RelationBalancesManager({
  pageSize,
}: RelationBalancesManagerProps) {
  const [relationBalances, setRelationBalances] = useState<RelationBalance[]>(
    []
  );
  const [relations, setRelations] = useState<ChallengeRelation[]>([]);
  const [balances, setBalances] = useState<ChallengeBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRelationBalance, setEditingRelationBalance] =
    useState<RelationBalance | null>(null);

  const relationBalancesValidation = useArrayValidation(relationBalances);
  const relationsValidation = useArrayValidation(relations);
  const balancesValidation = useArrayValidation(balances);

  const form = useForm<RelationBalanceFormData>({
    resolver: zodResolver(relationBalanceSchema),
    defaultValues: {
      balanceID: "",
      relationID: "",
      price: 0,
      isActive: true,
      hasDiscount: false,
      discount: 0,
    },
  });

  const loadRelationBalances = async () => {
    try {
      setIsLoading(true);
      const [relationBalancesData, relationsData, balancesData] =
        await Promise.all([
          challengeTemplatesApi.listRelationBalances(),
          challengeTemplatesApi.listRelations(),
          challengeTemplatesApi.listBalances(),
        ]);
      setRelationBalances(relationBalancesData);
      setRelations(relationsData);
      setBalances(balancesData);
    } catch (error) {
      console.error("Error al cargar relation balances:", error);
      toast.error("Error al cargar los balances de relación");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRelationBalances();
  }, []);

  const handleCreate = () => {
    setEditingRelationBalance(null);
    form.reset({
      balanceID: "",
      relationID: "",
      price: 0,
      isActive: true,
      hasDiscount: false,
      discount: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (relationBalance: RelationBalance) => {
    setEditingRelationBalance(relationBalance);
    form.reset({
      balanceID: relationBalance.balanceID,
      relationID: relationBalance.relationID,
      price: relationBalance.price,
      isActive: relationBalance.isActive,
      hasDiscount: relationBalance.hasDiscount,
      discount: relationBalance.discount || 0,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: RelationBalanceFormData) => {
    try {
      if (editingRelationBalance) {
        await challengeTemplatesApi.updateRelationBalance(
          editingRelationBalance.relationBalanceID,
          data
        );
        toast.success("Balance de relación actualizado exitosamente");
      } else {
        await challengeTemplatesApi.createRelationBalance(data);
        toast.success("Balance de relación creado exitosamente");
      }
      setIsDialogOpen(false);
      loadRelationBalances();
    } catch (error) {
      console.error("Error al guardar balance de relación:", error);
      toast.error("Error al guardar el balance de relación");
    }
  };

  const handleDelete = async (relationBalance: RelationBalance) => {
    if (
      window.confirm(
        "¿Estás seguro de que quieres eliminar este balance de relación?"
      )
    ) {
      try {
        await challengeTemplatesApi.deleteRelationBalance(
          relationBalance.relationBalanceID
        );
        toast.success("Balance de relación eliminado exitosamente");
        loadRelationBalances();
      } catch (error) {
        console.error("Error al eliminar balance de relación:", error);
        toast.error("Error al eliminar el balance de relación");
      }
    }
  };

  const tableData = relationBalancesValidation.safeMap(
    (relationBalance, index) => {
      const relation = relationsValidation.safeFind(
        (r) => r?.relationID === relationBalance?.relationID
      );
      const balance = balancesValidation.safeFind(
        (b) => b?.balanceID === relationBalance?.balanceID
      );

      const balanceName = balance?.name || relationBalance?.balanceID || "N/A";
      const relationName =
        relation?.relationID || relationBalance?.relationID || "N/A";

      return {
        id: index + 1,
        name: `${balanceName} - ${relationName}`,
        description: `Precio: $${relationBalance?.price} | Activo: ${
          relationBalance?.isActive ? "Sí" : "No"
        } | Descuento: ${
          relationBalance?.hasDiscount ? `${relationBalance?.discount}%` : "No"
        }`,
        status: relationBalance?.isActive ? "Activo" : "Inactivo",
        originalId: relationBalance?.relationBalanceID || "",
      };
    }
  );

  return (
    <div className="space-y-6">
      <ChallengeTable
        title="Balances de Relación"
        data={tableData}
        pageSize={pageSize}
        isLoading={isLoading}
        onCreate={handleCreate}
        onEdit={(item) => {
          const relationBalance = relationBalancesValidation.safeFind(
            (rb) => rb?.relationBalanceID === item.originalId
          );
          if (relationBalance) handleEdit(relationBalance);
        }}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingRelationBalance ? "Editar" : "Crear"} Balance de Relación
            </DialogTitle>
            <DialogDescription>
              {editingRelationBalance
                ? "Modifica los datos del balance de relación."
                : "Completa los datos para crear un nuevo balance de relación."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="balanceID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Balance</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un balance" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {balancesValidation.safeMap((balance) => (
                            <SelectItem
                              key={balance?.balanceID}
                              value={balance?.balanceID || ""}
                            >
                              {balance?.name} (${balance?.balance})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="relationID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relación</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una relación" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {relationsValidation.safeMap((relation) => (
                            <SelectItem
                              key={relation?.relationID}
                              value={relation?.relationID || ""}
                            >
                              Relación {relation?.relationID}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ingresa el precio"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Activo</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasDiscount"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Tiene Descuento</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch("hasDiscount") && (
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descuento (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="Ingresa el porcentaje de descuento"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter className="flex justify-between">
                <div>
                  {editingRelationBalance && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        setIsDialogOpen(false);
                        handleDelete(editingRelationBalance);
                      }}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingRelationBalance ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
