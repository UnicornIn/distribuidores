import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../type/auth-context";  // Importar el contexto
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();  // Obtener la función login
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.target as HTMLFormElement;
    const email = form.querySelector<HTMLInputElement>("#email")?.value;
    const password = form.querySelector<HTMLInputElement>("#password")?.value;

    try {
      const response = await fetch("https://api.rizosfelices.co/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email!, password: password! }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al iniciar sesión");
      }

      const data = await response.json();
      login(data.access_token);  // Guardar el token en el contexto

      localStorage.setItem("rol", data.rol);
      localStorage.setItem("nombre", data.nombre);
      localStorage.setItem("pais", data.pais);
      localStorage.setItem("email", data.email);

      // Redirigir según el rol
      if (data.rol === "Admin" || data.rol === "produccion" || data.rol === "facturacion") {
        navigate("/admin/dashboard");
      } else if (data.rol === "distribuidor") {
        navigate("/distribuidor/pedidos");
      } else {
        throw new Error("Rol no reconocido");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-accent to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="absolute left-4 top-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <CardTitle className="text-2xl font-bold text-primary">Iniciar Sesión</CardTitle>
          <CardDescription>Accede a tu cuenta para gestionar tus pedidos</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" placeholder="tu@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Rizos Felices
        </CardFooter>
      </Card>
    </div>
  );
}
