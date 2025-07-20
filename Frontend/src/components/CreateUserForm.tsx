import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { UsuarioRol, TipoPrecio, CDIType } from "../type/usuarios";

type CreateUserFormProps = {
  user: any;
  onChange: (data: any) => void;
};

export const CreateUserForm = ({ user, onChange }: CreateUserFormProps) => {
  const handleRoleChange = (value: UsuarioRol) => {
    const updatedUser = { 
      ...user, 
      rol: value,
      // Limpiar campos específicos si no es distribuidor
      ...(value !== "distribuidor_nacional" && value !== "distribuidor_internacional" && {
        tipo_precio: undefined,
        unidades_individuales: undefined,
        cdi: undefined
      }),
      // Limpiar cdi si no es bodega
      ...(value !== "bodega" && { cdi: undefined })
    };
    
    // Establecer valores por defecto para distribuidores
    if (value === "distribuidor_nacional" || value === "distribuidor_internacional") {
      updatedUser.tipo_precio = updatedUser.tipo_precio || "con_iva";
      updatedUser.unidades_individuales = updatedUser.unidades_individuales !== undefined ? updatedUser.unidades_individuales : false;
    }
    
    // Establecer cdi por defecto para bodega
    if (value === "bodega") {
      updatedUser.cdi = updatedUser.cdi || "medellin";
    }
    
    onChange(updatedUser);
  };

  const handleTipoPrecioChange = (value: TipoPrecio) => {
    onChange({ ...user, tipo_precio: value });
  };

  const handleCDIChange = (value: CDIType) => {
    onChange({ ...user, cdi: value });
  };

  const handleUnidadesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...user, unidades_individuales: e.target.checked });
  };

  return (
    <div className="max-h-[calc(100vh-150px)] overflow-y-auto p-2 sm:p-4">
      <div className="grid gap-4 max-w-2xl mx-auto">
        {/* Sección de Información Básica */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 pt-0 md:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={user.nombre}
                onChange={(e) => onChange({ ...user, nombre: e.target.value })}
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="correo_electronico">Correo</Label>
              <Input
                id="correo_electronico"
                type="email"
                value={user.correo_electronico}
                onChange={(e) => onChange({ ...user, correo_electronico: e.target.value })}
                placeholder="usuario@empresa.com"
                required
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={user.password || ''}
                onChange={(e) => onChange({ ...user, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Sección de Contacto */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Contacto</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 pt-0 md:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="pais">País</Label>
              <Select
                value={user.pais}
                onValueChange={(value) => onChange({ ...user, pais: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Colombia">Colombia</SelectItem>
                  <SelectItem value="México">México</SelectItem>
                  <SelectItem value="Chile">Chile</SelectItem>
                  <SelectItem value="Perú">Perú</SelectItem>
                  <SelectItem value="Ecuador">Ecuador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                value={user.phone}
                onChange={(e) => onChange({ ...user, phone: e.target.value })}
                placeholder="+57 300 123 4567"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Sección de Configuración */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Configuración</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 pt-0">
            <div className="grid gap-1">
              <Label htmlFor="rol">Rol</Label>
              <Select
                value={user.rol}
                onValueChange={handleRoleChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distribuidor_nacional">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">DN</Badge>
                      <span>Distribuidor Nacional</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="distribuidor_internacional">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">DI</Badge>
                      <span>Distribuidor Internacional</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="produccion">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">P</Badge>
                      <span>Producción</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="facturacion">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-800">F</Badge>
                      <span>Facturación</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bodega">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-100 text-orange-800">B</Badge>
                      <span>Bodega</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campos específicos para distribuidores */}
            {(user.rol === "distribuidor_nacional" || user.rol === "distribuidor_internacional") && (
              <>
                <div className="grid gap-1">
                  <Label htmlFor="tipo_precio">Tipo de Precio</Label>
                  <Select
                    value={user.tipo_precio || "con_iva"}
                    onValueChange={handleTipoPrecioChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo de precio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sin_iva">Sin IVA (Nacional)</SelectItem>
                      <SelectItem value="con_iva">Con IVA (+19%)</SelectItem>
                      {user.rol === "distribuidor_internacional" && (
                        <SelectItem value="sin_iva_internacional">Sin IVA (Internacional)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="cdi">CDI</Label>
                  <Select
                    value={user.cdi || "medellin"}
                    onValueChange={handleCDIChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona CDI" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medellin">Medellín</SelectItem>
                      <SelectItem value="guarne">Guarne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="unidades_individuales"
                    checked={user.unidades_individuales || false}
                    onChange={handleUnidadesChange}
                  />
                  <Label htmlFor="unidades_individuales">Unidades Individuales</Label>
                </div>
              </>
            )}

            {/* Campo específico para bodega */}
            {user.rol === "bodega" && (
              <div className="grid gap-1">
                <Label htmlFor="cdi">Ubicación de Bodega</Label>
                <Select
                  value={user.cdi || "medellin"}
                  onValueChange={handleCDIChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medellin">Medellín</SelectItem>
                    <SelectItem value="guarne">Guarne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-1">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={user.estado}
                onValueChange={(value) => onChange({ ...user, estado: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estado de cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};