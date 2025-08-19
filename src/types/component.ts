// UI Component interfaces

import type { ChallengeBalance } from "@/types";

// Challenge Templates Components
export interface BalanceSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balances: ChallengeBalance[];
  initialSelected?: string[];
  initialRelationBalances?: Array<{
    balanceID: string;
    price?: number;
    isActive?: boolean;
    hasDiscount?: boolean;
    discount?: string;
    wooID?: number;
  }>;
  onConfirm?: (selectedIds: string[]) => void;
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
