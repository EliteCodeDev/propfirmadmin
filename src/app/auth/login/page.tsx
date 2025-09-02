"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import {
  EyeIcon,
  EyeSlashIcon,
  SunIcon,
  MoonIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CogIcon
} from "@heroicons/react/24/outline";
import { sendEmailConfirmation } from "@/api/auth";
import { HERO_BG, LOGIN_RIGHT_BG, IMAGEN_LOGIN } from "@/config";
import Recaptcha, { RecaptchaRef } from "@/components/cloudflare/cloudflare";
import Image from "next/image";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showConfirmationError, setShowConfirmationError] = useState(false);
  const router = useRouter();
  const recaptchaRef = useRef<RecaptchaRef>(null);
  const [isVerifying, setIsVerifying] = useState("");

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

    if (!isVerifying) {
      toast.error("Por favor, verifique su recaptcha");
      return;
    }

    setIsSubmitting(true);
    setShowConfirmationError(false);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setIsSubmitting(false);

    if (res?.ok) {
      toast.success("Acceso autorizado!");
      router.push("/admin/dashboard");
    } else {
      if (res?.error === "Email not confirmed") {
        setShowConfirmationError(true);
      } else {
        toast.error(res?.error || "Credenciales incorrectas");
      }
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setIsVerifying("");
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
    <div className="min-h-screen flex relative overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Toaster position="top-right" richColors theme={isDarkMode ? "dark" : "light"} />

      {/* Panel izquierdo - Información corporativa */}
      <aside className="hidden lg:flex relative w-1/2 min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,white_1px,transparent_1px)] [background-size:24px_24px]"></div>
        </div>

        {HERO_BG && (
          <div
            className="absolute inset-0 bg-center bg-cover opacity-20"
            style={{ backgroundImage: `url(${HERO_BG})` }}
          />
        )}

        <div className="relative z-10 flex flex-col justify-center w-full p-12 text-white">
          <div className="mb-12">
            {IMAGEN_LOGIN ? (
              <Image
                src={IMAGEN_LOGIN}
                alt="Logo"
                width={150}
                height={150}
                className="rounded-2xl shadow-2xl"
              />
            ) : (
              <div className="w-40 h-40 bg-gradient-to-br from-indigo-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <CogIcon className="w-20 h-20 text-white" />
              </div>
            )}
          </div>

          <div className="space-y-8 max-w-lg">
            <div>
              <h1 className="text-5xl font-light text-white mb-4 tracking-tight">
                Panel de{" "}
                <span className="block text-6xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Administración
                </span>
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed font-light">
                Centro de control unificado para la gestión integral de operaciones y configuraciones del sistema
              </p>
            </div>

            <div className="space-y-4 pt-8">
              <div className="flex items-center gap-4 text-slate-200">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-lg font-light">Acceso seguro y encriptado</span>
              </div>
              <div className="flex items-center gap-4 text-slate-200">
                <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                <span className="text-lg font-light">Panel de control avanzado</span>
              </div>
              <div className="flex items-center gap-4 text-slate-200">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-lg font-light">Monitoreo en tiempo real</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Panel derecho - Formulario de acceso */}
      <main className="flex-1 min-h-screen flex items-center justify-center p-8 relative">
        {LOGIN_RIGHT_BG && (
          <>
            <div
              className="absolute inset-0 bg-center bg-cover"
              style={{ backgroundImage: `url(${LOGIN_RIGHT_BG})` }}
            />
            <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90" />
          </>
        )}

        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-3 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-200 z-20"
          aria-label="Cambiar tema"
        >
          {isDarkMode ? (
            <SunIcon className="h-5 w-5 text-amber-500" />
          ) : (
            <MoonIcon className="h-5 w-5 text-slate-600" />
          )}
        </button>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="lg:hidden mb-6">
              {IMAGEN_LOGIN ? (
                <div className="inline-block">
                  <Image
                    src={IMAGEN_LOGIN}
                    alt="Logo"
                    width={130}
                    height={130}
                    className="rounded-xl shadow-2xl drop-shadow-2xl"
                    style={{
                      filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.5))'
                    }}
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-xl">
                  <CogIcon className="w-16 h-16 text-white" />
                </div>
              )}
            </div>

            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Acceso al Sistema
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Ingresa tus credenciales de administrador
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/main/dashboard" })}
              className="w-full flex items-center justify-center gap-3 py-3.5 mb-6 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-200 font-semibold"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                  O accede con email
                </span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="admin@empresa.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-12 py-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-center py-4">
                <Recaptcha ref={recaptchaRef} onVerify={setIsVerifying} />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verificando credenciales...
                  </div>
                ) : (
                  "Acceder al Panel"
                )}
              </button>
            </form>

            {showConfirmationError && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5">
                    ⚠️
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      Verificación pendiente
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Debes confirmar tu email antes de acceder al panel.
                    </p>
                    <button
                      onClick={handleResendConfirmation}
                      disabled={isResending}
                      className="mt-3 text-sm font-medium text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 disabled:opacity-50"
                    >
                      {isResending ? "Reenviando..." : "Reenviar correo"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              2025 © Copyright - PropFirmAdmin v1.0.0 Made with ❤ by EliteCode.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando panel de administración...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}