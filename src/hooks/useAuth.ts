'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  register as registerService,
  requestPasswordReset as requestPasswordResetService,
  confirmPasswordReset as confirmPasswordResetService,
} from '@/services/auth';
import type { AuthResponse, ConfirmResetPasswordData } from '@/services/auth';

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
    onSuccess: (data) => {
      // The backend now requires email confirmation, so we guide the user to do that.
      toast.success(data.message || '¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
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

// Hook for requesting a password reset
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: requestPasswordResetService,
    onSuccess: () => {
      toast.success('Si el email existe, se ha enviado un correo para restablecer tu contraseña.');
    },
    onError: () => {
      // For security, don't reveal if the email was correct or not.
      toast.error('No se pudo procesar la solicitud.');
    },
  });
}

// Hook for confirming the password reset
export function useConfirmPasswordReset() {
  const router = useRouter();

  return useMutation<AuthResponse, Error, ConfirmResetPasswordData>({
    mutationFn: confirmPasswordResetService,
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
