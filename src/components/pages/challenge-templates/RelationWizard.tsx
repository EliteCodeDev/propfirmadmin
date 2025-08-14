"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  challengeTemplatesApi,
  type ChallengeCategory,
  type ChallengePlan,
  type ChallengeBalance,
  type ChallengeStage,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

// Validaciones
const relationSchema = z.object({
  categoryID: z.string().optional(),
  planID: z.string().min(1, "El plan es requerido"),
});

const relationBalanceSchema = z.object({
  balanceID: z.string().min(1, "El balance es requerido"),
  price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  isActive: z.boolean(),
  hasDiscount: z.boolean(),
  discount: z.number().min(0).max(100, "El descuento debe estar entre 0 y 100"),
});

const relationStageSchema = z.object({
  stageID: z.string().min(1, "El stage es requerido"),
  numPhase: z.number().min(1, "La fase debe ser mayor a 0"),
});

type RelationFormData = z.infer<typeof relationSchema>;
type RelationBalanceFormData = z.infer<typeof relationBalanceSchema>;
type RelationStageFormData = z.infer<typeof relationStageSchema>;

interface RelationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RelationWizard({
  open,
  onOpenChange,
  onSuccess,
}: RelationWizardProps) {
  // Estados
  const [categories, setCategories] = useState<ChallengeCategory[]>([]);
  const [plans, setPlans] = useState<ChallengePlan[]>([]);
  const [balances, setBalances] = useState<ChallengeBalance[]>([]);
  const [stages, setStages] = useState<ChallengeStage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [createdRelationID, setCreatedRelationID] = useState<string | null>(
    null
  );

  // Estados para balances y stages seleccionados
  const [selectedBalances, setSelectedBalances] = useState<
    RelationBalanceFormData[]
  >([]);
  const [selectedStages, setSelectedStages] = useState<RelationStageFormData[]>(
    []
  );

  // Forms
  const relationForm = useForm<RelationFormData>({
    resolver: zodResolver(relationSchema),
    defaultValues: {
      categoryID: "",
      planID: "",
    },
  });

  const balanceForm = useForm<RelationBalanceFormData>({
    resolver: zodResolver(relationBalanceSchema),
    defaultValues: {
      balanceID: "",
      price: 0,
      isActive: true,
      hasDiscount: false,
      discount: 0,
    },
  });

  const stageForm = useForm<RelationStageFormData>({
    resolver: zodResolver(relationStageSchema),
    defaultValues: {
      stageID: "",
      numPhase: 1,
    },
  });

  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [categoriesData, plansData, balancesData, stagesData] =
        await Promise.all([
          challengeTemplatesApi.listCategories(),
          challengeTemplatesApi.listPlans(),
          challengeTemplatesApi.listBalances(),
          challengeTemplatesApi.listStages(),
        ]);

      setCategories(categoriesData);
      setPlans(plansData);
      setBalances(balancesData);
      setStages(stagesData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetWizard = useCallback(() => {
    setCurrentStep(1);
    setCreatedRelationID(null);
    setSelectedBalances([]);
    setSelectedStages([]);
    relationForm.reset();
    balanceForm.reset();
    stageForm.reset();
  }, [relationForm, balanceForm, stageForm]);

  // Cargar datos al abrir
  useEffect(() => {
    if (open) {
      loadAllData();
      resetWizard();
    }
  }, [open, loadAllData, resetWizard]);

  // Validaciones
  const categoriesValidation = useArrayValidation(categories);
  const plansValidation = useArrayValidation(plans);
  const balancesValidation = useArrayValidation(balances);
  const stagesValidation = useArrayValidation(stages);

  // Funciones auxiliares
  const getCategoryName = (id?: string) => {
    if (!id) return "Sin categoría";
    const category = categoriesValidation.safeFind((c) => c?.categoryID === id);
    return category?.name || "N/A";
  };

  const getPlanName = (id?: string) => {
    const plan = plansValidation.safeFind((p) => p?.planID === id);
    return plan?.name || "N/A";
  };

  const getBalanceName = (id?: string) => {
    const balance = balancesValidation.safeFind((b) => b?.balanceID === id);
    return balance?.name || "N/A";
  };

  const getStageName = (id?: string) => {
    const stage = stagesValidation.safeFind((s) => s?.stageID === id);
    return stage?.name || "N/A";
  };

  // Paso 1: Crear relación
  const onSubmitRelation = async (formValues: RelationFormData) => {
    try {
      setIsLoading(true);
      const response = await challengeTemplatesApi.createRelation(formValues);
      setCreatedRelationID(response.relationID);
      setCurrentStep(2);
      toast.success("Relación creada exitosamente");
    } catch (error) {
      console.error("Error al crear relación:", error);
      toast.error("Error al crear relación");
    } finally {
      setIsLoading(false);
    }
  };

  // Paso 2: Agregar balance
  const onAddBalance = (formValues: RelationBalanceFormData) => {
    const isDuplicate = selectedBalances.some(
      (b) => b.balanceID === formValues.balanceID
    );
    if (isDuplicate) {
      toast.error("Este balance ya ha sido agregado");
      return;
    }
    setSelectedBalances([...selectedBalances, formValues]);
    balanceForm.reset();
    toast.success("Balance agregado");
  };

  const removeBalance = (index: number) => {
    setSelectedBalances(selectedBalances.filter((_, i) => i !== index));
  };

  // Paso 3: Agregar stage
  const onAddStage = (formValues: RelationStageFormData) => {
    const isDuplicateStage = selectedStages.some(
      (s) => s.stageID === formValues.stageID
    );
    const isDuplicatePhase = selectedStages.some(
      (s) => s.numPhase === formValues.numPhase
    );

    if (isDuplicateStage) {
      toast.error("Este stage ya ha sido agregado");
      return;
    }
    if (isDuplicatePhase) {
      toast.error("Ya existe un stage con esta fase");
      return;
    }

    setSelectedStages([...selectedStages, formValues]);
    stageForm.reset({ stageID: "", numPhase: selectedStages.length + 1 });
    toast.success("Stage agregado");
  };

  const removeStage = (index: number) => {
    setSelectedStages(selectedStages.filter((_, i) => i !== index));
  };

  // Finalizar wizard
  const finishWizard = async () => {
    if (!createdRelationID) return;

    try {
      setIsLoading(true);

      // Crear relation balances
      for (const balance of selectedBalances) {
        await challengeTemplatesApi.createRelationBalance({
          ...balance,
          relationID: createdRelationID,
        });
      }

      // Crear relation stages
      for (const stage of selectedStages) {
        await challengeTemplatesApi.createRelationStage({
          ...stage,
          relationID: createdRelationID,
        });
      }

      toast.success("Relación completa creada exitosamente");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al finalizar:", error);
      toast.error("Error al finalizar la creación");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <Form {...relationForm}>
      <form
        onSubmit={relationForm.handleSubmit(onSubmitRelation)}
        className="space-y-4"
      >
        <FormField
          control={relationForm.control}
          name="categoryID"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[var(--app-secondary)] dark:text-blue-500 text-sm">
                Categoría (opcional)
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white dark:bg-transparent border border-zinc-300 dark:border-gray-700 text-zinc-800 dark:text-white text-sm">
                    <SelectValue placeholder="Selecciona una categoría (opcional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Sin categoría</SelectItem>
                  {categoriesValidation.safeMap((category) =>
                    category?.categoryID ? (
                      <SelectItem
                        key={category.categoryID}
                        value={category.categoryID}
                      >
                        {category?.name || "Sin nombre"}
                      </SelectItem>
                    ) : null
                  )}
                </SelectContent>
              </Select>
              <FormMessage className="text-red-600 dark:text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={relationForm.control}
          name="planID"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[var(--app-secondary)] dark:text-blue-500 text-sm">
                Plan
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white dark:bg-transparent border border-zinc-300 dark:border-gray-700 text-zinc-800 dark:text-white text-sm">
                    <SelectValue placeholder="Selecciona un plan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {plansValidation.safeMap((plan) =>
                    plan?.planID ? (
                      <SelectItem key={plan.planID} value={plan.planID}>
                        {plan?.name || "Sin nombre"}
                      </SelectItem>
                    ) : null
                  )}
                </SelectContent>
              </Select>
              <FormMessage className="text-red-600 dark:text-red-400" />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            Siguiente
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        Relación creada: {getCategoryName(relationForm.getValues("categoryID"))}{" "}
        - {getPlanName(relationForm.getValues("planID"))}
      </div>

      <Form {...balanceForm}>
        <form
          onSubmit={balanceForm.handleSubmit(onAddBalance)}
          className="space-y-3 border rounded-lg p-4"
        >
          <h4 className="font-medium text-[var(--app-secondary)] dark:text-blue-400">
            Agregar Balance
          </h4>

          <FormField
            control={balanceForm.control}
            name="balanceID"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Balance</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Selecciona un balance" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {balancesValidation.safeMap((balance) =>
                      balance?.balanceID ? (
                        <SelectItem
                          key={balance.balanceID}
                          value={balance.balanceID}
                        >
                          {balance?.name || "Sin nombre"} - $
                          {balance?.balance?.toLocaleString() || 0}
                        </SelectItem>
                      ) : null
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={balanceForm.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Precio</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={balanceForm.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Descuento (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" size="sm" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Balance
          </Button>
        </form>
      </Form>

      {/* Lista de balances agregados */}
      {selectedBalances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Balances Agregados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedBalances.map((balance, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded"
              >
                <div className="text-sm">
                  <span className="font-medium">
                    {getBalanceName(balance.balanceID)}
                  </span>
                  <span className="text-zinc-500 ml-2">
                    ${balance.price.toLocaleString()}
                  </span>
                  {balance.hasDiscount && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      -{balance.discount}%
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBalance(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep(1)}
        >
          Anterior
        </Button>
        <Button
          type="button"
          onClick={() => setCurrentStep(3)}
          disabled={selectedBalances.length === 0}
        >
          Siguiente
        </Button>
      </DialogFooter>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        Balances agregados: {selectedBalances.length}
      </div>

      <Form {...stageForm}>
        <form
          onSubmit={stageForm.handleSubmit(onAddStage)}
          className="space-y-3 border rounded-lg p-4"
        >
          <h4 className="font-medium text-[var(--app-secondary)] dark:text-blue-400">
            Agregar Stage
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={stageForm.control}
              name="stageID"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Stage</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Selecciona un stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stagesValidation.safeMap((stage) =>
                        stage?.stageID ? (
                          <SelectItem key={stage.stageID} value={stage.stageID}>
                            {stage?.name || "Sin nombre"}
                          </SelectItem>
                        ) : null
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={stageForm.control}
              name="numPhase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Número de Fase</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" size="sm" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Stage
          </Button>
        </form>
      </Form>

      {/* Lista de stages agregados */}
      {selectedStages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Stages Agregados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedStages
              .sort((a, b) => a.numPhase - b.numPhase)
              .map((stage, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded"
                >
                  <div className="text-sm">
                    <Badge variant="outline" className="mr-2">
                      Fase {stage.numPhase}
                    </Badge>
                    <span className="font-medium">
                      {getStageName(stage.stageID)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStage(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep(2)}
        >
          Anterior
        </Button>
        <Button
          type="button"
          onClick={finishWizard}
          disabled={isLoading || selectedStages.length === 0}
        >
          {isLoading ? "Creando..." : "Finalizar"}
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-black text-zinc-800 dark:text-white border border-[var(--app-secondary)]/70 dark:border-blue-500 max-w-2xl mx-auto shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-[var(--app-secondary)] dark:text-blue-400 text-lg font-semibold">
            Crear Relación Completa - Paso {currentStep} de 3
          </DialogTitle>
          <DialogDescription className="text-zinc-600 dark:text-gray-300 text-sm">
            {currentStep === 1 &&
              "Configura la relación básica entre categoría y plan"}
            {currentStep === 2 &&
              "Agrega los balances disponibles para esta relación"}
            {currentStep === 3 &&
              "Configura las etapas y sus fases para esta relación"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
