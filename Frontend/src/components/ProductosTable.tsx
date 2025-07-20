import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useUser } from "../hooks/useUser";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Edit, Trash, ChevronDown, ChevronUp } from "lucide-react";
import { Producto } from "../api/types";
import { useState } from "react";

interface ProductosTableProps {
  productos: Producto[];
  loading: boolean;
  onEdit: (producto: Producto) => void;
  onDelete: (id: string) => void;
}

const getStockBadge = (stock: number) => {
  if (stock <= 10) return <Badge variant="destructive">Bajo</Badge>;
  if (stock <= 30)
    return <Badge className="bg-yellow-500 text-white">Medio</Badge>;
  return <Badge className="bg-green-500 text-white">Alto</Badge>;
};

const formatPriceCOP = (price: number) => {
  if (isNaN(price)) return "$ 0";
  return new Intl.NumberFormat("es-CO", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const formatPriceUSD = (price: number) => {
  if (isNaN(price)) return "$ 0";
  return new Intl.NumberFormat("es-CO", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("es-CO");
  } catch {
    return "-";
  }
};

export const ProductosTable = ({
  productos,
  loading,
  onEdit,
  onDelete,
}: ProductosTableProps) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const { rol: userRol, cdi: userCdi } = useUser();

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const mostrarInternacional =
    userRol === "Admin" || userCdi?.toLowerCase() === "guarne";
  const mostrarColombia =
    userRol === "Admin" || userCdi?.toLowerCase() === "medellin";

  if (loading && productos.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No hay productos disponibles.</p>
      </div>
    );
  }

  return (
    <div
      className="w-full"
      style={{
        maxHeight: "80vh",
        overflowY: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {/* Ocultar scrollbars visualmente */}
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Tabla para escritorio */}
      <div className="hidden lg:block w-full overflow-x-auto rounded-xl border shadow-sm">
        <Table className="min-w-[1100px]">
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="w-[70px]">ID</TableHead>
              <TableHead className="min-w-[180px]">Producto</TableHead>
              <TableHead className="w-[110px]">Categoría</TableHead>
              {mostrarColombia && (
                <>
                  <TableHead className="text-right w-[120px]">Sin IVA</TableHead>
                  <TableHead className="text-right w-[120px]">Con IVA</TableHead>
                </>
              )}
              {mostrarInternacional && (
                <TableHead className="text-right w-[120px]">Internac.</TableHead>
              )}
              {userRol === "Admin" ? (
                <>
                  <TableHead className="text-right w-[100px]">
                    Stock Medellín
                  </TableHead>
                  <TableHead className="text-right w-[100px]">
                    Stock Guarne
                  </TableHead>
                </>
              ) : (
                <TableHead className="text-right w-[100px]">
                  {userCdi?.toLowerCase() === "guarne"
                    ? "Stock Guarne"
                    : "Stock Medellín"}
                </TableHead>
              )}
              <TableHead className="text-center w-[120px]">Actualizado</TableHead>
              <TableHead className="text-center w-[90px]">Estado</TableHead>
              <TableHead className="text-right w-[130px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.map((producto) => {
              const stockMed = producto.stock?.medellin || 0;
              const stockGua = producto.stock?.guarne || 0;
              const stockActual =
                userCdi?.toLowerCase() === "guarne" ? stockGua : stockMed;

              return (
                <TableRow
                  key={producto.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="font-medium">{producto.id}</TableCell>
                  <TableCell className="font-semibold">{producto.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{producto.categoria}</Badge>
                  </TableCell>
                  {mostrarColombia && (
                    <>
                      <TableCell className="text-right">
                        $ {formatPriceCOP(producto.precios?.sin_iva_colombia || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        $ {formatPriceCOP(producto.precios?.con_iva_colombia || 0)}
                      </TableCell>
                    </>
                  )}
                  {mostrarInternacional && (
                    <TableCell className="text-right">
                      $ {formatPriceUSD(producto.precios?.internacional || 0)}
                    </TableCell>
                  )}
                  {userRol === "Admin" ? (
                    <>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {stockMed} {getStockBadge(stockMed)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {stockGua} {getStockBadge(stockGua)}
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {stockActual}
                        {getStockBadge(stockActual)}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-center text-sm text-gray-500">
                    {formatDate(producto.precios?.fecha_actualizacion)}
                  </TableCell>
                  <TableCell className="text-center">
                    {producto.activo ? (
                      <Badge className="bg-green-500 text-white">Activo</Badge>
                    ) : (
                      <Badge variant="destructive">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(producto)}
                        className="h-8 w-8 p-0 hover:bg-primary/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => producto.id && onDelete(producto.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Cards para iPad y móviles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 lg:hidden">
        {productos.map((producto) => {
          const stockMed = producto.stock?.medellin || 0;
          const stockGua = producto.stock?.guarne || 0;
          const stockActual =
            userCdi?.toLowerCase() === "guarne" ? stockGua : stockMed;

          return (
            <div key={producto.id} className="border rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-base">{producto.nombre}</p>
                  <p className="text-xs text-muted-foreground">ID: {producto.id}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleRow(producto.id)}
                  className="h-8 w-8 p-0"
                >
                  {expandedRow === producto.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Categoría</p>
                  <Badge variant="outline">{producto.categoria}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  {producto.activo ? (
                    <Badge className="bg-green-500 text-white">Activo</Badge>
                  ) : (
                    <Badge variant="destructive">Inactivo</Badge>
                  )}
                </div>
                {userRol === "Admin" ? (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Medellín</p>
                      <div className="flex items-center gap-2">
                        {stockMed} {getStockBadge(stockMed)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Guarne</p>
                      <div className="flex items-center gap-2">
                        {stockGua} {getStockBadge(stockGua)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-xs text-muted-foreground">Stock</p>
                    <div className="flex items-center gap-2">
                      {stockActual} {getStockBadge(stockActual)}
                    </div>
                  </div>
                )}
              </div>

              {expandedRow === producto.id && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  {mostrarColombia && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Precio Sin IVA:</span>
                        <span className="font-medium">
                          $ {formatPriceCOP(producto.precios?.sin_iva_colombia || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Precio Con IVA:</span>
                        <span className="font-medium">
                          $ {formatPriceCOP(producto.precios?.con_iva_colombia || 0)}
                        </span>
                      </div>
                    </>
                  )}
                  {mostrarInternacional && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Precio Internacional:
                      </span>
                      <span className="font-medium">
                        $ {formatPriceUSD(producto.precios?.internacional || 0)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Actualizado:</span>
                    <span>{formatDate(producto.precios?.fecha_actualizacion)}</span>
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(producto)}
                    >
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => producto.id && onDelete(producto.id)}
                      className="text-red-500 border-red-300 hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4 mr-1" /> Eliminar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
