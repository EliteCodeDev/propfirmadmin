"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ManagerHeaderProps {
  title: string;
  description: string;
  buttonText?: string;
  onCreateClick?: () => void;
  totalCount?: number;
  showTotalCount?: boolean;
}

export function ManagerHeader({
  title,
  description,
  buttonText,
  onCreateClick,
  totalCount = 0,
  showTotalCount = false,
}: ManagerHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6 px-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {showTotalCount && (
          <div className="bg-gradient-to-r from-blue-500 to-red-600 rounded-lg px-4 py-2 text-white shadow-sm">
            <div className="text-xs font-medium">Total</div>
            <div className="text-lg font-bold">{totalCount}</div>
          </div>
        )}
        {buttonText && onCreateClick && (
          <Button
            onClick={onCreateClick}
            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white group shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  );
}
