"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import Link from "next/link";
import { 
  EyeIcon, 
  EyeSlashIcon, 
  SunIcon, 
  MoonIcon,
  EnvelopeIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";
import { sendEmailConfirmation } from "@/api/auth";


function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showConfirmationError, setShowConfirmationError] = useState(false);
  const router = useRouter();

  // Cargar preferencia de tema
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(savedTheme === "dark" || (!savedTheme && prefersDark));
  }, []);

  // Aplicar tema al document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowConfirmationError(false); // Reset on new submission

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setIsSubmitting(false);

    if (res?.ok) {
      toast.success("¡Bienvenido de vuelta!");
      router.push("/admin/dashboard");
    } else {
      if (res?.error === "Email not confirmed") {
        setShowConfirmationError(true);
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

    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      <Toaster 
        position="top-right" 
        richColors 
        theme={isDarkMode ? "dark" : "light"}
      />

      {/* Header con toggle de tema */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700"
          aria-label="Cambiar tema"
        >
          {isDarkMode ? (
            <SunIcon className="h-5 w-5 text-yellow-500" />
          ) : (
            <MoonIcon className="h-5 w-5 text-slate-600" />
          )}
        </button>
      </div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand area */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <span className="text-2xl font-bold text-white">P</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Bienvenido
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Inicia sesión en tu cuenta
            </p>
          </div>

          {/* Formulario principal */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Campo Email */}
              <div className="space-y-2">
                <label 
                  htmlFor="email" 
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-2">
                <label 
                  htmlFor="password" 
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <span>Iniciar sesión</span>
                )}
              </button>
            </form>

            {/* Mensaje de error de confirmación */}
            {showConfirmationError && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      Email no confirmado
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Debes confirmar tu email antes de poder iniciar sesión.
                    </p>
                    <button
                      onClick={handleResendConfirmation}
                      disabled={isResending}
                      className="mt-3 text-sm font-medium text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 disabled:opacity-50 transition-colors"
                    >
                      {isResending ? "Reenviando..." : "Reenviar correo de confirmación"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              © 2025 PropFirm. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}