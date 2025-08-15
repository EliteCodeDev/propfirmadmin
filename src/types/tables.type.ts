export interface ColumnConfig {
  key: string;
  label: string;
  type?: "normal" | "link" | "badge";
  // Widened function parameter types to avoid contravariance issues when callers specify narrower types
  linkUrl?: string | ((value: unknown, row: Record<string, unknown>) => string);
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}
