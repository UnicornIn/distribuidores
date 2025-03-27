import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Package, ShoppingCart, TrendingUp, Users } from "lucide-react"
import { Link } from "react-router-dom"

export default function AdminDashboardPage() {
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
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground"></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            {/* 6 productos con bajo stock */}
            <p className="text-xs text-muted-foreground"></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Distribuidores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground"></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventas Mensuales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            {/* +23% desde el mes pasado */}
            <p className="text-xs text-muted-foreground"></p>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Pedido</TableHead>
                      <TableHead>Distribuidor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">PED-1234</TableCell>
                      <TableCell>María López</TableCell>
                      <TableCell>2023-07-25</TableCell>
                      <TableCell>$145.90</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          Pendiente
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Gestionar
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">PED-1233</TableCell>
                      <TableCell>Carlos Rodríguez</TableCell>
                      <TableCell>2023-07-24</TableCell>
                      <TableCell>$89.50</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          Enviado
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Gestionar
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">PED-1232</TableCell>
                      <TableCell>Ana Martínez</TableCell>
                      <TableCell>2023-07-23</TableCell>
                      <TableCell>$235.75</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Entregado
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Gestionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="mt-4 flex justify-end">
                  <Link to="/admin/pedidos">
                    <Button variant="outline">Ver todos los pedidos</Button>
                  </Link>
                </div>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Vendidos</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Sérum Anti-Frizz</TableCell>
                      <TableCell>Tratamientos</TableCell>
                      <TableCell>$29.95</TableCell>
                      <TableCell>20</TableCell>
                      <TableCell>45</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Champú Rizos Definidos</TableCell>
                      <TableCell>Limpieza</TableCell>
                      <TableCell>$22.95</TableCell>
                      <TableCell>50</TableCell>
                      <TableCell>38</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Mascarilla Nutritiva</TableCell>
                      <TableCell>Tratamientos</TableCell>
                      <TableCell>$24.95</TableCell>
                      <TableCell>25</TableCell>
                      <TableCell>32</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="mt-4 flex justify-end">
                  <Link to="/admin/productos">
                    <Button variant="outline">Gestionar inventario</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

