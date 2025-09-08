// UI Component interfaces

import type { ChallengeBalance, Addon, WithdrawalRule } from "@/types";

// Challenge Templates Components
export interface BalanceSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balances: ChallengeBalance[];
  initialSelected?: string[];
  initialRelationBalances?: Array<{
    challengeBalanceID: string;
    price?: number;
    isActive?: boolean;
    hasDiscount?: boolean;
    discount?: string;
    wooID?: number;
  }>;
  onConfirm?: (selectedIds: string[]) => void;
  onConfirmWithDetails?: (
    items: Array<{
      challengeBalanceID: string;
      price?: number;
      isActive?: boolean;
      hasDiscount?: boolean;
      discount?: string;
      wooID?: number;
    }>
  ) => void;
  relationName?: string;
}

// Withdrawal Rules selector modal props
export interface WithdrawalRuleSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawalRules: WithdrawalRule[];
  initialSelected?: string[];
  initialRelationWithdrawalRules?: Array<{
    ruleID: string;
    relationID: string;
    value: string;
    rule?: WithdrawalRule;
    relation?: Record<string, unknown>;
  }>;
  onConfirm?: (selectedIds: string[]) => void;
  onConfirmWithDetails?: (
    items: Array<{
      ruleID: string;
      relationID: string;
      value: string;
    }>,
    configs?: Record<string, { value: string }>
  ) => void;
  relationName?: string;
  relationID: string;
}

// New: Addon selector modal props
export interface AddonSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addons: Addon[];
  initialSelected?: string[];
  initialRelationAddons?: Array<{
    addonID: string;
    price?: number;
    isActive?: boolean;
    hasDiscount?: boolean;
    discount?: number;
    wooID?: number;
  }>;
  onConfirm?: (selectedIds: string[]) => void;
  onConfirmWithDetails?: (
    items: Array<{
      addonID: string;
      price?: number;
      isActive?: boolean;
      hasDiscount?: boolean;
      discount?: number;
      wooID?: number;
    }>
  ) => void;
  relationName?: string;
}

export interface BalancesManagerProps {
  pageSize?: number;
}

export interface StagesManagerProps {
  pageSize?: number;
}

export interface PlansManagerProps {
  pageSize?: number;
}

export interface CategoriesManagerProps {
  pageSize?: number;
}

export interface RelationsManagerProps {
  pageSize?: number;
}

export interface TemplateVisualizerProps {
  pageSize?: number;
}

// Newly added component props
export interface AddonsManagerProps {
  pageSize?: number;
}

export interface ProductsManagerProps {
  pageSize?: number;
}

// Metric Card
export interface MetricCardProps {
  color: string;
  label: string;
  icon: React.ReactNode;
  value: string;
}

export interface ThemeToggleProps {
  variant?: "default" | "minimal" | "button";
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export interface ContactCardProps {
  title?: string;
  icon?: React.ReactNode;
  fields?: Array<{
    label: string;
    value: string;
  }>;
}

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  subtitle?: string;
  className?: string;
  showProgress?: boolean;
  steps?: string[];
}
// Rows Per Page
export interface RowsPerPageProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  options?: number[];
}

// Navigation
export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
}

export interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

// Theme
export interface ThemeContextType {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark" | "system";
  storageKey?: string;
}
