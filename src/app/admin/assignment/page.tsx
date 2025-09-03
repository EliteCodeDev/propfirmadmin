"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";
import MainLayout from "@/components/layouts/MainLayout";
import { challengeTemplatesApi } from "@/api/challenge-templates";
import { useArrayValidation } from "@/hooks/useArrayValidation";
import {
    ChallengeCategory,
    ChallengePlan,
    ChallengeBalance,
    ChallengeRelation,
} from "@/types/challenge-template";
import {
    TrophyIcon,
    InformationCircleIcon,
    CheckIcon,
    MagnifyingGlassIcon,
    UserIcon,
    EnvelopeIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { apiBaseUrl } from "@/config";

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}

export default function AssignmentPage() {
    const { data: session } = useSession();

    // Datos de prueba mientras se implementa el fetch real
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [usersError, setUsersError] = useState<any>(null);

    // 2) Estados de búsqueda de email con autocompletado
    const [searchEmail, setSearchEmail] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingModal, setLoadingModal] = useState(false);
    const [emailSuggestions, setEmailSuggestions] = useState([]);
    const [showEmailDropdown, setShowEmailDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const emailInputRef = useRef<HTMLInputElement>(null);
    const emailDropdownRef = useRef<HTMLDivElement>(null);

    // Manejar clicks fuera del dropdown de email
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                emailInputRef.current &&
                !emailInputRef.current.contains(event.target as Node) &&
                emailDropdownRef.current &&
                !emailDropdownRef.current.contains(event.target as Node)
            ) {
                setShowEmailDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const obtenerUsuarios = async () => {
            try {
                const response = await axios.get(
                    `${apiBaseUrl}/users?page=1&limit=999999999`
                );

                // Mapear los datos de la API a la estructura esperada
                const mappedUsers = response.data.data.data.map((user: any) => ({
                    id: user.userID,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username,
                    phone: user.phone,
                    role: user.role
                }));

                setUsers(mappedUsers);
                console.log("Usuarios cargados:", mappedUsers); // Para debug
            } catch (error) {
                console.error("Error al cargar usuarios:", error);
                setUsersError(error);
            }
        };

        obtenerUsuarios();
    }, []);

    console.log(users);

    // Solo loader inicial (no volverá a mostrarse al revalidar)
    const loadingInitialUsers = loadingUsers && users?.length === 0;

    // Filtrar sugerencias de email basado en la búsqueda
    const filteredEmailSuggestions = useMemo(() => {
        if (!searchEmail.trim() || searchEmail.length < 2) return [];
        if (!Array.isArray(users)) return [];

        const filtered = users
            .filter(
                (user) =>
                    user.email && user.email.toLowerCase().includes(searchEmail.toLowerCase())
            )
            .slice(0, 10);

        console.log("Search term:", searchEmail);
        console.log("Users array:", users);
        console.log("Filtered suggestions:", filtered);

        return filtered;
    }, [users, searchEmail]);

    // Manejar selección de email del dropdown
    const handleEmailSuggestionClick = (user: any) => {
        setSearchEmail(user.email);
        setSelectedUser(user);
        setShowEmailDropdown(false);
        setHighlightedIndex(-1);
    };

    // Manejar cambio en el input de email
    const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        console.log("Input change:", value);
        setSearchEmail(value);
        setSelectedUser(null);
        setHighlightedIndex(-1);

        const shouldShow = value.length >= 2;
        console.log("Should show dropdown:", shouldShow);
        setShowEmailDropdown(shouldShow);
    };

    // Manejar navegación con teclado
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showEmailDropdown || filteredEmailSuggestions.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < filteredEmailSuggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredEmailSuggestions.length - 1
                );
                break;
            case "Enter":
                e.preventDefault();
                if (highlightedIndex >= 0) {
                    handleEmailSuggestionClick(filteredEmailSuggestions[highlightedIndex]);
                }
                break;
            case "Escape":
                setShowEmailDropdown(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    const handleSearchUser = () => {
        if (!searchEmail.trim()) {
            toast.error("Por favor ingresa un email válido.");
            return;
        }
        setLoadingSearch(true);

        if (!Array.isArray(users)) {
            toast.error("No se encontró ningún usuario con ese email.");
            setSelectedUser(null);
            setLoadingSearch(false);
            return;
        }

        const hit = users.find(
            (u) => u.email && u.email.toLowerCase() === searchEmail.toLowerCase()
        );
        if (!hit) {
            toast.error("No se encontró ningún usuario con ese email.");
            setSelectedUser(null);
        } else {
            setSelectedUser(hit);
        }
        setLoadingSearch(false);
    };

    // 3) Fetch inicial de relaciones, productos y configs (solo al montar)
    const [categories, setCategories] = useState<ChallengeCategory[]>([]);
    const [plans, setPlans] = useState<ChallengePlan[]>([]);
    const [balances, setBalances] = useState<ChallengeBalance[]>([]);
    const [relations, setRelations] = useState<ChallengeRelation[]>([]);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // Estados de selección para challenge templates
    const [selectedPlan, setSelectedPlan] = useState<ChallengePlan | null>(null);
    const [selectedCategory, setSelectedCategory] =
        useState<ChallengeCategory | null>(null);
    const [selectedBalance, setSelectedBalance] =
        useState<ChallengeBalance | null>(null);

    // Cargar todos los datos de challenge templates
    const loadChallengeData = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            const [categoriesData, plansData, balancesData, relationsData] =
                await Promise.all([
                    challengeTemplatesApi.listCategories(),
                    challengeTemplatesApi.listPlans(),
                    challengeTemplatesApi.listBalances(),
                    challengeTemplatesApi.listRelations(),
                ]);

            setCategories(categoriesData);
            setPlans(plansData);
            setBalances(balancesData);
            setRelations(relationsData);

            console.log("Challenge data loaded:", {
                categories: categoriesData,
                plans: plansData,
                balances: balancesData,
                relations: relationsData,
            });
        } catch (error: unknown) {
            console.error("Error al cargar datos de challenge:", error);
            setError(error instanceof Error ? error.message : "Error desconocido");
            toast.error("Error al cargar datos de challenge templates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadChallengeData();
    }, []);

    // Validaciones de arrays
    const categoriesValidation = useArrayValidation(categories);
    const plansValidation = useArrayValidation(plans);
    const balancesValidation = useArrayValidation(balances);
    const relationsValidation = useArrayValidation(relations);

    // Buscar relación basada en selecciones (como en TemplateVisualizer)
    const currentRelation = useMemo(() => {
        if (!selectedPlan || !selectedCategory) return null;

        return relationsValidation.safeFind(
            (rel) =>
                rel?.planID === selectedPlan.planID &&
                rel?.categoryID === selectedCategory.categoryID
        );
    }, [selectedPlan, selectedCategory, relationsValidation]);

    // Obtener balances disponibles para la relación actual (como en TemplateVisualizer)
    const availableBalances = useMemo(() => {
        if (!currentRelation?.balances) return [];

        return currentRelation.balances
            .map((rb) => {
                const balance = balancesValidation.safeFind(
                    (b) => b?.balanceID === rb.balanceID
                );
                return {
                    relationBalance: rb,
                    balance,
                };
            })
            .filter((item) => item.balance);
    }, [currentRelation, balancesValidation]);

    // 5) Estados de selección (actualizados para trabajar con challenge templates)
    const [selectedStep, setSelectedStep] = useState<any>(null);
    const [selectedRelation, setSelectedRelation] = useState<any>(null);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [selectedStage, setSelectedStage] = useState<any>(null);

    // Handlers para challenge plans y categories
    const handlePlanClick = (plan: ChallengePlan) => {
        setSelectedPlan(plan);
        setSelectedBalance(null); // Reset balance when plan changes
    };

    const handleCategoryClick = (category: ChallengeCategory) => {
        setSelectedCategory(category);
        setSelectedBalance(null); // Reset balance when category changes
    };

    const handleBalanceClick = (balance: ChallengeBalance) => {
        setSelectedBalance(balance);
    };

    // Usar currentRelation como selectedRelation para compatibilidad
    useEffect(() => {
        setSelectedRelation(currentRelation);
    }, [currentRelation]);

    const handleProductClick = (prod: any) => setSelectedProduct(prod);

    // 6) Matching variation (simplificado ya que usamos relaciones directas)
    const matchingVariation = useMemo(() => {
        if (!selectedBalance || !currentRelation) return null;

        // Buscar la relación de balance específica
        const relationBalance = currentRelation.balances?.find(
            (rb) => rb.balanceID === selectedBalance.balanceID
        );

        return relationBalance
            ? {
                wooId: relationBalance.wooID,
                price: relationBalance.price,
            }
            : null;
    }, [selectedBalance, currentRelation]);

    // 7) Continuar al checkout
    const handleContinue = async () => {
        if (!session) {
            signIn(undefined, { callbackUrl: window.location.href });
            return;
        }
        if (!selectedUser) {
            toast.error("Primero busca y selecciona un usuario.");
            return;
        }
        if (!selectedPlan || !selectedCategory || !selectedBalance) {
            toast.error("Selecciona plan, categoría y balance.");
            return;
        }

        if (selectedBalance && matchingVariation) {
            const postData =
                {
                        user: {
                            email: selectedUser.email,
                            name: `${selectedUser.firstName} ${selectedUser.lastName}`,
                            billing: {
                                first_name: selectedUser.firstName,
                                last_name: selectedUser.lastName,
                                address_1: "Trujillo - Esperanza",
                                city: "Trujillo",
                                state: "LAL",
                                postcode: "13009",
                                country: "PE",
                                phone: selectedUser.phone || "+51111111111"
                            }
                        },
                        status: "completed",
                        wooID: 999,
                        total: matchingVariation.price || 0,
                        product: {
                            productID: matchingVariation.wooId || 999,
                            variationID: matchingVariation.wooId || 999,
                            name: `${selectedPlan.name} - ${selectedCategory.name} - ${selectedBalance.name || selectedBalance.balance}`,
                            price: matchingVariation.price || 0
                        }
                };

            console.log("Assignment data prepared:", postData);
            setLoadingModal(true);

            try {
                const res = await fetch(`${apiBaseUrl}/orders/create-complete`, {
                    method: "POST",
                    headers: {
                        // "x-api-key":
                        "Content-Type": "application/json" 
                    },
                    body: JSON.stringify(postData)
                });
                const data = await res.json();
                setLoadingModal(false);
                
                if (res.ok && data.success) {
                    toast.success("Challenge asignado exitosamente");
                    // Reset form
                    setSelectedUser(null);
                    setSelectedPlan(null);
                    setSelectedCategory(null);
                    setSelectedBalance(null);
                    setSearchEmail("");
                } else {
                    toast.error(data.message || "Error al asignar challenge");
                }
            } catch (error) {
                console.error("Error assigning challenge:", error);
                setLoadingModal(false);
                toast.error("Error al asignar challenge");
            }
        } else {
            toast.error("Datos de challenge incompletos");
        }
    };

    // 8) Render & loaders
    if (loading || loadingInitialUsers) {
        return (
            <MainLayout>
                <div className="relative min-h-[420px] flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-purple-50/60 to-transparent dark:from-blue-950/30 dark:via-purple-950/20" />
                    <div className="relative flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-zinc-200 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando configuración de retos…</p>
                    </div>
                </div>
            </MainLayout>
        );
    }
    if (error || usersError) {
        return (
            <MainLayout>
                <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                    <h2 className="text-red-800 font-semibold mb-1">No pudimos cargar los datos</h2>
                    <p className="text-red-600 text-sm">Intenta de nuevo más tarde.</p>
                </div>
            </MainLayout>
        );
    }

    // Helper UI blocks (purely visual; no logic changes)
    const Step = ({ index, label, active, done }: { index: number; label: string; active?: boolean; done?: boolean }) => (
        <div className="flex items-center gap-3">
            <div className={classNames(
                "w-8 h-8 grid place-items-center rounded-full border text-sm font-semibold",
                done ? "bg-green-500 text-white border-green-500" : active ? "bg-blue-600 text-white border-blue-600" : "bg-white border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700 text-zinc-500"
            )}>
                {done ? <CheckIcon className="w-4 h-4" /> : index}
            </div>
            <span className={classNames("text-sm", active ? "text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400")}>{label}</span>
        </div>
    );

    return (
        <MainLayout>
            {/* Page header */}
            <section className="p-6">
                <div className="mb-6 relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-800">
                    <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_45%),radial-gradient(ellipse_at_bottom_left,rgba(147,51,234,0.12),transparent_45%)]" />
                    <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-3">
                                {/* <TrophyIcon className="w-7 h-7 text-blue-600" /> */}
                                Asignar Challenge
                            </h1>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Elige plan, categoría y balance; luego selecciona el comprador.</p>
                        </div>
                        {/* Visual stepper */}
                        <div className="flex items-center gap-6">
                            <Step index={1} label="Plan" done={!!selectedPlan} active={!selectedPlan} />
                            <div className="w-10 h-px bg-zinc-200 dark:bg-zinc-400" />
                            <Step index={2} label="Categoría" done={!!selectedCategory} active={!!selectedPlan && !selectedCategory} />
                            <div className="w-10 h-px bg-zinc-200 dark:bg-zinc-400" />
                            <Step index={3} label="Balance" done={!!selectedBalance} active={!!selectedCategory && !selectedBalance} />
                            <div className="w-10 h-px bg-zinc-200 dark:bg-zinc-400" />
                            <Step index={4} label="Comprador" active={!!selectedBalance && !selectedUser} done={!!selectedUser} />
                        </div>
                    </div>
                </div>

                <form onSubmit={(e) => e.preventDefault()} className="w-full mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                            {/* Challenge Plans */}
                            <section className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 dark:bg-gray-800 dark:border-zinc-800">
                                <div className="flex items-center mb-3">
                                    <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold">Planes disponibles</h3>
                                    <div className="relative ml-2 group">
                                        <InformationCircleIcon className="h-5 w-5 text-zinc-500 group-hover:text-zinc-400" />
                                        <div className="absolute z-10 invisible group-hover:visible bg-zinc-800 text-xs text-zinc-200 p-2 rounded-md w-56 top-full left-0 mt-1">
                                            Selecciona el plan de challenge que deseas asignar.
                                        </div>
                                    </div>
                                </div>
                                <p className="text-zinc-600 mb-4 text-sm dark:text-zinc-400">
                                    Elige un plan para continuar.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                    {plansValidation.safeMap((plan, index) => (
                                        <div key={`plan-${plan?.planID ?? "unknown"}-${index}`} className="relative">
                                            <input
                                                type="radio"
                                                id={`plan-${index}`}
                                                name="plan"
                                                checked={selectedPlan?.planID === plan?.planID}
                                                onChange={() => handlePlanClick(plan)}
                                                className="sr-only"
                                            />
                                            <label
                                                htmlFor={`plan-${index}`}
                                                className={classNames(
                                                    "block p-4 rounded-xl border cursor-pointer transition-all aria-checked:shadow-sm",
                                                    selectedPlan?.planID === plan?.planID
                                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent"
                                                        : "bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                                )}
                                                aria-checked={selectedPlan?.planID === plan?.planID}
                                                role="radio"
                                            >
                                                <span className="block font-medium leading-tight">{plan?.name || "Sin nombre"}</span>
                                                {selectedPlan?.planID === plan?.planID && (
                                                    <CheckIcon className="absolute top-4 right-4 h-5 w-5" />
                                                )}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Challenge Categories */}
                            {selectedPlan && (
                                <section className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 dark:bg-gray-800 dark:border-zinc-800">
                                    <div className="flex items-center mb-3">
                                        <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold">Categorías del plan</h3>
                                        <div className="relative ml-2 group">
                                            <InformationCircleIcon className="h-5 w-5 text-zinc-500 group-hover:text-zinc-400" />
                                            <div className="absolute z-10 invisible group-hover:visible bg-zinc-800 text-xs text-zinc-200 p-2 rounded-md w-56 top-full left-0 mt-1">
                                                Selecciona la categoría que deseas asignar.
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-zinc-600 mb-4 text-sm dark:text-zinc-400">
                                        Para <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedPlan.name}</span>.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {categoriesValidation.safeMap((category, index) => (
                                            <div key={`category-${category?.categoryID ?? "unknown"}-${index}`} className="relative">
                                                <input
                                                    type="radio"
                                                    id={`category-${index}`}
                                                    name="category"
                                                    checked={selectedCategory?.categoryID === category?.categoryID}
                                                    onChange={() => handleCategoryClick(category)}
                                                    className="sr-only"
                                                />
                                                <label
                                                    htmlFor={`category-${index}`}
                                                    className={classNames(
                                                        "block p-4 rounded-xl border cursor-pointer transition-all aria-checked:shadow-sm relative",
                                                        selectedCategory?.categoryID === category?.categoryID
                                                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent"
                                                            : "bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                                    )}
                                                    aria-checked={selectedCategory?.categoryID === category?.categoryID}
                                                    role="radio"
                                                >
                                                    <span className="block font-medium leading-tight">{category?.name || "Sin nombre"}</span>
                                                    {selectedCategory?.categoryID === category?.categoryID && (
                                                        <CheckIcon className="absolute top-4 right-4 h-5 w-5" />
                                                    )}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Account Balances */}
                            {selectedPlan && selectedCategory && availableBalances.length > 0 && (
                                <section className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 dark:bg-gray-800 dark:border-zinc-800">
                                    <div className="flex items-center mb-3">
                                        <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold">Balance de cuenta</h3>
                                        <div className="relative ml-2 group">
                                            <InformationCircleIcon className="h-5 w-5 text-zinc-500 group-hover:text-zinc-400" />
                                            <div className="absolute z-10 invisible group-hover:visible bg-zinc-800 text-xs text-zinc-200 p-2 rounded-md w-56 top-full left-0 mt-1">
                                                Selecciona el balance de cuenta a asignar.
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-zinc-600 mb-4 text-sm dark:text-zinc-400">
                                        Para {selectedPlan.name} — {selectedCategory.name}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {availableBalances.map((balanceDetail, index) => {
                                            const isSelected =
                                                selectedBalance?.balanceID === balanceDetail.balance?.balanceID;
                                            const balanceLabel =
                                                balanceDetail.balance?.name ||
                                                (typeof balanceDetail.balance?.balance === "number"
                                                    ? balanceDetail.balance.balance.toLocaleString()
                                                    : "Sin balance");

                                            return (
                                                <div
                                                    key={`balance-${balanceDetail.balance?.balanceID ?? "unknown"}-${index}`}
                                                    className="relative"
                                                >
                                                    <input
                                                        type="radio"
                                                        id={`balance-${index}`}
                                                        name="balance"
                                                        checked={isSelected}
                                                        onChange={() =>
                                                            balanceDetail.balance && handleBalanceClick(balanceDetail.balance)
                                                        }
                                                        className="sr-only"
                                                    />
                                                    <label
                                                        htmlFor={`balance-${index}`}
                                                        className={classNames(
                                                            "block p-4 rounded-xl border cursor-pointer transition-all aria-checked:shadow-sm relative",
                                                            isSelected
                                                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent"
                                                                : "bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                                        )}
                                                        aria-checked={isSelected}
                                                        role="radio"
                                                    >
                                                        {balanceDetail.relationBalance?.hasDiscount && (
                                                            <div className="absolute -top-2 -left-2 bg-green-500 text-white w-8 h-8 rounded-tl-md rounded-br-xl grid place-items-center shadow-sm">
                                                                <span className="text-lg font-bold">%</span>
                                                            </div>
                                                        )}
                                                        <span className="block font-medium leading-tight">{balanceLabel}</span>
                                                        <span className="block text-sm mt-1 opacity-90">
                                                            ${balanceDetail.relationBalance?.price?.toLocaleString() || "0"}
                                                        </span>
                                                        {isSelected && <CheckIcon className="absolute top-4 right-4 h-5 w-5" />}
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* Email + Buscar */}
                            {selectedBalance && (
                                <section className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 dark:bg-gray-800 dark:border-zinc-800">
                                    <div className="flex items-center mb-3">
                                        <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold">Email del comprador</h3>
                                    </div>
                                    <div className="relative mb-4">
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <div className="relative">
                                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                                    <input
                                                        ref={emailInputRef}
                                                        type="email"
                                                        value={searchEmail}
                                                        onChange={handleEmailInputChange}
                                                        onKeyDown={handleKeyDown}
                                                        onFocus={() => {
                                                            console.log("Input focused, searchEmail:", searchEmail);
                                                            if (searchEmail.length >= 2) {
                                                                console.log("Setting dropdown to true");
                                                                setShowEmailDropdown(true);
                                                            }
                                                        }}
                                                        placeholder="Buscar usuario por email…"
                                                        className="w-full pl-10 pr-4 py-3.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-white dark:border-zinc-700 transition-all"
                                                        aria-autocomplete="list"
                                                        aria-expanded={showEmailDropdown}
                                                        aria-controls="email-suggestions"
                                                    />
                                                </div>

                                                {/* Dropdown de sugerencias de email */}
                                                {showEmailDropdown && filteredEmailSuggestions.length > 0 && (
                                                    <div
                                                        ref={emailDropdownRef}
                                                        id="email-suggestions"
                                                        className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-xl shadow-xl max-h-72 overflow-y-auto backdrop-blur-sm"
                                                        role="listbox"
                                                    >
                                                        <div className="p-2 border-b border-zinc-100 dark:border-zinc-700">
                                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 px-2 py-1">
                                                                {filteredEmailSuggestions.length} usuario
                                                                {filteredEmailSuggestions.length !== 1 ? "s" : ""} encontrado
                                                                {filteredEmailSuggestions.length !== 1 ? "s" : ""}
                                                            </p>
                                                        </div>
                                                        {filteredEmailSuggestions.map((user, index) => (
                                                            <div
                                                                key={user.id}
                                                                onClick={() => handleEmailSuggestionClick(user)}
                                                                className={classNames(
                                                                    "mx-2 my-1 px-4 py-3 cursor-pointer rounded-lg transition-all",
                                                                    index === highlightedIndex
                                                                        ? "bg-gradient-to-r from-blue-500/15 to-purple-500/15 border border-blue-500/30"
                                                                        : "hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                                                                )}
                                                                role="option"
                                                                aria-selected={index === highlightedIndex}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex-shrink-0">
                                                                        <div
                                                                            className={classNames(
                                                                                "w-10 h-10 rounded-full grid place-items-center",
                                                                                index === highlightedIndex
                                                                                    ? "bg-blue-500/15"
                                                                                    : "bg-zinc-100 dark:bg-zinc-700"
                                                                            )}
                                                                        >
                                                                            <UserIcon
                                                                                className={classNames(
                                                                                    "h-5 w-5",
                                                                                    index === highlightedIndex
                                                                                        ? "text-blue-600"
                                                                                        : "text-zinc-500 dark:text-zinc-400"
                                                                                )}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <EnvelopeIcon
                                                                                className={classNames(
                                                                                    "h-4 w-4 flex-shrink-0",
                                                                                    index === highlightedIndex ? "text-blue-600" : "text-zinc-400"
                                                                                )}
                                                                            />
                                                                            <span
                                                                                className={classNames(
                                                                                    "font-medium truncate",
                                                                                    index === highlightedIndex
                                                                                        ? "text-blue-700 dark:text-blue-400"
                                                                                        : "text-zinc-900 dark:text-white"
                                                                                )}
                                                                            >
                                                                                {user.email}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <UserIcon className="h-3 w-3 text-zinc-400 flex-shrink-0" />
                                                                            <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                                                                                {user.firstName || "Sin nombre"} {user.lastName || ""}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div className="p-2 border-t border-zinc-100 dark:border-zinc-700">
                                                            <p className="text-xs text-zinc-400 dark:text-zinc-500 px-2 text-center">
                                                                Usa ↑↓ para navegar • Enter para seleccionar • Esc para cerrar
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleSearchUser}
                                                disabled={loadingSearch}
                                                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
                                            >
                                                {loadingSearch ? "Buscando…" : "Buscar"}
                                            </button>
                                        </div>
                                    </div>
                                    {selectedUser && (
                                        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-800/60 dark:to-zinc-800">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <p className="text-sm">
                                                    <span className="text-zinc-500">ID</span>
                                                    <br />
                                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedUser.id}</span>
                                                </p>
                                                <p className="text-sm">
                                                    <span className="text-zinc-500">Email</span>
                                                    <br />
                                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedUser.email}</span>
                                                </p>
                                                <p className="text-sm">
                                                    <span className="text-zinc-500">Nombre</span>
                                                    <br />
                                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedUser.firstName} {selectedUser.lastName}</span>
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Continue Button */}
                            {selectedBalance && (
                                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
                                    {loadingModal && (
                                        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50">
                                            <div className="bg-zinc-900 p-8 rounded-2xl text-center text-white w-[320px] border border-zinc-700">
                                                <div className="w-14 h-14 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                                                <p className="mt-4 text-sm">Redirigiendo a checkout…</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-5">
                                        <button
                                            onClick={handleContinue}
                                            disabled={!selectedUser || loadingModal}
                                            className={classNames(
                                                "w-full flex items-center justify-center px-4 py-4 text-base rounded-xl transition-all shadow-sm",
                                                selectedUser
                                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-95"
                                                    : "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                                            )}
                                        >
                                            <span>{loadingModal ? "Redirigiendo…" : "Continuar"}</span>
                                            <ChevronRightIcon className="h-5 w-5 ml-2" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </section>
        </MainLayout>
    );
}
