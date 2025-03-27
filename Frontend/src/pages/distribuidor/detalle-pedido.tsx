"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { ArrowLeft, CheckCircle2, Printer, Truck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";

type ProductoDetalle = {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
};

type PedidoDetalle = {
  id: string;
  fecha: string;
  estado: "Procesando" | "pendiente" | "enviado" | "entregado"; // Asegúrate de incluir "Procesando" aquí
  direccion: string;
  notas?: string;
  productos: ProductoDetalle[];
};

export default function DetallePedidoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const esNuevo = new URLSearchParams(location.search).get("nuevo") === "true";
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  // Obtener los detalles del pedido
  useEffect(() => {
    const fetchPedido = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("No se encontró el token de autenticación");
        }

        const response = await fetch(`http://127.0.0.1:8000/pedidos/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al obtener los detalles del pedido");
        }

        const data = await response.json();
        setPedido(data.pedido);
      } catch (err) {
        console.error("Error al obtener los detalles del pedido:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPedido();
  }, [id]);

  const calcularSubtotal = () => {
    if (!pedido) return 0;
    return pedido.productos.reduce((total, producto) => total + producto.precio * producto.cantidad, 0);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pendiente
          </Badge>
        );
      case "enviado":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Enviado
          </Badge>
        );
      case "entregado":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Entregado
          </Badge>
        );
      case "Procesando": // Caso para "Procesando"
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            Procesando
          </Badge>
        );
      default:
        return <Badge variant="outline">Desconocido</Badge>; // Muestra "Desconocido" si el estado no coincide con ningún caso
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-[400px] items-center justify-center p-4 md:p-6">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p>Cargando detalles del pedido...</p>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <h1 className="mb-6 text-2xl font-bold text-primary md:text-3xl">Pedido no encontrado</h1>
        <p>El pedido que buscas no existe o ha sido eliminado.</p>
        <Button asChild className="mt-4">
          <Link to="/distribuidor/pedidos">Volver a mis pedidos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/distribuidor/pedidos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">Pedido #{pedido.id}</h1>
          <p className="text-muted-foreground">
            Realizado el {new Date(pedido.fecha).toLocaleDateString()} • Estado: {getEstadoBadge(pedido.estado)}
          </p>
        </div>
      </div>

      {esNuevo && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">¡Pedido realizado con éxito!</AlertTitle>
          <AlertDescription className="text-green-700">
            Tu pedido ha sido registrado correctamente. Puedes ver el estado de tu pedido en esta página.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
              <CardDescription>Detalle de los productos incluidos en tu pedido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pedido.productos.map((producto) => (
                  <div
                    key={producto.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{producto.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        ${producto.precio.toFixed(2)} x {producto.cantidad}
                      </p>
                    </div>
                    <p className="font-medium">${(producto.precio * producto.cantidad).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <p className="text-lg font-semibold">Total</p>
              <p className="text-lg font-semibold">${calcularSubtotal().toFixed(2)}</p>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                  <p>{pedido.direccion}</p>
                </div>
                {pedido.notas && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notas</p>
                    <p>{pedido.notas}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Seguimiento</p>
                    <p className="text-sm text-muted-foreground">
                      {pedido.estado === "pendiente"
                        ? "Tu pedido está siendo procesado"
                        : pedido.estado === "enviado"
                          ? "Tu pedido está en camino"
                          : pedido.estado === "Procesando"
                            ? "Tu pedido está en proceso"
                            : "Tu pedido ha sido entregado"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full gap-2">
                <Printer className="h-4 w-4" />
                Imprimir Detalles
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}