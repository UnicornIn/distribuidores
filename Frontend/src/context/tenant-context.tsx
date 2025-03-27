"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type TenantConfig = {
  id: string
  name: string
  logo?: string
  primaryColor: string
  secondaryColor: string
  currency: string
  locale: string
  features: {
    multipleWarehouses: boolean
    barcodeScanning: boolean
    supplierManagement: boolean
    advancedAnalytics: boolean
    customFields: boolean
  }
  productCategories: string[]
  customFields: {
    products: Array<{
      name: string
      type: "text" | "number" | "date" | "select"
      required: boolean
      options?: string[]
    }>
    orders: Array<{
      name: string
      type: "text" | "number" | "date" | "select"
      required: boolean
      options?: string[]
    }>
  }
}

export const defaultTenantConfig: TenantConfig = {
  id: "default",
  name: "Mi Empresa",
  primaryColor: "hsl(262.1, 83.3%, 57.8%)", // Default purple
  secondaryColor: "hsl(262.1, 83.3%, 97.8%)",
  currency: "USD",
  locale: "es-ES",
  features: {
    multipleWarehouses: false,
    barcodeScanning: false,
    supplierManagement: false,
    advancedAnalytics: false,
    customFields: false,
  },
  productCategories: ["General"],
  customFields: {
    products: [],
    orders: [],
  },
}

type TenantContextType = {
  config: TenantConfig
  updateConfig: (config: Partial<TenantConfig>) => void
  isLoading: boolean
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<TenantConfig>(defaultTenantConfig)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // En una implementación real, esto cargaría la configuración del tenant desde una API
    const loadTenantConfig = async () => {
      try {
        // Simulación de carga desde API
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Aquí se cargaría la configuración real del tenant basada en el dominio o subdominios
        // Por ahora usamos una configuración de ejemplo
        const exampleConfig: TenantConfig = {
          id: "tenant-123",
          name: "Rizos Felices",
          logo: "/logo.svg",
          primaryColor: "hsl(262.1, 83.3%, 57.8%)",
          secondaryColor: "hsl(262.1, 83.3%, 97.8%)",
          currency: "USD",
          locale: "es-ES",
          features: {
            multipleWarehouses: true,
            barcodeScanning: true,
            supplierManagement: true,
            advancedAnalytics: false,
            customFields: true,
          },
          productCategories: ["Limpieza", "Styling", "Tratamientos", "Protección"],
          customFields: {
            products: [
              {
                name: "Tamaño",
                type: "select",
                required: true,
                options: ["Pequeño", "Mediano", "Grande"],
              },
              {
                name: "Tipo de cabello",
                type: "select",
                required: false,
                options: ["Rizado", "Liso", "Ondulado", "Todos"],
              },
            ],
            orders: [
              {
                name: "Prioridad",
                type: "select",
                required: false,
                options: ["Baja", "Media", "Alta"],
              },
            ],
          },
        }

        setConfig(exampleConfig)
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading tenant config:", error)
        setIsLoading(false)
      }
    }

    loadTenantConfig()
  }, [])

  const updateConfig = (newConfig: Partial<TenantConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }))
    // En una implementación real, aquí se guardarían los cambios en la API
  }

  return <TenantContext.Provider value={{ config, updateConfig, isLoading }}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider")
  }
  return context
}

