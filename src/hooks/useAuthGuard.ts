import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook de protección de páginas cliente.
 * Redirige a /auth/login si no hay sesión o no hay accessToken.
 */
export function useAuthGuard({
  redirectTo = "/auth/login",
}: { redirectTo?: string } = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.accessToken) {
      router.replace(redirectTo);
    }
  }, [session?.accessToken, status, router, redirectTo]);

  return { session, loading: status === "loading" };
}
