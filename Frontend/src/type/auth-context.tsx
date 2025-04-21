import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(localStorage.getItem("access_token"));

  // Verificar el token en cada carga de la app
  useEffect(() => {
    const checkTokenValidity = async () => {
      if (!token) {
        logout();
        return;
      }

      try {
        const response = await fetch("https://api.rizosfelices.co/validate_token", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Token inválido o expirado");
        }
      } catch (error) {
        logout();
      }
    };

    checkTokenValidity();
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem("access_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("rol");
    localStorage.removeItem("nombre");
    localStorage.removeItem("pais");
    localStorage.removeItem("email");
    setToken(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
