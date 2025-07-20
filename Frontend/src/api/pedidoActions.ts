// pedidoActions.ts
import { Pedido, EstadoPedido, Producto } from './typeStatus';

export const fetchPedidos = async (): Promise<Pedido[]> => {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('No hay token de autenticación');
        
        const response = await fetch('https://api.rizosfelices.co/orders/get-all-orders/', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return Array.isArray(data.pedidos) ? data.pedidos.map(parsePedido) : [];
    } catch (error) {
        console.error('Error en fetchPedidos:', error);
        throw new Error('No se pudieron obtener los pedidos');
    }
};

export const fetchPedidoById = async (id: string): Promise<Pedido> => {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('No hay token de autenticación');
        
        const response = await fetch(`https://api.rizosfelices.co/orders/pedidos/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return parsePedido(data.pedido);
    } catch (error) {
        console.error('Error en fetchPedidoById:', error);
        throw new Error('No se pudo obtener el pedido');
    }
};

export const updateEstadoPedido = async (id: string, nuevoEstado: EstadoPedido): Promise<Pedido> => {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('No hay token de autenticación');
        
        const response = await fetch(`https://api.rizosfelices.co/orders/pedidos/${id}/estado`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nuevo_estado: nuevoEstado })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error al actualizar el estado');
        }

        const data = await response.json();
        return parsePedido(data.pedido);
    } catch (error) {
        console.error('Error en updateEstadoPedido:', error);
        throw new Error('No se pudo actualizar el estado del pedido');
    }
};

// Funciones auxiliares
const parsePedido = (pedido: any): Pedido => {
    if (!pedido) throw new Error('Datos de pedido inválidos');
    
    return {
        id: pedido.id || pedido._id || '',
        distribuidor: pedido.distribuidor_nombre || pedido.distribuidor?.nombre || '',
        distribuidor_id: pedido.distribuidor_id || '',
        distribuidor_nombre: pedido.distribuidor_nombre || '',
        distribuidor_phone: pedido.distribuidor_phone || '',
        fecha: pedido.fecha || new Date().toISOString(),
        productos: Array.isArray(pedido.productos) ? pedido.productos.map(parseProducto) : [],
        total: pedido.total || calcularTotal(pedido.productos),
        subtotal: pedido.subtotal || 0,
        iva: pedido.iva || 0,
        estado: validarEstado(pedido.estado),
        direccion: pedido.direccion || '',
        notas: pedido.notas,
        tipo_precio: pedido.tipo_precio || 'con_iva'
    };
};

const parseProducto = (producto: any): Producto => {
    return {
        id: producto.id || '',
        nombre: producto.nombre || '',
        cantidad: Number(producto.cantidad) || 0,
        precio: Number(producto.precio) || 0,
        precio_sin_iva: Number(producto.precio_sin_iva) || 0,
        iva_unitario: Number(producto.iva_unitario) || 0,
        total: Number(producto.total) || 0,
        tipo_precio: producto.tipo_precio || 'con_iva'
    };
};

const calcularTotal = (productos: Producto[] = []): number => {
    return productos.reduce((total, producto) => {
        return total + (producto.total || 0);
    }, 0);
};

const validarEstado = (estado: any): EstadoPedido => {
    const estadosValidos: EstadoPedido[] = ['procesando', 'facturado', 'en camino'];
    return estadosValidos.includes(estado) ? estado : 'procesando';
};