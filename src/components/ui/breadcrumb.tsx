import React from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  icon?: (props: { className?: string }) => React.ReactNode;
  current?: boolean;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="m-0">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === items.length - 1;
          const content = (
            <span
              className={[
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 border leading-none",
                isFirst
                  ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                  : isLast
                  ? "bg-gray-100 text-gray-700 border-gray-200"
                  : "bg-gray-100 text-gray-600 border-gray-200",
              ].join(" ")}
            >
              {item.icon ? <item.icon className="h-4 w-4" /> : null}
              <span className="whitespace-nowrap">{item.label}</span>
            </span>
          );

          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:opacity-90">
                  {content}
                </Link>
              ) : (
                content
              )}
              {!isLast && <ChevronRightIcon className="h-4 w-4 text-gray-400" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
