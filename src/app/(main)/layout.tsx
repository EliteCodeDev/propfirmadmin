import Sidebar from "@/components/common/sidebar"; // Asegúrate de crear este componente

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-4 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
