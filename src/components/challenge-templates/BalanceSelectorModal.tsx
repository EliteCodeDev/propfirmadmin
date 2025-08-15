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
import type { ChallengeBalance } from "@/api/challenge-templates";

export interface BalanceSelectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    balances: ChallengeBalance[];
    initialSelected?: string[]; // balanceIDs
    onConfirm: (selectedIds: string[]) => void;
    onConfirmWithDetails?: (
        items: Array<{
            balanceID: string;
            price?: number;
            isActive?: boolean;
            hasDiscount?: boolean;
            discount?: string;
        }>
    ) => void;
}

// Datos temporales/mocks mientras no haya fetch real al backend
const MOCK_BALANCES: ChallengeBalance[] = [
    { balanceID: "bal-5k", name: "5K", isActive: true, hasDiscount: false, balance: 5000 },
    { balanceID: "bal-10k", name: "10K", isActive: true, hasDiscount: false, balance: 10000 },
    { balanceID: "bal-25k", name: "25K", isActive: true, hasDiscount: true, discount: "10%", balance: 25000 },
    { balanceID: "bal-50k", name: "50K", isActive: true, hasDiscount: false, balance: 50000 },
    { balanceID: "bal-100k", name: "100K", isActive: false, hasDiscount: false, balance: 100000 },
];

function formatAmount(n?: number) {
    if (typeof n !== "number") return "—";
    return `$${n.toLocaleString()}`;
}

export default function BalanceSelectorModal({
    open,
    onOpenChange,
    balances,
    initialSelected = [],
    onConfirm,
    onConfirmWithDetails,
}: BalanceSelectorModalProps) {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<string[]>(initialSelected);
    const [detailsOpen, setDetailsOpen] = useState<Record<string, boolean>>({});
    const [configs, setConfigs] = useState<Record<string, { price?: number; isActive?: boolean; hasDiscount?: boolean; discount?: string }>>({});
    // Usar datos mock si no vienen balances o vienen vacíos
    const sourceBalances = balances && balances.length > 0 ? balances : MOCK_BALANCES;

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
                    const b = sourceBalances.find((x) => x.balanceID === id);
                    next[id] = {
                        price: b?.balance,
                        isActive: b?.isActive,
                        hasDiscount: b?.hasDiscount,
                        discount: b?.discount,
                    };
                }
            });
            return next;
        });
    }, [selected, sourceBalances]);

    const { available, selectedList } = useMemo(() => {
        const set = new Set(selected);
        const available = sourceBalances.filter((b) => !set.has(b.balanceID));
        const selectedList = sourceBalances.filter((b) => set.has(b.balanceID));
        return { available, selectedList };
    }, [sourceBalances, selected]);

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
            <DialogContent className="w-[50vw] max-w-[40vw] sm:!max-w-6xl lg:!max-w-7xl bg-white dark:bg-black text-zinc-800 dark:text-white border border-[var(--app-secondary)]/70 dark:border-blue-500 shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-[var(--app-secondary)] dark:text-blue-400 text-base md:text-lg font-semibold">
                        Seleccionar balances
                    </DialogTitle>
                    <DialogDescription className="text-zinc-600 dark:text-gray-300 text-xs sm:text-sm">
                        Elige balances disponibles y muévelos a la lista de agregados. Puedes buscar por nombre o monto.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {/* Columna izquierda: disponibles */}
                    <div className="rounded-lg border border-zinc-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/40 border-b border-zinc-200 dark:border-gray-700 flex items-center justify-between">
                            <span className="text-sm font-medium">Disponibles</span>
                            <span className="text-xs text-gray-500">{available.length}</span>
                        </div>
                        <div className="p-3">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar balances..."
                                className="mb-3"
                            />
                            <div className="space-y-2 max-h-64 overflow-auto pr-1">
                                {filteredAvailable.length === 0 ? (
                                    <div className="text-xs text-gray-500">Sin resultados</div>
                                ) : (
                                    filteredAvailable.map((b) => (
                                        <div
                                            key={b.balanceID}
                                            className="flex items-center justify-between px-3 py-2 rounded-md border border-zinc-200 dark:border-gray-700 bg-white dark:bg-transparent"
                                        >
                                            <div>
                                                <div className="text-sm font-medium">{b.name}</div>
                                                <div className="text-xs text-gray-500">{formatAmount(b.balance)}</div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-2"
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
                    <div className="rounded-lg border border-zinc-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/40 border-b border-zinc-200 dark:border-gray-700 flex items-center justify-between">
                            <span className="text-sm font-medium">Agregados</span>
                            <span className="text-xs text-gray-500">{selected.length}</span>
                        </div>
                        <div className="p-3">
                            <div className="space-y-2 max-h-72 overflow-auto pr-1">
                                {selectedList.length === 0 ? (
                                    <div className="text-xs text-gray-500">No has agregado balances</div>
                                ) : (
                                    selectedList.map((b) => (
                                        <div key={b.balanceID} className="rounded-md border border-zinc-200 dark:border-gray-700 bg-white dark:bg-transparent">
                                            <div className="flex items-center justify-between px-3 py-2">
                                                <div>
                                                    <div className="text-sm font-medium">{b.name}</div>
                                                    <div className="text-xs text-gray-500">{formatAmount(b.balance)}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-2"
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
                                                        className="h-8 px-2"
                                                        onClick={() => remove(b.balanceID)}
                                                        title="Quitar"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {detailsOpen[b.balanceID] && (
                                                <div className="px-3 pb-3">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div>
                                                            <Label htmlFor={`price-${b.balanceID}`} className="text-xs">Precio</Label>
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
                                                                            price: e.target.value === "" ? undefined : Number(e.target.value),
                                                                        },
                                                                    }))
                                                                }
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
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
                                                            <Label htmlFor={`active-${b.balanceID}`} className="text-xs">Activo</Label>
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
                                                            <Label htmlFor={`disc-${b.balanceID}`} className="text-xs">Tiene descuento</Label>
                                                        </div>
                                                        {configs[b.balanceID]?.hasDiscount && (
                                                            <div>
                                                                <Label htmlFor={`discount-${b.balanceID}`} className="text-xs">Descuento</Label>
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
                                                                    placeholder="Ej: 10%"
                                                                />
                                                            </div>
                                                        )}
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

                <Separator className="my-2" />

                <DialogFooter className="flex items-center justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => {
                            if (onConfirmWithDetails) {
                                const items = selected.map((id) => ({
                                    balanceID: id,
                                    price: configs[id]?.price,
                                    isActive: configs[id]?.isActive,
                                    hasDiscount: configs[id]?.hasDiscount,
                                    discount: configs[id]?.discount,
                                }));
                                onConfirmWithDetails(items);
                            } else {
                                onConfirm(selected);
                            }
                            onOpenChange(false);
                        }}
                        className="bg-[var(--app-secondary)] dark:bg-blue-500 text-black hover:bg-[var(--app-secondary)]/90 dark:hover:bg-blue-400"
                    >
                        <Check className="h-4 w-4 mr-1" /> Agregar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
