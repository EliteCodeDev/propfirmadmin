'use client';

import React from 'react';
import { useArrayValidation } from '@/hooks/useArrayValidation';

import type { RowsPerPageProps } from "@/types";

export function RowsPerPage({ 
  pageSize, 
  onPageSizeChange, 
  options = [5, 10, 20, 50] 
}: RowsPerPageProps) {
  const optionsValidation = useArrayValidation(options);
  
  return (
    <select
      value={pageSize}
      onChange={(e) => onPageSizeChange(Number(e.target.value))}
      className="px-3 py-1 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)] focus:outline-none"
    >
      {optionsValidation.safeMap((option) => (
        <option key={option || 'default'} value={option || 5}>
          {option || 5}
        </option>
      ))}
    </select>
  );
}