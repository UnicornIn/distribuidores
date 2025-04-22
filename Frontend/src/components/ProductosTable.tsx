import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
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
  if (stock <= 30) return <Badge className="bg-yellow-500 text-white">Medio</Badge>;
  return <Badge className="bg-green-500 text-white">Alto</Badge>;
};

const formatPriceCOP = (price: number) => {
  if (isNaN(price)) return "$ 0";
  return new Intl.NumberFormat('es-CO', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

const formatPriceUSD = (price: number) => {
  if (isNaN(price)) return "$ 0";
  return new Intl.NumberFormat('es-CO', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString('es-CO');
  } catch {
    return "-";
  }
};

export const ProductosTable = ({ productos, loading, onEdit, onDelete }: ProductosTableProps) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="overflow-x-auto">
      {/* Versión para pantallas grandes (md y arriba) */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="min-w-[150px]">Producto</TableHead>
              <TableHead className="w-[100px]">Categoría</TableHead>
              <TableHead className="text-right w-[120px]">Sin IVA</TableHead>
              <TableHead className="text-right w-[120px]">Con IVA</TableHead>
              <TableHead className="text-right w-[120px]">Internac.</TableHead>
              <TableHead className="text-right w-[100px]">Stock</TableHead>
              <TableHead className="text-center w-[100px]">Desc.</TableHead>
              <TableHead className="text-center w-[120px]">Actualizado</TableHead>
              <TableHead className="text-center w-[100px]">Estado</TableHead>
              <TableHead className="text-right w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.map((producto) => (
              <TableRow key={producto.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{producto.id}</TableCell>
                <TableCell className="font-medium">{producto.nombre}</TableCell>
                <TableCell>
                  <Badge variant="outline">{producto.categoria}</Badge>
                </TableCell>
                <TableCell className="text-right">$ {formatPriceCOP(producto.precios?.sin_iva_colombia || 0)}</TableCell>
                <TableCell className="text-right">$ {formatPriceCOP(producto.precios?.con_iva_colombia || 0)}</TableCell>
                <TableCell className="text-right">$ {formatPriceUSD(producto.precios?.internacional || 0)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {producto.stock}
                    {getStockBadge(producto.stock)}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {Math.round((producto.margenes?.descuento || 0) * 100)}%
                </TableCell>
                <TableCell className="text-center">
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
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEdit(producto)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => producto.id && onDelete(producto.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Versión para móviles (sm y abajo) */}
      <div className="md:hidden space-y-2">
        {productos.map((producto) => (
          <div key={producto.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{producto.nombre}</div>
                <div className="text-sm text-muted-foreground">ID: {producto.id}</div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleRow(producto.id)}
                className="h-8 w-8 p-0"
              >
                {expandedRow === producto.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <div className="text-sm text-muted-foreground">Categoría</div>
                <div><Badge variant="outline">{producto.categoria}</Badge></div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Estado</div>
                <div>
                  {producto.activo ? (
                    <Badge className="bg-green-500 text-white">Activo</Badge>
                  ) : (
                    <Badge variant="destructive">Inactivo</Badge>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Stock</div>
                <div className="flex items-center gap-2">
                  {producto.stock}
                  {getStockBadge(producto.stock)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Descuento</div>
                <div>{Math.round((producto.margenes?.descuento || 0) * 100)}%</div>
              </div>
            </div>

            {expandedRow === producto.id && (
              <div className="mt-4 pt-4 border-t">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Precio Sin IVA:</span>
                    <span>$ {formatPriceCOP(producto.precios?.sin_iva_colombia || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Precio Con IVA:</span>
                    <span>$ {formatPriceCOP(producto.precios?.con_iva_colombia || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Precio Internacional:</span>
                    <span>$ {formatPriceUSD(producto.precios?.internacional || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Actualizado:</span>
                    <span>{formatDate(producto.precios?.fecha_actualizacion)}</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEdit(producto)}
                  >
                    <Edit className="h-4 w-4 mr-2" /> Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => producto.id && onDelete(producto.id)}
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4 mr-2" /> Eliminar
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};