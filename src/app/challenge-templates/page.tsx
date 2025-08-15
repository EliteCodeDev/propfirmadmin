"use client";

import React from "react";
import { ChallengeTemplatesManager } from "@/components/dashboard/challenge-templates/ChallengeTemplatesManager";
import MainLayout from "@/components/layouts/MainLayout";

export default function ChallengeTemplatesPage() {
  return (
    <MainLayout>
      <ChallengeTemplatesManager />
    </MainLayout>
  );
}
