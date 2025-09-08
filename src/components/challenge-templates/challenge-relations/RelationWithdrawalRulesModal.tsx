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
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
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
}: WithdrawalRuleSelectorModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [detailsOpen, setDetailsOpen] = useState<Record<string, boolean>>({});
  const [configs, setConfigs] = useState<
    Record<
      string,
      {
        ruleValue?: string | number | boolean;
        isActive?: boolean;
      }
    >
  >({});
  const [isLoading] = useState(false);

  const sourceWithdrawalRules = withdrawalRules;

  useEffect(() => {
    if (open) setSelected(initialSelected);
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
          const existing = initialRelationWithdrawalRules.find((rwr) => rwr.ruleID === id);
          if (existing) {
            next[id] = {
              ruleValue: existing.ruleValue,
              isActive: existing.isActive,
            };
          } else {
            next[id] = {
              isActive: true,
              ruleValue: "",
            };
          }
        }
      });
      return next;
    });
  }, [selected, sourceWithdrawalRules, initialRelationWithdrawalRules]);

  const { available } = useMemo(() => {
    const set = new Set(selected);
    const available = sourceWithdrawalRules.filter((wr) => !set.has(wr.ruleID));
    return { available };
  }, [sourceWithdrawalRules, selected]);

  const filteredAvailable = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter((wr) => 
  `${wr.nameRule || ''} ${wr.descriptionRule || ''}`.toLowerCase().includes(q)
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

  function updateConfig(id: string, key: string, value: any) {
    setConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }));
  }

  function handleConfirm() {
    if (onConfirmWithDetails) {
      const items = selected.map((id) => ({
        ruleID: id,
        ruleValue: configs[id]?.ruleValue,
        isActive: configs[id]?.isActive ?? true,
      }));
      onConfirmWithDetails(items);
    } else {
      onConfirm(selected);
    }
    onOpenChange(false);
  }

  const renderRuleValue = (rule: WithdrawalRule, id: string) => {
    const config = configs[id] || {};
    
    switch (rule.ruleType) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={Boolean(config.ruleValue)}
              onCheckedChange={(checked) => updateConfig(id, "ruleValue", checked)}
            />
            <Label className="text-xs">{config.ruleValue ? "Sí" : "No"}</Label>
          </div>
        );
      case "number":
      case "percentage":
        return (
          <Input
              type="number"
              placeholder={rule.ruleType === "percentage" ? "0-100" : "Valor"}
              value={typeof config.ruleValue === 'boolean' ? '' : (config.ruleValue || "")}
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Number(e.target.value);
                updateConfig(id, "ruleValue", val);
              }}
            className="h-8 text-xs"
          />
        );
      default:
        return (
          <Input
            type="text"
            placeholder="Valor"
            value={String(config.ruleValue || "")}
            onChange={(e) => updateConfig(id, "ruleValue", e.target.value)}
            className="h-8 text-xs"
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gestionar Withdrawal Rules</DialogTitle>
          <DialogDescription>
            {relationName ? `Configurar withdrawal rules para: ${relationName}` : "Selecciona y configura las withdrawal rules"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Columna izquierda: Disponibles */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
              <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Disponibles</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{filteredAvailable.length}</span>
                </div>
                <Input
                  placeholder="Buscar withdrawal rules..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="p-2 flex-1 overflow-auto">
                <div className="space-y-1 max-h-72 overflow-auto pr-1">
                  {filteredAvailable.length === 0 ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {search ? "No se encontraron withdrawal rules" : "No hay withdrawal rules disponibles"}
                    </div>
                  ) : (
                    filteredAvailable.map((wr) => (
                      <div key={wr.ruleID} className="flex items-center justify-between p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {wr.nameRule || `Rule ${wr.ruleID.slice(0, 8)}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {getRuleTypeLabel(wr.ruleType)}
                          </div>
                          {wr.descriptionRule && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                              {wr.descriptionRule}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 ml-2 border-green-300 dark:border-green-600 bg-white dark:bg-gray-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                          onClick={() => add(wr.ruleID)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Columna derecha: Seleccionadas */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
              <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Seleccionadas</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{selected.length}</span>
                </div>
              </div>
              <div className="p-2 flex-1 overflow-auto">
                  <div className="space-y-1 max-h-72 overflow-auto pr-1">
                    {selected.length === 0 ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400">No has agregado withdrawal rules</div>
                    ) : (
                      selected
                        .map((id) => sourceWithdrawalRules.find((wr) => wr.ruleID === id))
                        .filter(Boolean)
                      .map((wr) => (
                        <div key={wr!.ruleID} className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <div className="flex items-center justify-between px-2 py-1.5">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {wr!.nameRule || `Rule ${wr!.ruleID.slice(0, 8)}`}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {getRuleTypeLabel(wr!.ruleType)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                onClick={() => setDetailsOpen((prev) => ({ ...prev, [wr!.ruleID]: !prev[wr!.ruleID] }))}
                              >
                                {detailsOpen[wr!.ruleID] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 border-red-300 dark:border-red-600 bg-white dark:bg-gray-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => remove(wr!.ruleID)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {detailsOpen[wr!.ruleID] && (
                            <div className="px-2 pb-2">
                              <Separator className="mb-2" />
                              <div className="space-y-2">
                                <div>
                                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Valor de la regla</Label>
                                  {renderRuleValue(wr!, wr!.ruleID)}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={configs[wr!.ruleID]?.isActive ?? true}
                                    onCheckedChange={(checked) => updateConfig(wr!.ruleID, "isActive", checked)}
                                  />
                                  <Label className="text-xs">Activo</Label>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}