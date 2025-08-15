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
  totalItems?: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

interface PaginatedCardTableProps {
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

  // Función para determinar el ancho de columna basado en el contenido
  const getColumnWidth = (column: ColumnConfig) => {
    switch (column.key) {
      case 'serial':
      case 'id':
        return 'w-16'; // ID muy pequeño
      case 'status':
        return 'w-24'; // Status badge
      case 'role':
        return 'w-20'; // Role corto
      case 'country':
        return 'w-24'; // País
      case 'createdAt':
      case 'dateJoined':
        return 'w-28'; // Fecha
      case 'email':
        return 'w-48'; // Email más ancho
      case 'name':
        return 'w-32'; // Nombre moderado
      default:
        return 'w-auto'; // Automático para otros
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {(subtitleBadge) && (
        <CardHeader className="px-4 py-3 border-b border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            
            {subtitleBadge && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {subtitleBadge}
              </span>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="w-full mx-auto text-center">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-700/30 backdrop-blur-sm border-gray-200 dark:border-gray-600/50">
                {columns.map((c) => (
                  <TableHead 
                    key={c.key} 
                    className={`pl-6 pr-4 py-3  text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 whitespace-nowrap ${getColumnWidth(c)}`}
                  >
                    {c.label}
                  </TableHead>
                ))}
                {renderActions && (
                  <TableHead className="px-3 py-3 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 whitespace-nowrap w-20">
                    {actionsHeader || "Acciones"}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="pl-6 pr-4 py-8 text-center bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                      <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">Cargando datos...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="pl-6 pr-4 py-12 bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="flex flex-col items-center justify-center">
                      {emptyIcon}
                      <span className="text-gray-500 dark:text-gray-400 text-base font-medium">{emptyText}</span>
                      {emptyHint && (
                        <span className="text-gray-400 dark:text-gray-500 text-sm mt-1">{emptyHint}</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors border-gray-200 dark:border-gray-700/30">
                    {columns.map((c) => (
                      <TableCell 
                        key={c.key} 
                        className={`pl-6 pr-4 py-3 align-middle whitespace-nowrap text-xs text-gray-900 dark:text-gray-200 ${getColumnWidth(c)}`}
                      >
                        <div className="truncate" title={String(row[c.key] || "")}>
                          {renderCell(c, row)}
                        </div>
                      </TableCell>
                    ))}
                    {renderActions && (
                      <TableCell className="px-3 py-3 align-middle text-center text-xs w-20">
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
          <div className="bg-gray-50 dark:bg-gray-700/20 backdrop-blur-sm px-4 py-3 border-t border-gray-200 dark:border-gray-600/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">Mostrar</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600/50 rounded-md bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
                >
                  {Array.from(new Set([10, 25, 50, 100, pageSize])).sort((a, b) => a - b).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-600 dark:text-gray-400">registros</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex-shrink-0 p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="hidden sm:flex items-center gap-1">
                  {startPage > 1 && (
                    <>
                      <button onClick={() => onPageChange(1)} className="px-2.5 py-1 rounded-md text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors">1</button>
                      {startPage > 2 && <span className="px-1 text-gray-400 dark:text-gray-500 text-xs">...</span>}
                    </>
                  )}

                  {pageNumbers.map((p) => (
                    <button
                      key={p}
                      onClick={() => onPageChange(p)}
                      className={`px-2.5 py-1 rounded-md text-xs transition-colors ${currentPage === p ? "bg-blue-600 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600/30"}`}
                    >
                      {p}
                    </button>
                  ))}

                  {endPage < totalPages && (
                    <>
                      {endPage < totalPages - 1 && <span className="px-1 text-gray-400 dark:text-gray-500 text-xs">...</span>}
                      <button onClick={() => onPageChange(totalPages)} className="px-2.5 py-1 rounded-md text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors">{totalPages}</button>
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
                            <button onClick={() => onPageChange(1)} className="px-2.5 py-1 rounded-md text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors">1</button>
                            {mobilePages[0] > 2 && <span className="px-1 text-gray-400 dark:text-gray-500 text-xs">...</span>}
                          </>
                        )}
                        {mobilePages.map((p) => (
                          <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`px-2.5 py-1 rounded-md text-xs transition-colors ${currentPage === p ? "bg-blue-600 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600/30"}`}
                          >
                            {p}
                          </button>
                        ))}
                        {mobilePages[mobilePages.length - 1] < totalPages && (
                          <>
                            {mobilePages[mobilePages.length - 1] < totalPages - 1 && <span className="px-1 text-gray-400 dark:text-gray-500 text-xs">...</span>}
                            <button onClick={() => onPageChange(totalPages)} className="px-2.5 py-1 rounded-md text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors">{totalPages}</button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>

                <button
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex-shrink-0 p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="sm:hidden text-xs text-gray-600 dark:text-gray-400 text-center">
                Página {currentPage} de {totalPages}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}