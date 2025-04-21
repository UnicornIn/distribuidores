"use client";

import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

// Función para formatear números con separadores de miles
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

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
  categoria?: string;
  tipo_precio: "sin_iva" | "con_iva" | "sin_iva_internacional" | "base";
};

type ProductoPedido = {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  precio_sin_iva: number; // Añadimos esta propiedad
  tipo_precio: "sin_iva" | "con_iva" | "sin_iva_internacional" | "base";
  iva_unitario?: number; // Opcional para mostrar en la UI
};

type PedidoResponse = {
  message: string;
  pedido: {
    id: string;
    distribuidor_id: string;
    distribuidor_nombre: string;
    distribuidor_phone: string;
    productos: ProductoPedido[];
    direccion: string;
    notas: string;
    fecha: string;
    estado: string;
    subtotal: number;
    iva: number;
    total: number;
    _id: string;
  };
};

export default function NuevoPedidoPage() {
  const { toast } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState<PedidoResponse | null>(null);
  const [tipoPrecioUsuario, setTipoPrecioUsuario] = useState<"sin_iva" | "con_iva" | "sin_iva_internacional" | "base" | null>(null);

  // Obtener productos disponibles
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("No autenticado");
        }

        const response = await fetch("https://api.rizosfelices.co/productos/disponibles", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al obtener productos");
        }

        const data = await response.json();

        const tipoPrecio = data[0]?.tipo_precio || "base";
        setTipoPrecioUsuario(tipoPrecio);

        setProductos(data.map((p: Producto) => ({
          ...p,
          cantidad: 0,
          precio: Math.round(p.precio),
        })));
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
    const producto = productos.find(p => p.id === id);
    if (producto) {
      actualizarCantidad(id, producto.cantidad + 1);
    }
  };

  const decrementarCantidad = (id: string) => {
    const producto = productos.find(p => p.id === id);
    if (producto) {
      actualizarCantidad(id, producto.cantidad - 1);
    }
  };

  // Calcular totales del carrito
  const productosSeleccionados = productos.filter(p => p.cantidad > 0);

  // 👇 Aquí ya estás incluyendo el precio con IVA si aplica
  const aplicarIva = tipoPrecioUsuario === "con_iva";
  const subtotal = productosSeleccionados.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  const iva = aplicarIva ? subtotal * 0.19 : 0;
  const total = aplicarIva ? subtotal + iva : subtotal;
  
  const descuentos = productosSeleccionados.reduce(
    (sum, p) => sum + ((p.precio_original || p.precio) - p.precio) * p.cantidad,
    0
  );
  
  // 👇 Enviar pedido con precio incluido
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No autenticado");
  
      if (productosSeleccionados.length === 0) {
        throw new Error("Selecciona al menos un producto");
      }
  
      const response = await fetch("https://api.rizosfelices.co/pedidos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productos: productosSeleccionados.map(p => ({
            id: p.id,
            cantidad: p.cantidad,
            tipo_precio: p.tipo_precio,
            precio: p.precio, // ✅ Incluido el IVA si aplica
          })),
          direccion,
          notas,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al crear pedido");
      }
  
      const data: PedidoResponse = await response.json();
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
  
  // ✅ Vista de confirmación (usa el desglose, pero sin recalcular mal el IVA)
  if (pedidoConfirmado) {
    const { pedido } = pedidoConfirmado;
    const productosPedido = pedido.productos || [];
    const fechaPedido = pedido.fecha ? new Date(pedido.fecha) : new Date();
  
    // ✅ Usamos precio_sin_iva si lo devuelve el backend ya calculado
    const subtotalSinIva = productosPedido.reduce(
      (sum, p) => sum + (p.precio_sin_iva * p.cantidad),
      0
    );
  
    const aplicarIvaPedido = tipoPrecioUsuario === "con_iva";
    const ivaPedido = aplicarIvaPedido ? subtotalSinIva * 0.19 : 0;
    const totalPedido = aplicarIvaPedido ? subtotalSinIva + ivaPedido : subtotalSinIva;

    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">¡Pedido Confirmado!</CardTitle>
            <CardDescription className="text-lg">
              ID del pedido: <span className="font-bold">{pedido.id || 'N/A'}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Sección de confirmación */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-700 font-semibold text-lg">✅ Pedido realizado con éxito</p>
              <p className="text-green-600 mt-2">
                Total del pedido: <span className="font-bold">${formatNumber(totalPedido)}</span>
              </p>
              <p className="text-green-600 mt-1">
                Fecha: {fechaPedido.toLocaleDateString()} a las {fechaPedido.toLocaleTimeString()}
              </p>
            </div>

            {/* Detalles de productos */}
            <div className="space-y-3">
              <h3 className="font-semibold text-xl">Detalles del pedido</h3>
              <div className="border rounded-lg divide-y">
                {productosPedido.map((p, i) => {
                  const precioSinIva = p.precio_sin_iva || p.precio / 1.19;
                  const ivaUnitario = aplicarIvaPedido ? precioSinIva * 0.19 : 0;
                  const precioFinal = aplicarIvaPedido ? precioSinIva + ivaUnitario : precioSinIva;
                  const totalProducto = precioFinal * p.cantidad;

                  return (
                    <div key={i} className="flex justify-between items-center p-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-100 rounded-md w-10 h-10 flex items-center justify-center">
                          <span className="text-gray-500">{i + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{p.nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            Cantidad: {p.cantidad}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${formatNumber(totalProducto)}</p>
                        {aplicarIvaPedido ? (
                          <>
                            <p className="text-sm text-muted-foreground">
                              Precio sin IVA: ${formatNumber(precioSinIva)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              IVA (19%): ${formatNumber(ivaUnitario)} × {p.cantidad} = ${formatNumber(ivaUnitario * p.cantidad)}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Precio unitario: ${formatNumber(precioSinIva)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resumen de totales */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${formatNumber(subtotalSinIva)}</span>
                </div>
                {aplicarIvaPedido && (
                  <div className="flex justify-between">
                    <span>IVA (19%):</span>
                    <span>${formatNumber(ivaPedido)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${formatNumber(totalPedido)}</span>
                </div>
                {pedido.estado === 'Procesando' && (
                  <p className="text-sm text-muted-foreground mt-2">
                    El distribuidor procesará tu pedido y te notificará cuando esté en camino.
                  </p>
                )}
              </div>
            </div>

            {/* Información de entrega */}
            <div className="space-y-4 pt-4">
              <h3 className="font-semibold text-xl">Información de entrega</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Distribuidor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p>{pedido.distribuidor_nombre || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p>{pedido.distribuidor_phone || 'No especificado'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Entrega</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Dirección</p>
                      <p>{pedido.direccion || 'No especificada'}</p>
                    </div>
                    {pedido.notas && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notas</p>
                        <p className="bg-gray-50 p-2 rounded">{pedido.notas}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Estado del pedido */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Estado del pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <span className={`inline-block w-3 h-3 rounded-full ${pedido.estado === 'Procesando' ? 'bg-yellow-500' :
                        pedido.estado === 'En camino' ? 'bg-blue-500' :
                          pedido.estado === 'Entregado' ? 'bg-green-500' : 'bg-gray-500'
                      }`}></span>
                    <span className="font-medium">{pedido.estado || 'Estado desconocido'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista principal del formulario de pedido
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Nuevo Pedido</h1>
      {tipoPrecioUsuario && (
        <div className="text-sm text-muted-foreground">

          {tipoPrecioUsuario === "con_iva" && (
            <span className="ml-2 text-green-600"></span>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Productos Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right w-[120px]">Precio</TableHead>
                    <TableHead className="text-center w-[150px]">Cantidad</TableHead>
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
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                            {p.id}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{p.nombre}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {p.descripcion}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-semibold">
                            ${formatNumber(p.precio)}
                            {tipoPrecioUsuario === "con_iva" && (
                              <span className="block text-xs text-green-600">
                              </span>
                            )}
                          </div>
                          {p.precio_original && p.precio < p.precio_original && (
                            <div className="text-xs text-green-600 line-through">
                              ${formatNumber(p.precio_original)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => decrementarCantidad(p.id)}
                              disabled={p.cantidad <= 0}
                            >
                              -
                            </Button>
                            <div className="relative">
                              <input
                                type="number"
                                className="w-12 h-8 text-center text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={p.cantidad}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  actualizarCantidad(p.id, Math.min(Math.max(value, 0), p.stock));
                                }}
                                min={0}
                                max={p.stock}
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => incrementarCantidad(p.id)}
                              disabled={p.cantidad >= p.stock}
                            >
                              +
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
                      <div className="text-right">
                        <span>${formatNumber(p.precio * p.cantidad)}</span>
                        {tipoPrecioUsuario === "con_iva" && (
                          <span className="block text-xs text-muted-foreground">
                            <span className="text-green-600 font-medium">+ IVA</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {descuentos > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuentos:</span>
                      <span>-${formatNumber(descuentos)}</span>
                    </div>
                  )}

                  {tipoPrecioUsuario === "con_iva" && (
                    <>
                      <div className="flex justify-between border-t pt-2">
                        <span>Subtotal:</span>
                        <span>${formatNumber(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IVA (19%):</span>
                        <span>${formatNumber(iva)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>${formatNumber(total)}</span>
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
                  <input
                    id="direccion"
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Calle, número, ciudad, código postal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notas">Notas Adicionales</Label>
                  <input
                    id="notas"
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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