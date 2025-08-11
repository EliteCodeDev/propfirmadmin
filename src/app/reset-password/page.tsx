"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import { resetPassword } from "@/api/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const resetCode = searchParams?.get("code");
    if (resetCode) {
      setCode(resetCode);
    } else {
      toast.error("Código de reseteo no encontrado en la URL.");
    }
  }, [searchParams]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== passwordConfirmation) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    if (!code) {
      toast.error(
        "Falta el código de reseteo. Por favor, usa el enlace que te enviamos."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({ code, password, passwordConfirmation });
      toast.success("¡Contraseña actualizada con éxito!");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error(
        "No se pudo actualizar la contraseña. El código podría ser inválido o haber expirado."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Crea tu nueva contraseña
            </CardTitle>
            <CardDescription>
              Asegúrate de que sea segura y fácil de recordar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirmation">
                  Confirmar nueva contraseña
                </Label>
                <Input
                  id="passwordConfirmation"
                  name="passwordConfirmation"
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || !code}
                className="w-full"
              >
                {isSubmitting
                  ? "Actualizando…"
                  : "Actualizar contraseña"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-sm text-center block">
            <p>
              <Link
                href="/login"
                className="text-blue-600 hover:underline"
              >
                Volver a inicio de sesión
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Cargando…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
