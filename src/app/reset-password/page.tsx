'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useConfirmPasswordReset } from '@/hooks/useAuth';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const { mutate: confirmPasswordReset, isPending } = useConfirmPasswordReset();

  useEffect(() => {
    const resetCode = searchParams.get('code');
    if (resetCode) {
      setCode(resetCode);
    } else {
      toast.error('Código de reseteo no encontrado en la URL.');
    }
  }, [searchParams]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== passwordConfirmation) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (!code) {
      toast.error('Falta el código de reseteo. Por favor, usa el enlace de tu correo.');
      return;
    }

    confirmPasswordReset({ code, password, passwordConfirmation });
  };

  return (
    <>
      <Toaster position="top-right" richColors />

      <main className="max-w-md mx-auto p-8 bg-white dark:bg-gray-800 shadow-md rounded-lg mt-10">
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">Nueva contraseña</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nueva contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirmar contraseña
            </label>
            <input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !code}
            className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700 dark:hover:bg-blue-500"
          >
            {isPending ? 'Actualizando…' : 'Actualizar contraseña'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center">
          <Link href="/login" className="text-blue-600 hover:underline">
            Volver a inicio de sesión
          </Link>
        </p>
      </main>
    </>
  );
}
