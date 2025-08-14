import Sidebar from "@/components/common/sidebar";
import BreadcrumbBar from "@/components/common/BreadcrumbBar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <BreadcrumbBar />
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
