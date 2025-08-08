// src/app/dashboard/page.tsx

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../pages/api/auth/[...nextauth]';
import { redirect } from 'next/navigation';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <header className="flex justify-between items-center pb-4 border-b dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
        <div className="flex items-center gap-4">
          <p className="hidden sm:block">¡Bienvenido, {session.user?.name}!</p>
          <ThemeSwitcher />
        </div>
      </header>
      <main className="mt-8">
        {/* Aquí irá el contenido del panel de administrador */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <p>Contenido del panel...</p>
        </div>
      </main>
    </div>
  );
}
