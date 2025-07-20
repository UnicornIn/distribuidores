import { useEffect, useState } from "react";

interface UserData {
  rol: string;
  cdi: string | null;
}

export function useUser(): UserData {
  const [user, setUser] = useState<UserData>({ rol: "invitado", cdi: null });

  useEffect(() => {
    try {
      const rol = localStorage.getItem("rol") || "invitado";
      const cdi = localStorage.getItem("cdi");

      // Si es Admin, cdi siempre será null porque no aplica
      setUser({
        rol,
        cdi: rol === "Admin" ? null : cdi,
      });

      console.log("DEBUG useUser -> rol:", rol, "cdi:", cdi);
    } catch (error) {
      console.error("Error leyendo datos del usuario en localStorage", error);
    }
  }, []);

  return user;
}
