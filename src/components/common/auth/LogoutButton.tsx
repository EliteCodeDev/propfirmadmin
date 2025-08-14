import React from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { signOut } from "next-auth/react";
export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="group flex items-center w-full px-3 py-2 text-base font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
    >
      <ArrowRightIcon className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
      Cerrar sesión
    </button>
  );
}
