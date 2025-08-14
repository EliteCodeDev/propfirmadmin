"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { HomeIcon, UserGroupIcon, BanknotesIcon, TrophyIcon, CogIcon, ChartBarIcon } from "@heroicons/react/24/outline";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Customers",
  withdrawals: "Withdrawals",
  "user-challenges": "User Challenges",
  "challenge-templates": "Challenge Templates",
  settings: "Settings",
};

const ICONS: Record<string, (props: { className?: string }) => React.ReactNode> = {
  dashboard: (p) => <HomeIcon {...p} />,
  users: (p) => <UserGroupIcon {...p} />,
  withdrawals: (p) => <BanknotesIcon {...p} />,
  "user-challenges": (p) => <TrophyIcon {...p} />,
  settings: (p) => <CogIcon {...p} />,
  reports: (p) => <ChartBarIcon {...p} />,
};

function humanize(segment: string): string {
  return segment
    .replace(/^\[|\]$/g, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BreadcrumbBar() {
  const pathname = usePathname() || "/dashboard";

  const items = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: BreadcrumbItem[] = [];

    // Always begin with Dashboard home
    crumbs.push({ label: "Dashboard", href: "/dashboard", icon: (p) => <HomeIcon {...p} /> });

    let acc = "";
    segments.forEach((seg, idx) => {
      if (seg === "dashboard") return; // skip because it's already added
      acc += `/${seg}`;
      const label = LABELS[seg] || humanize(seg);
      const icon = ICONS[seg];
      const isLast = idx === segments.length - 1;
      crumbs.push({ label, href: isLast ? undefined : acc, icon, current: isLast });
    });
    return crumbs;
  }, [pathname]);

  return (
    <div className="sticky top-0 z-20 backdrop-blur bg-white/80 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-start h-16 px-4">
        <Breadcrumbs items={items} />
      </div>
    </div>
  );
}
