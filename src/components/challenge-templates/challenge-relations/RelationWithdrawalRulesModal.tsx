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
import { Check, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import type { WithdrawalRule } from "@/types/challenge-template";
import type { WithdrawalRuleSelectorModalProps } from "@/types";

function getRuleTypeLabel(ruleType: string) {
  switch (ruleType) {
    case "number":
      return "Número";
    case "percentage":
      return "Porcentaje";
    case "boolean":
      return "Booleano";
    case "string":
      return "Texto";
    default:
      return ruleType;
  }
}

export default function RelationWithdrawalRulesModal({
  open,
  onOpenChange,
  withdrawalRules,
  initialSelected = [],
  initialRelationWithdrawalRules = [],
  onConfirm = () => {},
  onConfirmWithDetails,
  relationName = "",
  relationID,
}: WithdrawalRuleSelectorModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [detailsOpen, setDetailsOpen] = useState<Record<string, boolean>>({});
  const [configs, setConfigs] = useState<
    Record<
      string,
      {
        value: string;
      }
    >
  >({});
  const [isLoading, setIsLoading] = useState(false);

  const sourceWithdrawalRules = withdrawalRules;

  // Sincroniza selección cuando cambia initialSelected mientras está abierto
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
          // Buscar primero en los RelationWithdrawalRules existentes
          const existingRelationRule = initialRelationWithdrawalRules.find(
            (rwr) => rwr.ruleID === id
          );
          if (existingRelationRule) {
            next[id] = {
              value: existingRelationRule.value,
            };
          } else {
            // Si no existe, usar defaults basados en el tipo de regla
            const rule = sourceWithdrawalRules.find((wr) => wr.ruleID === id);
            let defaultValue: string;

            if (rule?.ruleType === "boolean") {
              defaultValue = "false";
            } else if (
              rule?.ruleType === "number" ||
              rule?.ruleType === "percentage"
            ) {
              defaultValue = "0";
            } else {
              defaultValue = "";
            }

            next[id] = {
              value: defaultValue,
            };
          }
        }
      });
      return next;
    });
  }, [selected, sourceWithdrawalRules, initialRelationWithdrawalRules]);

  const { available, selectedList } = useMemo(() => {
    const set = new Set(selected);
    const available = sourceWithdrawalRules.filter((wr) => !set.has(wr.ruleID));
    const selectedList = sourceWithdrawalRules.filter((wr) =>
      set.has(wr.ruleID)
    );
    return { available, selectedList };
  }, [sourceWithdrawalRules, selected]);

  // Ordenar las reglas seleccionadas alfabéticamente por nombre
  const selectedListSorted = useMemo(() => {
    return [...selectedList].sort((a, b) =>
      (a.nameRule || a.ruleID).localeCompare(b.nameRule || b.ruleID)
    );
  }, [selectedList]);

  const filteredAvailable = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter((wr) =>
      `${wr.nameRule || ""} ${wr.descriptionRule || ""}`
        .toLowerCase()
        .includes(q)
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

  function updateConfig(id: string, key: string, value: any) {
    setConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }));
  }

  const renderRuleValue = (rule: WithdrawalRule, id: string) => {
    const config = configs[id] || {};

    switch (rule.ruleType) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              name="value"
              checked={config.value === "true"}
              onCheckedChange={(checked) =>
                updateConfig(id, "value", checked ? "true" : "false")
              }
            />
            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {config.value === "true" ? "Sí" : "No"}
            </Label>
          </div>
        );
      case "number":
      case "percentage":
        return (
          <Input
            type="number"
            placeholder={
              rule.ruleType === "percentage" ? "0-100" : "Valor numérico"
            }
            value={config.value || ""}
            onChange={(e) => {
              updateConfig(id, "value", e.target.value);
            }}
            className="mt-0.5 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        );
      default:
        return (
          <Input
            type="text"
            placeholder="Valor de texto"
            value={config.value || ""}
            onChange={(e) => updateConfig(id, "value", e.target.value)}
            className="mt-0.5 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-auto sm:!max-w-3xl md:!max-w-5xl lg:!max-w-6xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white text-base md:text-lg font-semibold">
            {relationName
              ? `Withdrawal Rules para: ${relationName}`
              : "Seleccionar Withdrawal Rules"}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
            Elige withdrawal rules disponibles y muévelas a la lista de
            agregadas. Puedes buscar por nombre o descripción.
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
                placeholder="Buscar withdrawal rules..."
                className="mb-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="space-y-1 max-h-64 overflow-auto pr-1">
                {filteredAvailable.length === 0 ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Sin resultados
                  </div>
                ) : (
                  filteredAvailable.map((wr) => (
                    <div
                      key={wr.ruleID}
                      className="grid grid-cols-[auto,1fr] items-start gap-2 px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-shrink-0 self-start">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                          onClick={() => add(wr.ruleID)}
                          title="Agregar"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {wr.nameRule || `Rule ${wr.ruleID.slice(0, 8)}`}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {getRuleTypeLabel(wr.ruleType)}
                        </div>
                        {wr.descriptionRule && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {wr.descriptionRule}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha: agregadas */}
          <div className="md:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div className="px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Agregadas
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {selectedList.length}
              </span>
            </div>
            <div className="p-2">
              <div className="space-y-1 max-h-72 overflow-auto pr-1">
                {selectedList.length === 0 ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Sin withdrawal rules agregadas
                  </div>
                ) : (
                  selectedListSorted.map((wr) => (
                    <div
                      key={wr.ruleID}
                      className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {wr.nameRule || `Rule ${wr.ruleID.slice(0, 8)}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {getRuleTypeLabel(wr.ruleType)}
                          </div>
                          {wr.descriptionRule && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
                              {wr.descriptionRule}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                            onClick={() =>
                              setDetailsOpen((prev) => ({
                                ...prev,
                                [wr.ruleID]: !prev[wr.ruleID],
                              }))
                            }
                            title="Detalles"
                          >
                            {detailsOpen[wr.ruleID] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                            onClick={() => remove(wr.ruleID)}
                            title="Quitar"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {detailsOpen[wr.ruleID] && (
                        <div className="px-2 pb-2 border-t border-gray-200 dark:border-gray-700 pt-2 mt-1">
                          <div>
                            <Label
                              htmlFor={`value-${wr.ruleID}`}
                              className="text-xs font-medium text-gray-700 dark:text-gray-300"
                            >
                              Valor de la regla
                            </Label>
                            <div className="mt-0.5">
                              {renderRuleValue(wr, wr.ruleID)}
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

        <DialogFooter className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              setIsLoading(true);
              try {
                // Verificar si hay cambios
                const hasChanges =
                  selectedList.length !== initialSelected.length ||
                  selectedList.some(
                    (wr) => !initialSelected.includes(wr.ruleID)
                  ) ||
                  Object.keys(configs).some((ruleID) => {
                    const config = configs[ruleID];
                    const initial = initialRelationWithdrawalRules.find(
                      (r) => r.ruleID === ruleID
                    );
                    return !initial || config.value !== initial.value;
                  });

                if (!hasChanges) {
                  onOpenChange(false);
                  return;
                }

                // Preparar datos
                const data = selectedList.map((wr) => {
                  const config = configs[wr.ruleID];
                  let value = config?.value;

                  // Convertir el valor según el tipo de regla para envío al backend
                  if (wr.ruleType === "boolean") {
                    value = config?.value === "true" ? "true" : "false";
                  } else if (
                    wr.ruleType === "number" ||
                    wr.ruleType === "percentage"
                  ) {
                    value = config?.value || "0";
                  } else {
                    // Para string, asegurar que no esté vacío
                    value = config?.value || "";
                  }

                  return {
                    ruleID: wr.ruleID,
                    relationID,
                    value: value,
                  };
                });
                // Validar campos requeridos
                const invalidRules = selectedList.filter((rule) => {
                  const config = configs[rule.ruleID];
                  // Para booleanos, siempre hay un valor válido (true/false)
                  if (rule.ruleType === "boolean") {
                    return false;
                  }
                  // Para otros tipos, verificar que no esté vacío
                  return !config?.value || config.value.trim() === "";
                });

                if (invalidRules.length > 0) {
                  console.warn(
                    "Hay reglas sin valor configurado:",
                    invalidRules.map((r) => r.nameRule)
                  );
                  return;
                }

                if (onConfirmWithDetails) {
                  await onConfirmWithDetails(data, configs);
                } else if (onConfirm) {
                  await onConfirm(selected);
                }

                onOpenChange(false);
              } catch (error) {
                console.error("Error al confirmar:", error);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className="bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            {isLoading ? "Guardando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
