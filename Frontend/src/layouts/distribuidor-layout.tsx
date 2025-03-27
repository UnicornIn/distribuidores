import { Outlet } from "react-router-dom";
import { DistribuidorNav } from "../components/distribuidor-nav"; // Verifica que el nombre sea correcto

export default function DistribuidorLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <DistribuidorNav /> {/* Asegurar que esta función existe en el archivo importado */}
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
