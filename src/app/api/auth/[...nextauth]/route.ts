// Re-export solo de los handlers válidos para la ruta NextAuth
// (No exportamos authOptions aquí para evitar error de tipos de Next.js
// por exportaciones no permitidas en route handlers. Importar authOptions
// directamente desde "@/lib/auth" donde se necesite.)
export { authHandler as GET, authHandler as POST } from "@/lib/auth";
