"use client";

import { ReactNode } from "react";

export function SectionCard({ children, gradientClass = "from-gray-50/50 to-white/50" }: { children: ReactNode; gradientClass?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-gray-100/70 dark:border-gray-800/60 shadow-xl hover:shadow-2xl transition-all duration-500">
      <div className="absolute inset-0 opacity-5" />
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />
      <div className="relative p-8">
        {children}
      </div>
    </div>
  );
}
