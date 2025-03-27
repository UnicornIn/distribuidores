import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "../hooks/use-toast";

const productoSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido"),
  categoria: z.string().min(1, "Categoría es requerida"),
  precio_sin_iva_colombia: z.number().min(1000, "Mínimo $1.000").int("Debe ser valor entero"),
  precio_con_iva_colombia: z.number().min(1000, "Mínimo $1.000").int("Debe ser valor entero"),
  precio_internacional: z.number().min(1000, "Mínimo $1.000").int("Debe ser valor entero"),
  stock: z.number().min(0, "Stock no puede ser negativo").int("Debe ser valor entero"),
  margen_descuento: z.number().min(0).max(1, "Margen debe ser entre 0 y 1"),
  codigo_tipo: z.number().min(0).optional(),
});

export function ProductoCreateForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: "",
      categoria: "",
      precio_sin_iva_colombia: 0,
      precio_con_iva_colombia: 0,
      precio_internacional: 0,
      stock: 0,
      margen_descuento: 0.45,
      codigo_tipo: undefined
    }
  });

  const onSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No hay token de autenticación");

      const response = await fetch("http://127.0.0.1:8000/productos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: data.nombre,
          categoria: data.categoria,
          precio_sin_iva_colombia: Number(data.precio_sin_iva_colombia),
          precio_con_iva_colombia: Number(data.precio_con_iva_colombia),
          precio_internacional: Number(data.precio_internacional),
          stock: Number(data.stock),
          margen_descuento: Number(data.margen_descuento),
          codigo_tipo: data.codigo_tipo ? Number(data.codigo_tipo) : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al crear producto");
      }

      toast({
        title: "Éxito",
        description: "Producto creado correctamente",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
      {/* Sección de información básica */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold">Información básica</h2>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre del Producto*</Label>
            <Input
              id="nombre"
              {...register("nombre")}
              placeholder="Ej: Aceite 120 ML"
              className={errors.nombre ? "border-red-500" : ""}
            />
            {errors.nombre && <p className="text-sm text-red-500">{String(errors.nombre.message)}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="categoria">Categoría*</Label>
            <Select
              onValueChange={(value) => setValue("categoria", value)}
              defaultValue=""
            >
              <SelectTrigger className={errors.categoria ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {["PLUS", "SPECIAL", "MEN", "ACCESORIO", "USO SALON"].map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoria && <p className="text-sm text-red-500">{String(errors.categoria.message)}</p>}
          </div>
        </div>
      </div>

      {/* Sección de precios y stock */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold">Precios y stock</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Columna 1: Sin IVA Colombia */}
          <div className="space-y-4">
            <InputCOP
              label="Precio Sin IVA (Colombia)*"
              value={watch("precio_sin_iva_colombia")}
              onChange={(value: number) => setValue("precio_sin_iva_colombia", value)}
              error={errors.precio_sin_iva_colombia}
              placeholder="Ej: 40.200"
            />
            
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock*</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                {...register("stock", { valueAsNumber: true })}
                className={errors.stock ? "border-red-500" : ""}
              />
              {errors.stock && <p className="text-sm text-red-500">{String(errors.stock.message)}</p>}
            </div>
          </div>

          {/* Columna 2: Con IVA Colombia */}
          <div className="space-y-4">
            <InputCOP
              label="Precio Con IVA (Colombia)*"
              value={watch("precio_con_iva_colombia")}
              onChange={(value: number) => setValue("precio_con_iva_colombia", value)}
              error={errors.precio_con_iva_colombia}
              placeholder="Ej: 94.879"
            />

            <div className="grid gap-2">
              <Label htmlFor="margen_descuento">Margen de Descuento (%)*</Label>
              <Input
                id="margen_descuento"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register("margen_descuento", {
                  valueAsNumber: true,
                  setValueAs: v => parseFloat(v) / 100
                })}
                placeholder="Ej: 0,45"
                className={errors.margen_descuento ? "border-red-500" : ""}
              />
              {errors.margen_descuento && (
                <p className="text-sm text-red-500">{String(errors.margen_descuento.message)}</p>
              )}
            </div>
          </div>

          {/* Columna 3: Internacional */}
          <div className="space-y-4">
            <InputCOP
              label="Precio Internacional*"
              value={watch("precio_internacional")}
              onChange={(value: number) => setValue("precio_internacional", value)}
              error={errors.precio_internacional}
              placeholder="Ej: 48.124"
            />
          </div>
        </div>
      </div>

      {/* Sección de código de tipo */}
      <div className="p-4 border rounded-lg">
        <div className="grid gap-2">
          <Label htmlFor="codigo_tipo">Código de Tipo</Label>
          <Input
            id="codigo_tipo"
            type="number"
            min="0"
            {...register("codigo_tipo", { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Crear Producto"}
        </Button>
      </div>
    </form>
  );
}

// Componente InputCOP (igual que antes)
function InputCOP({ label, value, onChange, error, placeholder }: any) {
  const [displayValue, setDisplayValue] = useState("");

  const formatValue = (inputValue: string) => {
    const numericValue = parseInt(inputValue.replace(/\D/g, '')) || 0;
    const formatted = new Intl.NumberFormat('es-CO').format(numericValue);
    return { numericValue, formatted };
  };

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(new Intl.NumberFormat('es-CO').format(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { numericValue, formatted } = formatValue(e.target.value);
    onChange(numericValue);
    setDisplayValue(formatted);
  };

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={error ? "border-red-500" : ""}
      />
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  );
}