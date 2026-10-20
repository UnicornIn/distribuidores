"""
Listas de precios especiales de exportacion.

Parche acotado y temporal: algunos clientes de exportacion tienen precios
pactados distintos al catalogo, y distintos entre si. Se resuelven en el
servidor para que el precio no dependa de lo que mande el cliente y para que
ningun otro usuario pueda verlos.

Si el correo no tiene lista asignada, o el producto no esta en su lista, estas
funciones devuelven None y el sistema se comporta exactamente igual que antes.
Ese es el modo seguro por defecto.

Para agregar un cliente: definir su lista y registrarlo en LISTAS_POR_CLIENTE.
Los IDs de producto salen de:  python Backend/scripts/dump_catalogo.py
"""

MONEDA = "USD"


# ---------------------------------------------------------------------------
# Lista 1 - Exportacion Venezuela (Caracas)
#   Special 250 ml = 8 | Men 250 ml = 8 | Profesional 1 L = 21 | Aceite = 10
# ---------------------------------------------------------------------------
LISTA_EXPORT_VE = {
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


# ---------------------------------------------------------------------------
# Lista 2 - Rizos Felices Mexico
#   250 ml = 5 | 1 L = 17 (todos los de litro) | Aceite = 6
#
# El correo todavia no existe en la base: la lista queda lista de antemano
# para que el usuario arranque con sus precios desde el primer pedido.
# ---------------------------------------------------------------------------
LISTA_MEXICO = {
    # --- 250 ml (Special y Men) -> USD 5 ---
    "P002": 5,   # SHAMPOO 250 ML
    "P003": 5,   # ACONDICIONADOR 250 ML
    "P004": 5,   # CREMA 3 EN 1 250 ML
    "P005": 5,   # GEL 250 ML
    "P007": 5,   # SHAMPOO MEN 250 ML
    "P008": 5,   # ACONDICIONADOR MEN 250 ML
    "P009": 5,   # GEL MEN 250 ML
    "P010": 5,   # CREMA 3 EN 1 MEN 250 ML

    # --- 1 L (categoria USO SALON) -> USD 17, TODOS los productos de litro ---
    "P016": 17,  # USO SALON GEL MOLDEADOR
    "P017": 17,  # USO SALON ACONDICIONADOR
    "P018": 17,  # USO SALON CREMA 3 EN 1
    "P019": 17,  # USO SALON SHAMPOO
    "P021": 17,  # USO SALON GEL MOLDEADOR MEN
    "P022": 17,  # USO SALON ACONDICIONADOR MEN
    "P023": 17,  # USO SALON CREMA 3 EN 1 MEN
    "P024": 17,  # USO SALON SHAMPOO MEN

    # --- Aceite capilar 120 ml -> USD 6 ---
    "P025": 6,   # ACEITE 120 ML
}


# Correo autenticado -> lista que le aplica. La identidad viene del JWT
# (campo "sub"), que el backend firma en el login, no de nada que el cliente
# pueda elegir en el request.
LISTAS_POR_CLIENTE = {
    "vzcb.ccs8@gmail.com": LISTA_EXPORT_VE,               # Marines Monserrat (persona natural), Caracas VE
    "rizosvisage@gmail.com": LISTA_EXPORT_VE,             # Rizos Visage Store, C.A. (empresa), Caracas VE
    "natalia.arredondo@rizosfelices.mx": LISTA_MEXICO,    # Rizos Felices Mexico
}


# Productos del catalogo que ninguna lista cubre. Si alguno deberia entrar,
# agregarlo a la lista correspondiente con su precio pactado:
#   P034       Mascarilla Color Balance
#   P028       Producto de prueba
#   P030-P033  Camisetas y capas (accesorios)


def _normalizar(email):
    return (email or "").strip().lower()


def es_cliente_especial(email) -> bool:
    """True si el correo autenticado tiene una lista de precios asignada."""
    return _normalizar(email) in LISTAS_POR_CLIENTE


def precio_especial(email, producto_id):
    """
    Precio pactado para ese cliente y ese producto, o None si no aplica.

    None significa "usar el precio normal": es la salida segura cuando el
    cliente no tiene lista asignada o el producto no esta en su lista.
    """
    lista = LISTAS_POR_CLIENTE.get(_normalizar(email))
    if lista is None:
        return None
    return lista.get(producto_id)
