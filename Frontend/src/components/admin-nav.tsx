"use client"

import type React from "react"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import { LayoutDashboard, LogOut, Menu, Package, ShoppingCart, UserPlus } from "lucide-react"
import { useTenant } from "../context/tenant-context"

type NavRoute = {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
}

export function AdminNav() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const { config } = useTenant()

  // Obtener el rol del usuario desde localStorage
  const rol = localStorage.getItem("rol")

  // Rutas base para todos los roles
  const baseRoutes: NavRoute[] = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/admin/dashboard",
    },
    {
      href: "/admin/pedidos",
      label: "Pedidos",
      icon: ShoppingCart,
      active: location.pathname === "/admin/pedidos",
    },
  ]

  // Rutas adicionales para el rol de Admin
  const adminRoutes: NavRoute[] =
    rol === "Admin"
      ? [
          {
            href: "/admin/productos",
            label: "Productos",
            icon: Package,
            active: location.pathname === "/admin/productos",
          },
          {
            href: "/admin/usuarios",
            label: "Usuarios",
            icon: UserPlus,
            active: location.pathname === "/admin/usuarios",
          },
        ]
      : []

  // Combinar rutas según el rol
  const routes = [...baseRoutes, ...adminRoutes]

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link to="/" className="flex items-center gap-2 text-lg font-semibold" onClick={() => setOpen(false)}>
              <Package className="h-6 w-6" />
              <span>{config.name}</span>
            </Link>
            {routes.map((route) => (
              <Link
                key={route.href}
                to={route.href}
                className={`flex items-center gap-2 ${route.active ? "text-primary" : "text-muted-foreground"}`}
                onClick={() => setOpen(false)}
              >
                <route.icon className="h-5 w-5" />
                {route.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <Link to="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
        <Package className="h-6 w-6" />
        <span>{config.name}</span>
      </Link>
      <nav className="hidden flex-1 items-center gap-6 md:flex">
        {routes.map((route) => (
          <Link
            key={route.href}
            to={route.href}
            className={`flex items-center gap-2 text-sm font-medium ${
              route.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {route.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt="Admin" />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configuración</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/login" className="flex w-full items-center gap-2 text-destructive">
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}