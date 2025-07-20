import { useState, useEffect } from "react";
import { Producto, Stock } from "../api/types";

export const useProductos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No se encontró el token de autenticación");

      const response = await fetch("https://api.rizosfelices.co/api/productos/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error al obtener los productos");

      const data = await response.json();

      // Obtener rol y cdi del usuario
      const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
      const userRol = userData.rol || "Admin";
      const userCdi = userData.cdi || null;

      const formattedProductos = data.map((producto: any) => {
        // Normalizar stock
        const stockObj: Stock = {
          medellin: Number(producto.stock?.medellin || 0),
          guarne: Number(producto.stock?.guarne || 0),
        };

        // Filtrar stock según rol bodega
        let stockVisible: Stock;
        if (userRol === "bodega" && userCdi) {
          stockVisible = {
            medellin: userCdi.toLowerCase() === "medellin" ? stockObj.medellin : 0,
            guarne: userCdi.toLowerCase() === "guarne" ? stockObj.guarne : 0,
          };
        } else {
          stockVisible = stockObj;
        }

        return {
          ...producto,
          precios: {
            sin_iva_colombia: Number(producto.precios?.sin_iva_colombia || 0),
            con_iva_colombia: Number(producto.precios?.con_iva_colombia || 0),
            internacional: Number(producto.precios?.internacional || 0),
            fecha_actualizacion: producto.precios?.fecha_actualizacion || new Date().toISOString(),
          },
          stock: stockVisible,
          margenes: {
            descuento: Number(producto.margenes?.descuento || 0.45),
            tipo_codigo: producto.margenes?.tipo_codigo ? Number(producto.margenes.tipo_codigo) : null,
          },
        };
      });

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
      if (!token) throw new Error("No se encontró el token de autenticación");

      const response = await fetch(`https://api.rizosfelices.co/productos/${productoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al eliminar el producto");
      }

      setProductos((prev) => prev.filter((producto) => producto.id !== productoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el producto");
    } finally {
      setLoading(false);
    }
  };

  return {
    productos,
    filteredProductos,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    handleDeleteProduct,
    refreshProductos: fetchProductos,
  };
};
