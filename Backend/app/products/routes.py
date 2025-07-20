from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError
from datetime import datetime
from typing import Dict
from app.auth.routes import get_current_user
from bson import ObjectId
from app.core.database import ( 
    collection_productos, collection_admin,
    collection_distribuidores,
    collection_bodegas
)
from app.products.models import ( 
    ProductCreate,
    ProductoUpdate
)

router = APIRouter()

# Endpoint para obtener productos disponibles
@router.get("/productos/disponibles")
async def obtener_productos_disponibles(
    current_user: Dict = Depends(get_current_user)
):
    try:
        print("📢 Iniciando obtención de productos disponibles")

        cdi = None
        tipo_precio = None

        # Detectar si es distribuidor
        if current_user["rol"].startswith("distribuidor"):
            print(f"🔍 Buscando distribuidor: {current_user['email']}")
            distribuidor = await collection_distribuidores.find_one(
                {"correo_electronico": current_user["email"]}
            )
            if not distribuidor:
                raise HTTPException(status_code=404, detail="Distribuidor no encontrado")

            tipo_precio = distribuidor.get("tipo_precio")
            cdi = distribuidor.get("cdi", "").lower()
            print(f"📢 Tipo de precio: {tipo_precio}, CDI: {cdi}")

            if not tipo_precio or not cdi:
                raise HTTPException(
                    status_code=400,
                    detail="El distribuidor no tiene configurado tipo_precio o CDI"
                )

        # Obtener productos
        productos = await collection_productos.find({}).to_list(200)

        productos_response = []
        for producto in productos:
            precios = producto.get("precios", {})
            stock_data = producto.get("stock", {})
            
            # Convertir stock a diccionario si es un número
            if isinstance(stock_data, (int, float)):
                stock_data = {"medellin": stock_data, "guarne": 0}

            producto_data = {
                "id": producto["id"],  # Usamos el campo id personalizado
                "nombre": producto["nombre"],
                "categoria": producto["categoria"],
                "descripcion": producto.get("descripcion", ""),
                "imagen": producto.get("imagen", ""),
                "activo": producto.get("activo", True),
                "tipo_codigo": producto.get("tipo_codigo", ""),
                "descuento": producto.get("descuento", 0)
            }

            # Filtrar precios y stock según rol
            if current_user["rol"].startswith("distribuidor"):
                # Stock por CDI
                producto_data["stock"] = stock_data.get(cdi, 0)

                # Asignar precio según tipo_precio
                if tipo_precio == "sin_iva":
                    producto_data["precio"] = precios.get("sin_iva_colombia", 0)
                    producto_data["tipo_precio"] = "sin_iva"
                elif tipo_precio == "con_iva":
                    producto_data["precio"] = precios.get("con_iva_colombia", 0)
                    producto_data["tipo_precio"] = "con_iva"
                elif tipo_precio == "sin_iva_internacional":
                    producto_data["precio"] = precios.get("internacional", 0)
                    producto_data["tipo_precio"] = "sin_iva_internacional"

            else:
                # Admin u otros roles: ver todos los precios y stocks
                producto_data.update({
                    "stock_medellin": stock_data.get("medellin", 0),
                    "stock_guarne": stock_data.get("guarne", 0),
                    "precio_sin_iva": precios.get("sin_iva_colombia", 0),
                    "precio_con_iva": precios.get("con_iva_colombia", 0),
                    "precio_internacional": precios.get("internacional", 0),
                    "margenes": producto.get("margenes", {})
                })

            productos_response.append(producto_data)

        return productos_response

    except Exception as e:
        print(f"❌ Error al obtener productos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener productos: {str(e)}")    

# Endpoint para obtener productos
@router.get("/productos/")
async def obtener_productos(current_user: dict = Depends(get_current_user)):
    # --- Validar permisos ---
    if current_user["rol"] not in ["Admin", "bodega"]:
        raise HTTPException(
            status_code=403,
            detail="Solo los administradores o usuarios de bodega pueden ver los productos"
        )

    # --- Construir filtro según rol ---
    filtro = {}
    if current_user["rol"] == "Admin":
        admin = await collection_admin.find_one({"correo_electronico": current_user["email"]})
        if not admin:
            raise HTTPException(status_code=404, detail="Administrador no encontrado")
        filtro["admin_id"] = str(admin["_id"])

    # --- Obtener productos ---
    productos = await collection_productos.find(filtro).to_list(100)

    for producto in productos:
        producto["_id"] = str(producto["_id"])

        # Asegurar estructura de stock
        if isinstance(producto.get("stock"), int):
            producto["stock"] = {"medellin": producto["stock"], "guarne": 0}
        elif "stock" not in producto:
            producto["stock"] = {"medellin": 0, "guarne": 0}

        # --- Reglas para usuarios bodega ---
        if current_user["rol"] == "bodega":
            bodega = await collection_bodegas.find_one({"correo_electronico": current_user["email"]})
            if not bodega or "cdi" not in bodega:
                raise HTTPException(status_code=404, detail="Bodega no encontrada o sin CDI asignado")

            cdi = bodega["cdi"].lower()
            if cdi not in ["medellin", "guarne"]:
                raise HTTPException(status_code=400, detail="CDI de bodega no válido")

            # Filtrar stock según CDI
            producto["stock"] = {cdi: producto["stock"].get(cdi, 0)}

            # Filtrar precios según CDI
            precios = producto.get("precios", {})
            if cdi == "medellin":
                precios.pop("internacional", None)
                # Eliminar precio_internacional suelto
                producto.pop("precio_internacional", None)
            elif cdi == "guarne":
                precios = {"internacional": precios.get("internacional", 0)}
                # Mantener precio_internacional como referencia
                producto["precio_internacional"] = precios["internacional"]

            producto["precios"] = precios

    return productos


