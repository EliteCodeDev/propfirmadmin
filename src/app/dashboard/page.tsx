// src/app/dashboard/page.tsx

import MainLayout from "@/components/layouts/MainLayout";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <p>¡Bienvenido, {JSON.stringify(session)}!</p>;
}
