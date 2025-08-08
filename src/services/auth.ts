// src/services/auth.ts
import strapiService from './server/strapiService';

export interface UserData {
  id: number;
  username: string;
  email: string;
  role?: { id: number; name: string };
  isVerified?: boolean;
  [key: string]: any;
}

export interface AuthResponse {
  user: UserData;
  jwt: string;
}

export async function signIn({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  // 1) Autenticación local
  const authResponse = await strapiService.request<AuthResponse>(
    'auth/local',
    {
      method: 'POST',
      data: {
        identifier: email,
        password,
      },
    }
  );
  const { jwt, user } = authResponse;
  if (!jwt) throw new Error('No JWT received');

  // 2) Obtener user con el rol poblado
  const userWithRole = await strapiService.authenticatedRequest<UserData>(
    'users/me',
    { method: 'GET', params: { populate: 'role' } },
    jwt
  );

  return { user: userWithRole, jwt };
}

export async function register(
  userData: Record<string, any>
): Promise<AuthResponse> {
  const response = await strapiService.request<AuthResponse>(
    'auth/local/register',
    {
      method: 'POST',
      data: userData,
    }
  );
  return response;
}

export async function providerAuth(
  provider: string,
  accessToken: string
): Promise<AuthResponse> {
  const response = await strapiService.request<AuthResponse>(
    `auth/${provider}/callback`,
    {
      method: 'GET',
      params: { access_token: accessToken },
    }
  );
  return response;
}

export async function getMe(token: string): Promise<UserData> {
  return strapiService.authenticatedRequest<UserData>(
    'users/me',
    { method: 'GET', params: { populate: 'role' } },
    token
  );
}
