"use client";

import React, { useMemo, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Check, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import type { BalanceSelectorModalProps } from "@/types";

function formatAmount(n?: number) {
  if (typeof n !== "number") return "—";
  return `$${n.toLocaleString()}`;
}

export default function BalanceSelectorModal({
  open,
  onOpenChange,
  balances,
  initialSelected = [],
  initialRelationBalances = [],
  onConfirm = () => {},
  onConfirmWithDetails,
  relationName = "",
}: BalanceSelectorModalProps) {
  console.log("initialRelationBalances for modal:", initialRelationBalances);
  console.log("relationName:", relationName);
  console.log("balances prop:", balances);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [detailsOpen, setDetailsOpen] = useState<Record<string, boolean>>({});
  const [configs, setConfigs] = useState<
    Record<
      string,
      {
        price?: number;
        isActive?: boolean;
        hasDiscount?: boolean;
        discount?: string;
        wooID?: number;
      }
    >
  >({});
  const [isLoading, setIsLoading] = useState(false);

  // Usar datos mock si no vienen balances o vienen vacíos
  const sourceBalances = balances;

  // Sincroniza seleccion cuando cambia initialSelected mientras está abierto
  React.useEffect(() => {
    if (open) setSelected(initialSelected);
  }, [initialSelected, open]);

  // Sincronizar configs default para seleccionados y limpiar los removidos
  React.useEffect(() => {
    setConfigs((prev) => {
      const next = { ...prev };
      const selSet = new Set(selected);
      // Limpiar no seleccionados
      Object.keys(next).forEach((k) => {
        if (!selSet.has(k)) delete (next as any)[k];
      });
      // Añadir defaults
      selected.forEach((id) => {
        if (!next[id]) {
          // Buscar primero en los RelationBalance existentes
          const existingRelationBalance = initialRelationBalances.find(
            (rb) => rb.challengeBalanceID === id
          );
          if (existingRelationBalance) {
            next[id] = {
              price: existingRelationBalance.price,
              isActive: existingRelationBalance.isActive,
              hasDiscount: existingRelationBalance.hasDiscount,
              discount: existingRelationBalance.discount,
              wooID: existingRelationBalance.wooID,
            };
          } else {
            // Si no existe, usar defaults del balance (sin precio por defecto)
            const b = sourceBalances.find((x) => x.balanceID === id);
            next[id] = {
              // price: undefined,
              isActive: b?.isActive ?? true,
              hasDiscount: b?.hasDiscount ?? false,
              discount: b?.discount,
            };
          }
        }
      });
      return next;
    });
  }, [selected, sourceBalances, initialRelationBalances]);

  const { available, selectedList } = useMemo(() => {
    const set = new Set(selected);
    const available = sourceBalances.filter((b) => !set.has(b.balanceID));
    const selectedList = sourceBalances.filter((b) => set.has(b.balanceID));
    return { available, selectedList };
  }, [sourceBalances, selected]);

  // Ordenar los agregados (selectedList) de menor a mayor según su balance
  const selectedListSorted = useMemo(() => {
    return [...selectedList].sort(
      (a, b) => (a.balance ?? 0) - (b.balance ?? 0)
    );
  }, [selectedList]);
  console.log("selectedListSorted", selectedListSorted);
  const filteredAvailable = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter((b) =>
      `${b.name} ${b.balance ?? ""}`.toLowerCase().includes(q)
    );
  }, [available, search]);

  function add(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }
  function remove(id: string) {
    setSelected((prev) => prev.filter((x) => x !== id));
    setConfigs((prev) => {
      const n = { ...prev };
      delete (n as any)[id];
      return n;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-auto sm:!max-w-3xl md:!max-w-5xl lg:!max-w-6xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white text-base md:text-lg font-semibold">
            {relationName ? `Balances para: ${relationName}` : "Seleccionar balances"}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
            Elige balances disponibles y muévelos a la lista de agregados.
            Puedes buscar por nombre o monto.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          {/* Columna izquierda: disponibles */}
          <div className="md:col-span-1 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div className="px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Disponibles
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {available.length}
              </span>
            </div>
            <div className="p-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar balances..."
                className="mb-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="space-y-1 max-h-64 overflow-auto pr-1">
                {filteredAvailable.length === 0 ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Sin resultados
                  </div>
                ) : (
                  filteredAvailable.map((b) => (
                    <div
                      key={b.balanceID}
                      className="flex items-center justify-between px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {b.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatAmount(b.balance)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                        onClick={() => add(b.balanceID)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha: agregados */}
          <div className="md:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div className="px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Agregados
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {selected.length}
              </span>
            </div>
            <div className="p-2">
              <div className="space-y-1 max-h-72 overflow-auto pr-1">
                {selectedListSorted.length === 0 ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    No has agregado balances
                  </div>
                ) : (
                  selectedListSorted.map((b) => (
                    <div
                      key={b.balanceID}
                      className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {b.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatAmount(b.balance)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                            onClick={() =>
                              setDetailsOpen((prev) => ({
                                ...prev,
                                [b.balanceID]: !prev[b.balanceID],
                              }))
                            }
                            title="Detalles"
                          >
                            {detailsOpen[b.balanceID] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                            onClick={() => remove(b.balanceID)}
                            title="Quitar"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {detailsOpen[b.balanceID] && (
                        <div className="px-2 pb-2 border-t border-gray-200 dark:border-gray-700 pt-2 mt-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <Label
                                htmlFor={`price-${b.balanceID}`}
                                className="text-xs font-medium text-gray-700 dark:text-gray-300"
                              >
                                Precio
                              </Label>
                              <Input
                                id={`price-${b.balanceID}`}
                                type="number"
                                min={0}
                                value={configs[b.balanceID]?.price ?? ""}
                                onChange={(e) =>
                                  setConfigs((prev) => ({
                                    ...prev,
                                    [b.balanceID]: {
                                      ...prev[b.balanceID],
                                      price:
                                        e.target.value === ""
                                          ? undefined
                                          : Number(e.target.value),
                                    },
                                  }))
                                }
                                className="mt-0.5 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-4">
                              <Switch
                                id={`active-${b.balanceID}`}
                                checked={!!configs[b.balanceID]?.isActive}
                                onCheckedChange={(val) =>
                                  setConfigs((prev) => ({
                                    ...prev,
                                    [b.balanceID]: {
                                      ...prev[b.balanceID],
                                      isActive: val,
                                    },
                                  }))
                                }
                              />
                              <Label
                                htmlFor={`active-${b.balanceID}`}
                                className="text-xs font-medium text-gray-700 dark:text-gray-300"
                              >
                                Activo
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`disc-${b.balanceID}`}
                                checked={!!configs[b.balanceID]?.hasDiscount}
                                onCheckedChange={(val) =>
                                  setConfigs((prev) => ({
                                    ...prev,
                                    [b.balanceID]: {
                                      ...prev[b.balanceID],
                                      hasDiscount: val,
                                      // Si se apaga el descuento, limpiar valor
                                      ...(val ? {} : { discount: undefined }),
                                    },
                                  }))
                                }
                              />
                              <Label
                                htmlFor={`disc-${b.balanceID}`}
                                className="text-xs font-medium text-gray-700 dark:text-gray-300"
                              >
                                Tiene descuento (%)
                              </Label>
                            </div>
                            {configs[b.balanceID]?.hasDiscount && (
                              <div>
                                <Label
                                  htmlFor={`discount-${b.balanceID}`}
                                  className="text-xs font-medium text-gray-700 dark:text-gray-300"
                                >
                                  Descuento
                                </Label>
                                <Input
                                  id={`discount-${b.balanceID}`}
                                  value={configs[b.balanceID]?.discount ?? ""}
                                  onChange={(e) =>
                                    setConfigs((prev) => ({
                                      ...prev,
                                      [b.balanceID]: {
                                        ...prev[b.balanceID],
                                        discount: e.target.value || undefined,
                                      },
                                    }))
                                  }
                                  placeholder="Ej: 10"
                                  className="mt-0.5 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            )}
                            <div>
                              <Label
                                htmlFor={`wooID-${b.balanceID}`}
                                className="text-xs font-medium text-gray-700 dark:text-gray-300"
                              >
                                WooCommerce ID (opcional)
                              </Label>
                              <Input
                                id={`wooID-${b.balanceID}`}
                                type="number"
                                min={0}
                                value={configs[b.balanceID]?.wooID ?? ""}
                                onChange={(e) =>
                                  setConfigs((prev) => ({
                                    ...prev,
                                    [b.balanceID]: {
                                      ...prev[b.balanceID],
                                      wooID:
                                        e.target.value === ""
                                          ? undefined
                                          : Number(e.target.value),
                                    },
                                  }))
                                }
                                placeholder="ID de WooCommerce"
                                className="mt-0.5 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-1.5 bg-gray-200 dark:bg-gray-700" />

        <DialogFooter className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              if (isLoading) return;

              setIsLoading(true);
              try {
                if (onConfirmWithDetails) {
                  const items = selected.map((id) => ({
                    challengeBalanceID: id,
                    price: configs[id]?.price,
                    isActive: configs[id]?.isActive,
                    hasDiscount: configs[id]?.hasDiscount,
                    discount: configs[id]?.discount,
                    wooID: configs[id]?.wooID,
                  }));

                  // Verificar si hay cambios reales
                  const hasChanges = (() => {
                    // Comparar selección actual vs inicial
                    const initialSelectedSet = new Set(initialSelected);
                    const currentSelectedSet = new Set(selected);

                    // Si cambió la cantidad o los IDs seleccionados
                    if (initialSelectedSet.size !== currentSelectedSet.size)
                      return true;
                    for (const id of selected) {
                      if (!initialSelectedSet.has(id)) return true;
                    }

                    // Comparar configuraciones de cada item seleccionado
                    for (const id of selected) {
                      const existingRelationBalance =
                        initialRelationBalances.find(
                          (rb) => rb.challengeBalanceID === id
                        );
                      const currentConfig = configs[id];

                      if (existingRelationBalance) {
                        // Comparar con datos existentes
                        if (
                          existingRelationBalance.price !==
                            currentConfig?.price ||
                          existingRelationBalance.isActive !==
                            currentConfig?.isActive ||
                          existingRelationBalance.hasDiscount !==
                            currentConfig?.hasDiscount ||
                          existingRelationBalance.discount !==
                            currentConfig?.discount ||
                          existingRelationBalance.wooID !== currentConfig?.wooID
                        ) {
                          return true;
                        }
                      } else {
                        // Es un nuevo balance, verificar si tiene configuración diferente a los defaults
                        const sourceBalance = sourceBalances.find(
                          (b) => b.balanceID === id
                        );
                        const defaultPrice = undefined;
                        const defaultIsActive = sourceBalance?.isActive ?? true;
                        const defaultHasDiscount =
                          sourceBalance?.hasDiscount ?? false;
                        const defaultDiscount = sourceBalance?.discount;

                        if (
                          currentConfig?.price !== defaultPrice ||
                          currentConfig?.isActive !== defaultIsActive ||
                          currentConfig?.hasDiscount !== defaultHasDiscount ||
                          currentConfig?.discount !== defaultDiscount ||
                          currentConfig?.wooID !== undefined
                        ) {
                          return true;
                        }
                      }
                    }

                    return false;
                  })();

                  if (hasChanges) {
                    await onConfirmWithDetails(items);
                  }
                } else {
                  // Para onConfirm simple, solo verificar si cambió la selección
                  const initialSelectedSet = new Set(initialSelected);
                  const currentSelectedSet = new Set(selected);

                  const hasSelectionChanges =
                    initialSelectedSet.size !== currentSelectedSet.size ||
                    selected.some((id) => !initialSelectedSet.has(id));

                  if (hasSelectionChanges) {
                    await onConfirm(selected);
                  }
                }
                onOpenChange(false);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4 mr-1" />{" "}
            {isLoading ? "Guardando..." : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
