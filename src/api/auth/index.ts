import authClient from "@/api/auth-client";
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  ResetPasswordData,
  UserData,
} from "../../types/auth";
//ivan

export async function login(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  console.log("Logging in user:", credentials);
  const { data } = await authClient.post("/auth/login", credentials);

  // Si la respuesta del backend tiene un formato como { success, message, data },
  // y en caso de éxito devuelve los datos del usuario dentro de 'data',
  // y en caso de error no lo hace, debemos manejarlo.
  // La lógica de NextAuth en `authorize` espera que se lance un error en caso de fallo.
  // El interceptor de axios ya imprime el error, así que aquí solo nos enfocamos en la data de éxito.

  // Asumimos que una respuesta exitosa siempre contiene `data.data` o una estructura predecible.
  // Si `data.data` no existe en una respuesta que no es de error, devolvemos `data`.
  if (data && data.data) {
    return data.data;
  }

  // Si la respuesta es exitosa pero no tiene el wrapper 'data', se devuelve directamente.
  // Esto cubre el caso de `data.data || data` pero de forma más explícita.
  // El `authorize` de NextAuth buscará las propiedades que necesita (user, access_token).
  return data;
}

export async function register(userData: RegisterData): Promise<AuthResponse> {
  console.log("Registering user:", userData);
  const { data } = await authClient.post("/auth/register", userData);
  // El backend envuelve la respuesta en {success, message, data}
  return data.data || data;
}

export async function forgotPassword(email: string): Promise<void> {
  await authClient.post("/auth/reset-password", { email });
}

export async function resetPassword(
  data: ResetPasswordData
): Promise<AuthResponse> {
  const { data: response } = await authClient.post("/auth/reset-password", data);
  return response;
}

export async function sendEmailConfirmation(email: string): Promise<void> {
  await authClient.post("/auth/resend-confirmation", { email });
}

export async function getProfile(): Promise<UserData> {
  const { data } = await authClient.get("/auth/profile");
  // El backend envuelve la respuesta en {success, message, data}
  return data.data || data;
}

export async function refresh(
  refreshToken: string
): Promise<Pick<AuthResponse, "access_token" | "refresh_token">> {
  const { data } = await authClient.post("/auth/refresh", { refreshToken });
  // El backend envuelve la respuesta en {success, message, data}
  return data.data || data;
}
