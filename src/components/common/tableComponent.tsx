import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

export interface ColumnConfig {
  key: string;
  label:string;
  type?: 'normal' | 'link' | 'badge';  
  // Widened function parameter types to avoid contravariance issues when callers specify narrower types
  linkUrl?: string | ((value: unknown, row: Record<string, unknown>) => string);
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

export interface DataTableProps {
  columns?: ColumnConfig[] | string[];
  data?: Record<string, unknown>[];
  // Optional color prop (currently unused visually) to align with call sites
  color?: string;
}

// Configuración de columnas más clara y comprensible
const defaultColumns: ColumnConfig[] = [
  { 
    key: 'orderId', 
    label: 'Order ID',
    type: 'normal'  // Columna normal, solo muestra info
  },
  { 
    key: 'method', 
    label: 'Method',
    type: 'normal'
  },
  { 
    key: 'amount', 
    label: 'Amount',
    type: 'normal'
  },
  { 
    key: 'firstName', 
    label: 'First Name',
    type: 'normal'
  },
  { 
    key: 'lastName', 
    label: 'Last Name',
    type: 'normal'
  },
  { 
    key: 'email', 
    label: 'Email',
    type: 'link',  
    linkUrl: (email, row) => `/usuario/${row.orderId}`  // Link específico por cada fila
  },
  { 
    key: 'status', 
    label: 'Status',
    type: 'badge'  // Identificador claro: esta columna será un badge con colores
  }
];

const defaultData = [
  {
    orderId: '6810cd3da8c44ae62a3b4d9d',
    method: 'Crypto',
    amount: '$59.5',
    firstName: 'Zamin',
    lastName: 'Mazhar',
    email: 'fabianruizsantos1@gmail.com',
    status: 'Failed'
  },
  {
    orderId: '6810cb4aa8c44ae62a3b4ca6',
    method: 'Crypto',
    amount: '$69.3',
    firstName: 'TESTER',
    lastName: 'xxxd',
    email: 'yemiworkk@z1techs.com',
    status: 'Failed'
  },
  {
    orderId: '680d1a7539b0b6e87e454d00',
    method: 'Card',
    amount: '$69.3',
    firstName: 'Ahmad',
    lastName: 'Raza',
    email: 'ahmadraza77887087@z1techs.com',
    status: 'Failed'
  },
  {
    orderId: '6809539408a88584d8788ff9',
    method: 'Card',
    amount: '$251.3',
    firstName: 'Tester',
    lastName: 'Ghost',
    email: 'muhammadahmadraza@dev@z1techs.com',
    status: 'Failed'
  },
  {
    orderId: '67f17cbf0b35e55e7c049a73',
    method: 'Card',
    amount: '$167.3',
    firstName: 'Ahmad',
    lastName: 'Raza',
    email: 'ahmadraza77887087@z1techs.com',
    status: 'Successful'
  }
];

export default function tableComponent({ columns = defaultColumns, data = defaultData }: DataTableProps) {
  // Normalizar columnas (si vienen como string[], convertir a ColumnConfig[])
  const normalizedColumns = Array.isArray(columns) && typeof columns[0] === 'string' 
    ? (columns as string[]).map(col => ({ key: col.toLowerCase().replace(' ', ''), label: col, type: 'normal' as const }))
    : columns as ColumnConfig[];

  // Función más clara para renderizar cada celda según su tipo
  const renderCell = (column: ColumnConfig, row: Record<string, unknown>) => {
    const raw = row[column.key];
    const value = typeof raw === 'string' ? raw : String(raw ?? "");
    
    // Si tiene render personalizado, usarlo
    if (column.render) {
      return column.render(value, row);
    }
    
    // Según el tipo de columna, renderizar diferente
    switch (column.type) {
      case 'link':
        // Columna tipo link - redirige a una página (URL específica por fila)
        const url = typeof column.linkUrl === 'function' 
          ? column.linkUrl(value, row)  // URL dinámica basada en la fila
          : column.linkUrl || '#';      // URL fija o # por defecto
          
        return (
          <a 
            href={url} 
            className="text-blue-400 hover:text-blue-300 font-medium hover:underline transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            {value}
          </a>
        );
        
      case 'badge':
        // Columna tipo badge - muestra estado con colores
        return (
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
            value === 'Successful' 
              ? 'bg-green-900/30 text-green-400 border border-green-700'
              : 'bg-red-900/30 text-red-400 border border-red-700'
          }`}>
            {value}
          </span>
        );
        
      case 'normal':
      default:
        // Columna normal - solo muestra el valor
        return value;
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Use fixed layout and allow wrapping to prevent horizontal overflow */}
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="bg-gray-800 border-gray-700">
            {normalizedColumns.map((column, index) => (
              <TableHead
                key={index}
                className="font-medium text-gray-300 text-xs sm:text-sm uppercase tracking-wide py-2 sm:py-4 px-3 sm:px-6 whitespace-normal break-words"
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow
              key={index}
              className="bg-gray-900 border-gray-800 hover:bg-gray-800/50 transition-colors"
            >
              {normalizedColumns.map((column, cellIndex) => (
                <TableCell
                  key={cellIndex}
                  className="py-2 sm:py-4 px-3 sm:px-6 text-gray-100 whitespace-normal break-words"
                >
                  {renderCell(column, row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
