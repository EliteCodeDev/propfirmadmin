'use client';

import { useState } from 'react';
import { forgotPassword } from '@/services/auth';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await forgotPassword(email);
      toast.success('Se ha enviado un correo para restablecer tu contraseña');
      setEmail('');
    } catch (error) {
      toast.error('No se pudo enviar el correo. ¿El email es correcto?');
    } finally {
      setIsSubmitting(false);
    }
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
            disabled={isSubmitting}
            className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
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
