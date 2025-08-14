import Sidebar from "@/components/common/sidebar/Sidebar";
import BreadcrumbBar from "@/components/common/BreadcrumbBar";
import { PropsWithChildren, ReactNode } from "react";

type MainLayoutProps = PropsWithChildren<{
  /** Slot opcional para un Header (breadcrumbs, buscador, etc.) */
  header?: ReactNode;
  /** Clases extra para el <main> si necesitas personalizar por página */
  className?: string;
}>;

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <BreadcrumbBar />
        <div className="p-4">{children}</div>
      </main>
    </div>
  );
}