# Endpoint para actualizar un producto
@router.patch("/productos/{producto_id}", response_model=dict)
async def actualizar_producto(
    producto_id: str,
    producto_data: ProductoUpdate,
    current_user: dict = Depends(get_current_user)
):
    # 1. Verificar permisos de administrador
    if current_user["rol"] != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden modificar productos"
        )

    # 2. Obtener el administrador autenticado
    admin = await collection_admin.find_one({"correo_electronico": current_user["email"]})
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Administrador no encontrado"
        )

    admin_id = str(admin["_id"])

    # 3. Construir filtro de búsqueda flexible (ObjectId o id personalizado)
    filtro = {"admin_id": admin_id}
    if ObjectId.is_valid(producto_id):
        filtro["_id"] = ObjectId(producto_id)
    else:
        filtro["id"] = producto_id

    # 4. Buscar el producto a actualizar
    producto = await collection_productos.find_one(filtro)
    if not producto:
        # Verificar si existe pero no pertenece a este admin
        if await collection_productos.find_one({"id": producto_id}):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Este producto no pertenece a tu cuenta de administrador"
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )

    # 5. Preparar los datos para actualizar
    update_data = {
        "actualizado_en": datetime.utcnow()
    }

    # Convertir el modelo Pydantic a dict y excluir campos no enviados
    producto_dict = producto_data.dict(exclude_unset=True)

    # 6. Manejar campos anidados (precios y margenes)
    if 'precios' in producto_dict and producto_dict['precios']:
        for key, value in producto_dict['precios'].items():
            if value is not None:
                update_data[f"precios.{key}"] = value

    if 'margenes' in producto_dict and producto_dict['margenes']:
        for key, value in producto_dict['margenes'].items():
            if value is not None:
                update_data[f"margenes.{key}"] = value

    # 7. Manejar campos directos
    campos_directos = ['nombre', 'categoria', 'stock']
    for campo in campos_directos:
        if campo in producto_dict and producto_dict[campo] is not None:
            update_data[campo] = producto_dict[campo]

    # 8. Realizar la actualización en MongoDB
    result = await collection_productos.update_one(
        filtro,
        {"$set": update_data}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_304_NOT_MODIFIED,
            detail="No se realizaron cambios en el producto"
        )

    return {
        "mensaje": "Producto actualizado correctamente",
        "producto_id": producto_id
    }
   
# Endpoint para eliminar un producto
@router.delete("/productos/{producto_id}")
async def eliminar_producto(producto_id: str, current_user: Dict = Depends(get_current_user)):
    # Verificar si el usuario es administrador
    if current_user["rol"] != "Admin":
        raise HTTPException(status_code=403, detail="Solo los administradores pueden eliminar productos")

    # Buscar el producto en la base de datos
    producto_existente = await collection_productos.find_one({"id": producto_id})
    if not producto_existente:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Eliminar el producto
    await collection_productos.delete_one({"id": producto_id})

    return {"message": "Producto eliminado exitosamente"}

# ENDPOINT PARA CREAR PRODUCTOS
@router.post("/productoss/", status_code=status.HTTP_201_CREATED)
async def crear_producto(
    producto_data: dict,
    current_user: dict = Depends(get_current_user)
):
    print("📢 Iniciando creación de producto")

    # 1. Verificar permisos (solo admin)
    if current_user["rol"] != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden crear productos"
        )

    # 2. Validar datos
    try:
        producto = ProductCreate(**producto_data)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.errors()
        )

    # 3. Obtener admin
    admin = await collection_admin.find_one({"correo_electronico": current_user["email"]})
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Administrador no encontrado"
        )

    admin_id = str(admin["_id"])

    # 4. Generar ID secuencial desde la colección de productos
    ultimo_producto = await collection_productos.find_one(
        {"admin_id": admin_id},
        sort=[("id", -1)]  # Ordena por ID descendente
    )

    # Calcula nuevo ID (P001, P002...)
    ultimo_num = int(ultimo_producto["id"][1:]) if ultimo_producto else 0
    nuevo_id = f"P{str(ultimo_num + 1).zfill(3)}"

    # 5. Crear producto (sin margen de descuento)
    nuevo_producto = {
        "id": nuevo_id,
        "admin_id": admin_id,
        "nombre": producto.nombre,
        "categoria": producto.categoria,
        "precios": {
            "sin_iva_colombia": float(producto.precio_sin_iva_colombia),
            "con_iva_colombia": float(producto.precio_con_iva_colombia),
            "internacional": float(producto.precio_internacional),
            "fecha_actualizacion": datetime.now()
        },
        "stock": int(producto.stock),
        "activo": True,
        "creado_en": datetime.now()
    }

    # 6. Insertar en MongoDB
    try:
        result = await collection_productos.insert_one(nuevo_producto)
        if not result.inserted_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear producto"
            )

        # 7. Respuesta simplificada
        return {
            "id": nuevo_id,
            "nombre": producto.nombre,
            "precio": producto.precio_con_iva_colombia,
            "stock": producto.stock
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear producto: {str(e)}"
        )


