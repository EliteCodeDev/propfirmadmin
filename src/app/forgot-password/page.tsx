'use client';

import { useState } from 'react';
import { useForgotPassword } from '@/hooks/useAuth';
import { Toaster } from 'sonner';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    forgotPassword(email, {
      onSuccess: () => {
        setEmail('');
      },
    });
  };

  return (
    <>
      <Toaster position="top-right" richColors />

      <main className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Restablecer contraseña</h1>
        <p className="mb-4 text-sm text-gray-600">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
        </p>

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

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {isPending ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center">
          ¿Ya te acordaste?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </main>
    </>
  );
}
