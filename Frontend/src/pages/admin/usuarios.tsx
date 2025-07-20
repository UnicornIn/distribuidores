import { useState, useEffect } from "react";
import { useUserAPI } from "../../api/user";
import { CreateUserForm } from "../../components/CreateUserForm";
import { EditUserForm } from "../../components/EditUserForm";
import { UserActions } from "../../components/userActionss";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Input } from "../../components/ui/input";
import { Search, PlusCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { useToast } from "../../hooks/use-toast";
import { Label } from "../../components/ui/label";
import { Usuario, UserCreateData, UsuarioRol, UsuarioEstado, UserUpdateData } from "../../type/usuarios";

export default function UsuariosPage() {
  const { toast } = useToast();
  const {
    fetchUsers,
    createUser,
    updateUser,
    changePassword,
    toggleUserStatus,
    deleteUser
  } = useUserAPI();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para diálogos
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
  // Estados para formularios
  const [nuevoUsuario, setNuevoUsuario] = useState<UserCreateData>({
    nombre: "",
    correo_electronico: "",
    rol: "distribuidor_nacional", // Cambiado a "distribuidor_nacional"
    estado: "Activo",
    pais: "",
    phone: "",
    password: "",
    tipo_precio: "con_iva"
  });
  
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const users = await fetchUsers();
      setUsuarios(users);
      setCurrentPage(1); // Resetear a la primera página
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones para manejar acciones
  const handleCreateUser = async () => {
    try {
      setIsLoading(true);
      await createUser(nuevoUsuario);
      await loadUsers(); // Recargar usuarios después de crear
      setDialogOpen(false);
      setNuevoUsuario({
        nombre: "",
        correo_electronico: "",
        rol: "distribuidor_nacional", // Cambiado a "distribuidor_nacional"
        estado: "Activo",
        pais: "",
        phone: "",
        password: "",
        tipo_precio: "con_iva"
      });
      toast({
        title: "✅ Usuario creado",
        description: "El usuario fue registrado exitosamente",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Error al crear usuario",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!usuarioEditando) return;
    
    try {
      setIsLoading(true);
      const updateData: UserUpdateData = {
        nombre: usuarioEditando.nombre,
        phone: usuarioEditando.phone,
        estado: usuarioEditando.estado,
        pais: usuarioEditando.pais,
        rol: usuarioEditando.rol,
        tipo_precio: usuarioEditando.tipo_precio
      };

      await updateUser(usuarioEditando.id, updateData);
      await loadUsers(); // Recargar usuarios después de editar
      setEditDialogOpen(false);
      toast({
        title: "✅ Usuario actualizado",
        description: `Usuario actualizado correctamente`,
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Error al actualizar usuario",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!usuarioEditando) return;
    
    try {
      setIsLoading(true);
      await changePassword(usuarioEditando.id, {
        currentPassword,
        newPassword
      });
      
      await loadUsers(); // Recargar usuarios después de cambiar contraseña
      setPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      toast({
        title: "✅ Contraseña actualizada",
        description: "La contraseña fue cambiada exitosamente",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Error al cambiar contraseña",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      setIsLoading(true);
      await toggleUserStatus(userId);
      await loadUsers(); // Recargar usuarios después de cambiar estado
      toast({
        title: "✅ Estado actualizado",
        description: "El estado del usuario fue actualizado",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Error al cambiar estado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setIsLoading(true);
      await deleteUser(userId);
      await loadUsers(); // Recargar usuarios después de eliminar
      toast({
        title: "✅ Usuario eliminado",
        description: "El usuario fue eliminado del sistema",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Error al eliminar usuario",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrado de usuarios
  const filteredUsuarios = usuarios.filter(usuario => 
    usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.correo_electronico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (usuario.phone && usuario.phone.includes(searchTerm)) ||
    usuario.rol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Lógica de paginación
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsuarios.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsuarios.length / usersPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const firstPage = () => setCurrentPage(1);
  const lastPage = () => setCurrentPage(totalPages);

  // Helpers para renderizado
  const getRolBadge = (rol: UsuarioRol) => {
    const rolesConfig = {
      distribuidor_nacional: { className: "bg-teal-100 text-teal-800", label: "Distribuidor Nacional" },
      distribuidor_internacional: { className: "bg-blue-100 text-blue-800", label: "Distribuidor Internacional" },
      produccion: { className: "bg-orange-100 text-orange-800", label: "Producción" },
      facturacion: { className: "bg-green-100 text-green-800", label: "Facturación" },
      bodega: { className: "bg-purple-100 text-purple-800", label: "Bodega" }
    };

    return (
      <Badge variant="secondary" className={rolesConfig[rol]?.className || "bg-gray-100"}>
        {rolesConfig[rol]?.label || rol}
      </Badge>
    );
  };

  const getEstadoBadge = (estado: UsuarioEstado) => {
    return estado === "Activo" ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">Activo</Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">Inactivo</Badge>
    );
  };

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const half = Math.floor(maxVisiblePages / 2);
      let start = currentPage - half;
      let end = currentPage + half;

      if (start < 1) {
        start = 1;
        end = maxVisiblePages;
      } else if (end > totalPages) {
        end = totalPages;
        start = totalPages - maxVisiblePages + 1;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Encabezado y barra de búsqueda */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios del sistema</p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar usuarios..."
              className="pl-8 md:w-[300px]"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Resetear a la primera página al buscar
              }}
            />
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>
            {isLoading ? "Cargando..." : `${filteredUsuarios.length} usuarios encontrados`}
            {filteredUsuarios.length > usersPerPage && (
              <span className="ml-2">
                (Mostrando {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsuarios.length)})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tipo Precio</TableHead>
                    <TableHead>Último Acceso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentUsers.length > 0 ? (
                    currentUsers.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.id}</TableCell>
                        <TableCell>{usuario.nombre}</TableCell>
                        <TableCell>{usuario.correo_electronico}</TableCell>
                        <TableCell>{usuario.phone || "N/A"}</TableCell>
                        <TableCell>{getRolBadge(usuario.rol)}</TableCell>
                        <TableCell>{getEstadoBadge(usuario.estado)}</TableCell>
                        <TableCell>
                          {(usuario.rol === "distribuidor_nacional" || usuario.rol === "distribuidor_internacional") ? (
                            <Badge variant="outline">
                              {usuario.tipo_precio || "No especificado"}
                            </Badge>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>{usuario.fecha_ultimo_acceso || "Nunca"}</TableCell>
                        <TableCell className="text-right">
                          <UserActions
                            user={usuario}
                            onEdit={() => {
                              setUsuarioEditando(usuario);
                              setEditDialogOpen(true);
                            }}
                            onChangePassword={() => {
                              setUsuarioEditando(usuario);
                              setPasswordDialogOpen(true);
                            }}
                            onToggleStatus={() => handleToggleStatus(usuario.id)}
                            onDelete={() => handleDeleteUser(usuario.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center h-24">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Paginación */}
              {filteredUsuarios.length > usersPerPage && (
                <div className="flex items-center justify-between px-2 pt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={firstPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((number) => (
                        <Button
                          key={number}
                          variant={currentPage === number ? "default" : "outline"}
                          size="sm"
                          onClick={() => paginate(number)}
                        >
                          {number}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={lastPage}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Diálogos */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>Completa la información para crear un nuevo usuario</DialogDescription>
          </DialogHeader>
          <CreateUserForm 
            user={nuevoUsuario} 
            onChange={setNuevoUsuario}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifica la información del usuario</DialogDescription>
          </DialogHeader>
          {usuarioEditando && (
            <EditUserForm 
              user={usuarioEditando} 
              onChange={setUsuarioEditando}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Ingresa la contraseña actual y la nueva contraseña para {usuarioEditando?.nombre}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Contraseña Actual</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handlePasswordChange} disabled={isLoading}>
              {isLoading ? "Procesando..." : "Cambiar Contraseña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}