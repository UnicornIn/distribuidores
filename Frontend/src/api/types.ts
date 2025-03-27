export interface Precios {
  sin_iva_colombia: number;
  con_iva_colombia: number;
  internacional: number;
  fecha_actualizacion: string;
}

export interface Margenes {
  descuento: number;
  tipo_codigo?: number;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precios: Precios;
  margenes: Margenes;
  stock: number;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
  admin_id?: string;
}