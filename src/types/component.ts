// UI Component interfaces

import type { ChallengeBalance, Addon, WithdrawalRule } from "@/types";

// Challenge Templates Components
export type BalanceSelectorModalProps = {
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
export type WithdrawalRuleSelectorModalProps = {
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
export type AddonSelectorModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addons: Addon[];
  initialSelected?: string[];
  initialRelationAddons?: Array<{
    addonID: string;
    value: number | boolean | null;
    isActive?: boolean;
    hasDiscount?: boolean;
    discount?: number;
    wooID?: number;
  }>;
  onConfirm?: (selectedIds: string[]) => void;
  onConfirmWithDetails?: (
    items: Array<{
      addonID: string;
      value: number | boolean | null;
      isActive?: boolean;
      hasDiscount?: boolean;
      discount?: number;
      wooID?: number;
    }>
  ) => void;
  relationName?: string;
}

export type BalancesManagerProps = {
  pageSize?: number;
}

export type StagesManagerProps = {
  pageSize?: number;
}

export type PlansManagerProps = {
  pageSize?: number;
}

export type CategoriesManagerProps = {
  pageSize?: number;
}

export type RelationsManagerProps = {
  pageSize?: number;
}

export type TemplateVisualizerProps = {
  pageSize?: number;
}

// Newly added component props
export type AddonsManagerProps = {
  pageSize?: number;
}

export type ProductsManagerProps = {
  pageSize?: number;
}

// Metric Card
export type MetricCardProps = {
  color: string;
  label: string;
  icon: React.ReactNode;
  value: string;
}

export type ThemeToggleProps = {
  variant?: "default" | "minimal" | "button";
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export type ContactCardProps = {
  title?: string;
  icon?: React.ReactNode;
  fields?: Array<{
    label: string;
    value: string;
  }>;
}

export type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  text?: string;
  subtitle?: string;
  className?: string;
  showProgress?: boolean;
  steps?: string[];
}
// Rows Per Page
export type RowsPerPageProps = {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  options?: number[];
}

// Navigation
export type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
}

export type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
}

// Theme
export type ThemeContextType = {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark" | "system";
  storageKey?: string;
}
