import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Info } from "lucide-react";
import { Button } from "../components/ui/button";

type EditUserFormProps = {
  user: any;
  onChange: (data: any) => void;
  onSave?: () => void;
  onCancel?: () => void;
  isSaving?: boolean;
};

export const EditUserForm = ({ 
  user = {}, 
  onChange, 
  onSave, 
  onCancel, 
  isSaving = false 
}: EditUserFormProps) => {
  // Clonar el objeto user para evitar mutaciones directas
  const safeUser = JSON.parse(JSON.stringify(user));

  const handleRoleChange = (value: string) => {
    const updatedUser = { ...safeUser, rol: value };
    if (value === "distribuidor" && !updatedUser.tipo_precio) {
      updatedUser.tipo_precio = safeUser.tipo_precio || "con_iva";
    } else if (value !== "distribuidor" && "tipo_precio" in updatedUser) {
      delete updatedUser.tipo_precio;
    }
    onChange(updatedUser);
  };

  const handleTipoPrecioChange = (value: string) => {
    onChange({ ...safeUser, tipo_precio: value });
  };

  const handleChange = (field: string, value: any) => {
    onChange({ ...safeUser, [field]: value });
  };

  return (
    <div className="max-h-[calc(100vh-180px)] overflow-y-auto p-2 sm:p-4">
      <div className="grid gap-4 max-w-2xl mx-auto">
        {/* Sección de Información Básica */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Información Básica</CardTitle>
            <CardDescription className="text-xs">Datos principales del usuario</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 pt-0 md:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="nombre" className="text-sm">Nombre</Label>
              <Input
                id="nombre"
                className="h-9 text-sm"
                value={safeUser.nombre || ""}
                onChange={(e) => handleChange("nombre", e.target.value)}
                placeholder="Ej: Juan Pérez"
                required
                disabled={isSaving}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="correo_electronico" className="text-sm">Correo</Label>
              <Input
                id="correo_electronico"
                type="email"
                className="h-9 text-sm"
                value={safeUser.correo_electronico || ""}
                onChange={(e) => handleChange("correo_electronico", e.target.value)}
                placeholder="usuario@empresa.com"
                required
                disabled
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
              <Label htmlFor="pais" className="text-sm">País</Label>
              <Select
                value={safeUser.pais || ""}
                onValueChange={(value) => handleChange("pais", value)}
                required
                disabled={isSaving}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecciona país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Colombia" className="text-sm">Colombia</SelectItem>
                  <SelectItem value="México" className="text-sm">México</SelectItem>
                  <SelectItem value="Chile" className="text-sm">Chile</SelectItem>
                  <SelectItem value="Perú" className="text-sm">Perú</SelectItem>
                  <SelectItem value="Ecuador" className="text-sm">Ecuador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="telefono" className="text-sm">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                className="h-9 text-sm"
                value={safeUser.telefono || ""}
                onChange={(e) => handleChange("telefono", e.target.value)}
                placeholder="+57 300 123 4567"
                required
                pattern="[+0-9\s\-]*"
                disabled={isSaving}
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
              <div className="flex items-center gap-2">
                <Label htmlFor="rol" className="text-sm">Rol</Label>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Permisos del usuario
                </span>
              </div>
              <Select
                value={safeUser.rol || ""}
                onValueChange={handleRoleChange}
                required
                disabled={isSaving}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecciona rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distribuidor" className="text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800 px-1.5 py-0.5 text-xs">D</Badge>
                      <span>Distribuidor</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="produccion" className="text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 px-1.5 py-0.5 text-xs">P</Badge>
                      <span>Producción</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="facturacion" className="text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-800 px-1.5 py-0.5 text-xs">F</Badge>
                      <span>Facturación</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {safeUser.rol === "distribuidor" && (
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="tipo_precio" className="text-sm">Precios</Label>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Visualización de precios
                  </span>
                </div>
                <Select
                  value={safeUser.tipo_precio || "con_iva"}
                  onValueChange={handleTipoPrecioChange}
                  required
                  disabled={isSaving}
                >
                  <SelectTrigger className="h-9 text-sm bg-blue-50">
                    <SelectValue placeholder="Tipo de precio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin_iva" className="text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 text-xs">$</Badge>
                        <div>
                          <p className="text-sm">Sin IVA (Nacional)</p>
                          <p className="text-xs text-muted-foreground">Precios columna I</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="con_iva" className="text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 px-1.5 py-0.5 text-xs">$+</Badge>
                        <div>
                          <p className="text-sm">Con IVA (+19%)</p>
                          <p className="text-xs text-muted-foreground">Precios columna J + IVA</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="sin_iva_internacional" className="text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-800 px-1.5 py-0.5 text-xs">$$</Badge>
                        <div>
                          <p className="text-sm">Sin IVA (Internacional)</p>
                          <p className="text-xs text-muted-foreground">Precios columna K</p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-1">
              <Label htmlFor="estado" className="text-sm">Estado</Label>
              <Select
                value={safeUser.estado || ""}
                onValueChange={(value) => handleChange("estado", value)}
                required
                disabled={isSaving}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Estado de cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo" className="text-sm text-green-600">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span>Activo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Inactivo" className="text-sm text-red-600">
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

        {/* Botones de acción */}
        {onCancel && onSave && (
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};