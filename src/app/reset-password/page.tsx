'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { resetPassword } from '@/services/auth';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const resetCode = searchParams.get('code');
    if (resetCode) {
      setCode(resetCode);
    } else {
      toast.error('Código de reseteo no encontrado.');
      // Opcional: redirigir si no hay código
      // router.push('/login');
    }
  }, [searchParams, router]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== passwordConfirmation) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (!code) {
      toast.error('Falta el código de reseteo.');
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(code, password, passwordConfirmation);
      toast.success('Contraseña actualizada con éxito');
      setTimeout(() => router.push('/login'), 2000);
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('No se pudo actualizar la contraseña. El código podría ser inválido o haber expirado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />

      <main className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Nueva contraseña</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Nueva contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="passwordConfirmation" className="block text-sm font-medium">
              Confirmar contraseña
            </label>
            <input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !code}
            className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Actualizando…' : 'Actualizar contraseña'}
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
