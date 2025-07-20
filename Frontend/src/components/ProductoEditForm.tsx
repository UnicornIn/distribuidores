import { useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "../hooks/use-toast";
import { Producto } from "../api/types";
import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Esquema de validación
const productoSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido"),
  categoria: z.string().min(1, "Categoría es requerida"),
  precios: z.object({
    sin_iva_colombia: z.number().min(1000, "Mínimo $1.000").int("Debe ser valor entero"),
    con_iva_colombia: z.number().min(1000, "Mínimo $1.000").int("Debe ser valor entero"),
    internacional: z.number().min(4, "Mínimo US$4").multipleOf(0.01, "Máximo 2 decimales"),
  }),
  stock: z.number().min(0, "Stock no puede ser negativo").int("Debe ser valor entero"),
  margenes: z.object({
    tipo_codigo: z.number().min(0, "Código no puede ser negativo"),
  }),
});

export function ProductoEditForm({ producto, onSuccess }: { producto: Producto; onSuccess: () => void }) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
    setValue,
    watch,
    control,
    reset,
    trigger
  } = useForm({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: producto.nombre,
      categoria: producto.categoria,
      precios: {
        sin_iva_colombia: producto.precios.sin_iva_colombia,
        con_iva_colombia: producto.precios.con_iva_colombia,
        internacional: producto.precios.internacional,
      },
      stock: producto.stock,
      margenes: {
        tipo_codigo: producto.margenes.tipo_codigo
      }
    }
  });

  const { isDirty } = useFormState({ control });

  useEffect(() => {
    reset({
      nombre: producto.nombre,
      categoria: producto.categoria,
      precios: {
        sin_iva_colombia: producto.precios.sin_iva_colombia,
        con_iva_colombia: producto.precios.con_iva_colombia,
        internacional: producto.precios.internacional,
      },
      stock: producto.stock,
      margenes: {
        tipo_codigo: producto.margenes.tipo_codigo
      }
    });
  }, [producto, reset]);

  const onSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No hay token de autenticación");

      // Preparar payload según campos modificados
      const payload: any = {};
      
      if (dirtyFields.nombre) payload.nombre = data.nombre;
      if (dirtyFields.categoria) payload.categoria = data.categoria;
      if (dirtyFields.stock) payload.stock = data.stock;
      
      // Manejo de precios
      const preciosPayload: any = {};
      if (dirtyFields.precios?.sin_iva_colombia) preciosPayload.sin_iva_colombia = data.precios.sin_iva_colombia;
      if (dirtyFields.precios?.con_iva_colombia) preciosPayload.con_iva_colombia = data.precios.con_iva_colombia;
      if (dirtyFields.precios?.internacional) preciosPayload.internacional = data.precios.internacional;
      
      if (Object.keys(preciosPayload).length > 0) {
        payload.precios = preciosPayload;
      }

      // Manejo de márgenes
      if (dirtyFields.margenes?.tipo_codigo) {
        payload.margenes = {
          tipo_codigo: data.margenes.tipo_codigo
        };
      }

      // Usar el código personalizado (id) en lugar de _id para la API
      const response = await fetch(`https://api.rizosfelices.co/productos/${producto.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al actualizar el producto");
      }

      toast({
        title: "✅ Producto actualizado",
        description: "Los cambios se guardaron correctamente",
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

  const nextStep = async () => {
    let isValid = false;
    
    if (currentStep === 0) {
      isValid = await trigger(['nombre', 'categoria']);
    } else if (currentStep === 1) {
      isValid = await trigger([
        'precios.sin_iva_colombia', 
        'precios.con_iva_colombia', 
        'precios.internacional',
        'stock'
      ]);
    } else if (currentStep === 2) {
      isValid = await trigger(['margenes.tipo_codigo']);
    } else {
      isValid = true;
    }

    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1">Nombre del Producto*</Label>
              <Input
                {...register("nombre")}
                placeholder="Ej: Aceite 120 ML"
                className={`h-8 text-xs ${errors.nombre ? "border-red-300" : ""}`}
              />
              {errors.nombre && (
                <p className="text-xs text-red-500 mt-1">{String(errors.nombre.message)}</p>
              )}
            </div>

            <div>
              <Label className="text-xs mb-1">Categoría*</Label>
              <Select
                onValueChange={(value) => setValue("categoria", value, { shouldDirty: true })}
                defaultValue={watch("categoria")}
              >
                <SelectTrigger className={`h-8 text-xs ${errors.categoria ? "border-red-300" : ""}`}>
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {["PLUS", "SPECIAL", "MEN", "ACCESORIO", "USO SALON"].map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
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
        );
      case 1:
        return (
          <div className="space-y-3">
            <InputCOP
              label="Precio Sin IVA (Colombia)*"
              value={watch("precios.sin_iva_colombia")}
              onChange={(value: number) => setValue("precios.sin_iva_colombia", value, { shouldDirty: true })}
              error={errors.precios?.sin_iva_colombia}
              placeholder="Ej: 10.000"
            />
            
            <InputCOP
              label="Precio Con IVA (Colombia)*"
              value={watch("precios.con_iva_colombia")}
              onChange={(value: number) => setValue("precios.con_iva_colombia", value, { shouldDirty: true })}
              error={errors.precios?.con_iva_colombia}
              placeholder="Ej: 12.500"
            />

            <InputUSD
              label="Precio Internacional (USD)*"
              value={watch("precios.internacional")}
              onChange={(value: number) => setValue("precios.internacional", value, { shouldDirty: true })}
              error={errors.precios?.internacional}
              placeholder="Ej: 4,20"
            />

            <div>
              <Label className="text-xs mb-1">Stock*</Label>
              <Input
                type="number"
                min="0"
                {...register("stock", { valueAsNumber: true })}
                className={`h-8 text-xs ${errors.stock ? "border-red-300" : ""}`}
              />
              {errors.stock && (
                <p className="text-xs text-red-500 mt-1">{String(errors.stock.message)}</p>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1">Código de Tipo*</Label>
              <Input
                type="number"
                min="0"
                {...register("margenes.tipo_codigo", { valueAsNumber: true })}
                className={`h-8 text-xs ${errors.margenes?.tipo_codigo ? "border-red-300" : ""}`}
              />
              {errors.margenes?.tipo_codigo && (
                <p className="text-xs text-red-500 mt-1">{String(errors.margenes.tipo_codigo.message)}</p>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-3 text-xs">
            <h3 className="font-medium">Resumen de cambios</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Nombre:</span>
                <span>{watch('nombre')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Categoría:</span>
                <span>{watch('categoria')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Precio sin IVA:</span>
                <span>$ {watch('precios.sin_iva_colombia')?.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Precio con IVA:</span>
                <span>$ {watch('precios.con_iva_colombia')?.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Precio Internacional:</span>
                <span>US$ {watch('precios.internacional')?.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stock:</span>
                <span>{String(watch('stock'))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Código de tipo:</span>
                <span>{watch('margenes.tipo_codigo')}</span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-3 max-w-md mx-auto">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Editar: {producto.nombre}</h1>
        <p className="text-xs text-gray-500">Modifica la información del producto</p>
      </div>

      {/* Barra de progreso */}
      <div className="flex justify-between items-center mb-4">
        {['Básico', 'Precios', 'Adicional', 'Confirmar'].map((stepTitle, index) => (
          <div key={index} className="flex flex-col items-center">
            <div 
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs 
                  ${currentStep >= index ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {index + 1}
            </div>
            <span 
              className={`text-xs mt-1 ${currentStep === index ? 'font-medium text-blue-600' : 'text-gray-500'}`}
            >
              {stepTitle}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-4">
          <CardContent className="p-4">
            {renderStep()}
          </CardContent>
        </Card>

        <div className="flex justify-between gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={currentStep === 0 ? onSuccess : prevStep}
            className="h-8 text-xs flex-1"
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            {currentStep === 0 ? 'Cancelar' : 'Atrás'}
          </Button>
          
          {currentStep < 3 ? (
            <Button 
              type="button" 
              onClick={nextStep}
              className="h-8 text-xs flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Siguiente
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={isSubmitting || !isDirty}
              className="h-8 text-xs flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-3 w-3 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando
                </span>
              ) : 'Confirmar cambios'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

// Componentes InputCOP e InputUSD (sin cambios)
function InputCOP({ label, value, onChange, error, placeholder }: any) {
  const [displayValue, setDisplayValue] = useState("");

  const formatValue = (inputValue: string) => {
    const numericString = inputValue.replace(/\D/g, '');
    const numericValue = numericString ? parseInt(numericString) : 0;
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
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs">$</span>
        <Input
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`h-8 text-xs pl-6 ${error ? "border-red-300" : ""}`}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error.message}</p>
      )}
    </div>
  );
}

function InputUSD({ label, value, onChange, error, placeholder }: any) {
  const [displayValue, setDisplayValue] = useState("");

  const formatValue = (inputValue: string) => {
    const normalized = inputValue.replace(',', '.');
    const numericString = normalized.replace(/[^\d.]/g, '')
      .replace(/^(\d*\.?)|(\d*)\.?/g, '$1$2')
      .replace(/\.(?=.*\.)/g, '');
    
    const numericValue = numericString ? parseFloat(numericString) : 0;
    const formatted = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue);
    return { numericValue, formatted };
  };

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { numericValue, formatted } = formatValue(e.target.value);
    onChange(numericValue);
    setDisplayValue(formatted);
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs">US$</span>
        <Input
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`h-8 text-xs pl-10 ${error ? "border-red-300" : ""}`}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error.message}</p>
      )}
    </div>
  );
}