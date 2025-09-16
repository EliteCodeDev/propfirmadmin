"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  InboxIcon,
  Pencil,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useArrayValidation } from "@/hooks/useArrayValidation";

import type { ChallengeTableProps } from "@/types";

export const ChallengeTable: React.FC<ChallengeTableProps> = ({
  title,
  data,
  pageSize,
  onCreate,
  onEdit,
  showPrice = false,
  isLoading = false,
}) => {
  // Validación de datos
  const dataValidation = useArrayValidation(data);

  // Paginación local
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular total de páginas
  const totalPages = useMemo(() => {
    if (pageSize < 1) return 1;
    return Math.ceil(dataValidation.data.length / pageSize) || 1;
  }, [dataValidation.data, pageSize]);

  // Ajustar currentPage si supera totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Calcular el slice de datos a mostrar
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedData = dataValidation.data.slice(startIndex, endIndex);

  // Funciones de paginación
  function goPrevPage() {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }
  function goNextPage() {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }

  return (
    <div className="shadow-xl border-0 overflow-hidden bg-white dark:bg-zinc-900 rounded-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            {title}
          </h3>
          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-500 dark:text-zinc-400 mr-4">
              {dataValidation.data.length > 0 &&
                `${dataValidation.data.length} records`}
            </div>

            <Button
              variant="secondary"
              className="group inline-block rounded bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 px-3 py-2 text-sm font-medium uppercase leading-normal text-white shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg items-center gap-2"
              onClick={onCreate}
            >
              <PlusCircle className="h-4 w-4 group-hover:rotate-90 transition-transform duration-500" />
              Create
            </Button>
          </div>
        </div>
      </div>

      {/* Table Container con altura fija */}
      <div className="h-[350px] overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="flex flex-col items-center justify-center my-auto">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--app-secondary)] mb-4"></div>
              <p className="text-zinc-800 dark:text-zinc-200 font-medium">
                Loading data...
              </p>
            </div>
          </div>
        ) : (
          <Table className="w-full">
            <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="pl-[70px] pr-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  ID
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Name
                </TableHead>
                {showPrice && (
                  <TableHead className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Price
                  </TableHead>
                )}
                <TableHead className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {displayedData.length > 0 ? (
                dataValidation
                  .safeMap((item) => (
                    <TableRow
                      key={item?.id || "unknown"}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <TableCell className="pl-[70px] pr-6 py-3 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                        {item?.id || "N/A"}
                      </TableCell>
                      <TableCell className="px-6 py-3 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                        {item?.name || "Untitled"}
                      </TableCell>
                      {showPrice && (
                        <TableCell className="px-6 py-3 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {item?.precio || "N/A"}
                        </TableCell>
                      )}
                      <TableCell className="px-6 py-3 whitespace-nowrap text-sm">
                        <Button
                          variant="outline"
                          className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md shadow-sm flex items-center gap-1"
                          onClick={() => onEdit(item)}
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                  .slice(startIndex, endIndex)
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={showPrice ? 4 : 3}
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <InboxIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-3" />
                      <span className="text-zinc-500 dark:text-zinc-400 text-base font-medium">
                        No results
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">
                        Data will appear here when available
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Paginación */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 px-6 py-3 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {displayedData.length} of {dataValidation.data.length} results
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={goPrevPage}
              disabled={currentPage === 1}
              className="flex-shrink-0 p-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              <span className="px-3 py-1 rounded-md text-sm bg-blue-500 text-white">
                {currentPage}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                of {totalPages}
              </span>
            </div>

            <button
              onClick={goNextPage}
              disabled={currentPage === totalPages}
              className="flex-shrink-0 p-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
