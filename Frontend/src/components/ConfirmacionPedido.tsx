import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { formatNumber } from "../lib/utils";

type ProductoPedido = {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  precio_sin_iva: number;
  iva_unitario: number;
  total: number;
};

type Pedido = {
  id: string;
  distribuidor_nombre: string;
  distribuidor_phone: string;
  productos: ProductoPedido[];
  direccion: string;
  notas: string;
  fecha: string;
  subtotal: number;
  iva: number;
  total: number;
  tipo_precio: string;
};

export default function ConfirmacionPedido() {
  const location = useLocation();
  const { pedido } = location.state as { pedido: Pedido };
  const fechaPedido = pedido.fecha ? new Date(pedido.fecha) : new Date();

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">¡Pedido Confirmado!</CardTitle>
          <CardDescription className="text-lg">
            ID del pedido: <span className="font-bold">{pedido.id}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-700 font-semibold text-lg">✅ Pedido realizado con éxito</p>
              <p className="text-green-600 mt-2">
                Total del pedido: <span className="font-bold">${formatNumber(pedido.total)}</span>
              </p>
              <p className="text-green-600 mt-1">
                Fecha: {fechaPedido.toLocaleDateString()} a las {fechaPedido.toLocaleTimeString()}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-xl">Detalles del pedido</h3>
              <div className="border rounded-lg divide-y">
                {pedido.productos.map((p, i) => (
                  <div key={i} className="flex justify-between items-center p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-100 rounded-md w-10 h-10 flex items-center justify-center">
                        <span className="text-gray-500">{i + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{p.nombre}</p>
                        <div className="text-sm text-muted-foreground">
                          Cantidad: {p.cantidad} | ${formatNumber(p.precio)} c/u
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${formatNumber(p.total)}</p>
                      {pedido.tipo_precio === "con_iva" && (
                        <p className="text-sm text-muted-foreground">
                          (Base: ${formatNumber(p.precio_sin_iva)} + IVA: ${formatNumber(p.iva_unitario)})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal (sin IVA):</span>
                  <span>${formatNumber(pedido.subtotal)}</span>
                </div>
                {pedido.tipo_precio === "con_iva" && (
                  <div className="flex justify-between">
                    <span>IVA (19%):</span>
                    <span>${formatNumber(pedido.iva)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${formatNumber(pedido.total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="font-semibold text-xl">Información de entrega</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Distribuidor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Nombre:</strong> {pedido.distribuidor_nombre}</p>
                    <p><strong>Teléfono:</strong> {pedido.distribuidor_phone}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Entrega</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Dirección:</strong> {pedido.direccion}</p>
                    {pedido.notas && <p><strong>Notas:</strong> {pedido.notas}</p>}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}