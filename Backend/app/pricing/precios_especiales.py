"""
Lista de precios especiales de exportacion.

Parche acotado y temporal: dos clientes de exportacion tienen precios pactados
distintos al catalogo. Se resuelve en el servidor para que el precio no dependa
de lo que mande el cliente y para que ningun otro usuario pueda verlo.

Si un producto no esta en PRECIOS_ESPECIALES, o el usuario no esta en
CLIENTES_PRECIO_ESPECIAL, estas funciones devuelven None y el sistema se
comporta exactamente igual que antes. Ese es el modo seguro por defecto.
"""

# Correos autorizados. La identidad viene del JWT (campo "sub"), que el backend
# firma en el login, no de nada que el cliente pueda elegir en el request.
CLIENTES_PRECIO_ESPECIAL = {
    "vzcb.ccs8@gmail.com",    # Marines Monserrat (persona natural) - Caracas, VE
    "rizosvisage@gmail.com",  # Rizos Visage Store, C.A. (empresa)   - Caracas, VE
}

MONEDA = "USD"

# PENDIENTE: llenar con los IDs reales del catalogo.
# Generar el borrador con:  python Backend/scripts/dump_catalogo.py
#
# Mientras este diccionario este vacio el parche no hace nada: ningun producto
# hace match y todos los clientes siguen viendo y pagando el precio de siempre.
#
# Precios pactados (USD por unidad):
#   Linea Special 250 ml (Shampoo, Acondicionador, Crema 3 en 1, Gel, Detangler) = 8
#   Linea Men 250 ml     (Shampoo, Acondicionador, Crema 3 en 1, Gel)            = 8
#   Linea Profesional 1 L (Shampoo, Acondicionador, Crema 3 en 1, Gel)           = 21
#   Aceite capilar 120 ml                                                        = 10
PRECIOS_ESPECIALES = {
    # --- Linea Special 250 ml -> USD 8 ---
    "P002": 8,   # SHAMPOO 250 ML
    "P003": 8,   # ACONDICIONADOR 250 ML
    "P004": 8,   # CREMA 3 EN 1 250 ML
    "P005": 8,   # GEL 250 ML
    # El Detangler 250 ml aparece en la cotizacion pero quedo descontinuado:
    # no esta en el catalogo y no se cotiza. Son 4 items en esta linea, no 5.

    # --- Linea Men 250 ml -> USD 8 ---
    "P007": 8,   # SHAMPOO MEN 250 ML
    "P008": 8,   # ACONDICIONADOR MEN 250 ML
    "P009": 8,   # GEL MEN 250 ML
    "P010": 8,   # CREMA 3 EN 1 MEN 250 ML

    # --- Linea Profesional 1 L (categoria USO SALON) -> USD 21 ---
    "P016": 21,  # USO SALON GEL MOLDEADOR
    "P017": 21,  # USO SALON ACONDICIONADOR
    "P018": 21,  # USO SALON CREMA 3 EN 1
    "P019": 21,  # USO SALON SHAMPOO

    # --- Aceite capilar 120 ml -> USD 10 ---
    "P025": 10,  # ACEITE 120 ML
}

# Excluidos a proposito (estan en el catalogo pero NO en la cotizacion).
# Si alguno deberia entrar, agregarlo arriba con su precio pactado:
#   P021-P024  USO SALON ... MEN (variantes 1 L de la linea Men)
#   P034       Mascarilla Color Balance
#   P028       Producto de prueba
#   P030-P033  Camisetas y capas (accesorios)


def _normalizar(email):
    return (email or "").strip().lower()


def es_cliente_especial(email) -> bool:
    """True si el correo autenticado tiene lista de precios especial."""
    return _normalizar(email) in CLIENTES_PRECIO_ESPECIAL


def precio_especial(email, producto_id):
    """
    Precio pactado para ese cliente y ese producto, o None si no aplica.

    None significa "usar el precio normal": es la salida segura cuando el
    cliente no esta autorizado o el producto no esta mapeado todavia.
    """
    if not es_cliente_especial(email):
        return None
    return PRECIOS_ESPECIALES.get(producto_id)
