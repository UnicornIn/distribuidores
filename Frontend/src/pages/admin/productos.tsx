import { useState } from "react";
import { Producto } from "../../api/types";
import { useProductos } from "../../api/useProductos";
import { ProductosTable } from "../../components/ProductosTable";
import { ProductoCreateForm } from "../../components/ProductoCreateForm";
import { ProductoEditForm } from "../../components/ProductoEditForm";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Search, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "../../components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";

export default function ProductosPage() {
  const {
    filteredProductos,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    handleDeleteProduct,
    refreshProductos
  } = useProductos();

  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    refreshProductos();
  };

  const handleEditSuccess = () => {
    setProductoEditando(null);
    refreshProductos();
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">Gestión de Productos</h1>
          <p className="text-muted-foreground">Administra el inventario de productos</p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar productos..."
              className="pl-8 md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Añadir Nuevo Producto</DialogTitle>
                <DialogDescription>
                  Completa la información para añadir un nuevo producto al inventario
                </DialogDescription>
              </DialogHeader>
              <ProductoCreateForm onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventario de Productos</CardTitle>
          <CardDescription>
            {filteredProductos.length} productos encontrados | 
            Stock total: {filteredProductos.reduce((sum, p) => sum + p.stock, 0)} unidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductosTable 
            productos={filteredProductos} 
            loading={loading}
            onEdit={setProductoEditando}
            onDelete={handleDeleteProduct}
          />
        </CardContent>
      </Card>

      {productoEditando && (
        <Dialog open={!!productoEditando} onOpenChange={(open) => !open && setProductoEditando(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Producto: {productoEditando.nombre}</DialogTitle>
              <DialogDescription>
                Modifica la información del producto seleccionado
              </DialogDescription>
            </DialogHeader>
            <ProductoEditForm 
              producto={productoEditando} 
              onSuccess={handleEditSuccess} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}