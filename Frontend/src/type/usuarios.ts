export type UsuarioRol = "distribuidor_nacional" | "distribuidor_internacional" | "produccion" | "facturacion" | "bodega";
export type UsuarioEstado = "Activo" | "Inactivo";
export type TipoPrecio = "sin_iva" | "con_iva" | "sin_iva_internacional";
export type CDIType = "medellin" | "guarne";
export type PaisType = "Colombia" | "México" | "Chile" | "Perú" | "Ecuador";

export interface Usuario {
  id: string;
  nombre: string;
  correo_electronico: string;
  rol: UsuarioRol;
  estado: UsuarioEstado;
  fecha_ultimo_acceso: string;
  admin_id: string;
  pais: string;
  phone: string;
  tipo_precio?: TipoPrecio;
  unidades_individuales?: boolean;
  cdi?: CDIType;
}

export interface UserCreateData extends Omit<Usuario, "id" | "fecha_ultimo_acceso" | "admin_id"> {
  password: string;
}

export interface UserUpdateData extends Partial<Omit<Usuario, "id" | "admin_id">> {
  rol?: UsuarioRol;
  tipo_precio?: TipoPrecio;
}