'use client';

import { useState } from 'react';
import { useRegister } from '@/hooks/useAuth';
import { Toaster } from 'sonner';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Use the custom hook for registration
  const { mutate: register, isPending } = useRegister();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    register({ username, email, password });
  };

  return (
    <>
      <Toaster position="top-right" richColors />

      <main className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg mt-10">
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">Crear cuenta</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre de usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
              title="La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula y un número."
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700 dark:hover:bg-blue-500"
          >
            {isPending ? 'Registrando…' : 'Registrarse'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </main>
    </>
  );
}
