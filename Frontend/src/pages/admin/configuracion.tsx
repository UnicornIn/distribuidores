"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Switch } from "../../components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { useTenant } from "../../context/tenant-context"
import { Loader2, Plus, Save, Trash2 } from "lucide-react"
import { Badge } from "../../components/ui/badge"

type CustomField = {
  name: string
  type: "text" | "number" | "date" | "select"
  required: boolean
  options?: string[]
}

type NewProductField = {
  name: string
  type: "text" | "number" | "date" | "select"
  required: boolean
  options: string
}

export default function ConfiguracionPage() {
  const { config, updateConfig, isLoading } = useTenant()
  const [isSaving, setIsSaving] = useState(false)
  const [newCategory, setNewCategory] = useState("")

  // Estado local para manejar los campos personalizados
  const [newProductField, setNewProductField] = useState<NewProductField>({
    name: "",
    type: "text",
    required: false,
    options: "",
  })

  const handleSaveConfig = async () => {
    setIsSaving(true)
    // Simulación de guardado
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  const addCategory = () => {
    if (newCategory.trim() && !config.productCategories.includes(newCategory.trim())) {
      updateConfig({
        productCategories: [...config.productCategories, newCategory.trim()],
      })
      setNewCategory("")
    }
  }

  const removeCategory = (category: string) => {
    updateConfig({
      productCategories: config.productCategories.filter((c) => c !== category),
    })
  }

  const addProductCustomField = () => {
    if (newProductField.name.trim()) {
      const newField: CustomField = {
        name: newProductField.name.trim(),
        type: newProductField.type,
        required: newProductField.required,
        options:
          newProductField.type === "select"
            ? newProductField.options
                .split(",")
                .map((o) => o.trim())
                .filter((o) => o)
            : undefined,
      }

      updateConfig({
        customFields: {
          ...config.customFields,
          products: [...config.customFields.products, newField],
        },
      })

      setNewProductField({
        name: "",
        type: "text",
        required: false,
        options: "",
      })
    }
  }

  const removeProductCustomField = (fieldName: string) => {
    updateConfig({
      customFields: {
        ...config.customFields,
        products: config.customFields.products.filter((f) => f.name !== fieldName),
      },
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-[400px] items-center justify-center p-4 md:p-6">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary md:text-3xl">Configuración del Sistema</h1>
        <p className="text-muted-foreground">Personaliza el sistema según las necesidades de tu empresa</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
          <TabsTrigger value="campos">Campos Personalizados</TabsTrigger>
          <TabsTrigger value="funciones">Funcionalidades</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
              <CardDescription>Configura la información básica de tu empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nombre de la Empresa</Label>
                  <Input
                    id="company-name"
                    value={config.name}
                    onChange={(e) => updateConfig({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={config.currency} onValueChange={(value) => updateConfig({ currency: value })}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Selecciona una moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                      <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                      <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="locale">Idioma y Región</Label>
                  <Select value={config.locale} onValueChange={(value) => updateConfig({ locale: value })}>
                    <SelectTrigger id="locale">
                      <SelectValue placeholder="Selecciona un idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es-ES">Español (España)</SelectItem>
                      <SelectItem value="es-MX">Español (México)</SelectItem>
                      <SelectItem value="es-CO">Español (Colombia)</SelectItem>
                      <SelectItem value="es-AR">Español (Argentina)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Color Principal</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                      className="h-10 w-10 cursor-pointer p-1"
                    />
                    <Input
                      value={config.primaryColor}
                      onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveConfig} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar Cambios
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorías de Productos</CardTitle>
              <CardDescription>Gestiona las categorías para clasificar tus productos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nueva categoría"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <Button onClick={addCategory} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {config.productCategories.map((category) => (
                  <Badge key={category} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                    {category}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeCategory(category)}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="sr-only">Eliminar {category}</span>
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveConfig} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar Cambios
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="campos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campos Personalizados</CardTitle>
              <CardDescription>Añade campos personalizados para productos y pedidos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-medium">Campos para Productos</h3>
                <div className="mb-4 grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="field-name">Nombre del Campo</Label>
                    <Input
                      id="field-name"
                      placeholder="Ej: Tamaño"
                      value={newProductField.name}
                      onChange={(e) => setNewProductField({ ...newProductField, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field-type">Tipo</Label>
                    <Select
                      value={newProductField.type}
                      onValueChange={(value: "text" | "number" | "date" | "select") =>
                        setNewProductField({ ...newProductField, type: value })
                      }
                    >
                      <SelectTrigger id="field-type">
                        <SelectValue placeholder="Tipo de campo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="date">Fecha</SelectItem>
                        <SelectItem value="select">Selección</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    {newProductField.type === "select" && (
                      <>
                        <Label htmlFor="field-options">Opciones (separadas por comas)</Label>
                        <Input
                          id="field-options"
                          placeholder="Opción 1, Opción 2, Opción 3"
                          value={newProductField.options}
                          onChange={(e) => setNewProductField({ ...newProductField, options: e.target.value })}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="field-required"
                        checked={newProductField.required}
                        onCheckedChange={(checked) => setNewProductField({ ...newProductField, required: checked })}
                      />
                      <Label htmlFor="field-required">Obligatorio</Label>
                    </div>
                  </div>
                </div>

                <Button onClick={addProductCustomField} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir Campo
                </Button>

                {config.customFields.products.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 font-medium">Campos actuales:</h4>
                    <div className="space-y-2">
                      {config.customFields.products.map((field) => (
                        <div key={field.name} className="flex items-center justify-between rounded-md border p-2">
                          <div>
                            <span className="font-medium">{field.name}</span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              ({field.type}
                              {field.required ? ", obligatorio" : ""})
                              {field.options && ` - Opciones: ${field.options.join(", ")}`}
                            </span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeProductCustomField(field.name)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveConfig} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar Cambios
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="funciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades del Sistema</CardTitle>
              <CardDescription>Activa o desactiva funcionalidades según tus necesidades</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="multiple-warehouses">Múltiples Almacenes</Label>
                    <p className="text-sm text-muted-foreground">
                      Gestiona inventario en diferentes ubicaciones físicas
                    </p>
                  </div>
                  <Switch
                    id="multiple-warehouses"
                    checked={config.features.multipleWarehouses}
                    onCheckedChange={(checked) =>
                      updateConfig({
                        features: { ...config.features, multipleWarehouses: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="barcode-scanning">Escaneo de Códigos de Barras</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite escanear códigos de barras para agilizar procesos
                    </p>
                  </div>
                  <Switch
                    id="barcode-scanning"
                    checked={config.features.barcodeScanning}
                    onCheckedChange={(checked) =>
                      updateConfig({
                        features: { ...config.features, barcodeScanning: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="supplier-management">Gestión de Proveedores</Label>
                    <p className="text-sm text-muted-foreground">Administra proveedores y órdenes de compra</p>
                  </div>
                  <Switch
                    id="supplier-management"
                    checked={config.features.supplierManagement}
                    onCheckedChange={(checked) =>
                      updateConfig({
                        features: { ...config.features, supplierManagement: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="advanced-analytics">Analíticas Avanzadas</Label>
                    <p className="text-sm text-muted-foreground">Reportes detallados y análisis predictivo</p>
                  </div>
                  <Switch
                    id="advanced-analytics"
                    checked={config.features.advancedAnalytics}
                    onCheckedChange={(checked) =>
                      updateConfig({
                        features: { ...config.features, advancedAnalytics: checked },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveConfig} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar Cambios
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

