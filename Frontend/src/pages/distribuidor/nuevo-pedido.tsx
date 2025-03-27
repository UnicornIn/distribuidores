"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { MinusCircle, PlusCircle, ShoppingCart, Loader2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

type Producto = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precio_original?: number;
  stock: number;
  cantidad: number;
  unidad_medida: string;
  descuento?: number;
};

type Pedido = {
  id: string;
  productos: {
    id: string;
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }[];
  direccion: string;
  notas: string;
  fecha: string;
  estado: string;
  total: number;
};

export default function NuevoPedidoPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState<Pedido | null>(null);

  // Obtener productos disponibles
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("No autenticado");
        }

        const response = await fetch("http://127.0.0.1:8000/productos/disponibles", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al obtener productos");
        }

        const data = await response.json();
        setProductos(data.map((p: Producto) => ({ ...p, cantidad: 0 })));
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive",
        });
      }
    };

    fetchProductos();
  }, [toast]);

  // Funciones para manejar cantidades
  const actualizarCantidad = (id: string, nuevaCantidad: number) => {
    setProductos(prev => prev.map(p => 
      p.id === id 
        ? { ...p, cantidad: Math.max(0, Math.min(nuevaCantidad, p.stock)) }
        : p
    ));
  };

  const incrementarCantidad = (id: string) => {
    actualizarCantidad(id, productos.find(p => p.id === id)?.cantidad || 0 + 1);
  };

  const decrementarCantidad = (id: string) => {
    actualizarCantidad(id, productos.find(p => p.id === id)?.cantidad || 0 - 1);
  };

  // Calcular total y productos seleccionados
  const productosSeleccionados = productos.filter(p => p.cantidad > 0);
  const subtotal = productosSeleccionados.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  const descuentos = productosSeleccionados.reduce((sum, p) => sum + ((p.precio_original || p.precio) - p.precio) * p.cantidad, 0);
  const total = subtotal;

  // Enviar pedido
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No autenticado");

      if (productosSeleccionados.length === 0) {
        throw new Error("Selecciona al menos un producto");
      }

      const response = await fetch("http://127.0.0.1:8000/pedidos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productos: productosSeleccionados.map(p => ({
            id: p.id,
            nombre: p.nombre,
            precio: p.precio,
            cantidad: p.cantidad,
          })),
          direccion,
          notas,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al crear pedido");
      }

      const data = await response.json();
      setPedidoConfirmado(data);
      toast({
        title: "Pedido creado",
        description: "Tu pedido se ha registrado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear pedido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Renderizado condicional
  if (pedidoConfirmado) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Pedido Confirmado</CardTitle>
            <CardDescription>Detalles de tu pedido #{pedidoConfirmado.id}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-700 font-semibold">¡Pedido realizado con éxito!</p>
                <p className="text-green-600 mt-2">
                  Hemos recibido tu pedido correctamente. Te notificaremos cuando esté en camino.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Productos:</h3>
                {pedidoConfirmado.productos.map((p, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{p.cantidad}x {p.nombre}</span>
                    <span>${(p.precio * p.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-2">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${pedidoConfirmado.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Información de entrega:</h3>
                <p><strong>Dirección:</strong> {pedidoConfirmado.direccion}</p>
                {pedidoConfirmado.notas && <p><strong>Notas:</strong> {pedidoConfirmado.notas}</p>}
                <p><strong>Fecha:</strong> {new Date(pedidoConfirmado.fecha).toLocaleString()}</p>
                <p><strong>Estado:</strong> {pedidoConfirmado.estado}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/mis-pedidos")}>
              Ver mis pedidos
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Nuevo Pedido</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Productos Disponibles</CardTitle>
              <CardDescription>
                Selecciona los productos y cantidades para tu pedido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                        <p className="mt-2">Cargando productos...</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    productos.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.nombre}</div>
                          <div className="text-sm text-muted-foreground">{p.descripcion}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>${p.precio.toFixed(2)}</div>
                          {p.precio_original && p.precio < p.precio_original && (
                            <div className="text-sm text-muted-foreground line-through">
                              ${p.precio_original.toFixed(2)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{p.stock} {p.unidad_medida}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => decrementarCantidad(p.id)}
                              disabled={p.cantidad <= 0}
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              className="w-16 text-center"
                              value={p.cantidad}
                              onChange={e => actualizarCantidad(p.id, parseInt(e.target.value) || 0)}
                              min={0}
                              max={p.stock}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => incrementarCantidad(p.id)}
                              disabled={p.cantidad >= p.stock}
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
              <CardDescription>Revisa tu pedido antes de confirmar</CardDescription>
            </CardHeader>
            <CardContent>
              {productosSeleccionados.length > 0 ? (
                <div className="space-y-4">
                  {productosSeleccionados.map(p => (
                    <div key={p.id} className="flex justify-between">
                      <div>
                        <span className="font-medium">{p.cantidad}x {p.nombre}</span>
                        {p.descuento && p.descuento > 0 && (
                          <span className="block text-xs text-green-600">
                            {p.descuento}% descuento
                          </span>
                        )}
                      </div>
                      <span>${(p.precio * p.cantidad).toFixed(2)}</span>
                    </div>
                  ))}

                  {descuentos > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuentos:</span>
                      <span>-${descuentos.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <ShoppingCart className="mx-auto h-12 w-12 opacity-20" />
                  <p>No hay productos seleccionados</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección de Entrega *</Label>
                  <Input
                    id="direccion"
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    required
                    placeholder="Calle, número, ciudad, código postal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notas">Notas Adicionales</Label>
                  <Input
                    id="notas"
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    placeholder="Instrucciones especiales para la entrega"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={productosSeleccionados.length === 0 || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    "Confirmar Pedido"
                  )}
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}