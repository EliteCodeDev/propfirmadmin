import authClient from "@/api/auth-client";
import { AuthResponse, LoginCredentials, UserData } from "../../types/auth";
// Registro manejado en el front público. API removida del admin.

export async function login(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  const { data } = await authClient.post("/auth/admin/login", credentials);
  if (data && data.data) {
    return data.data;
  }

  return data;
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
