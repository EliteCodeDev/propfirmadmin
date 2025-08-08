'use client';

import { useState } from 'react';
import { signIn }   from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import Link         from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router                        = useRouter();
  const params                        = useSearchParams();
  const errorMsg                      = params?.get('error') || '';

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.ok) {
      toast.success('Credenciales correctas');
      router.push('/dashboard');
    } else {
      toast.error('Credenciales incorrectas');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* contenedor de toasts */}
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
              onChange={e => setEmail(e.target.value)}
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
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full p-2 border rounded"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 flex items-center"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        {errorMsg && (
          <p className="mt-4 text-red-600 text-center">{errorMsg}</p>
        )}

        <p className="mt-6 text-sm text-center">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            Regístrate
          </Link>
        </p>
      </main>
    </>
  );
}
