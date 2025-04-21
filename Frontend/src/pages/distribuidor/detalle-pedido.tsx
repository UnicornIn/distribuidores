"use client";

import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { ArrowLeft, CheckCircle2, Printer, Truck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";

type ProductoDetalle = {
  id: string;
  nombre: string;
  precio: number;
  precio_sin_iva: number;
  iva_unitario: number;
  cantidad: number;
  total: number;
  tipo_precio: string;
};

type PedidoDetalle = {
  id: string;
  fecha: string;
  estado: "Procesando" | "en camino" | "facturado";
  direccion: string;
  notas?: string;
  distribuidor_nombre: string;
  distribuidor_phone: string;
  productos: ProductoDetalle[];
  subtotal: number;
  iva: number;
  total: number;
  tipo_precio: string;
};

export default function DetallePedidoPage() {
  const { id } = useParams<{ id: string }>();
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

        const response = await fetch(`https://api.rizosfelices.co/pedidos/${id}`, {
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

  // Función para formatear números con separadores de miles
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CO').format(Math.round(num));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "Procesando":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Procesando
          </Badge>
        );
      case "en camino":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            En Camino
          </Badge>
        );
      case "facturado":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Facturado
          </Badge>
        );
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getEstadoDescripcion = (estado: string) => {
    switch (estado) {
      case "Procesando":
        return "Tu pedido está siendo procesado por nuestro equipo";
      case "en camino":
        return "El almacén ha preparado tu pedido y está en camino";
      case "facturado":
        return "El departamento de facturación ha procesado tu pedido";
      default:
        return "Estado desconocido";
    }
  };

  // Función para manejar la impresión
  const handlePrint = () => {
    window.print();
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
    <div className="container mx-auto p-4 md:p-6 print:p-0">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="print:hidden">
          <Link to="/distribuidor/pedidos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">Pedido #{pedido.id}</h1>
          <p className="text-muted-foreground">
            Realizado el {formatDate(pedido.fecha)} • Estado: {getEstadoBadge(pedido.estado)}
          </p>
        </div>
      </div>

      {esNuevo && (
        <Alert className="mb-6 border-green-200 bg-green-50 print:hidden">
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-2 pl-2">Producto</th>
                        <th className="text-right pb-2">Cantidad</th>
                        <th className="text-right pb-2">Precio unitario</th>
                        <th className="text-right pb-2">IVA unitario</th>
                        <th className="text-right pb-2 pr-2">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedido.productos.map((producto) => (
                        <tr key={producto.id} className="border-b last:border-0">
                          <td className="py-3 pl-2">
                            <p className="font-medium">{producto.nombre}</p>
                          </td>
                          <td className="text-right py-3">{producto.cantidad}</td>
                          <td className="text-right py-3">${formatNumber(producto.precio)}</td>
                          <td className="text-right py-3">${formatNumber(producto.iva_unitario)}</td>
                          <td className="text-right py-3 pr-2">${formatNumber(producto.precio * producto.cantidad)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t pt-6">
              <div className="w-full space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal productos:</span>
                  <span>${formatNumber(pedido.subtotal)}</span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <div>
                    <span className="text-muted-foreground">IVA (19%)</span>
                    <p className="text-xs text-muted-foreground">Desglose por producto</p>
                  </div>
                  <span>${formatNumber(pedido.iva)}</span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="font-semibold">Total a pagar:</span>
                  <span className="font-semibold text-lg">${formatNumber(pedido.total)}</span>
                </div>

                <div className="mt-4 text-sm text-muted-foreground text-center">
                  <p className="text-xs">Pedido #{pedido.id} • {formatDate(pedido.fecha)}</p>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Distribuidor</p>
                  <p>{pedido.distribuidor_nombre}</p>
                  <p className="text-sm text-muted-foreground">{pedido.distribuidor_phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                  <p>{formatDate(pedido.fecha)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dirección de entrega</p>
                  <p>{pedido.direccion}</p>
                </div>
                {pedido.notas && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notas adicionales</p>
                    <p className="whitespace-pre-wrap">{pedido.notas}</p>
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
                      {getEstadoDescripcion(pedido.estado)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="print:hidden">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handlePrint}
              >
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