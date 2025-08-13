// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MainLayout from "@/components/layouts/MainLayout";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <MainLayout>
      <p>¡Bienvenido, {session.user.name}!</p>
    </MainLayout>
  );
}
