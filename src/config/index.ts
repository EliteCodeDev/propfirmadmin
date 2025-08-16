// src/config/index.ts
type GetEnvOptions = {
  required?: boolean;
  default?: string;
  logIfDefault?: boolean;
  clientSafe?: boolean; // Indica si la variable debe estar disponible en el cliente
};

// Detectar si estamos en el lado del cliente
const isClient = typeof window !== "undefined";

const PUBLIC_ENV = {
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  NEXT_PUBLIC_LOGO_APP: process.env.NEXT_PUBLIC_LOGO_APP,
  NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY,
} as const;

export const getEnv = (
  key: keyof typeof PUBLIC_ENV | string,
  { required, default: def, logIfDefault }: GetEnvOptions = {}
): string => {
  if (!isClient) {
    const value = process.env[key as string];
    if (value === undefined || value === "") {
      if (required && def === undefined) {
        throw new Error(`Falta variable de entorno requerida: ${key}`);
      }
      if (
        def !== undefined &&
        process.env.NODE_ENV !== "production" &&
        logIfDefault
      ) {
        console.warn(`[env] Usando valor por defecto para ${key}: ${def}`);
      }
      return def ?? "";
    }
    return value;
  }

  // Cliente: solo podemos leer de PUBLIC_ENV
  const value = (PUBLIC_ENV as Record<string, string | undefined>)[
    key as string
  ];
  if (value === undefined || value === "") {
    if (required && def === undefined) {
      throw new Error(
        `Falta variable de entorno pública (NEXT_PUBLIC_*) requerida: ${key}`
      );
    }
    if (def !== undefined && logIfDefault) {
      console.warn(
        `[env] (cliente) Usando valor por defecto para ${key}: ${def}`
      );
    }
    return def ?? "";
  }
  return value;
};

// Entorno
export const NODE_ENV = getEnv("NODE_ENV", {
  default: "development",
  logIfDefault: true,
});

export const IS_DEV = NODE_ENV === "development";
export const IS_PROD = NODE_ENV === "production";

// Backend público (usable en cliente). Se normaliza sin slash final.
export const backendUrl = getEnv("NEXT_PUBLIC_BACKEND_URL", {
  default: "http://localhost:1337",
  logIfDefault: true,
  clientSafe: true, // Esta variable debe estar disponible en el cliente
}).replace(/\/$/, "");

// Logo público opcional
export const LOGO_APP = getEnv("NEXT_PUBLIC_LOGO_APP", {
  default: "",
  logIfDefault: false,
  clientSafe: true,
});

// API key pública opcional (si aplica)
export const PUBLIC_API_KEY = getEnv("NEXT_PUBLIC_API_KEY", {
  default: "",
  logIfDefault: false,
  clientSafe: true,
});

// Backend interno (NO exponer). Permite apuntar a red interna / docker network.
export const internalBackendUrl = getEnv("BACKEND_INTERNAL_URL", {
  default: backendUrl,
  logIfDefault: true,
}).replace(/\/$/, "");

// Base URL para llamadas REST del frontend.
export const apiBaseUrl = `${backendUrl}/api`;
export const internalApiBaseUrl = `${internalBackendUrl}/api`;

// Secret de NextAuth (solo disponible en server / middleware / edge runtime).
export const NEXTAUTH_SECRET = getEnv("NEXTAUTH_SECRET", {
  required: !isClient, // Solo requerido en el servidor
  default: isClient ? "" : "dev-secret-change", // Vacío en cliente, valor por defecto en servidor
});

// Helper para exponer un snapshot (útil en depuración).
export const env = {
  NODE_ENV,
  IS_DEV,
  IS_PROD,
  backendUrl,
  apiBaseUrl,
  internalBackendUrl,
  internalApiBaseUrl,
  backendUrlSource: process.env.NEXT_PUBLIC_BACKEND_URL ? "env" : "default",
  LOGO_APP,
  PUBLIC_API_KEY,
  // No exponer secretos adicionales aquí si se agregan en el futuro.
};

export const getEnvSafe = getEnv;
