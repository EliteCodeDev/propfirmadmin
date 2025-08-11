import authClient from "@/api/auth-client";
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  ResetPasswordData,
  UserData,
} from "../../types/auth";

export async function login(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  console.log("Logging in user:", credentials);
  const { data } = await authClient.post("/auth/login", credentials);
  // El backend envuelve la respuesta en {success, message, data}
  return data.data || data;
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
