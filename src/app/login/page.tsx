"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "sonner";
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
import { sendEmailConfirmation } from "@/api/auth";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showConfirmationError, setShowConfirmationError] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowConfirmationError(false);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setIsSubmitting(false);

    if (res?.ok) {
      toast.success("¡Bienvenido de vuelta!");
      router.push("/dashboard");
    } else {
      if (res?.error === "Email not confirmed") {
        setShowConfirmationError(true);
        toast.error("Debes confirmar tu email para poder iniciar sesión.");
      } else {
        toast.error(res?.error || "Credenciales incorrectas");
      }
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error("Por favor, introduce tu email primero.");
      return;
    }
    setIsResending(true);
    try {
      await sendEmailConfirmation(email);
      toast.success("Correo de confirmación enviado.");
    } catch (error) {
      console.error("Resend confirmation error:", error);
      toast.error("No se pudo enviar el correo.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Bienvenido</CardTitle>
            <CardDescription>
              Inicia sesión en tu cuenta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              {showConfirmationError && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                >
                  {isResending
                    ? "Reenviando..."
                    : "Reenviar correo de confirmación"}
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-sm text-center block">
            <p>
              ¿No tienes cuenta?{" "}
              <Link
                href="/register"
                className="text-blue-600 hover:underline"
              >
                Regístrate
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Cargando...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}