// typeStatus.ts
export type EstadoPedido = "procesando" | "facturado" | "en camino";

export interface Producto {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  precio_sin_iva: number;
  iva_unitario: number;
  total: number;
  tipo_precio: string;
}

export interface Pedido {
  id: string;
  distribuidor: string;
  distribuidor_id: string;
  distribuidor_nombre: string;
  distribuidor_phone: string;
  fecha: string;
  productos: Producto[];
  total: number;
  subtotal: number;
  iva: number;
  estado: EstadoPedido;
  direccion: string;
  notas?: string;
  tipo_precio: string;
}
export interface PedidoActionsProps {
  pedidoId: string;
  currentEstado: EstadoPedido;
  userRole: string;
  onViewDetails?: (id: string) => Promise<void>; // Hacer opcional con ?
  onUpdateStatus: (id: string, nuevoEstado: EstadoPedido) => Promise<void>;
  onPrintOrder: (id: string) => Promise<void>;
  isMobile?: boolean;
  isFullWidth?: boolean;
}