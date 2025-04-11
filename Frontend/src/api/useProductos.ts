import { useState, useEffect } from "react";
import { Producto } from "../api/types";

export const useProductos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const response = await fetch("https://api.rizosfelices.co/productos/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener los productos");
      }

      const data = await response.json();
      
      // Transformar los datos recibidos para el nuevo formato de precios
      const formattedProductos = data.map((producto: any) => ({
        ...producto,
        precios: {
          sin_iva_colombia: Number(producto.precios?.sin_iva_colombia || 0),
          con_iva_colombia: Number(producto.precios?.con_iva_colombia || 0),
          internacional: Number(producto.precios?.internacional || 0),
          fecha_actualizacion: producto.precios?.fecha_actualizacion || new Date().toISOString()
        },
        stock: Number(producto.stock || 0),
        margenes: {
          descuento: Number(producto.margenes?.descuento || 0.45),
          tipo_codigo: producto.margenes?.tipo_codigo ? Number(producto.margenes.tipo_codigo) : null
        }
      }));

      setProductos(formattedProductos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener los productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const filteredProductos = productos.filter((producto) => {
    const nombre = producto.nombre?.toLowerCase() || "";
    const categoria = producto.categoria?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    return nombre.includes(search) || categoria.includes(search);
  });

  const handleDeleteProduct = async (productoId: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const response = await fetch(`https://api.rizosfelices.co/productos/${productoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al eliminar el producto");
      }

      const updatedProductos = productos.filter((producto) => producto.id !== productoId);
      setProductos(updatedProductos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el producto");
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar los productos
  const refreshProductos = async () => {
    await fetchProductos();
  };

  return {
    productos,
    filteredProductos,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    handleDeleteProduct,
    refreshProductos // Añadida la función refresh
  };
};