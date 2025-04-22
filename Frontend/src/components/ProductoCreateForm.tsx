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
  precio_sin_iva_colombia: z.number().min(1000, "Mínimo $1.000"),
  precio_con_iva_colombia: z.number().min(1000, "Mínimo $1.000"),
  precio_internacional: z.number().min(4, "Mínimo $4 USD"),
  stock: z.number().min(0, "Stock no puede ser negativo").int("Debe ser valor entero"),
});

export function ProductoCreateForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting }, 
    setValue, 
    watch 
  } = useForm({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: "",
      categoria: "",
      precio_sin_iva_colombia: 0,
      precio_con_iva_colombia: 0,
      precio_internacional: 0,
      stock: 0,
    }
  });

  const onSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No hay token de autenticación");

      const response = await fetch("https://api.rizosfelices.co/productos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: data.nombre,
          categoria: data.categoria,
          precio_sin_iva_colombia: data.precio_sin_iva_colombia,
          precio_con_iva_colombia: data.precio_con_iva_colombia,
          precio_internacional: data.precio_internacional,
          stock: Number(data.stock),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al crear producto");
      }

      toast({
        title: "✅ Producto creado",
        description: "El producto se ha registrado correctamente",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
      {/* Sección de información básica */}
      <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Información básica</h2>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label htmlFor="nombre" className="text-gray-700">Nombre del Producto*</Label>
            <Input
              id="nombre"
              {...register("nombre")}
              placeholder="Ej: Aceite 120 ML"
              className={errors.nombre ? "border-red-500" : "border-gray-300"}
            />
            {errors.nombre && (
              <p className="text-xs text-red-500 mt-1">{String(errors.nombre.message)}</p>
            )}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="categoria" className="text-gray-700">Categoría*</Label>
            <Select
              onValueChange={(value) => setValue("categoria", value)}
              defaultValue=""
            >
              <SelectTrigger className={errors.categoria ? "border-red-500" : "border-gray-300"}>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {["PLUS", "SPECIAL", "MEN", "ACCESORIO", "USO SALON"].map((cat) => (
                  <SelectItem key={cat} value={cat} className="hover:bg-gray-100">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoria && (
              <p className="text-xs text-red-500 mt-1">{String(errors.categoria.message)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Sección de precios y stock */}
      <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Precios y stock</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Columna 1: Sin IVA Colombia */}
          <div className="space-y-4">
            <InputPrecio
              label="Precio Sin IVA (Colombia)*"
              value={watch("precio_sin_iva_colombia")}
              onChange={(value: number) => setValue("precio_sin_iva_colombia", value)}
              error={errors.precio_sin_iva_colombia}
              placeholder="1.000"
              currency="COP"
              minValue={1000}
              decimalPlaces={0}
            />
            
            <div className="grid gap-1">
              <Label htmlFor="stock" className="text-gray-700">Stock*</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                {...register("stock", { valueAsNumber: true })}
                className={errors.stock ? "border-red-500" : "border-gray-300"}
              />
              {errors.stock && (
                <p className="text-xs text-red-500 mt-1">{String(errors.stock.message)}</p>
              )}
            </div>
          </div>

          {/* Columna 2: Con IVA Colombia */}
          <div className="space-y-4">
            <InputPrecio
              label="Precio Con IVA (Colombia)*"
              value={watch("precio_con_iva_colombia")}
              onChange={(value: number) => setValue("precio_con_iva_colombia", value)}
              error={errors.precio_con_iva_colombia}
              placeholder="1.000"
              currency="COP"
              minValue={1000}
              decimalPlaces={0}
            />
          </div>

          {/* Columna 3: Internacional */}
          <div className="space-y-4">
            <InputPrecio
              label="Precio Internacional(USD)*"
              value={watch("precio_internacional")}
              onChange={(value: number) => setValue("precio_internacional", value)}
              error={errors.precio_internacional}
              placeholder="4,20"
              currency="USD"
              minValue={4}
              decimalPlaces={2}
            />
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-4 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onSuccess}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary-dark"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </span>
          ) : "Crear Producto"}
        </Button>
      </div>
    </form>
  );
}

// Componente InputPrecio optimizado para manejar los diferentes formatos
function InputPrecio({ 
  label, 
  value, 
  onChange, 
  error, 
  placeholder, 
  currency = "COP",
  minValue = 0,
  decimalPlaces = 0
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: any;
  placeholder?: string;
  currency?: "COP" | "USD";
  minValue?: number;
  decimalPlaces?: number;
}) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    // Formatea el valor inicial según el tipo de moneda
    if (value !== undefined && value !== null) {
      if (currency === "COP") {
        // Formato COP: 1.000 (sin decimales)
        const formatted = new Intl.NumberFormat('es-CO', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
        setInputValue(formatted);
      } else {
        // Formato USD: 4,20 (con coma decimal)
        const formatted = new Intl.NumberFormat('es-CO', {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces
        }).format(value);
        setInputValue(formatted);
      }
    }
  }, [value, currency, decimalPlaces]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    if (currency === "COP") {
      // Para COP: solo permite números y puntos como separadores de miles
      if (/^[\d.]*$/.test(rawValue)) {
        // Elimina todos los puntos para el cálculo
        const numericValue = parseFloat(rawValue.replace(/\./g, '')) || 0;
        setInputValue(rawValue);
        onChange(numericValue);
      }
    } else {
      // Para USD: permite números y coma decimal
      if (/^[\d,]*$/.test(rawValue)) {
        // Reemplaza comas por puntos para el cálculo
        const normalizedValue = rawValue.replace(',', '.');
        const numericValue = parseFloat(normalizedValue) || 0;
        setInputValue(rawValue);
        onChange(numericValue);
      }
    }
  };

  const handleBlur = () => {
    let numericValue = 0;
    
    if (currency === "COP") {
      // Para COP: elimina puntos y convierte a número
      numericValue = parseFloat(inputValue.replace(/\./g, '')) || 0;
    } else {
      // Para USD: reemplaza coma por punto y convierte
      numericValue = parseFloat(inputValue.replace(',', '.')) || 0;
    }
    
    // Asegura el valor mínimo
    const finalValue = Math.max(numericValue, minValue);
    
    // Vuelve a formatear según el tipo de moneda
    if (currency === "COP") {
      const formatted = new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(finalValue);
      setInputValue(formatted);
    } else {
      const formatted = new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      }).format(finalValue);
      setInputValue(formatted);
    }
    
    onChange(finalValue);
  };

  return (
    <div className="grid gap-1">
      <Label className="text-gray-700 text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          {currency === "COP" ? "$" : "$"}
        </span>
        <Input
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`pl-10 ${error ? "border-red-500" : "border-gray-300"}`}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error.message}</p>
      )}
    </div>
  );
}