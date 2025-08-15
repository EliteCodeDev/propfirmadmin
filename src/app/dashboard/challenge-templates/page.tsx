"use client";

import React from "react";
import { ChallengeTemplatesManager } from "@/components/dashboard/challenge-templates/ChallengeTemplatesManager";

export default function ChallengeTemplatesPage() {
  return (
    <div className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800 text-zinc-800 dark:text-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--app-secondary)]">
          Gestión de Challenge Templates
        </h1>
      </div>

      <ChallengeTemplatesManager />
    </div>
  );
}
