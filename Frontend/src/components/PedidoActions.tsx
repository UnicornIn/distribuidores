"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { EstadoPedido } from "../api/typeStatus";

interface PedidoActionsProps {
  pedidoId: string;
  currentEstado: EstadoPedido;
  userRole: string;
  onViewDetails?: (id: string) => void; // Hacer opcional
  onUpdateStatus: (id: string, nuevoEstado: EstadoPedido) => Promise<void>;
  onPrintOrder?: (id: string) => void;
  onCancelOrder?: (id: string) => void;
}

export function PedidoActions({ 
  pedidoId, 
  currentEstado,
  userRole,
  onViewDetails,
  onUpdateStatus, 
  onPrintOrder, 
  onCancelOrder
}: PedidoActionsProps) {
  
  const handleStatusChange = async (nuevoEstado: EstadoPedido) => {
    try {
      await onUpdateStatus(pedidoId, nuevoEstado);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  // Opciones de estado disponibles según rol y estado actual
  const getStatusOptions = (): EstadoPedido[] => {
    if (userRole === "produccion" && currentEstado === "procesando") {
      return ["en camino"];
    }
    if (userRole === "facturacion" && ["procesando", "en camino"].includes(currentEstado)) {
      return ["facturado"];
    }
    return [];
  };

  const statusOptions = getStatusOptions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Gestionar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        
        {/* Ver detalles (solo si onViewDetails está definido) */}
        {onViewDetails && (
          <DropdownMenuItem onClick={() => onViewDetails(pedidoId)}>
            Ver detalles
          </DropdownMenuItem>
        )}
        
        {/* Menú para cambiar estado */}
        {statusOptions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Cambiar estado a:</DropdownMenuLabel>
            {statusOptions.map((status) => (
              <DropdownMenuItem 
                key={status}
                onClick={() => handleStatusChange(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Imprimir pedido (solo si onPrintOrder está definido) */}
        {onPrintOrder && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onPrintOrder(pedidoId)}>
              Imprimir pedido
            </DropdownMenuItem>
          </>
        )}

        {/* Cancelar pedido (solo si onCancelOrder está definido) */}
        {onCancelOrder && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-700" 
              onClick={() => onCancelOrder(pedidoId)}
            >
              Cancelar pedido
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}