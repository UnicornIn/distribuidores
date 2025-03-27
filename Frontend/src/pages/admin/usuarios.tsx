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
import { Search, PlusCircle } from "lucide-react";
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
    rol: "distribuidor",
    estado: "Activo",
    pais: "",
    phone: "",
    password: "",
    tipo_precio: "con_iva" // Añadido valor por defecto
  });
  
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const users = await fetchUsers();
      setUsuarios(users);
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
      const newUser = await createUser(nuevoUsuario);
      setUsuarios([...usuarios, newUser]);
      setDialogOpen(false);
      setNuevoUsuario({
        nombre: "",
        correo_electronico: "",
        rol: "distribuidor",
        estado: "Activo",
        pais: "",
        phone: "",
        password: "",
        tipo_precio: "con_iva" // Resetear con valor por defecto
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
      // Crear objeto de actualización
      const updateData: UserUpdateData & { rol?: UsuarioRol; tipo_precio?: string } = {
        nombre: usuarioEditando.nombre,
        phone: usuarioEditando.phone,
        estado: usuarioEditando.estado,
        pais: usuarioEditando.pais,
        rol: usuarioEditando.rol,
        tipo_precio: usuarioEditando.tipo_precio
      };

      const updatedUser = await updateUser(usuarioEditando.id, updateData);

      setUsuarios(usuarios.map(u => u.id === updatedUser.id ? updatedUser : u));
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
      const updatedUser = await toggleUserStatus(userId);
      setUsuarios(usuarios.map(u => u.id === updatedUser.id ? updatedUser : u));
      toast({
        title: updatedUser.estado === "Activo" ? "✅ Usuario activado" : "⛔ Usuario desactivado",
        description: `Estado actualizado a ${updatedUser.estado}`,
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
      setUsuarios(usuarios.filter(u => u.id !== userId));
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

  // Helpers para renderizado
  const getRolBadge = (rol: UsuarioRol) => {
    const rolesConfig = {
      distribuidor: { className: "bg-teal-100 text-teal-800", label: "Distribuidor" },
      produccion: { className: "bg-orange-100 text-orange-800", label: "Producción" },
      facturacion: { className: "bg-green-100 text-green-800", label: "Facturación" }
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
              onChange={(e) => setSearchTerm(e.target.value)}
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
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
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
                {filteredUsuarios.length > 0 ? (
                  filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">{usuario.id}</TableCell>
                      <TableCell>{usuario.nombre}</TableCell>
                      <TableCell>{usuario.correo_electronico}</TableCell>
                      <TableCell>{usuario.phone || "N/A"}</TableCell>
                      <TableCell>{getRolBadge(usuario.rol)}</TableCell>
                      <TableCell>{getEstadoBadge(usuario.estado)}</TableCell>
                      <TableCell>
                        {usuario.rol === "distribuidor" ? (
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
          )}
        </CardContent>
      </Card>

      {/* Diálogo para nuevo usuario */}
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

      {/* Diálogo para editar usuario */}
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

      {/* Diálogo para cambiar contraseña */}
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