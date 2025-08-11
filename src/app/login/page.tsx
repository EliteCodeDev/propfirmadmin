"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast, Toaster } from "sonner";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { sendEmailConfirmation } from "@/api/auth";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const errorMsg = params?.get("error") || "";

  // Rellenar el email si viene de un error de confirmación
  useEffect(() => {
    const emailFromStorage = localStorage.getItem("emailForConfirmation");
    if (errorMsg === "Email not confirmed" && emailFromStorage) {
      setEmail(emailFromStorage);
    }
    // Limpiar para no re-rellenar en el futuro
    localStorage.removeItem("emailForConfirmation");
  }, [errorMsg]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log("Logging in user:", { email, password });

    // Guardar el email por si el login falla por no estar confirmado
    localStorage.setItem("emailForConfirmation", email);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.ok) {
      toast.success("Credenciales correctas");
      router.push("/dashboard");
    } else {
      // El error se obtiene de `params` y se muestra en el JSX
      // Aquí solo actualizamos el estado de carga
      setIsSubmitting(false);
      // Actualizar el toast de error genérico si no es un error de confirmación
      if (errorMsg !== "Email not confirmed") {
        toast.error("Credenciales incorrectas");
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

      <main className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Contraseña
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-2 border rounded"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 flex items-center"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="text-right mt-1">
              <Link
                href="/forgot-password"
                passHref
                className="text-sm text-blue-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {isSubmitting ? "Entrando…" : "Entrar"}
          </button>
        </form>

        {errorMsg === "Email not confirmed" && (
          <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
            <p className="font-bold">Email no confirmado</p>
            <p>Debes confirmar tu email antes de poder iniciar sesión.</p>
            <button
              onClick={handleResendConfirmation}
              disabled={isResending}
              className="mt-2 text-sm text-blue-600 hover:underline disabled:opacity-50"
            >
              {isResending ? "Reenviando…" : "Reenviar correo de confirmación"}
            </button>
          </div>
        )}

        {errorMsg && errorMsg !== "Email not confirmed" && (
          <p className="mt-4 text-red-600 text-center">{errorMsg}</p>
        )}

        <p className="mt-6 text-sm text-center">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Regístrate
          </Link>
        </p>
      </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando…</div>}>
      <LoginContent />
    </Suspense>
  );
}
