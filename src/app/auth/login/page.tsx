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

// URL del fondo del hero (lado izquierdo). Define NEXT_PUBLIC_LOGIN_BG para usar una imagen remota o local.
const HERO_BG = process.env.NEXT_PUBLIC_LOGIN_BG || "";

// URL del fondo del formulario (lado derecho). Define NEXT_PUBLIC_LOGIN_RIGHT_BG para usar una imagen de fondo.
// Ejemplo: NEXT_PUBLIC_LOGIN_RIGHT_BG=https://tu-imagen.com/background.jpg
// O imagen local: NEXT_PUBLIC_LOGIN_RIGHT_BG=/images/login-bg.jpg


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
      router.push("/main/dashboard");
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
    <div className="min-h-screen flex relative overflow-hidden">
      <Toaster position="top-right" richColors theme={isDarkMode ? "dark" : "light"} />

      {/* Fondo que responde al tema: claro en light, oscuro en dark */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-white dark:bg-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.04),transparent_55%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_55%)]" />
      </div>

      {/* Lado izquierdo: hero mejorado */}
      <aside className="hidden lg:flex relative w-1/2 min-h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={HERO_BG ? { backgroundImage: `url(${HERO_BG})` } : {}}
        />
  {/* Overlay neutro (sin tonos morados) */}
  <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/40 to-transparent dark:from-black/80 dark:via-black/50 dark:to-transparent backdrop-blur-sm" />

        {/* Contenido visual mejorado que responde al tema */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-8 text-white dark:text-slate-100">
          {/* Logo animado con colores que responden al tema */}
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 dark:from-cyan-300 dark:via-blue-400 dark:to-blue-500 flex items-center justify-center shadow-2xl ring-4 ring-white/20 dark:ring-slate-400/20 backdrop-blur-sm transform hover:scale-105 transition-all duration-500">
              <span className="text-5xl font-bold text-white drop-shadow-lg">P</span>
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 to-blue-600 dark:from-cyan-300 dark:to-blue-500 rounded-3xl blur opacity-60 dark:opacity-40 -z-10 animate-pulse" />
          </div>

          {/* Texto hero con colores que responden al tema */}
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-200 dark:from-slate-100 dark:to-cyan-100 bg-clip-text text-transparent leading-tight">
              Bienvenido de vuelta
            </h2>
            <p className="text-lg text-slate-300 dark:text-slate-400 leading-relaxed">
              Accede a tu panel de control y gestiona tus operaciones de trading de forma profesional
            </p>
          </div>

          {/* Elementos decorativos con colores que responden al tema */}
          <div className="absolute top-20 left-20 w-2 h-2 bg-cyan-400 dark:bg-cyan-300 rounded-full animate-ping" />
          <div className="absolute bottom-32 right-16 w-3 h-3 bg-purple-400 dark:bg-purple-300 rounded-full animate-bounce" />
          <div className="absolute top-1/3 right-20 w-1 h-1 bg-yellow-400 dark:bg-yellow-300 rounded-full animate-pulse" />
        </div>
      </aside>

      {/* Lado derecho: formulario con imagen de fondo que responde al tema */}
  <main className={"flex-1 min-h-screen flex items-center justify-center p-6 relative bg-center bg-cover " + (!process.env.NEXT_PUBLIC_LOGIN_RIGHT_BG ? "bg-white dark:bg-black" : "")} 
            style={{ 
              backgroundImage: process.env.NEXT_PUBLIC_LOGIN_RIGHT_BG ? `url(${process.env.NEXT_PUBLIC_LOGIN_RIGHT_BG})` : 'none'
            }}>
        {/* Overlay para la imagen de fondo que responde al tema */}
        {process.env.NEXT_PUBLIC_LOGIN_RIGHT_BG && (
          <div className="absolute inset-0 bg-white/65 dark:bg-black/80 backdrop-blur-[1px]" />
        )}
        {/* Header con toggle de tema mejorado que responde al tema */}
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={toggleTheme}
            className="group p-3 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-2xl border border-slate-200 dark:border-slate-600 hover:shadow-[0_6px_24px_rgba(0,0,0,0.12)] hover:scale-110 transition-all duration-300"
            aria-label="Cambiar tema"
          >
            {isDarkMode ? (
              <SunIcon className="h-6 w-6 text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300" />
            ) : (
              <MoonIcon className="h-6 w-6 text-amber-500 group-hover:text-amber-600 transition-colors duration-300" />
            )}
          </button>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Marca optimizada que responde al tema */}
          <div className="text-center mb-6">
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 dark:from-cyan-300 dark:via-blue-400 dark:to-blue-500 rounded-2xl shadow-xl flex items-center justify-center transform hover:scale-110 transition-all duration-500 ring-2 ring-white/20 dark:ring-slate-400/20 backdrop-blur-sm">
                <span className="text-xl font-bold text-white drop-shadow-lg">P</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 dark:from-cyan-300 dark:to-blue-500 rounded-2xl blur opacity-45 dark:opacity-30 -z-10 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-2">
              Iniciar sesión
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base font-medium">Accede a tu cuenta</p>
          </div>

          {/* Card del formulario con glassmorphism */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            
            <div className="relative bg-white/85 dark:bg-slate-800/85 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/30 p-6 sm:p-7 transition-all duration-500 hover:shadow-cyan-500/25 hover:shadow-2xl">
              {/* Botón Google optimizado */}
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/main/dashboard" })}
                className="group w-full flex items-center justify-center gap-3 py-3 mb-4 rounded-xl border border-slate-300/60 dark:border-slate-600/50 bg-white/70 dark:bg-slate-700/50 backdrop-blur-sm text-slate-800 dark:text-slate-100 hover:bg-white/90 dark:hover:bg-slate-700/80 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.01] transform"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12   s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.64,6.053,29.072,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20   s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,14,24,14c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657   C33.64,6.053,29.072,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.197l-6.19-5.238C29.211,35.091,26.715,36,24,36   c-5.202,0-9.619-3.317-11.276-7.95l-6.55,5.046C9.494,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.793,2.237-2.231,4.166-4.097,5.565   c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.983,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
                <span className="font-semibold">Continuar con Google</span>
              </button>

              {/* Divisor compacto */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 py-1 bg-white/90 dark:bg-slate-800/80 backdrop-blur-sm text-slate-500 rounded-full text-xs font-medium border border-slate-200/60 dark:border-slate-700/50">
                    o continúa con email
                  </span>
                </div>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300">Correo electrónico</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors duration-300" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-500"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300">Contraseña</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors duration-300" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center group/btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors duration-300 group-hover/btn:scale-110 transform" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors duration-300 group-hover/btn:scale-110 transform" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Captcha removido por solicitud */}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group w-full py-3 px-6 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded-xl shadow-2xl hover:shadow-cyan-500/25 disabled:shadow-none transition-all duration-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
                >
                  {/* Efecto de brillo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:animate-shimmer" />
                  
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar Sesión</span>
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

            {showConfirmationError && (
              <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl backdrop-blur-sm">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mt-2 animate-pulse"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-1">Email no confirmado</h3>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">Debes confirmar tu email antes de poder iniciar sesión.</p>
                    <button
                      onClick={handleResendConfirmation}
                      disabled={isResending}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-300 transform hover:scale-105 disabled:scale-100 text-xs"
                    >
                      {isResending ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Reenviando...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Reenviar correo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Footer compacto que responde al tema */}
          <div className="text-center mt-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              © 2025 PropFirm. Todos los derechos reservados.
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
          <p className="text-slate-600 dark:text-slate-400">Cargando...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}