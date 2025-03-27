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

const productoSchema = z.object({
    nombre: z.string().min(1, "Nombre es requerido"),
    categoria: z.string().min(1, "Categoría es requerida"),
    precio_sin_iva_colombia: z.number().min(1000, "Mínimo $1.000").int("Debe ser valor entero"),
    precio_con_iva_colombia: z.number().min(1000, "Mínimo $1.000").int("Debe ser valor entero"),
    precio_internacional: z.number().min(1000, "Mínimo $1.000").int("Debe ser valor entero"),
    stock: z.number().min(0, "Stock no puede ser negativo").int("Debe ser valor entero"),
    margen_descuento: z.number().min(0).max(1, "Margen debe ser entre 0 y 1"),
    codigo_tipo: z.number().min(0),
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
            precio_sin_iva_colombia: producto.precios.sin_iva_colombia,
            precio_con_iva_colombia: producto.precios.con_iva_colombia,
            precio_internacional: producto.precios.internacional,
            stock: producto.stock,
            margen_descuento: producto.margenes.descuento,
            codigo_tipo: producto.margenes.tipo_codigo
        }
    });

    const { isDirty } = useFormState({ control });

    useEffect(() => {
        reset({
            nombre: producto.nombre,
            categoria: producto.categoria,
            precio_sin_iva_colombia: producto.precios.sin_iva_colombia,
            precio_con_iva_colombia: producto.precios.con_iva_colombia,
            precio_internacional: producto.precios.internacional,
            stock: producto.stock,
            margen_descuento: producto.margenes.descuento,
            codigo_tipo: producto.margenes.tipo_codigo
        });
    }, [producto, reset]);

    const onSubmit = async (data: any) => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) throw new Error("No hay token de autenticación");

            const payload = Object.keys(dirtyFields).reduce((acc, key) => {
                acc[key] = data[key];
                return acc;
            }, {} as Record<string, any>);

            const response = await fetch(`http://127.0.0.1:8000/productos/${producto.id}`, {
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
                title: "Éxito",
                description: "Producto actualizado correctamente",
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

    const nextStep = async () => {
        let isValid = false;
        
        if (currentStep === 0) {
            isValid = await trigger(['nombre', 'categoria']);
        } else if (currentStep === 1) {
            isValid = await trigger([
                'precio_sin_iva_colombia', 
                'precio_con_iva_colombia', 
                'precio_internacional',
                'stock',
                'margen_descuento'
            ]);
        } else if (currentStep === 2) {
            isValid = await trigger(['codigo_tipo']);
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
                            <Label className="text-xs mb-1">Nombre del Producto</Label>
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
                            <Label className="text-xs mb-1">Categoría</Label>
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
                            label="Precio Sin IVA (Colombia)"
                            value={watch("precio_sin_iva_colombia")}
                            onChange={(value: number) => setValue("precio_sin_iva_colombia", value, { shouldDirty: true })}
                            error={errors.precio_sin_iva_colombia}
                            placeholder="Ej: 10.875"
                        />
                        
                        <InputCOP
                            label="Precio Con IVA (Colombia)"
                            value={watch("precio_con_iva_colombia")}
                            onChange={(value: number) => setValue("precio_con_iva_colombia", value, { shouldDirty: true })}
                            error={errors.precio_con_iva_colombia}
                            placeholder="Ej: 125.764"
                        />

                        <InputCOP
                            label="Precio Internacional"
                            value={watch("precio_internacional")}
                            onChange={(value: number) => setValue("precio_internacional", value, { shouldDirty: true })}
                            error={errors.precio_internacional}
                            placeholder="Ej: 23.354"
                        />

                        <div>
                            <Label className="text-xs mb-1">Stock</Label>
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

                        <div>
                            <Label className="text-xs mb-1">Margen de Descuento (%)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                {...register("margen_descuento", {
                                    valueAsNumber: true,
                                    setValueAs: v => parseFloat(v) / 100
                                })}
                                placeholder="Ej: 0,45"
                                className={`h-8 text-xs ${errors.margen_descuento ? "border-red-300" : ""}`}
                            />
                            {errors.margen_descuento && (
                                <p className="text-xs text-red-500 mt-1">{String(errors.margen_descuento.message)}</p>
                            )}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs mb-1">Código de Tipo</Label>
                            <Input
                                type="number"
                                min="0"
                                {...register("codigo_tipo", { valueAsNumber: true })}
                                className={`h-8 text-xs ${errors.codigo_tipo ? "border-red-300" : ""}`}
                            />
                            {errors.codigo_tipo && (
                                <p className="text-xs text-red-500 mt-1">{String(errors.codigo_tipo.message)}</p>
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
                                <span className="text-gray-500">Precio con IVA:</span>
                                <span>${watch('precio_con_iva_colombia')?.toLocaleString('es-CO')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Stock:</span>
                                <span>{watch('stock')}</span>
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
                            className={`text-xs mt-1 ${currentStep === index ? 'font-medium' : 'text-gray-500'}`}
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
                            className="h-8 text-xs flex-1"
                        >
                            Siguiente
                            <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                    ) : (
                        <Button 
                            type="submit" 
                            disabled={isSubmitting || !isDirty}
                            className="h-8 text-xs flex-1"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-3 w-3 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Guardando
                                </span>
                            ) : 'Confirmar'}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
}

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