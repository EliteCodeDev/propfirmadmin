// src/services/server/strapiService.ts

import axios, { AxiosRequestConfig, isAxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!API_URL) {
  throw new Error('⚠️ NEXT_PUBLIC_BACKEND_URL no está definido en .env.local');
}

// Creamos una instancia de Axios con la baseURL apuntando a /api
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

const strapiService = {
  /**
   * Hace una petición genérica a Strapi.
   * @param path Ruta relativa dentro de /api (p.ej. 'auth/local' o 'users/me').
   * @param config Configuración de Axios (method, params, data, headers).
   */
  async request<T = unknown>(
    path: string,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      const res = await api.request<T>({
        url: `/${path}`,
        method: config.method,
        params: config.params,
        data:   config.data,
        headers: { ...config.headers },
      });
      return res.data;
    } catch (err) {
      if (isAxiosError(err)) {
        // Mostramos el body JSON de Strapi o el mensaje de error
        console.error('⛔ Strapi error response:', err.response?.data ?? err.message);
      } else {
        console.error('⛔ Generic error:', err);
      }
      throw err;
    }
  },

  /**
   * Igual que request, pero añade el Authorization header con el JWT de Strapi.
   */
  async authenticatedRequest<T = unknown>(
    path: string,
    config: AxiosRequestConfig = {},
    jwt: string
  ): Promise<T> {
    return this.request<T>(path, {
      ...config,
      headers: {
        Authorization: `Bearer ${jwt}`,
        ...config.headers,
      },
    });
  },
};

export default strapiService;
