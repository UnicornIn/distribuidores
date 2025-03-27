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
import { LogOut, Menu, Package, ShoppingCart } from "lucide-react"

type NavRoute = {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
}

export function DistribuidorNav() {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const routes: NavRoute[] = [
    {
      href: "/distribuidor/pedidos",
      label: "Mis Pedidos",
      icon: ShoppingCart,
      active: location.pathname === "/distribuidor/pedidos",
    },
    {
      href: "/distribuidor/pedidos/nuevo",
      label: "Nuevo Pedido",
      icon: Package,
      active: location.pathname === "/distribuidor/pedidos/nuevo",
    },
  ]

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
              <span>Rizos Felices</span>
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
        <span>Rizos Felices</span>
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
                <AvatarImage src="/placeholder.svg" alt="Distribuidor" />
                <AvatarFallback>D</AvatarFallback>
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