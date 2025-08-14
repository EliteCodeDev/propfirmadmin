"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/config/navigation";
import LogoutButton from "../auth/LogoutButton";
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-gray-800 shadow-md">
      <div className="flex items-center justify-center h-20 shadow-md">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          PropFirm
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="px-4 py-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                pathname === item.href
                  ? "bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white",
                "group flex items-center px-3 py-2 text-base font-medium rounded-md"
              )}
            >
              <item.icon
                className={classNames(
                  pathname === item.href
                    ? "text-indigo-500 dark:text-indigo-400"
                    : "text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300",
                  "mr-4 flex-shrink-0 h-6 w-6"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <LogoutButton />
      </div>
    </div>
  );
}
