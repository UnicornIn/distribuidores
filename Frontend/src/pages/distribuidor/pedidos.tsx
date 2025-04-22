"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { PlusCircle } from "lucide-react";

type Producto = {
  nombre: string;
  cantidad: number;
  precio: number;
};

type Pedido = {
  id: string;
  fecha: string;
  productos: Producto[];
  estado: "pendiente" | "enviado" | "entregado";
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Mostrar 5 pedidos por página

  // Obtener los pedidos al cargar la página
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("No se encontró el token de autenticación");
        }

        const response = await fetch("https://api.rizosfelices.co/pedidos/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al obtener los pedidos");
        }

        const data = await response.json();
        setPedidos(data.pedidos);
      } catch (err) {
        console.error("Error al obtener los pedidos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, []);

  // Función para calcular el total de un pedido (ahora devuelve un número entero)
  const calcularTotal = (productos: Producto[]) => {
    return Math.round(productos.reduce((total, producto) => total + producto.precio * producto.cantidad, 0));
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
      case "Procesando":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            Procesando
          </Badge>
        );
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPedidos = pedidos.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-[400px] items-center justify-center p-4 md:p-6">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p>Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">Mis Pedidos</h1>
          <p className="text-muted-foreground">Gestiona tus pedidos realizados</p>
        </div>
        <Link to="/distribuidor/pedidos/nuevo">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nuevo Pedido
          </Button>
        </Link>
      </div>

      {pedidos.length > 0 ? (
        <>
          {/* Tabla para pantallas grandes */}
          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pedidos</CardTitle>
                <CardDescription>Visualiza todos tus pedidos anteriores y su estado actual</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Pedido</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPedidos.map((pedido) => {
                      const total = calcularTotal(pedido.productos);
                      return (
                        <TableRow key={pedido.id}>
                          <TableCell className="font-medium">{pedido.id}</TableCell>
                          <TableCell>{new Date(pedido.fecha).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {pedido.productos.map((producto) => `${producto.nombre} (x${producto.cantidad})`).join(", ")}
                          </TableCell>
                          <TableCell>${total}</TableCell>
                          <TableCell>{getEstadoBadge(pedido.estado)}</TableCell>
                          <TableCell className="text-right">
                            <Link to={`/distribuidor/pedidos/${pedido.id}`}>
                              <Button variant="outline" size="sm">
                                Ver detalles
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Lista de tarjetas para pantallas pequeñas */}
          <div className="md:hidden">
            {currentPedidos.map((pedido) => {
              const total = calcularTotal(pedido.productos);
              return (
                <Card key={pedido.id} className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">{pedido.id}</CardTitle>
                    <CardDescription>{new Date(pedido.fecha).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Productos:</span>{" "}
                        {pedido.productos.map((producto) => `${producto.nombre} (x${producto.cantidad})`).join(", ")}
                      </div>
                      <div>
                        <span className="font-medium">Total:</span> ${total}
                      </div>
                      <div>
                        <span className="font-medium">Estado:</span> {getEstadoBadge(pedido.estado)}
                      </div>
                      <div className="flex justify-end">
                        <Link to={`/distribuidor/pedidos/${pedido.id}`}>
                          <Button variant="outline" size="sm">
                            Ver detalles
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Paginación */}
          <div className="mt-4 flex justify-between">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => paginate(currentPage - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={indexOfLastItem >= pedidos.length}
              onClick={() => paginate(currentPage + 1)}
            >
              Siguiente
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No hay pedidos</CardTitle>
            <CardDescription>Aún no has realizado ningún pedido. ¡Crea tu primer pedido ahora!</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link to="/distribuidor/pedidos/nuevo">
              <Button>Crear Pedido</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}