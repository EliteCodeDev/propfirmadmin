export interface ColumnConfig {
  key: string;
  label: string;
  type?: "normal" | "link" | "badge";
  // Widened function parameter types to avoid contravariance issues when callers specify narrower types
  linkUrl?: string | ((value: unknown, row: Record<string, unknown>) => string);
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}
export const defaultColumns: ColumnConfig[] = [
  {
    key: "orderId",
    label: "Order ID",
    type: "normal", // Columna normal, solo muestra info
  },
  {
    key: "method",
    label: "Method",
    type: "normal",
  },
  {
    key: "amount",
    label: "Amount",
    type: "normal",
  },
  {
    key: "firstName",
    label: "First Name",
    type: "normal",
  },
  {
    key: "lastName",
    label: "Last Name",
    type: "normal",
  },
  {
    key: "email",
    label: "Email",
    type: "link",
    linkUrl: (email, row) => `/usuario/${row.orderId}`, // Link específico por cada fila
  },
  {
    key: "status",
    label: "Status",
    type: "badge", // Identificador claro: esta columna será un badge con colores
  },
];
