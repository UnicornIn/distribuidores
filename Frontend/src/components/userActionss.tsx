import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { Button } from "./ui/button"

type UserActionsProps = {
  user: any
  onEdit: () => void
  onChangePassword: () => void
  onToggleStatus: () => void
  onDelete: () => void
}

export const UserActions = ({ 
  user, 
  onEdit, 
  onChangePassword, 
  onToggleStatus, 
  onDelete 
}: UserActionsProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
      <DropdownMenuItem onClick={onEdit}>Editar usuario</DropdownMenuItem>
      <DropdownMenuItem onClick={onChangePassword}>Cambiar contraseña</DropdownMenuItem>
      <DropdownMenuItem 
        className="text-destructive"
        onClick={onToggleStatus}
      >
        {user.estado === "Activo" ? "Desactivar" : "Activar"}
      </DropdownMenuItem>
      <DropdownMenuItem 
        className="text-destructive"
        onClick={onDelete}
      >
        Eliminar
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)