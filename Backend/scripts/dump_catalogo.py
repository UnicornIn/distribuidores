"""
Volcado de SOLO LECTURA del catalogo de productos.

Sirve para mapear los IDs reales de producto (P001, P002...) contra la lista de
precios especiales de exportacion antes de escribirla en codigo.

El script NO escribe nada: la unica operacion contra Mongo es un find().

Uso:
    python Backend/scripts/dump_catalogo.py
    python Backend/scripts/dump_catalogo.py --uri "mongodb+srv://..."

La URI se toma, en orden: --uri, la variable de entorno MONGODB_URI,
o el archivo Backend/.env
"""

import argparse
import os
import sys
from pathlib import Path

try:
    from pymongo import MongoClient
except ImportError:
    sys.exit("Falta pymongo. Instalalo con: pip install pymongo")

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


# Precios especiales de la cotizacion de exportacion (USD por unidad).
# Se usan solo para SUGERIR un mapeo; hay que revisarlo a mano.
PRECIO_SPECIAL_250 = 8
PRECIO_MEN_250 = 8
PRECIO_PROFESIONAL_1L = 21
PRECIO_ACEITE_120 = 10


def resolver_uri(uri_arg):
    if uri_arg:
        return uri_arg

    if os.getenv("MONGODB_URI"):
        return os.getenv("MONGODB_URI")

    env_path = Path(__file__).resolve().parent.parent / ".env"
    if load_dotenv and env_path.exists():
        load_dotenv(env_path)
        if os.getenv("MONGODB_URI"):
            return os.getenv("MONGODB_URI")

    sys.exit(
        "No se encontro MONGODB_URI.\n"
        "Pasala con --uri, exportala como variable de entorno, "
        f"o crea {env_path}"
    )


def sugerir_precio(producto):
    """Heuristica para proponer el precio especial. SIEMPRE revisar a mano."""
    categoria = (producto.get("categoria") or "").strip().upper()
    nombre = (producto.get("nombre") or "").strip().lower()

    if "aceite" in nombre:
        return PRECIO_ACEITE_120, "aceite capilar"
    if "1 l" in nombre or "1l" in nombre or "litro" in nombre or categoria == "USO SALON":
        return PRECIO_PROFESIONAL_1L, "linea profesional 1L"
    if categoria == "MEN":
        return PRECIO_MEN_250, "linea men 250ml"
    if categoria == "SPECIAL":
        return PRECIO_SPECIAL_250, "linea special 250ml"
    return None, ""


def main():
    parser = argparse.ArgumentParser(description="Volcado read-only del catalogo")
    parser.add_argument("--uri", help="URI de conexion a MongoDB")
    parser.add_argument(
        "--db", default=os.getenv("MONGODB_NAME", "DatabaseInvetary"),
        help="Nombre de la base de datos",
    )
    args = parser.parse_args()

    client = MongoClient(resolver_uri(args.uri), serverSelectionTimeoutMS=15000)
    productos = list(
        client[args.db]["productos"].find(
            {},
            {"_id": 0, "id": 1, "nombre": 1, "categoria": 1, "precios": 1, "activo": 1},
        )
    )
    client.close()

    if not productos:
        sys.exit("La coleccion 'productos' vino vacia. Revisa --db.")

    productos.sort(key=lambda p: (p.get("categoria") or "", p.get("id") or ""))

    print(f"\n{len(productos)} productos en '{args.db}'\n")
    print(f"{'ID':<8} {'CATEGORIA':<12} {'NOMBRE':<42} {'INTERNAC.':>10}  {'ACT':<4} SUGERIDO")
    print("-" * 100)

    sugerencias = []
    for p in productos:
        pid = p.get("id") or "(sin id)"
        categoria = (p.get("categoria") or "")[:12]
        nombre = (p.get("nombre") or "")[:42]
        internacional = (p.get("precios") or {}).get("internacional", 0)
        activo = "si" if p.get("activo", True) else "NO"

        precio, motivo = sugerir_precio(p)
        marca = f"US$ {precio}  <- {motivo}" if precio else ""
        if precio and p.get("id"):
            sugerencias.append((p["id"], precio, nombre, motivo))

        print(f"{pid:<8} {categoria:<12} {nombre:<42} {internacional:>10}  {activo:<4} {marca}")

    print("\n" + "=" * 100)
    print("Borrador del diccionario (REVISAR cada linea antes de usarlo):\n")
    print("PRECIOS_ESPECIALES = {")
    for pid, precio, nombre, motivo in sorted(sugerencias, key=lambda s: -s[1]):
        print(f'    "{pid}": {precio},'.ljust(22) + f"# {nombre} ({motivo})")
    print("}")
    print(f"\n{len(sugerencias)} de 14 items esperados fueron mapeados automaticamente.")
    if len(sugerencias) != 14:
        print("Revisa la tabla de arriba: faltan items o sobran por la heuristica.")
    print()


if __name__ == "__main__":
    main()
