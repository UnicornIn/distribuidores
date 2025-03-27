"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Label } from "../../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Search, PlusCircle, MapPin, ArrowRightLeft } from "lucide-react"
import { useTenant } from "../../context/tenant-context"

type Almacen = {
  id: string
  nombre: string
  direccion: string
  ciudad: string
  responsable: string
  productos: number
  estado: "activo" | "inactivo"
}

type Transferencia = {
  id: string
  origen: string
  destino: string
  productos: string[]
  cantidad: number
  fecha: string
  estado: "pendiente" | "completada" | "cancelada"
}

export default function AlmacenesPage() {
  const { config } = useTenant()
  const [almacenes, setAlmacenes] = useState<Almacen[]>([
    {
      id: "ALM001",
      nombre: "Almacén Central",
      direccion: "Calle Principal 123",
      ciudad: "Ciudad Principal",
      responsable: "Carlos Rodríguez",
      productos: 245,
      estado: "activo",
    },
    {
      id: "ALM002",
      nombre: "Almacén Norte",
      direccion: "Av. Norte 456",
      ciudad: "Ciudad Norte",
      responsable: "Ana Martínez",
      productos: 120,
      estado: "activo",
    },
    {
      id: "ALM003",
      nombre: "Almacén Sur",
      direccion: "Calle Sur 789",
      ciudad: "Ciudad Sur",
      responsable: "Juan Pérez",
      productos: 180,
      estado: "inactivo",
    },
  ])
  const [transferencias] = useState<Transferencia[]>([
    {
      id: "TRF001",
      origen: "Almacén Central",
      destino: "Almacén Norte",
      productos: ["Champú Rizos Definidos", "Acondicionador Hidratante"],
      cantidad: 25,
      fecha: "2023-07-20",
      estado: "completada",
    },
    {
      id: "TRF002",
      origen: "Almacén Norte",
      destino: "Almacén Sur",
      productos: ["Gel Fijador Extra Fuerte"],
      cantidad: 15,
      fecha: "2023-07-22",
      estado: "pendiente",
    },
    {
      id: "TRF003",
      origen: "Almacén Central",
      destino: "Almacén Sur",
      productos: ["Sérum Anti-Frizz", "Mascarilla Nutritiva"],
      cantidad: 30,
      fecha: "2023-07-25",
      estado: "cancelada",
    },
  ])
  const [searchTerm, setSearchTerm] = useState("")
  const [nuevoAlmacen, setNuevoAlmacen] = useState<Omit<Almacen, "id" | "productos">>({
    nombre: "",
    direccion: "",
    ciudad: "",
    responsable: "",
    estado: "activo",
  })
  const [dialogOpen, setDialogOpen] = useState(false)

  // Solo mostrar esta página si la función de múltiples almacenes está activada
  if (!config.features.multipleWarehouses) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary md:text-3xl">Gestión de Almacenes</h1>
          <p className="text-muted-foreground">Esta funcionalidad no está activada</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Función no disponible</CardTitle>
            <CardDescription>La gestión de múltiples almacenes no está activada en tu plan actual.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <MapPin className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <p className="mb-4 text-center text-muted-foreground">
              Para activar esta funcionalidad, ve a la sección de Configuración y activa la opción de "Múltiples
              Almacenes".
            </p>
            <Button asChild>
              <a href="/admin/configuracion">Ir a Configuración</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNuevoAlmacen({
      ...nuevoAlmacen,
      [name]: value,
    })
  }

  const handleAddAlmacen = () => {
    const newId = `ALM${String(almacenes.length + 1).padStart(3, "0")}`
    setAlmacenes([...almacenes, { id: newId, ...nuevoAlmacen, productos: 0 }])
    setNuevoAlmacen({ nombre: "", direccion: "", ciudad: "", responsable: "", estado: "activo" })
    setDialogOpen(false)
  }

  const filteredAlmacenes = almacenes.filter(
    (almacen) =>
      almacen.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      almacen.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      almacen.responsable.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getEstadoBadge = (estado: string) => {
    return estado === "activo" ? (
      <Badge className="bg-green-100 text-green-800">Activo</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Inactivo</Badge>
    )
  }

  const getTransferenciaEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "completada":
        return <Badge className="bg-green-100 text-green-800">Completada</Badge>
      case "cancelada":
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>
      default:
        return <Badge>Desconocido</Badge>
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary md:text-3xl">Gestión de Almacenes</h1>
        <p className="text-muted-foreground">Administra tus almacenes y transferencias de inventario</p>
      </div>

      <Tabs defaultValue="almacenes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="almacenes">Almacenes</TabsTrigger>
          <TabsTrigger value="transferencias">Transferencias</TabsTrigger>
        </TabsList>

        <TabsContent value="almacenes">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar almacenes..."
                className="pl-8 md:w-[300px]"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Nuevo Almacén
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Añadir Nuevo Almacén</DialogTitle>
                  <DialogDescription>Completa la información para crear un nuevo almacén</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nombre">Nombre del Almacén</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={nuevoAlmacen.nombre}
                      onChange={handleInputChange}
                      placeholder="Ej: Almacén Central"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      name="direccion"
                      value={nuevoAlmacen.direccion}
                      onChange={handleInputChange}
                      placeholder="Ej: Calle Principal 123"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input
                      id="ciudad"
                      name="ciudad"
                      value={nuevoAlmacen.ciudad}
                      onChange={handleInputChange}
                      placeholder="Ej: Ciudad Principal"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="responsable">Responsable</Label>
                    <Input
                      id="responsable"
                      name="responsable"
                      value={nuevoAlmacen.responsable}
                      onChange={handleInputChange}
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddAlmacen}>Guardar Almacén</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Almacenes</CardTitle>
              <CardDescription>{filteredAlmacenes.length} almacenes encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlmacenes.map((almacen) => (
                    <TableRow key={almacen.id}>
                      <TableCell className="font-medium">{almacen.id}</TableCell>
                      <TableCell>{almacen.nombre}</TableCell>
                      <TableCell>{almacen.ciudad}</TableCell>
                      <TableCell>{almacen.responsable}</TableCell>
                      <TableCell>{almacen.productos} unidades</TableCell>
                      <TableCell>{getEstadoBadge(almacen.estado)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Gestionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transferencias">
          <div className="mb-4 flex justify-end">
            <Button className="gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Nueva Transferencia
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transferencias de Inventario</CardTitle>
              <CardDescription>Historial de transferencias entre almacenes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transferencias.map((transferencia) => (
                    <TableRow key={transferencia.id}>
                      <TableCell className="font-medium">{transferencia.id}</TableCell>
                      <TableCell>{transferencia.origen}</TableCell>
                      <TableCell>{transferencia.destino}</TableCell>
                      <TableCell>{transferencia.productos.length} productos</TableCell>
                      <TableCell>{transferencia.cantidad} unidades</TableCell>
                      <TableCell>{transferencia.fecha}</TableCell>
                      <TableCell>{getTransferenciaEstadoBadge(transferencia.estado)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Ver detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

