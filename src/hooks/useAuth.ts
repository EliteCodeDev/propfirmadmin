'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  register as registerService,
  forgotPassword as forgotPasswordService,
  resetPassword as resetPasswordService,
} from '@/services/auth';
import type { AuthResponse } from '@/services/auth';

// Define a type for the API error response
type ApiError = {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
};

// Hook for user registration
export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: registerService,
    onSuccess: () => {
      toast.success('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    },
    onError: (error: ApiError) => {
      const rawMessage = error.response?.data?.message;
      const errorMsg = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage || 'Hubo un error en el registro.';

      if (errorMsg.includes('already exists')) {
        toast.error('Un usuario con este email o nombre de usuario ya existe.');
      } else {
        toast.error(errorMsg);
      }
    },
  });
}

// Hook for handling forgot password
export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPasswordService,
    onSuccess: () => {
      toast.success('Se ha enviado un correo para restablecer tu contraseña.');
    },
    onError: () => {
      toast.error('No se pudo enviar el correo. ¿El email es correcto?');
    },
  });
}

// Hook for resetting password
export function useResetPassword() {
  const router = useRouter();

  return useMutation<AuthResponse, Error, Parameters<typeof resetPasswordService>[0]>({
    mutationFn: resetPasswordService,
    onSuccess: () => {
      toast.success('Contraseña actualizada con éxito. Serás redirigido a la página de login.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    },
    onError: () => {
      toast.error('No se pudo actualizar la contraseña. El código podría ser inválido o haber expirado.');
    },
  });
}
