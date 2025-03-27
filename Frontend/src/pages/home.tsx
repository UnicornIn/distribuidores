import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-accent to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Rizos Felices</CardTitle>
          <CardDescription>Sistema de Gestión de Pedidos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Link to="/login" className="w-full">
              <Button className="w-full" size="lg">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Rizos Felices. Todos los derechos reservados.
        </CardFooter>
      </Card>
    </div>
  )
}

