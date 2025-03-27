// src/utils/auth.ts

// Función para obtener el token del localStorage
export const getToken = (): string | null => {
  return localStorage.getItem('access_token');
}

// Función para obtener el país del usuario del localStorage
export const getPais = (): string | null => {
  return localStorage.getItem('pais');
}

// Función para verificar si el token es válido
export const isTokenValid = (token: string): boolean => {
  try {
      const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decodificar el token JWT
      const currentTime = Date.now() / 1000; // Obtener el tiempo actual en segundos

      // Verificar si el token ha expirado
      if (decodedToken.exp && decodedToken.exp < currentTime) {
          return false;
      }

      return true;
  } catch (error) {
      console.error('Error al decodificar el token:', error);
      return false;
  }
}

// Función para limpiar el localStorage
export const clearAuthData = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('pais');
}

// Función para recargar la página
const reloadPage = (): void => {
  window.location.reload();
}

// Función para verificar y limpiar el token si no es válido, y recargar la página si es necesario
export const validateAndCleanToken = (): void => {
  const token = getToken();

  if (!token || !isTokenValid(token)) {
      clearAuthData();
      reloadPage(); // Recargar la página si el token no es válido o no está presente
  }
}

// Función para obtener el token y validarlo
export const getValidatedToken = (): string | null => {
  validateAndCleanToken();
  return getToken();
}

// Función para obtener el país y validar el token
export const getValidatedPais = (): string | null => {
  validateAndCleanToken();
  return getPais();
}