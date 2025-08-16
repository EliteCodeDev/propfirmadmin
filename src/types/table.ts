// Table and pagination related interfaces

export interface ColumnConfig {
  key: string;
  label: string;
  type?: 'normal' | 'link' | 'badge';
  linkUrl?: string | ((value: unknown, row: Record<string, unknown>) => string);
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

export interface DataTableProps {
  columns?: ColumnConfig[] | string[];
  data?: Record<string, unknown>[];
  color?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export type ActionsRenderer = (row: Record<string, unknown>, index: number) => React.ReactNode;

export interface PaginatedCardTableProps {
  subtitleBadge?: string;
  columns: ColumnConfig[];
  rows: Record<string, unknown>[];
  isLoading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyText?: string;
  emptyHint?: string;
  actionsHeader?: string;
  renderActions?: ActionsRenderer;
  pagination: PaginationProps;
}