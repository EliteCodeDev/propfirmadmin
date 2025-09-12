"use client";

import React, { useMemo, useState, useEffect } from "react";
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
import type { AddonSelectorModalProps } from "@/types";


export default function RelationAddonsModal({
  open,
  onOpenChange,
  addons,
  initialSelected = [],
  initialRelationAddons = [],
  onConfirm = () => {},
  onConfirmWithDetails,
  relationName = "",
}: AddonSelectorModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(
    Array.from(new Set(initialSelected))
  );
  const [detailsOpen, setDetailsOpen] = useState<Record<string, boolean>>({});
  const [configs, setConfigs] = useState<
    Record<
      string,
      {
        value: number | boolean | null;
        isActive?: boolean;
        hasDiscount?: boolean;
        discount?: number;
        wooID?: number;
      }
    >
  >({});
  const [isLoading, setIsLoading] = useState(false);

  const sourceAddons = addons;

  useEffect(() => {
    if (open) setSelected(Array.from(new Set(initialSelected)));
  }, [initialSelected, open]);

  useEffect(() => {
    setConfigs((prev) => {
      const next = { ...prev } as typeof prev;
      const selSet = new Set(selected);
      Object.keys(next).forEach((k) => {
        if (!selSet.has(k)) delete (next as any)[k];
      });
      selected.forEach((id) => {
        if (!next[id]) {
          const existing = initialRelationAddons.find(
            (ra) => ra.addonID === id
          );
          if (existing) {
            next[id] = {
              value: existing.value,
              isActive: existing.isActive,
              hasDiscount: existing.hasDiscount,
              discount: existing.discount,
              wooID: existing.wooID,
            };
          } else {
            const a = sourceAddons.find((x) => x.addonID === id);
            next[id] = {
              value: 0,
              isActive: a?.isActive ?? true,
              hasDiscount: a?.hasDiscount ?? false,
              discount: a?.discount,
            };
          }
        }
      });
      return next;
    });
  }, [selected, sourceAddons, initialRelationAddons]);

  const { available } = useMemo(() => {
    const set = new Set(selected);
    const available = sourceAddons.filter((a) => !set.has(a.addonID));
    const selectedList = sourceAddons.filter((a) => set.has(a.addonID));
    return { available, selectedList };
  }, [sourceAddons, selected]);

  const filteredAvailable = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter((a) =>
      a.name.toLowerCase().includes(q)
    );
  }, [available, search]);

  function add(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }
  function remove(id: string) {
    setSelected((prev) => prev.filter((x) => x !== id));
    setConfigs((prev) => {
      const n = { ...prev } as typeof prev;
      delete (n as any)[id];
      return n;
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-auto sm:!max-w-3xl md:!max-w-5xl lg:!max-w-6xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white text-base md:text-lg font-semibold">
            {relationName
              ? `Addons para: ${relationName}`
              : "Seleccionar addons"}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
            Elige addons disponibles y muévelos a la lista de agregados. Puedes
            buscar por nombre o monto.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
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
                placeholder="Buscar addons..."
                className="mb-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="space-y-1 max-h-64 overflow-auto pr-1">
                {filteredAvailable.length === 0 ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Sin resultados
                  </div>
                ) : (
                  filteredAvailable.map((a) => (
                    <div
                      key={a.addonID}
                      className="flex items-center justify-between px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {a.name}
                        </div>

                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                        onClick={() => add(a.addonID)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

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
                {selected.length === 0 ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    No has agregado addons
                  </div>
                ) : (
                  Array.from(new Set(selected))
                    .map((id) => sourceAddons.find((a) => a.addonID === id))
                    .filter(Boolean)
                    .map((a) => (
                      <div
                        key={a!.addonID}
                        className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <div className="flex items-center justify-between px-2 py-1.5">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {a!.name}
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
                                  [a!.addonID]: !prev[a!.addonID],
                                }))
                              }
                              title="Detalles"
                            >
                              {detailsOpen[a!.addonID] ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                              onClick={() => remove(a!.addonID)}
                              title="Quitar"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {detailsOpen[a!.addonID] && (
                          <div className="px-2 pb-2 border-t border-gray-200 dark:border-gray-700 pt-2 mt-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <Label
                                  htmlFor={`value-${a!.addonID}`}
                                  className="text-xs font-medium text-gray-700 dark:text-gray-300"
                                >
                                  Valor
                                </Label>
                                <Input
                                  id={`value-${a!.addonID}`}
                                  type="number"
                                  min={0}
                                  value={typeof configs[a!.addonID]?.value === 'number' ? configs[a!.addonID]?.value?.toString() : ""}
                                  onChange={(e) =>
                                    setConfigs((prev) => ({
                                      ...prev,
                                      [a!.addonID]: {
                                        ...prev[a!.addonID],
                                        value:
                                          e.target.value === ""
                                            ? null
                                            : Number(e.target.value),
                                      },
                                    }))
                                  }
                                  className="mt-0.5 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex items-center gap-2 pt-4">
                                <Switch
                                  id={`active-${a!.addonID}`}
                                  checked={!!configs[a!.addonID]?.isActive}
                                  onCheckedChange={(val) =>
                                    setConfigs((prev) => ({
                                      ...prev,
                                      [a!.addonID]: {
                                        ...prev[a!.addonID],
                                        isActive: val,
                                      },
                                    }))
                                  }
                                />
                                <Label
                                  htmlFor={`active-${a!.addonID}`}
                                  className="text-xs font-medium text-gray-700 dark:text-gray-300"
                                >
                                  Activo
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  id={`disc-${a!.addonID}`}
                                  checked={!!configs[a!.addonID]?.hasDiscount}
                                  onCheckedChange={(val) =>
                                    setConfigs((prev) => ({
                                      ...prev,
                                      [a!.addonID]: {
                                        ...prev[a!.addonID],
                                        hasDiscount: val,
                                        ...(val ? {} : { discount: undefined }),
                                      },
                                    }))
                                  }
                                />
                                <Label
                                  htmlFor={`disc-${a!.addonID}`}
                                  className="text-xs font-medium text-gray-700 dark:text-gray-300"
                                >
                                  Tiene descuento (%)
                                </Label>
                              </div>
                              {configs[a!.addonID]?.hasDiscount && (
                                <div>
                                  <Label
                                    htmlFor={`discount-${a!.addonID}`}
                                    className="text-xs font-medium text-gray-700 dark:text-gray-300"
                                  >
                                    Descuento
                                  </Label>
                                  <Input
                                    id={`discount-${a!.addonID}`}
                                    type="number"
                                    min={0}
                                    value={configs[a!.addonID]?.discount ?? ""}
                                    onChange={(e) =>
                                      setConfigs((prev) => ({
                                        ...prev,
                                        [a!.addonID]: {
                                          ...prev[a!.addonID],
                                          discount:
                                            e.target.value === ""
                                              ? undefined
                                              : Number(e.target.value),
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
                                  htmlFor={`wooID-${a!.addonID}`}
                                  className="text-xs font-medium text-gray-700 dark:text-gray-300"
                                >
                                  WooCommerce ID (opcional)
                                </Label>
                                <Input
                                  id={`wooID-${a!.addonID}`}
                                  type="number"
                                  min={0}
                                  value={configs[a!.addonID]?.wooID ?? ""}
                                  onChange={(e) =>
                                    setConfigs((prev) => ({
                                      ...prev,
                                      [a!.addonID]: {
                                        ...prev[a!.addonID],
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
                    addonID: id,
                    value: configs[id]?.value,
                    isActive: configs[id]?.isActive,
                    hasDiscount: configs[id]?.hasDiscount,
                    discount: configs[id]?.discount,
                    wooID: configs[id]?.wooID,
                  }));

                  // Detectar cambios básicos (selección/config)
                  const initialSet = new Set(initialSelected);
                  const currentSet = new Set(selected);
                  let hasChanges =
                    initialSet.size !== currentSet.size ||
                    selected.some((id) => !initialSet.has(id));
                  if (!hasChanges) {
                    for (const id of selected) {
                      const existing = initialRelationAddons.find(
                        (ra) => ra.addonID === id
                      );
                      const cur = configs[id];
                      if (existing) {
                        if (
                          existing.value !== cur?.value ||
                          existing.isActive !== cur?.isActive ||
                          existing.hasDiscount !== cur?.hasDiscount ||
                          existing.discount !== cur?.discount ||
                          existing.wooID !== cur?.wooID
                        ) {
                          hasChanges = true;
                          break;
                        }
                      }
                    }
                  }

                  if (hasChanges) await onConfirmWithDetails(items);
                } else {
                  const initialSet = new Set(initialSelected);
                  const changed =
                    initialSet.size !== new Set(selected).size ||
                    selected.some((id) => !initialSet.has(id));
                  if (changed) await onConfirm(selected);
                }
                onOpenChange(false);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className="bg-emerald-600 text-center text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (<>
            <Check className="h-4 w-4 mr-1 animate-spin" />
            </>) : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
