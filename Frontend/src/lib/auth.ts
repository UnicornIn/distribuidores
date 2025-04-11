import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    // Verifica si el token es válido (puedes decodificar el token JWT si lo usas)
    const isTokenExpired = () => {
      const token = localStorage.getItem("access_token");
      if (!token) return true;
    
      try {
        const payload = JSON.parse(atob(token.split(".")[1])); // Decodifica el JWT
        return payload.exp * 1000 < Date.now(); // Verifica la expiración
      } catch {
        return true;
      }
    };
    
    if (isTokenExpired()) {
      localStorage.clear(); // Borra la sesión si el token expiró
      navigate("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, []);

  return isAuthenticated;
}
