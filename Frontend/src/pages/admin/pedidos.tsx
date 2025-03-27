"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Search, Package } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"

type Producto = {
  nombre: string
  cantidad: number
  precio: number
}

type Pedido = {
  id: string
  distribuidor: string
  fecha: string
  productos: Producto[]
  total: number
  estado: "Procesando" | "pendiente" | "enviado" | "entregado"
}

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Obtener el rol del usuario desde el token
  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]))
      setUserRole(payload.rol)
    }
  }, [])

  // Obtener pedidos desde el backend
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/pedidos/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        })
        if (!response.ok) {
          throw new Error("Error al obtener los pedidos")
        }
        const data = await response.json()
        const pedidosMapeados = data.pedidos?.map((pedido: any) => ({
          id: pedido._id,
          distribuidor: pedido.distribuidor_nombre || "Distribuidor Desconocido",
          fecha: new Date(pedido.fecha).toLocaleDateString(),
          productos: pedido.productos || [],
          total: pedido.productos.reduce((acc: number, producto: Producto) => acc + producto.cantidad * producto.precio, 0),
          estado: pedido.estado || "Procesando",
        })) || []
        setPedidos(pedidosMapeados)
      } catch (err) {
        console.error("Error al obtener los pedidos:", err)
        setError("Error al cargar los pedidos. Inténtalo de nuevo más tarde.")
      } finally {
        setLoading(false)
      }
    }

    fetchPedidos()
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredPedidos = pedidos.filter((pedido) => {
    const matchesSearch =
      pedido.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.distribuidor.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "todos" || pedido.estado === statusFilter

    return matchesSearch && matchesStatus
  })

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "Procesando":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            Procesando
          </Badge>
        )
      case "pendiente":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pendiente
          </Badge>
        )
      case "enviado":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Enviado
          </Badge>
        )
      case "entregado":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Entregado
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const handleViewDetails = (id: string) => {
    console.log(`Ver detalles del pedido ${id}`)
  }

  const handleUpdateStatus = (id: string) => {
    console.log(`Cambiar estado del pedido ${id}`)
  }

  const handlePrintOrder = (id: string) => {
    console.log(`Imprimir pedido ${id}`)
  }

  const handleCancelOrder = (id: string) => {
    console.log(`Cancelar pedido ${id}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando pedidos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error}
        </div>
      </div>
    )
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
            <SelectItem value="Procesando">Procesando</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="entregado">Entregado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos</CardTitle>
          <CardDescription>
            {filteredPedidos.length > 0 
              ? `${filteredPedidos.length} pedidos encontrados` 
              : "No hay pedidos para mostrar"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPedidos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Pedido</TableHead>
                  <TableHead>Distribuidor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  {userRole === "produccion" && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPedidos.map((pedido) => (
                  <TableRow key={pedido.id}>
                    <TableCell className="font-medium">{pedido.id}</TableCell>
                    <TableCell>{pedido.distribuidor}</TableCell>
                    <TableCell>{pedido.fecha}</TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        {pedido.productos.map((producto, index) => (
                          <span key={index} className="text-sm">
                            {producto.nombre} - {producto.cantidad} x ${producto.precio.toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>${pedido.total.toFixed(2)}</TableCell>
                    <TableCell>{getEstadoBadge(pedido.estado)}</TableCell>
                    {userRole === "produccion" && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Gestionar
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(pedido.id)}>Ver detalles</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(pedido.id)}>
                              Cambiar estado
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handlePrintOrder(pedido.id)}>Imprimir pedido</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleCancelOrder(pedido.id)}>
                              Cancelar pedido
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
    </div>
  )
}