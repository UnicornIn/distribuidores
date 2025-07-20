// AdminPedidosPage.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Search, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { PedidoActions } from "../../components/PedidoActions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Pedido, EstadoPedido } from "../../api/typeStatus";
import { fetchPedidos, fetchPedidoById, updateEstadoPedido } from "../../api/pedidoActions";

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.rol);
      } catch (err) {
        console.error("Error al decodificar el token:", err);
        setError("Error de autenticación");
      }
    }
  }, []);

  useEffect(() => {
    const loadPedidos = async () => {
      try {
        const data = await fetchPedidos();
        setPedidos(data);
      } catch (err) {
        setError("Error al cargar los pedidos. Inténtalo de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    loadPedidos();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CO').format(Math.round(num));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredPedidos = pedidos.filter((pedido) => {
    const matchesSearch =
      pedido.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.distribuidor.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "todos" || pedido.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPedidos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPedidos.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const getEstadoBadge = (estado: EstadoPedido) => {
    switch (estado) {
      case "procesando":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">Procesando</Badge>;
      case "facturado":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Facturado</Badge>;
      case "en camino":
        return <Badge variant="outline" className="bg-green-100 text-green-800">En Camino</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Desconocido</Badge>;
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      setLoading(true);
      const pedido = await fetchPedidoById(id);
      setSelectedPedido({
        ...pedido,
        fecha: formatDate(pedido.fecha),
        direccion: pedido.direccion || "No especificada"
      });
      setIsDetailsOpen(true);
    } catch (err) {
      setError("Error al cargar los detalles del pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, nuevoEstado: EstadoPedido) => {
    try {
      const updatedPedido = await updateEstadoPedido(id, nuevoEstado);
      setPedidos(pedidos.map(p => p.id === id ? { ...p, estado: updatedPedido.estado } : p));
      if (selectedPedido?.id === id) {
        setSelectedPedido({ ...selectedPedido, estado: updatedPedido.estado });
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const handlePrintOrder = async (id: string) => {
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const pedido = pedidos.find(p => p.id === id);
        if (pedido) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Pedido ${pedido.id}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  h1 { color: #333; }
                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                  th { background-color: #f2f2f2; }
                  .total { font-weight: bold; margin-top: 20px; }
                </style>
              </head>
              <body>
                <h1>Pedido #${pedido.id}</h1>
                <p><strong>Distribuidor:</strong> ${pedido.distribuidor}</p>
                <p><strong>Fecha:</strong> ${formatDate(pedido.fecha)}</p>
                <p><strong>Estado:</strong> ${pedido.estado}</p>
                
                <h2>Productos</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unitario</th>
                      <th>IVA</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${pedido.productos.map(producto => `
                      <tr>
                        <td>${producto.nombre}</td>
                        <td>${producto.cantidad}</td>
                        <td>$${formatNumber(producto.precio)}</td>
                        <td>${producto.iva_unitario ? `$${formatNumber(producto.iva_unitario)}` : 'N/A'}</td>
                        <td>$${formatNumber(producto.total)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                
                <div class="total">
                  <p><strong>Subtotal:</strong> $${formatNumber(pedido.subtotal)}</p>
                  ${pedido.iva > 0 ? `<p><strong>IVA (19%):</strong> $${formatNumber(pedido.iva)}</p>` : ''}
                  <p><strong>Total:</strong> $${formatNumber(pedido.total)}</p>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (err) {
      console.error("Error al imprimir pedido:", err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary md:text-3xl">Gestión de Pedidos</h1>
        <p className="text-muted-foreground">Administra los pedidos de los distribuidores</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por ID o distribuidor..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="procesando">Procesando</SelectItem>
            <SelectItem value="facturado">Facturado</SelectItem>
            <SelectItem value="en camino">En Camino</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle>Pedidos</CardTitle>
              <CardDescription>
                {filteredPedidos.length > 0 
                  ? `Mostrando ${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredPedidos.length)} de ${filteredPedidos.length} pedidos` 
                  : "No hay pedidos para mostrar"}
              </CardDescription>
            </div>
            
            {filteredPedidos.length > 0 && (
              <div className="bg-gray-50 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {currentItems.length > 0 ? (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Pedido</TableHead>
                      <TableHead>Distribuidor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      {(userRole === "produccion" || userRole === "facturacion" || userRole === "Admin") && (
                        <TableHead className="text-right">Acciones</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((pedido) => (
                      <TableRow key={pedido.id}>
                        <TableCell className="font-medium">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                            {pedido.id}
                          </span>
                        </TableCell>
                        <TableCell>{pedido.distribuidor}</TableCell>
                        <TableCell>{formatDate(pedido.fecha)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            {pedido.productos.slice(0, 2).map((producto, index) => (
                              <span key={index} className="text-sm">
                                {producto.nombre} - {producto.cantidad} x ${formatNumber(producto.precio)}
                              </span>
                            ))}
                            {pedido.productos.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{pedido.productos.length - 2} más
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>${formatNumber(pedido.total)}</TableCell>
                        <TableCell>{getEstadoBadge(pedido.estado)}</TableCell>
                        {(userRole === "produccion" || userRole === "facturacion" || userRole === "bodega" || userRole === "Admin") && (
                          <TableCell className="text-right">
                            <PedidoActions
                              pedidoId={pedido.id}
                              currentEstado={pedido.estado}
                              userRole={userRole || ""}
                              onViewDetails={handleViewDetails}
                              onUpdateStatus={handleUpdateStatus}
                              onPrintOrder={handlePrintOrder}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-4">
                {currentItems.map((pedido) => (
                  <Card key={pedido.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">Pedido #{pedido.id}</p>
                        <p className="text-muted-foreground text-sm">{pedido.distribuidor}</p>
                      </div>
                      <div>{getEstadoBadge(pedido.estado)}</div>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Fecha</span>
                        <span className="text-sm">{formatDate(pedido.fecha)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="font-medium">${formatNumber(pedido.total)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">Productos:</p>
                      <div className="space-y-1">
                        {pedido.productos.slice(0, 2).map((producto, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{producto.nombre} x {producto.cantidad}</span>
                            <span>${formatNumber(producto.precio)}</span>
                          </div>
                        ))}
                        {pedido.productos.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{pedido.productos.length - 2} productos más
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {(userRole === "produccion" || userRole === "facturacion" || userRole === "Admin") && (
                      <div className="mt-3 flex justify-end">
                        <PedidoActions
                          pedidoId={pedido.id}
                          currentEstado={pedido.estado}
                          userRole={userRole || ""}
                          onViewDetails={handleViewDetails}
                          onUpdateStatus={handleUpdateStatus}
                          onPrintOrder={handlePrintOrder}
                        />
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-4 py-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Anterior</span>
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => paginate(pageNum)}
                          className={`w-10 h-10 flex items-center justify-center rounded-md text-sm ${currentPage === pageNum ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 px-4 py-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No hay pedidos registrados</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {searchTerm || statusFilter !== "todos"
                  ? "No se encontraron pedidos que coincidan con los filtros aplicados."
                  : "Actualmente no hay pedidos en el sistema. Cuando se realicen nuevos pedidos, aparecerán aquí."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[95%] max-w-[95%] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Detalles del Pedido #{selectedPedido?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPedido && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Distribuidor</p>
                  <p className="font-medium">{selectedPedido.distribuidor}</p>
                  <p className="text-sm text-muted-foreground">{selectedPedido.distribuidor_phone}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{selectedPedido.fecha}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <div>{getEstadoBadge(selectedPedido.estado)}</div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-bold text-primary">${formatNumber(selectedPedido.total)}</p>
                </div>
                
                <div className="md:col-span-2 space-y-1">
                  <p className="text-sm text-muted-foreground">Dirección de envío</p>
                  <p className="font-medium">{selectedPedido.direccion}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Productos solicitados</h3>
                <div className="space-y-3">
                  {selectedPedido.productos.map((producto, index) => (
                    <div key={index} className="grid grid-cols-3 md:grid-cols-4 gap-2 p-3 bg-gray-50 rounded">
                      <div className="col-span-2 md:col-span-1">
                        <p className="font-medium">{producto.nombre}</p>
                        <p className="text-sm text-muted-foreground">Cantidad: {producto.cantidad}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Precio unitario</p>
                        <p className="font-medium">${formatNumber(producto.precio)}</p>
                      </div>
                      {producto.iva_unitario > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">IVA</p>
                          <p className="font-medium">${formatNumber(producto.iva_unitario)}</p>
                        </div>
                      )}
                      <div className="col-span-3 md:col-span-1 text-right">
                        <p className="text-sm text-muted-foreground">Subtotal</p>
                        <p className="font-medium">${formatNumber(producto.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal productos:</span>
                    <span>${formatNumber(selectedPedido.subtotal)}</span>
                  </div>
                  {selectedPedido.iva > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA (19%):</span>
                      <span>${formatNumber(selectedPedido.iva)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${formatNumber(selectedPedido.total)}</span>
                  </div>
                </div>

                {(userRole === "produccion" || userRole === "facturacion" || userRole === "Admin") && (
                  <div className="flex flex-col md:items-end justify-end gap-2">
                    <PedidoActions
                      pedidoId={selectedPedido.id}
                      currentEstado={selectedPedido.estado}
                      userRole={userRole || ""}
                      onUpdateStatus={handleUpdateStatus}
                      onPrintOrder={handlePrintOrder}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}