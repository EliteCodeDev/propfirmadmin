// src/app/dashboard/page.tsx

import { getServerSession } from 'next-auth/next';
import { authOptions }      from '../../../pages/api/auth/[...nextauth]';
import { redirect }         from 'next/navigation';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <p>¡Bienvenido, {session.user?.name}!</p>;
}
