import { useAuth } from "./auth-context"; // Ajusta la ruta según tu estructura

/**
 * Obtiene los headers de autenticación para las peticiones HTTP.
 * @returns {HeadersInit} Objeto con los headers necesarios (Authorization).
 */
export const getAuthHeader = (): HeadersInit => {
  const { token } = useAuth(); // Obtiene el token del contexto de autenticación

  if (!token) {
    throw new Error("No hay token de autenticación disponible");
  }

  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json", // Opcional: para peticiones JSON
  };
};