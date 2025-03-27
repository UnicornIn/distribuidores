export type UsuarioRol = "distribuidor" | "produccion" | "facturacion";
export type UsuarioEstado = "Activo" | "Inactivo";
export type TipoPrecio = "sin_iva" | "con_iva" | "sin_iva_internacional" | undefined;

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
  tipo_precio?: TipoPrecio; // Nuevo campo opcional
}

export interface UserCreateData extends Omit<Usuario, "id" | "fecha_ultimo_acceso" | "admin_id"> {
  password: string;
  tipo_precio?: TipoPrecio; // Asegurarse que esté incluido
}

export interface UserUpdateData extends Partial<Omit<Usuario, "id" | "admin_id">> {
  rol?: UsuarioRol; // Permitir actualizar el rol si es necesario
  tipo_precio?: TipoPrecio; // Asegurarse que esté incluido
}