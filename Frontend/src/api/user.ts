import { useToast } from "../hooks/use-toast"

type Usuario = {
  id: string
  nombre: string
  correo_electronico: string
  rol: "distribuidor" | "produccion" | "facturacion"
  estado: "Activo" | "Inactivo"
  fecha_ultimo_acceso: string
  admin_id: string
  pais: string
  phone: string
}

type UserCreateData = Omit<Usuario, "id" | "fecha_ultimo_acceso" | "admin_id"> & { password: string }
type UserUpdateData = Partial<Omit<Usuario, "id" | "rol" | "admin_id">>
type PasswordChangeData = { currentPassword: string; newPassword: string }

export const useUserAPI = () => {
  const { toast } = useToast()

  const getAuthHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json"
  })

  const handleError = (error: unknown, defaultMessage: string) => {
    console.error("API Error:", error)
    const message = error instanceof Error ? error.message : defaultMessage
    toast({
      title: "Error",
      description: message,
      variant: "destructive"
    })
    throw error
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("https://api.rizosfelices.co/usuarios/", {
        headers: getAuthHeader()
      })

      if (!response.ok) {
        throw new Error("Error al obtener usuarios")
      }

      return await response.json()
    } catch (error) {
      return handleError(error, "Error al cargar usuarios")
    }
  }

  const createUser = async (userData: UserCreateData) => {
    try {
      const response = await fetch("https://api.rizosfelices.co/usuarios/", {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify({
          ...userData,
          correo_electronico: userData.correo_electronico.toLowerCase(),
          rol: userData.rol.toLowerCase()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al crear usuario")
      }

      toast({ title: "Éxito", description: "Usuario creado correctamente" })
      return await response.json()
    } catch (error) {
      return handleError(error, "Error al crear usuario")
    }
  }

  const updateUser = async (userId: string, data: UserUpdateData) => {
    try {
      const response = await fetch(`https://api.rizosfelices.co/usuarios/${userId}`, {
        method: "PUT",
        headers: getAuthHeader(),
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al actualizar usuario")
      }

      toast({ title: "Éxito", description: "Usuario actualizado correctamente" })
      return await response.json()
    } catch (error) {
      return handleError(error, "Error al actualizar usuario")
    }
  }

  const changePassword = async (userId: string, data: PasswordChangeData) => {
    try {
      const response = await fetch(`https://api.rizosfelices.co/usuarios/${userId}/password`, {
        method: "PUT",
        headers: getAuthHeader(),
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al cambiar contraseña")
      }

      toast({ title: "Éxito", description: "Contraseña cambiada correctamente" })
      return true
    } catch (error) {
      return handleError(error, "Error al cambiar contraseña")
    }
  }

  const toggleUserStatus = async (userId: string): Promise<Usuario> => {
    try {
      const response = await fetch(`https://api.rizosfelices.co/usuarios/${userId}/cambiar-estado`, {
        method: "PUT",
        headers: getAuthHeader()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al cambiar estado");
      }

      const result = await response.json();

      toast({
        title: result.estado === "Activo" ? "✅ Usuario Activado" : "⛔ Usuario Desactivado",
        description: `Estado actualizado correctamente a: ${result.estado}`,
        variant: "default"
      });

      return result as Usuario;

    } catch (error) {
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error desconocido al cambiar estado",
        variant: "destructive"
      });
      throw error; // Propaga el error para manejo adicional si es necesario
    }
  };
  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`https://api.rizosfelices.co/usuarios/${userId}`, {
        method: "DELETE",
        headers: getAuthHeader()
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al eliminar usuario")
      }

      toast({ title: "Éxito", description: "Usuario eliminado correctamente" })
      return true
    } catch (error) {
      return handleError(error, "Error al eliminar usuario")
    }
  }

  return {
    fetchUsers,
    createUser,
    updateUser,
    changePassword,
    toggleUserStatus,
    deleteUser
  }
}