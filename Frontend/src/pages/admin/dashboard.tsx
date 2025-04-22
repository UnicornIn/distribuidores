"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Package, ShoppingCart, TrendingUp, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "../../hooks/use-toast";
import { Loader2 } from "lucide-react";

type StatsData = {
  pedidos_totales: number;
  total_productos: number;
  total_distribuidores: number;
  ventas_mensuales: number;
};

type RecentOrder = {
  id: string;
  _id?: string;
  distribuidor_nombre: string;
  fecha: string;
  total: number;
  estado: string;
};

type PopularProduct = {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  vendidos: number;
};

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState({
    stats: true,
    orders: true,
    products: true
  });

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No autenticado");

      const response = await fetch("https://api.rizosfelices.co/api/estadisticas/generales", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Error al obtener estadísticas");

      const data: StatsData = await response.json();
      setStats(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar estadísticas",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No autenticado");

      const response = await fetch("https://api.rizosfelices.co/api/pedidos/recientes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Error al obtener pedidos recientes");

      const data: RecentOrder[] = await response.json();
      
      // Formatear los IDs de pedido a PED-YYYYMMDDHHmmss
      const formattedOrders = data.map(order => {
        let formattedId = order.id;
        
        // Si el ID no está en el formato correcto, intentar formatearlo desde la fecha
        if (!order.id.startsWith('PED-') && order.fecha) {
          try {
            const date = new Date(order.fecha);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            
            formattedId = `PED-${year}${month}${day}${hours}${minutes}${seconds}`;
          } catch (e) {
            console.error("Error formateando ID de pedido:", e);
          }
        }
        
        return {
          ...order,
          id: formattedId
        };
      });
      
      setRecentOrders(formattedOrders);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar pedidos recientes",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  };

  const fetchPopularProducts = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No autenticado");

      const response = await fetch("https://api.rizosfelices.co/api/productos/populares", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Error al obtener productos populares");

      const data: PopularProduct[] = await response.json();
      setPopularProducts(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar productos populares",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.rol);
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }

    fetchStats();
    fetchRecentOrders();
    fetchPopularProducts();
  }, []);

  const getBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "pendiente":
        return { className: "bg-yellow-100 text-yellow-800", text: "Pendiente" };
      case "procesando":
      case "en_produccion":
        return { className: "bg-blue-100 text-blue-800", text: "En producción" };
      case "por_facturar":
        return { className: "bg-purple-100 text-purple-800", text: "Por facturar" };
      case "facturado":
        return { className: "bg-green-100 text-green-800", text: "Facturado" };
      case "enviado":
        return { className: "bg-blue-100 text-blue-800", text: "Enviado" };
      case "entregado":
        return { className: "bg-green-100 text-green-800", text: "Entregado" };
      default:
        return { className: "bg-gray-100 text-gray-800", text: status };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary md:text-3xl">Panel de Administración</h1>
        <p className="text-muted-foreground">Bienvenido al panel de administración de Rizos Felices</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading.stats ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.pedidos_totales || 0}</div>
                <p className="text-xs text-muted-foreground"></p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading.stats ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.total_productos || 0}</div>
                {popularProducts.some(p => p.stock < 10) && (
                  <p className="text-xs text-muted-foreground">
                    {popularProducts.filter(p => p.stock < 10).length} productos con bajo stock
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Distribuidores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading.stats ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.total_distribuidores || 0}</div>
                <p className="text-xs text-muted-foreground"></p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventas Mensuales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading.stats ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">${stats?.ventas_mensuales || 0}</div>
                <p className="text-xs text-muted-foreground"></p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Tabs defaultValue="pedidos">
          <TabsList>
            <TabsTrigger value="pedidos">Pedidos Recientes</TabsTrigger>
            <TabsTrigger value="productos">Productos Populares</TabsTrigger>
          </TabsList>
          <TabsContent value="pedidos" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recientes</CardTitle>
                <CardDescription>Lista de los últimos pedidos realizados por los distribuidores</CardDescription>
              </CardHeader>
              <CardContent>
                {loading.orders ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID Pedido</TableHead>
                          <TableHead>Distribuidor</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                          {userRole.toLowerCase() !== 'admin' && (
                            <TableHead className="text-right">Acciones</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentOrders.length > 0 ? (
                          recentOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                                  {order.id}
                                </span>
                              </TableCell>
                              <TableCell>{order.distribuidor_nombre}</TableCell>
                              <TableCell>{formatDate(order.fecha)}</TableCell>
                              <TableCell>${order.total.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getBadgeVariant(order.estado).className}>
                                  {getBadgeVariant(order.estado).text}
                                </Badge>
                              </TableCell>
                              {userRole.toLowerCase() !== 'admin' && (
                                <TableCell className="text-right">
                                  <Link to={`/admin/pedidos`}>
                                    <Button variant="outline" size="sm" className="gap-1">
                                      Gestionar
                                      <ArrowRight className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell 
                              colSpan={userRole.toLowerCase() !== 'admin' ? 6 : 5} 
                              className="text-center py-8"
                            >
                              No hay pedidos recientes
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    <div className="mt-4 flex justify-end">
                      <Link to="/admin/pedidos">
                        <Button variant="outline" className="gap-1">
                          Ver todos los pedidos
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="productos" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Productos Populares</CardTitle>
                <CardDescription>Los productos más vendidos este mes</CardDescription>
              </CardHeader>
              <CardContent>
                {loading.products ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Vendidos</TableHead>
                          {userRole.toLowerCase() !== 'admin' && (
                            <TableHead className="text-right">Acciones</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {popularProducts.length > 0 ? (
                          popularProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.nombre}</TableCell>
                              <TableCell>{product.categoria}</TableCell>
                              <TableCell>${product.precio.toLocaleString()}</TableCell>
                              <TableCell>
                                <span className={product.stock < 10 ? "text-red-500 font-medium" : ""}>
                                  {product.stock}
                                </span>
                              </TableCell>
                              <TableCell>{product.vendidos}</TableCell>
                              {userRole.toLowerCase() !== 'admin' && (
                                <TableCell className="text-right">
                                  <Link to={`/admin/productos/${product.id}`}>
                                    <Button variant="outline" size="sm" className="gap-1">
                                      Editar
                                      <ArrowRight className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell 
                              colSpan={userRole.toLowerCase() !== 'admin' ? 6 : 5} 
                              className="text-center py-8"
                            >
                              No hay datos de productos populares
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    <div className="mt-4 flex justify-end">
                      <Link to="/admin/productos">
                        <Button variant="outline" className="gap-1">
                          Gestionar inventario
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}