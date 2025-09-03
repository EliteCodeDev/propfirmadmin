// Cliente HTTP centralizado para llamadas al backend (capa API)
import axios from "axios";
import { getSession, signOut } from "next-auth/react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiBaseUrl, internalApiBaseUrl } from "@/config";

const isBrowser = typeof window !== "undefined";

const client = axios.create({
  // En browser -> BFF; en server -> backend interno (si existe) o público.
  baseURL: isBrowser ? "/api/server" : internalApiBaseUrl || apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use(async (config) => {
  // Sólo añadimos Authorization en entorno servidor.
  if (!isBrowser) {
    try {
      const session = await getServerSession(authOptions);
      if (session?.accessToken) {
        config.headers = config.headers || {};
        (config.headers as Record<string, string>)[
          "Authorization"
        ] = `Bearer ${session.accessToken}`;
      }
    } catch {}
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        try {
          if (typeof window !== "undefined") {
            await signOut({ callbackUrl: "/auth/login" });
          }
        } catch {}
      }
      const payload = error.response.data;
      const info = typeof payload === "object" && payload !== null && Object.keys(payload).length === 0
        ? `(status ${status})`
        : payload;
      console.error("API Error Response:", info);
    } else if (error.request) {
      console.error("API Error Request:", error.request);
    } else {
      console.error("API Error Message:", error.message);
    }
    return Promise.reject(error instanceof Error ? error : new Error(error?.message || 'Unknown error'));
  }
);

export default client;
