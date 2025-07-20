import { useToast } from "../hooks/use-toast"
import { Usuario, UserCreateData, UserUpdateData } from "../type/usuarios"

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

  const fetchUsers = async (): Promise<Usuario[]> => {
    try {
      const response = await fetch("https://api.rizosfelices.co/api/usuarios/", {
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

  const createUser = async (userData: UserCreateData): Promise<Usuario> => {
    try {
      // Preparar datos para enviar
      const payload = {
        ...userData,
        correo_electronico: userData.correo_electronico.toLowerCase(),
        rol: userData.rol,
        // Asegurar que solo se envíen campos relevantes según el rol
        ...(userData.rol.includes("distribuidor") ? {
          tipo_precio: userData.tipo_precio,
          unidades_individuales: userData.unidades_individuales,
          cdi: userData.cdi
        } : {}),
        ...(userData.rol === "bodega" ? {
          cdi: userData.cdi
        } : {})
      }

      const response = await fetch("https://api.rizosfelices.co/api/create-users/", {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
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

  const updateUser = async (userId: string, data: UserUpdateData): Promise<Usuario> => {
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

  const changePassword = async (userId: string, data: PasswordChangeData): Promise<boolean> => {
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
      throw error;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
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