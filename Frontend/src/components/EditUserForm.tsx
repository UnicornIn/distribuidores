import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Info } from "lucide-react";

type EditUserFormProps = {
  user: any;
  onChange: (data: any) => void;
};

export const EditUserForm = ({ user, onChange }: EditUserFormProps) => {
  const handleRoleChange = (value: string) => {
    const updatedUser = { ...user, rol: value };
    if (value === "distribuidor" && !updatedUser.tipo_precio) {
      updatedUser.tipo_precio = user.tipo_precio || "con_iva";
    } else if (value !== "distribuidor" && "tipo_precio" in updatedUser) {
      delete updatedUser.tipo_precio;
    }
    onChange(updatedUser);
  };

  const handleTipoPrecioChange = (value: string) => {
    onChange({ ...user, tipo_precio: value });
  };

  return (
    <div className="grid gap-6">
      {/* Sección de Información Básica */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Información Básica</CardTitle>
          <CardDescription>Datos principales del usuario</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre Completo</Label>
            <Input
              id="nombre"
              value={user.nombre}
              onChange={(e) => onChange({ ...user, nombre: e.target.value })}
              placeholder="Ej: Juan Pérez"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="correo_electronico">Correo Electrónico</Label>
            <Input
              id="correo_electronico"
              type="email"
              value={user.correo_electronico}
              onChange={(e) => onChange({ ...user, correo_electronico: e.target.value })}
              placeholder="Ej: usuario@empresa.com"
              required
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Sección de Contacto */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Información de Contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="pais">País</Label>
            <Select
              value={user.pais}
              onValueChange={(value) => onChange({ ...user, pais: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un país" />
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

          <div className="grid gap-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              type="tel"
              value={user.phone}
              onChange={(e) => onChange({ ...user, phone: e.target.value })}
              placeholder="Ej: +57 300 123 4567"
              required
              pattern="[+0-9\s\-]*"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sección de Configuración */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Configuración de Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="rol">Rol del Usuario</Label>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Define los permisos del usuario
              </span>
            </div>
            <Select
              value={user.rol}
              onValueChange={handleRoleChange}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distribuidor">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800">D</Badge>
                    <span>Distribuidor</span>
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
              </SelectContent>
            </Select>
          </div>

          {user.rol === "distribuidor" && (
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="tipo_precio">Tipo de Precio</Label>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Define cómo verá los precios este distribuidor
                </span>
              </div>
              <Select
                value={user.tipo_precio || "con_iva"}
                onValueChange={handleTipoPrecioChange}
                required
              >
                <SelectTrigger className="bg-blue-50">
                  <SelectValue placeholder="Selecciona tipo de precio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin_iva">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-100 text-yellow-800">$</Badge>
                      <div>
                        <p>Sin IVA (Nacional)</p>
                        <p className="text-xs text-muted-foreground">Precios columna I</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="con_iva">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">$+</Badge>
                      <div>
                        <p>Con IVA (+19%)</p>
                        <p className="text-xs text-muted-foreground">Precios columna J + IVA</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="sin_iva_internacional">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800">$$</Badge>
                      <div>
                        <p>Sin IVA (Internacional)</p>
                        <p className="text-xs text-muted-foreground">Precios columna K</p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="estado">Estado de la Cuenta</Label>
            <Select
              value={user.estado}
              onValueChange={(value) => onChange({ ...user, estado: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Activo" className="text-green-600">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Activo</span>
                  </div>
                </SelectItem>
                <SelectItem value="Inactivo" className="text-red-600">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <span>Inactivo</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};