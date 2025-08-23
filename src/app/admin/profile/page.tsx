"use client";

import MainLayout from "@/components/layouts/MainLayout";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";

function ProfileInner() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  const user = session?.user;
  const initials = ((user?.firstName?.[0] || user?.username?.[0] || user?.email?.[0] || "U") + "").toUpperCase();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || user?.email || "Usuario";
  const roleLabel = (() => {
    const candidate = user?.roles?.[0];
    if (!candidate) return "Usuario";
    return candidate.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  })();

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Perfil</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile summary */}
          <div className="lg:col-span-1 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-white/5 backdrop-blur p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{displayName}</h2>
                  {user?.isVerified && (
                    <CheckBadgeIcon className="h-5 w-5 text-emerald-500" title="Verificado" />
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{roleLabel}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{user?.email ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Username</span>
                <span className="font-medium">{user?.username ?? "-"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500">ID</span>
                <span className="font-medium">
                  {String((user as unknown as { id?: string | number })?.id ?? "-")}
                </span>
              </div>

            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-white/5 backdrop-blur p-6">
            <div className="flex items-center gap-3 mb-6">
              <UserIcon className="h-6 w-6 text-indigo-600" />
              <h3 className="text-lg font-semibold">Información de la cuenta</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-300">Nombre</span>
                <input disabled value={user?.firstName ?? ""} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/30" />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-300">Apellido</span>
                <input disabled value={user?.lastName ?? ""} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/30" />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-300">Email</span>
                <input disabled value={user?.email ?? ""} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/30" />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-300">Usuario</span>
                <input disabled value={user?.username ?? ""} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/30" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function ProfilePage() {
  return (
    <SessionProvider>
      <ProfileInner />
    </SessionProvider>
  );
}
