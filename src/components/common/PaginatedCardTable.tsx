"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ColumnConfig } from "./tableComponent";

export type ActionsRenderer = (row: Record<string, unknown>, index: number) => React.ReactNode;

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number; // opcional si no está disponible
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

interface PaginatedCardTableProps {
  title: string;
  subtitleBadge?: string; // texto entre paréntesis junto al título, ej: (Verificados)
  columns: ColumnConfig[];
  rows: Record<string, unknown>[];
  isLoading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyText?: string;
  emptyHint?: string;
  actionsHeader?: string; // si existe, se añade una columna de acciones
  renderActions?: ActionsRenderer;
  pagination: PaginationProps;
}

function usePageNumbers(currentPage: number, totalPages: number, windowSize = 5) {
  return useMemo(() => {
    const maxToShow = Math.max(3, windowSize);
    const half = Math.floor(maxToShow / 2);
    let startPage = Math.max(1, currentPage - half);
    let endPage = Math.min(totalPages, startPage + maxToShow - 1);
    if (endPage - startPage + 1 < maxToShow) {
      startPage = Math.max(1, endPage - maxToShow + 1);
    }
    const pageNumbers: number[] = [];
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    return { pageNumbers, startPage, endPage };
  }, [currentPage, totalPages, windowSize]);
}

const renderCell = (column: ColumnConfig, row: Record<string, unknown>) => {
  const raw = row[column.key];
  const value = typeof raw === "string" ? raw : String(raw ?? "");

  if (column.render) return column.render(value, row);

  switch (column.type) {
    case "link": {
      const url = typeof column.linkUrl === "function" ? column.linkUrl(value, row) : column.linkUrl || "#";
      return (
        <a
          href={url}
          className="text-blue-600 dark:text-blue-400 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {value}
        </a>
      );
    }
    case "badge": {
      const isOk = String(value).toLowerCase().includes("success");
      return (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            isOk
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700"
          }`}
        >
          {value}
        </span>
      );
    }
    default: {
      // Texto normal con envoltura; título como tooltip para ver completo
      return (
        <span className="block break-words whitespace-pre-wrap" title={value}>
          {value}
        </span>
      );
    }
  }
};

export default function PaginatedCardTable(props: PaginatedCardTableProps) {
  const {
    title,
    subtitleBadge,
    columns,
    rows,
    isLoading,
    emptyIcon,
    emptyText = "Sin datos",
    emptyHint,
    actionsHeader,
    renderActions,
    pagination,
  } = props;

  const { currentPage, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange } = pagination;
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = typeof totalItems === "number"
    ? Math.min(currentPage * pageSize, totalItems)
    : currentPage * pageSize;

  const { pageNumbers, startPage, endPage } = usePageNumbers(currentPage, totalPages);

  const colCount = columns.length + (renderActions ? 1 : 0);

  return (
    <Card className="shadow-xl border-0 overflow-hidden bg-white dark:bg-zinc-900">
      <CardHeader className="bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 px-6 py-5 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
            {title}
            {subtitleBadge && (
              <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">({subtitleBadge})</span>
            )}
          </CardTitle>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {typeof totalItems === "number" && totalItems > 0
              ? `${startRecord} - ${endRecord} de ${totalItems} registros`
              : `Página ${currentPage} de ${totalPages}`}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-zinc-50 dark:bg-zinc-800/50">
                {columns.map((c) => (
                  <TableHead key={c.key} className="px-6 py-4 text-left text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 whitespace-normal break-words">
                    {c.label}
                  </TableHead>
                ))}
                {renderActions && (
                  <TableHead className="px-6 py-4 text-center text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 whitespace-normal break-words">
                    {actionsHeader || "Acciones"}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-zinc-600 dark:text-zinc-400 font-medium">Cargando datos...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      {emptyIcon}
                      <span className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">{emptyText}</span>
                      {emptyHint && (
                        <span className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">{emptyHint}</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    {columns.map((c) => (
                      <TableCell key={c.key} className="px-6 py-4 align-middle whitespace-normal break-words text-xs">
                        {renderCell(c, row)}
                      </TableCell>
                    ))}
                    {renderActions && (
                      <TableCell className="px-6 py-4 align-middle text-center text-xs">
                        {renderActions(row, idx)}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

  {(rows.length > 0 || totalPages > 1) && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 px-6 py-4 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Mostrar</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="px-6 py-1 text-sm border rounded-md bg-white dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from(new Set([10, 25, 50, 100, pageSize])).sort((a, b) => a - b).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">registros</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex-shrink-0 p-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="hidden sm:flex items-center gap-1">
                  {startPage > 1 && (
                    <>
                      <button onClick={() => onPageChange(1)} className="px-3 py-1 rounded-md text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">1</button>
                      {startPage > 2 && <span className="px-2 text-zinc-400">...</span>}
                    </>
                  )}

                  {pageNumbers.map((p) => (
                    <button
                      key={p}
                      onClick={() => onPageChange(p)}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${currentPage === p ? "bg-blue-500 text-white" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"}`}
                    >
                      {p}
                    </button>
                  ))}

                  {endPage < totalPages && (
                    <>
                      {endPage < totalPages - 1 && <span className="px-2 text-zinc-400">...</span>}
                      <button onClick={() => onPageChange(totalPages)} className="px-3 py-1 rounded-md text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">{totalPages}</button>
                    </>
                  )}
                </div>

                <div className="flex sm:hidden items-center gap-1">
                  {(() => {
                    const mobilePages: number[] = [];
                    if (totalPages <= 3) {
                      for (let i = 1; i <= totalPages; i++) mobilePages.push(i);
                    } else if (currentPage === 1) {
                      mobilePages.push(1, 2, 3);
                    } else if (currentPage === totalPages) {
                      mobilePages.push(totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      mobilePages.push(currentPage - 1, currentPage, currentPage + 1);
                    }
                    return (
                      <>
                        {mobilePages[0] > 1 && (
                          <>
                            <button onClick={() => onPageChange(1)} className="px-3 py-1 rounded-md text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">1</button>
                            {mobilePages[0] > 2 && <span className="px-1 text-zinc-400">...</span>}
                          </>
                        )}
                        {mobilePages.map((p) => (
                          <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`px-3 py-1 rounded-md text-sm transition-colors ${currentPage === p ? "bg-blue-500 text-white" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"}`}
                          >
                            {p}
                          </button>
                        ))}
                        {mobilePages[mobilePages.length - 1] < totalPages && (
                          <>
                            {mobilePages[mobilePages.length - 1] < totalPages - 1 && <span className="px-1 text-zinc-400">...</span>}
                            <button onClick={() => onPageChange(totalPages)} className="px-3 py-1 rounded-md text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">{totalPages}</button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>

                 <button
                   onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                   disabled={currentPage === totalPages}
                   className="flex-shrink-0 p-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   <ChevronRight className="w-5 h-5" />
                 </button>
               </div>

               <div className="sm:hidden text-sm text-zinc-600 dark:text-zinc-400 text-center">
                 Página {currentPage} de {totalPages}
               </div>
             </div>
           </div>
         )}
       </CardContent>
     </Card>
   );
 }
