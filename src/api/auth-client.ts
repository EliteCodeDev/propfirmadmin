// Cliente HTTP específico para autenticación que llama directamente al backend
// NextAuth requiere acceso directo al backend para el proceso de autenticación
import axios from "axios";
import { apiBaseUrl } from "@/config";

const authClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      console.error("Auth API Error Response:", error.response.data);
    } else if (error.request) {
      console.error("Auth API Error Request:", error.request);
    } else {
      console.error("Auth API Error Message:", error.message);
    }
    return Promise.reject(error);
  }
);

export default authClient;