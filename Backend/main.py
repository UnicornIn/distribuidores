from fastapi import FastAPI, HTTPException, Depends, status, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, ValidationError
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from email.message import EmailMessage
from jose import jwt, JWTError
from dotenv import load_dotenv
from bson import ObjectId
import smtplib
import ssl
import jwt
import os
from schemas import (
    Distribuidor, DistribuidorCreate, Admin, TokenResponse,
    ProductCreate, ProductUpdate, UserCreate, UserResponse,
    UserUpdate
)
from database import (
    collection_admin, collection_distribuidores,
    collection_productos, collection_pedidos,
    collection_produccion, collection_facturas,
    verify_password, create_access_token, SECRET_KEY, ALGORITHM,
)

app = FastAPI()

load_dotenv()


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")
ACCESS_TOKEN_EXPIRE_MINUTES = 60



# Configuración de CORS
origins = [
    "http://localhost:3000",
    "https://distribuidores.rizosfelices.co"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        rol: str = payload.get("rol")
        
        print("📢 Usuario autenticado:", {"email": email, "rol": rol})  # <-- Agregar print
        
        if not email or not rol:
            raise credentials_exception
        return {"email": email, "rol": rol}
    except jwt.PyJWTError:
        raise credentials_exception

async def generar_id_unico_global():
    # Obtener el máximo ID de todas las colecciones
    max_ids = []
    
    for collection in [collection_distribuidores, collection_produccion, collection_facturas]:
        last_user = await collection.find_one(sort=[("id", -1)])
        if last_user and "id" in last_user:
            try:
                max_ids.append(int(last_user["id"][1:]))
            except (ValueError, IndexError):
                continue
    
    nuevo_num = max(max_ids) + 1 if max_ids else 1
    return f"U{nuevo_num:03d}"

EMAIL_SENDER = os.getenv("EMAIL_REMITENTE")
EMAIL_PASSWORD = os.getenv("EMAIL_CONTRASENA")  # Contraseña de aplicación generada en Gmail
print("EMAIL_SENDER:", EMAIL_SENDER)  # Debe imprimir info@rizosfelices.co
print("EMAIL_PASSWORD:", EMAIL_PASSWORD)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465  # Puerto seguro con SSL

def enviar_correo(destinatario, asunto, mensaje):
    msg = EmailMessage()
    msg["Subject"] = asunto
    msg["From"] = EMAIL_SENDER
    msg["To"] = destinatario
    msg.set_content(mensaje, subtype="html")  # Enviar contenido en HTML

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=context) as server:
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.send_message(msg)
    print(f"📧 Correo enviado a {destinatario}")

@app.get("/")
async def read_root():
    return {"message": "Bienvenido a la API de inventario"}

# ENDPOINT PARA INICIAR SESIÓN POR ROLES
@app.post("/token", response_model=TokenResponse)
async def login(
    username: str = Form(...),  # Correo electrónico
    password: str = Form(...)   # Contraseña
):
    user = None  # Inicializamos la variable user
    rol = None   # Inicializamos el rol del usuario

    # Buscar en todas las colecciones
    collections = [collection_admin, collection_distribuidores, collection_produccion, collection_facturas]
    for collection in collections:
        user = await collection.find_one({"correo_electronico": username})
        if user:
            rol = user.get("rol")
            break

    # Si no se encontró en ninguna colección
    if not user:
        raise HTTPException(status_code=400, detail="Usuario no encontrado.")

    # Verificar la contraseña
    if not pwd_context.verify(password, user.get("hashed_password")):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta.")

    # Actualizar la fecha de último acceso
    await collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"fecha_ultimo_acceso": datetime.now().strftime("%Y-%m-%d %H:%M")}}
    )

    # Crear el token de acceso
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["correo_electronico"], "rol": rol, "nombre": user.get("nombre"), "pais": user.get("pais")},
        expires_delta=access_token_expires
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        rol=rol,
        nombre=user.get("nombre"),
        pais=user.get("pais"),
        email=user.get("correo_electronico")
    )
    
# ENDPOINT PARA REGISTRAR UN ADMINISTRADOR
@app.post("/admin/registro", status_code=status.HTTP_201_CREATED)
async def registrar_admin(admin: Admin):  # Aquí usamos la clase AdminN
    # Verificar si el AdminN ya existe por correo electrónico
    existing_adminN = await collection_admin.find_one({"correo_electronico": admin.correo_electronico})
    if existing_adminN:
        raise HTTPException(status_code=400, detail="El AdminN ya está registrado.")

    # Validar que el rol sea uno de los permitidos ("Distribuidor" o "AdminN")
    if admin.rol not in ["Distribuidor", "Admin"]:
        raise HTTPException(status_code=400, detail="Rol no válido. Debe ser 'Distribuidor' o 'Admin'.")

    # Encriptar la contraseña antes de guardarla
    hashed_password = pwd_context.hash(admin.password)

    # Crear el nuevo AdminN
    nuevo_admin = {
        "nombre": admin.nombre,
        "pais": admin.pais,
        "whatsapp": admin.whatsapp,
        "correo_electronico": admin.correo_electronico,
        "hashed_password": hashed_password,
        "rol": admin.rol,  # Guardar el rol del AdminN
    }

    # Insertar el AdminN en la colección `adminNegocio`
    result = await collection_admin.insert_one(nuevo_admin)

    if result.inserted_id:
        print(f"📢 AdminN registrado exitosamente: {nuevo_admin}")  # <-- Agregar print
        return {
            "mensaje": "AdminN registrado exitosamente",
            "id": str(result.inserted_id),
            "rol": admin.rol,  # Incluir el rol en la respuesta
        }
    else:
        print("❌ Error al registrar el AdminN")  # <-- Agregar print
        raise HTTPException(status_code=500, detail="Error al registrar el AdminN.")

# ENDPOINT PARA CREAR DISRTRIBUIDORES
@app.post("/distribuidores/", response_model=Distribuidor)
async def crear_distribuidor(
    distribuidor: DistribuidorCreate,
    current_user: Dict = Depends(get_current_user)
):
    # Verificar que el usuario autenticado sea un Admin
    if current_user["rol"] != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los Admin pueden crear distribuidores"
        )

    # Obtener el Admin autenticado
    admin = await collection_admin.find_one({"correo_electronico": current_user["email"]})
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El Admin autenticado no existe en la base de datos"
        )

    # Verificar si el correo ya está registrado como distribuidor
    existing_distribuidor_correo = await collection_distribuidores.find_one(
        {"correo_electronico": distribuidor.correo_electronico}
    )
    if existing_distribuidor_correo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado como distribuidor"
        )

    # Verificar si el número de teléfono ya está registrado como distribuidor
    existing_distribuidor_telefono = await collection_distribuidores.find_one(
        {"phone": distribuidor.phone}
    )
    if existing_distribuidor_telefono:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El número de teléfono ya está registrado como distribuidor"
        )

    # Crear el nuevo distribuidor
    nuevo_distribuidor = {
        "nombre": distribuidor.nombre,
        "pais": distribuidor.pais,
        "correo_electronico": distribuidor.correo_electronico,
        "phone": distribuidor.phone,
        "hashed_password": pwd_context.hash(distribuidor.password),
        "rol": "Distribuidor",  # Rol fijo
        "admin_id": admin["_id"]  # Relación con el Admin que lo creó
    }

    # Insertar el distribuidor en la base de datos
    result = await collection_distribuidores.insert_one(nuevo_distribuidor)

    # Retornar la respuesta esperada por FastAPI
    if result.inserted_id:
        return Distribuidor(
            nombre=nuevo_distribuidor["nombre"],
            pais=nuevo_distribuidor["pais"],
            phone=nuevo_distribuidor["phone"],
            correo_electronico=nuevo_distribuidor["correo_electronico"],
            admin_id=str(nuevo_distribuidor["admin_id"])  # Convertir ObjectId a string
        )
    else:
        raise HTTPException(status_code=500, detail="Error al crear el distribuidor.")

# ENDPOINT PARA CREAR PRODUCTOS
@app.post("/productos/", status_code=status.HTTP_201_CREATED)
async def crear_producto(
    producto_data: dict,
    current_user: dict = Depends(get_current_user)
):
    print("📢 Iniciando creación de producto")

    # Verificación de administrador
    if current_user["rol"] != "Admin":
        print("❌ Acceso denegado: Solo los administradores pueden crear productos")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden crear productos"
        )

    # Validar los datos recibidos
    try:
        producto = ProductCreate(**producto_data)
        print(f"📢 Datos del producto validados: {producto}")
    except ValidationError as e:
        print(f"❌ Error de validación: {e.errors()}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.errors()
        )

    # Buscar al administrador
    admin = await collection_admin.find_one({"correo_electronico": current_user["email"]})
    if not admin:
        print("❌ Administrador no encontrado")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Administrador no encontrado"
        )

    admin_id = str(admin["_id"])
    print(f"📢 ID del administrador: {admin_id}")

    # Generar ID del producto
    ultimo_producto = await collection_productos.find_one(
        {"admin_id": admin_id},
        sort=[("id", -1)]
    )
    ultimo_id = int(ultimo_producto["id"][1:]) if ultimo_producto else 0
    nuevo_id = f"P{str(ultimo_id + 1).zfill(3)}"
    print(f"📢 Nuevo ID del producto: {nuevo_id}")

    # Estructura del producto para MongoDB
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
        "margenes": {
            "descuento": float(producto.margen_descuento),
            "tipo_codigo": int(producto.codigo_tipo) if producto.codigo_tipo else None
        },
        "stock": int(producto.stock),
        "activo": True,
        "creado_en": datetime.now(),
        "actualizado_en": datetime.now()
    }
    print(f"📢 Datos del nuevo producto: {nuevo_producto}")

    try:
        result = await collection_productos.insert_one(nuevo_producto)
        print(f"📢 Resultado de inserción: {result.inserted_id}")
        
        if not result.inserted_id:
            print("❌ Error al insertar el producto en la base de datos")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear el producto"
            )

        # Obtener el producto creado y convertirlo a un diccionario serializable
        producto_creado = await collection_productos.find_one({"_id": result.inserted_id})
        print(f"📢 Producto creado: {producto_creado}")
        
        # Convertir ObjectId a string y formatear fechas
        producto_creado["_id"] = str(producto_creado["_id"])
        producto_creado["creado_en"] = producto_creado["creado_en"].isoformat()
        producto_creado["actualizado_en"] = producto_creado["actualizado_en"].isoformat()
        producto_creado["precios"]["fecha_actualizacion"] = producto_creado["precios"]["fecha_actualizacion"].isoformat()

        # Preparar la respuesta final sin campos internos de MongoDB
        response_data = {
            "id": producto_creado["id"],
            "nombre": producto_creado["nombre"],
            "categoria": producto_creado["categoria"],
            "precios": {
                "sin_iva_colombia": producto_creado["precios"]["sin_iva_colombia"],
                "con_iva_colombia": producto_creado["precios"]["con_iva_colombia"],
                "internacional": producto_creado["precios"]["internacional"],
                "fecha_actualizacion": producto_creado["precios"]["fecha_actualizacion"]
            },
            "stock": producto_creado["stock"],
            "creado_en": producto_creado["creado_en"]
        }
        print(f"📢 Respuesta preparada: {response_data}")

        return response_data

    except Exception as e:
        print(f"❌ Error al crear producto: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear producto: {str(e)}"
        )

# Endpoint para obtener productos
@app.get("/productos/")
async def obtener_productos(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != "Admin":
        raise HTTPException(
            status_code=403,
            detail="Solo los administradores pueden ver los productos"
        )

    # Obtener el ID del administrador actual desde la base de datos
    admin = await collection_admin.find_one({"correo_electronico": current_user["email"]})
    if not admin:
        raise HTTPException(status_code=404, detail="Administrador no encontrado")

    admin_id = str(admin["_id"])  # Convertir ObjectId a string

    # Obtener los productos asociados al administrador actual
    productos = await collection_productos.find({"admin_id": admin_id}).to_list(100)

    # Convertir ObjectId a string para evitar errores en la respuesta JSON
    for producto in productos:
        producto["_id"] = str(producto["_id"])

    return productos

# Endpoint para actualizar un producto
@app.put("/productos/{producto_id}")
@app.patch("/productos/{producto_id}") 
async def editar_producto(producto_id: str, datos_actualizados: dict, current_user: Dict = Depends(get_current_user)):
    # Verificar si el usuario es administrador
    if current_user["rol"] != "Admin":
        raise HTTPException(status_code=403, detail="Solo los administradores pueden editar productos")

    # Buscar el producto en la base de datos
    producto_existente = await collection_productos.find_one({"id": producto_id})
    if not producto_existente:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Actualizar el producto con los nuevos datos
    await collection_productos.update_one({"id": producto_id}, {"$set": datos_actualizados})

    return {"message": "Producto actualizado exitosamente"}

# Endpoint para eliminar un producto
@app.delete("/productos/{producto_id}")
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

# Endpoint para obtener productos disponibles
@app.get("/productos/disponibles")
async def obtener_productos_disponibles(
    current_user: Dict = Depends(get_current_user)
):
    try:
        print("📢 Iniciando obtención de productos disponibles")  # Debug

        # 1. Obtener información del distribuidor (si aplica)
        tipo_precio = None
        if current_user["rol"] == "distribuidor":
            print(f"🔍 Buscando distribuidor: {current_user['email']}")  # Debug
            distribuidor = await collection_distribuidores.find_one(
                {"correo_electronico": current_user["email"]}
            )
            if not distribuidor:
                print("❌ Distribuidor no encontrado")  # Debug
                raise HTTPException(
                    status_code=404,
                    detail="Distribuidor no encontrado"
                )
            tipo_precio = distribuidor.get("tipo_precio")
            print(f"📢 Tipo de precio del distribuidor: {tipo_precio}")  # Debug
            if not tipo_precio:
                print("❌ Tipo de precio no configurado para el distribuidor")  # Debug
                raise HTTPException(
                    status_code=400,
                    detail="El distribuidor no tiene configurado un tipo de precio"
                )

        # 2. Obtener productos con stock > 0
        print("🔍 Buscando productos con stock disponible")  # Debug
        productos = await collection_productos.find({"stock": {"$gt": 0}}).to_list(100)
        print(f"📢 Productos encontrados: {len(productos)}")  # Debug

        # 3. Mapear el campo de precio según el tipo de precio del distribuidor
        mapeo_precios = {
            "sin_iva": "precios.sin_iva_colombia",
            "con_iva": "precios.con_iva_colombia",
            "sin_iva_internacional": "precios.internacional"
        }

        # 4. Procesar cada producto
        productos_response = []
        for producto in productos:
            print(f"🔍 Procesando producto: {producto['nombre']}")  # Debug
            producto_data = {
                "id": str(producto["id"]),
                "nombre": producto["nombre"],
                "categoria": producto["categoria"],
                "descripcion": producto.get("descripcion", ""),
                "imagen": producto.get("imagen", ""),
                "stock": producto["stock"]
            }

            # Para distribuidores: usar el precio específico configurado
            if current_user["rol"] == "distribuidor" and tipo_precio:
                campo_precio = mapeo_precios[tipo_precio]
                print(f"📢 Campo de precio seleccionado: {campo_precio}")  # Debug
                # Obtener el precio usando notación de puntos (ej: precios.sin_iva_colombia)
                partes = campo_precio.split('.')
                precio = producto
                for parte in partes:
                    precio = precio.get(parte, 0)
                print(f"📢 Precio calculado: {precio}")  # Debug
                
                producto_data["precio"] = precio
                producto_data["tipo_precio"] = tipo_precio
            else:
                # Para no distribuidores: usar precio base
                producto_data["precio"] = producto.get("precio", 0)
                producto_data["tipo_precio"] = "base"
                print(f"📢 Precio base asignado: {producto_data['precio']}")  # Debug

            productos_response.append(producto_data)

        print(f"📢 Productos procesados: {len(productos_response)}")  # Debug
        return productos_response

    except Exception as e:
        print(f"❌ Error al obtener productos: {str(e)}")  # Debug
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener productos: {str(e)}"
        )

# ENDPOINT PARA CREAR EL PEDIDO Y DEVUELVE DETALLES
@app.post("/pedidos/")
async def crear_pedido(pedido: dict, current_user: dict = Depends(get_current_user)):
    print("📢 Iniciando creación de pedido")

    # Verificar si el usuario tiene el rol de distribuidor
    if current_user["rol"] != "distribuidor":
        print("❌ Acceso denegado: Solo los distribuidores pueden crear pedidos")
        raise HTTPException(status_code=403, detail="Solo los distribuidores pueden crear pedidos")

    # Obtener distribuidor actual
    distribuidor = await collection_distribuidores.find_one({"correo_electronico": current_user["email"]})
    if not distribuidor:
        print("❌ Distribuidor no encontrado")
        raise HTTPException(status_code=404, detail="Distribuidor no encontrado")

    distribuidor_id = str(distribuidor["_id"])
    distribuidor_nombre = distribuidor.get("nombre", "Desconocido")
    distribuidor_phone = distribuidor.get("phone", "No registrado")
    distribuidor_tipo = distribuidor.get("tipo", "nacional")  # Asegurar que tiene un tipo

    if "productos" not in pedido or not isinstance(pedido["productos"], list):
        raise HTTPException(status_code=400, detail="El pedido debe contener una lista de productos")

    if "direccion" not in pedido:
        raise HTTPException(status_code=400, detail="El pedido debe incluir una dirección")

    productos_actualizados = []

    # 📌 **VERIFICAR STOCK Y SELECCIONAR PRECIO**
    for producto in pedido["productos"]:
        if "id" not in producto or "cantidad" not in producto:
            print(f"❌ Producto inválido: {producto}")
            raise HTTPException(status_code=400, detail="Cada producto debe tener un 'id' y 'cantidad'")

        producto_id = producto["id"]
        cantidad_solicitada = int(producto["cantidad"])

        print(f"🔍 Verificando producto {producto_id}")

        producto_db = await collection_productos.find_one({"id": producto_id})
        if not producto_db:
            print(f"❌ Producto {producto_id} no encontrado")
            raise HTTPException(status_code=404, detail=f"Producto {producto_id} no encontrado")

        if producto_db["stock"] < cantidad_solicitada:
            print(f"❌ Stock insuficiente para {producto_db['nombre']}")
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {producto_db['nombre']}")

        # Seleccionar el precio según el tipo de distribuidor
        if distribuidor_tipo == "nacional":
            precio_seleccionado = producto_db["precios"]["con_iva_colombia"]
        else:
            precio_seleccionado = producto_db["precios"]["internacional"]

        # Actualizar stock
        nuevo_stock = producto_db["stock"] - cantidad_solicitada
        await collection_productos.update_one({"id": producto_id}, {"$set": {"stock": nuevo_stock}})

        productos_actualizados.append({
            "nombre": producto_db["nombre"],
            "cantidad": cantidad_solicitada,
            "precio": precio_seleccionado
        })
        print(f"✅ Producto {producto_id} actualizado con nuevo stock: {nuevo_stock} y precio: {precio_seleccionado}")

    # 📌 **CREAR PEDIDO**
    pedido_id = f"PED-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    nuevo_pedido = {
        "id": pedido_id,
        "distribuidor_id": distribuidor_id,
        "distribuidor_nombre": distribuidor_nombre,
        "distribuidor_phone": distribuidor_phone,
        "productos": productos_actualizados,
        "direccion": pedido["direccion"],
        "notas": pedido.get("notas", ""),
        "fecha": datetime.now(),
        "estado": "Procesando"
    }
    result = await collection_pedidos.insert_one(nuevo_pedido)
    print(f"📦 Pedido creado con ID: {pedido_id}")

    # 📌 **ENVÍO DE CORREOS**
    productos_mensaje = "\n".join(
        [f"- {p['nombre']}: {p['cantidad']} x ${p['precio']:.2f}" for p in productos_actualizados]
    )
    total_pedido = sum(p["cantidad"] * p["precio"] for p in productos_actualizados)

    mensaje_admin = f"""
    <h1>Nuevo Pedido: {pedido_id}</h1>
    <p><strong>Distribuidor:</strong> {distribuidor_nombre}</p>
    <p><strong>Teléfono:</strong> {distribuidor_phone}</p>
    <p><strong>Dirección:</strong> {pedido['direccion']}</p>
    <p><strong>Notas:</strong> {pedido.get("notas", "Sin notas")}</p>
    <h2>Productos:</h2>
    <ul>{productos_mensaje}</ul>
    <p><strong>Total:</strong> ${total_pedido:.2f}</p>
    """

    mensaje_distribuidor = f"""
    <h1>Confirmación de Pedido: {pedido_id}</h1>
    <p>Tu pedido ha sido registrado correctamente. Aquí están los detalles:</p>
    <p><strong>Dirección:</strong> {pedido['direccion']}</p>
    <p><strong>Notas:</strong> {pedido.get("notas", "Sin notas")}</p>
    <h2>Productos:</h2>
    <ul>{productos_mensaje}</ul>
    <p><strong>Total:</strong> ${total_pedido:.2f}</p>
    <p>Gracias por confiar en nosotros.</p>
    """

    # Enviar correos
    enviar_correo("rochejuan123@gmail.com", f"Nuevo pedido: {pedido_id}", mensaje_admin)
    enviar_correo(current_user["email"], f"Confirmación de pedido: {pedido_id}", mensaje_distribuidor)
    print(f"📧 Correos enviados para el pedido {pedido_id}")

    # Convertir `_id` de MongoDB a string
    nuevo_pedido["_id"] = str(result.inserted_id)

    return {"message": "Pedido creado exitosamente", "pedido": nuevo_pedido}




# Endpoint para Eliminar un Producto
@app.delete("/productos/{producto_id}")
async def eliminar_producto(producto_id: str, current_user: Dict = Depends(get_current_user)):
    if current_user["rol"] != "Admin":
        raise HTTPException(status_code=403, detail="Solo los administradores pueden eliminar productos")

    producto_existente = await collection_productos.find_one({"id": producto_id})
    if not producto_existente:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Eliminar el producto
    await collection_productos.delete_one({"id": producto_id})

    return {"message": "Producto eliminado exitosamente"}

# ENDPOINT PARA OBTENER LOS PEDIDOS
@app.get("/pedidos/")
async def obtener_pedidos(current_user: dict = Depends(get_current_user)):
    try:
        email = current_user["email"]
        rol = current_user["rol"]

        print(f"📢 Usuario autenticado: {email}, Rol: {rol}")  # Debug

        if rol == "Admin":
            # Obtener el admin actual
            admin = await collection_admin.find_one({"correo_electronico": email})
            if not admin:
                raise HTTPException(status_code=404, detail="Admin no encontrado")

            admin_id = str(admin["_id"])  # Convertir ObjectId a str
            print(f"📦 ID del admin: {admin_id}")  # Debug

            # Obtener los distribuidores asociados al admin
            distribuidores = await collection_distribuidores.find({"admin_id": ObjectId(admin_id)}).to_list(None)
            distribuidores_ids = [str(distribuidor["_id"]) for distribuidor in distribuidores]
            print(f"📦 Distribuidores asociados al admin: {distribuidores_ids}")  # Debug

            # Obtener los pedidos de los distribuidores asociados
            pedidos = []
            for distribuidor_id in distribuidores_ids:
                pedidos_distribuidor = await collection_pedidos.find({"distribuidor_id": distribuidor_id}).to_list(None)
                pedidos.extend(pedidos_distribuidor)

        elif rol == "distribuidor":
            # Obtener el distribuidor actual
            distribuidor = await collection_distribuidores.find_one({"correo_electronico": email})
            if not distribuidor:
                raise HTTPException(status_code=404, detail="Distribuidor no encontrado")

            distribuidor_id = str(distribuidor["_id"])
            print(f"📦 ID del distribuidor: {distribuidor_id}")  # Debug

            # Obtener los pedidos del distribuidor
            pedidos = await collection_pedidos.find({"distribuidor_id": distribuidor_id}).to_list(None)

        elif rol == "produccion":
            # Obtener todos los pedidos (o los relevantes para producción)
            pedidos = await collection_pedidos.find().to_list(None)
            
        elif rol == "facturacion":
            # Obtener todos los pedidos (o los relevantes para facturación)
            pedidos = await collection_pedidos.find().to_list(None)

        else:
            raise HTTPException(status_code=403, detail="Rol no autorizado para ver pedidos")

        # Convertir ObjectId a str para la respuesta JSON
        for pedido in pedidos:
            pedido["_id"] = str(pedido["_id"])

        return {"pedidos": pedidos}

    except Exception as e:
        print(f"❌ Error al obtener pedidos: {e}")  # Debug
        raise HTTPException(status_code=500, detail="Error interno al obtener pedidos")

# Endpoint para obtener detalles de un pedido específico
@app.get("/pedidos/{pedido_id}")
async def obtener_detalles_pedido(pedido_id: str, current_user: dict = Depends(get_current_user)):
    try:
        email = current_user["email"]
        rol = current_user["rol"]

        print(f"📢 Usuario autenticado: {email}, Rol: {rol}")  # Debug

        # Buscar el pedido por su ID
        pedido = await collection_pedidos.find_one({"id": pedido_id})
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")

        # Convertir ObjectId a str para la respuesta JSON
        pedido["_id"] = str(pedido["_id"])

        # Verificar permisos según el rol
        if rol == "Admin":
            # Obtener el admin actual
            admin = await collection_admin.find_one({"correo_electronico": email})
            if not admin:
                raise HTTPException(status_code=404, detail="Admin no encontrado")

            admin_id = str(admin["_id"])  # Convertir ObjectId a str

            # Verificar si el pedido pertenece a un distribuidor asociado al admin
            distribuidor = await collection_distribuidores.find_one({"_id": ObjectId(pedido["distribuidor_id"])})
            if not distribuidor or str(distribuidor["admin_id"]) != admin_id:
                raise HTTPException(status_code=403, detail="No tienes permisos para ver este pedido")

        elif rol == "distribuidor":
            # Obtener el distribuidor actual
            distribuidor = await collection_distribuidores.find_one({"correo_electronico": email})
            if not distribuidor:
                raise HTTPException(status_code=404, detail="Distribuidor no encontrado")

            distribuidor_id = str(distribuidor["_id"])

            # Verificar si el pedido pertenece al distribuidor
            if pedido["distribuidor_id"] != distribuidor_id:
                raise HTTPException(status_code=403, detail="No tienes permisos para ver este pedido")

        elif rol in ["produccion", "facturacion"]:
            # Los roles de producción y facturación pueden ver cualquier pedido
            pass

        else:
            raise HTTPException(status_code=403, detail="Rol no autorizado para ver pedidos")

        return {"pedido": pedido}

    except Exception as e:
        print(f"❌ Error al obtener detalles del pedido: {e}")  # Debug
        raise HTTPException(status_code=500, detail="Error interno al obtener detalles del pedido")

# ENDPOINT PARA CAMBIAR ESTADO DE PEDIDO (facturado/en camino)
@app.put("/pedidos/{pedido_id}/estado")
async def cambiar_estado_pedido(
    pedido_id: str,
    nuevo_estado: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    try:
        email = current_user["email"]
        rol = current_user["rol"]

        # Verificar permisos
        if rol not in ["Admin", "produccion", "facturacion", "distribuidor"]:
            raise HTTPException(status_code=403, detail="No tienes permisos para cambiar estados")

        # Validar estado
        if nuevo_estado not in ["facturado", "en camino"]:
            raise HTTPException(status_code=400, detail="Estado no válido")

        # Buscar y actualizar usando el ID personalizado (no ObjectId)
        resultado = await collection_pedidos.update_one(
            {"id": pedido_id},  # Buscar por tu ID personalizado
            {"$set": {"estado": nuevo_estado}}
        )

        if resultado.modified_count == 0:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")

        # Obtener pedido actualizado
        pedido_actualizado = await collection_pedidos.find_one({"id": pedido_id})
        
        # Limpiar el _id de MongoDB si existe
        if pedido_actualizado and "_id" in pedido_actualizado:
            del pedido_actualizado["_id"]

        return {
            "mensaje": f"Estado actualizado a '{nuevo_estado}'",
            "pedido": pedido_actualizado
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# ENDPOINT PARA CREAR USUARIOS CON DIFERENTES ROLES
@app.post("/usuarios/", response_model=UserResponse)
async def crear_usuario(
    usuario: UserCreate,
    current_user: Dict = Depends(get_current_user)
):
    # Verificar permisos de admin
    if current_user["rol"] != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los Admin pueden crear usuarios"
        )

    # Verificar que el admin existe
    admin = await collection_admin.find_one({"correo_electronico": current_user["email"]})
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin no encontrado"
        )

    # Normalizar datos
    correo_normalizado = usuario.correo_electronico.lower()
    rol_normalizado = usuario.rol.lower()

    # Verificar correo único en todas las colecciones
    for collection in [collection_distribuidores, collection_produccion, collection_facturas]:
        if await collection.find_one({"correo_electronico": correo_normalizado}):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo ya está registrado"
            )

    # Validar rol
    if rol_normalizado not in ["distribuidor", "produccion", "facturacion"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rol no válido"
        )

    # Validación específica para distribuidores
    if rol_normalizado == "distribuidor":
        if not usuario.tipo_precio:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Los distribuidores deben tener un tipo de precio"
            )
        
        if usuario.tipo_precio not in ["sin_iva", "con_iva", "sin_iva_internacional"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tipo de precio no válido. Opciones: sin_iva, con_iva, sin_iva_internacional"
            )
    else:
        if usuario.tipo_precio:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El campo tipo_precio solo aplica para distribuidores"
            )

    # Generar ID único (versión mejorada)
    async def generar_id_unico():
        max_ids = []
        
        for collection in [collection_distribuidores, collection_produccion, collection_facturas]:
            last_user = await collection.find_one(sort=[("id", -1)])
            if last_user and "id" in last_user:
                try:
                    max_ids.append(int(last_user["id"][1:]))
                except (ValueError, IndexError):
                    continue
        
        nuevo_num = max(max_ids) + 1 if max_ids else 1
        return f"U{nuevo_num:03d}"

    try:
        nuevo_id = await generar_id_unico()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando ID único: {str(e)}"
        )

    # Crear documento de usuario
    nuevo_usuario = {
        "id": nuevo_id,
        "nombre": usuario.nombre,
        "pais": usuario.pais,
        "correo_electronico": correo_normalizado,
        "phone": usuario.phone,
        "hashed_password": pwd_context.hash(usuario.password),
        "rol": rol_normalizado,
        "estado": "Activo",
        "fecha_ultimo_acceso": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "admin_id": admin["_id"],
    }

    # Añadir tipo_precio solo para distribuidores
    if rol_normalizado == "distribuidor":
        nuevo_usuario["tipo_precio"] = usuario.tipo_precio

    # Determinar colección destino
    target_collection = {
        "distribuidor": collection_distribuidores,
        "produccion": collection_produccion,
        "facturacion": collection_facturas
    }[rol_normalizado]

    # Insertar usuario
    result = await target_collection.insert_one(nuevo_usuario)

    if not result.inserted_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear usuario"
        )

    return UserResponse(
        id=nuevo_id,
        nombre=usuario.nombre,
        correo_electronico=correo_normalizado,
        rol=rol_normalizado,
        estado="Activo",
        fecha_ultimo_acceso=nuevo_usuario["fecha_ultimo_acceso"],
        admin_id=str(admin["_id"]),
        phone=usuario.phone
    )

# ENDPOINT PARA OBTENER LOS USUARIOS
@app.get("/usuarios/", response_model=List[UserResponse])
async def obtener_usuarios(
    current_user: Dict = Depends(get_current_user)
):
    print("📢 Iniciando obtención de usuarios")  # Debug

    # Verificar permisos
    if current_user["rol"] != "Admin":
        print("❌ Acceso denegado: Solo los Admin pueden obtener usuarios")  # Debug
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los Admin pueden obtener usuarios"
        )

    # Obtener usuarios de todas las colecciones
    collections = {
        "distribuidor": collection_distribuidores,
        "produccion": collection_produccion,
        "facturacion": collection_facturas
    }

    usuarios = []
    seen_ids = set()  # Para evitar duplicados

    for rol, collection in collections.items():
        print(f"🔍 Buscando usuarios en la colección: {rol}")  # Debug
        async for user in collection.find():
            print(f"📢 Usuario encontrado: {user}")  # Debug
            if user["id"] not in seen_ids:
                seen_ids.add(user["id"])
                usuarios.append(user)

    print(f"📢 Total de usuarios encontrados: {len(usuarios)}")  # Debug

    # Formatear respuesta
    response = [
        UserResponse(
            id=u["id"],
            nombre=u["nombre"],
            correo_electronico=u["correo_electronico"],
            phone=u["phone"],
            rol=u["rol"],
            estado=u["estado"],
            fecha_ultimo_acceso=u["fecha_ultimo_acceso"],
            tipo_precio=u.get("tipo_precio"),
            admin_id=str(u["admin_id"])
        ) for u in usuarios
    ]

    print(f"📢 Respuesta preparada: {response}")  # Debug
    return response

# ENDPOINT PARA ACTUALIZAR USUARIOS 
@app.put("/usuarios/{usuario_id}", response_model=UserResponse)
async def editar_usuario(
    usuario_id: str,
    usuario_actualizado: UserUpdate,
    current_user: Dict = Depends(get_current_user)
):
    print(f"📢 Iniciando edición de usuario: {usuario_id}")

    # 1. Verificar permisos de admin
    if current_user["rol"] != "Admin":
        print("❌ Acceso denegado: Solo los Admin pueden editar usuarios")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los Admin pueden editar usuarios"
        )

    # 2. Mapeo de roles a colecciones
    ROLES_COLECCIONES = {
        "distribuidor": collection_distribuidores,
        "produccion": collection_produccion,
        "facturacion": collection_facturas
    }

    # 3. Buscar usuario en todas las colecciones
    usuario_original = None
    coleccion_actual = None
    rol_actual = None
    
    for rol, coleccion in ROLES_COLECCIONES.items():
        usuario_original = await coleccion.find_one({"id": usuario_id})
        if usuario_original:
            coleccion_actual = coleccion
            rol_actual = rol
            break

    if not usuario_original:
        print("❌ Usuario no encontrado")
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    print(f"📢 Usuario original encontrado: {usuario_original}")

    # 4. Preparar datos para actualización
    update_data = usuario_actualizado.dict(exclude_unset=True)
    nuevo_rol = update_data.get("rol", rol_actual)

    # 5. Validaciones para tipo_precio
    if "tipo_precio" in update_data:
        # 5.1 Validar que solo distribuidores pueden tener tipo_precio
        if rol_actual != "distribuidor" and nuevo_rol != "distribuidor":
            raise HTTPException(
                status_code=400,
                detail="El campo tipo_precio solo aplica para distribuidores"
            )
        
        # 5.2 Validar valores permitidos
        tipos_precio_validos = ["sin_iva", "con_iva", "sin_iva_internacional"]
        if update_data["tipo_precio"] not in tipos_precio_validos:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de precio no válido. Opciones: {tipos_precio_validos}"
            )

    # 6. Manejar tipo_precio para no distribuidores
    if nuevo_rol != "distribuidor" and "tipo_precio" in update_data:
        print("⚠️ Advertencia: tipo_precio solo aplica para distribuidores")
        update_data.pop("tipo_precio")

    print(f"📢 Datos para actualización: {update_data}")

    # 7. Verificar si hay cambio de rol
    if nuevo_rol != rol_actual:
        print(f"📢 Cambio de rol detectado: {rol_actual} -> {nuevo_rol}")

        # 7.1 Validar que el nuevo rol existe
        if nuevo_rol not in ROLES_COLECCIONES:
            print(f"❌ Rol '{nuevo_rol}' no válido")
            raise HTTPException(
                status_code=400,
                detail=f"Rol '{nuevo_rol}' no válido. Roles permitidos: {list(ROLES_COLECCIONES.keys())}"
            )

        # 7.2 Obtener colección destino
        coleccion_destino = ROLES_COLECCIONES[nuevo_rol]

        # 7.3 Crear nuevo documento con los datos actualizados
        nuevo_documento = {**usuario_original, **update_data}
        
        # 7.4 Limpiar campos específicos según nuevo rol
        if nuevo_rol != "distribuidor":
            nuevo_documento.pop("tipo_precio", None)
        
        print(f"📢 Nuevo documento para colección destino: {nuevo_documento}")

        # 7.5 Transacción atómica (eliminar de origen, insertar en destino)
        try:
            # Eliminar de colección actual
            await coleccion_actual.delete_one({"id": usuario_id})
            print(f"📢 Usuario eliminado de la colección actual: {rol_actual}")
            
            # Insertar en nueva colección
            await coleccion_destino.insert_one(nuevo_documento)
            print(f"📢 Usuario insertado en la nueva colección: {nuevo_rol}")
            
            # Obtener el documento actualizado
            usuario_actualizado_db = await coleccion_destino.find_one({"id": usuario_id})
        except Exception as e:
            print(f"❌ Error al cambiar de colección: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error al cambiar de colección: {str(e)}"
            )
    else:
        # 8. Actualización normal (sin cambio de rol)
        print("📢 Actualización sin cambio de rol")

        # Eliminar campos protegidos
        for campo in ["_id", "id", "admin_id"]:
            update_data.pop(campo, None)

        # Actualizar documento
        await coleccion_actual.update_one(
            {"id": usuario_id},
            {"$set": update_data}
        )
        usuario_actualizado_db = await coleccion_actual.find_one({"id": usuario_id})

    # 9. Convertir ObjectId a string para la respuesta
    if usuario_actualizado_db:
        if isinstance(usuario_actualizado_db.get("_id"), ObjectId):
            usuario_actualizado_db["_id"] = str(usuario_actualizado_db["_id"])
        if isinstance(usuario_actualizado_db.get("admin_id"), ObjectId):
            usuario_actualizado_db["admin_id"] = str(usuario_actualizado_db["admin_id"])

    print(f"📢 Usuario actualizado: {usuario_actualizado_db}")

    return UserResponse(**usuario_actualizado_db)

# Endpoint para desactivar un usuario
@app.put("/usuarios/{usuario_id}/cambiar-estado", response_model=UserResponse)
async def cambiar_estado_usuario(
    usuario_id: str,
    current_user: Dict = Depends(get_current_user)
):
    # Verificar permisos
    if current_user["rol"] != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los Admin pueden cambiar estados de usuarios"
        )

    # Buscar el usuario
    usuario_encontrado = None
    coleccion_encontrada = None
    colecciones = [collection_distribuidores, collection_produccion, collection_facturas]

    for coleccion in colecciones:
        usuario_encontrado = await coleccion.find_one({"id": usuario_id})
        if usuario_encontrado:
            coleccion_encontrada = coleccion
            break

    if not usuario_encontrado:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Cambiar estado
    nuevo_estado = "Inactivo" if usuario_encontrado.get("estado") == "Activo" else "Activo"
    await coleccion_encontrada.update_one(
        {"id": usuario_id},
        {"$set": {"estado": nuevo_estado}}
    )

    # Obtener datos actualizados
    usuario_actualizado = await coleccion_encontrada.find_one({"id": usuario_id})
    
    # Convertir ObjectIds
    if usuario_actualizado:
        usuario_actualizado = {
            **usuario_actualizado,
            "_id": str(usuario_actualizado["_id"]),
            "admin_id": str(usuario_actualizado.get("admin_id")) if usuario_actualizado.get("admin_id") else None
        }

    return UserResponse(**usuario_actualizado)

# ENDPOINT PARA ELIMINAR UN USUARIO 
@app.delete("/usuarios/{usuario_id}")
async def eliminar_usuario(
    usuario_id: str,
    current_user: Dict = Depends(get_current_user)
):
    # Verificar que el usuario autenticado sea un Admin
    if current_user["rol"] != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los Admin pueden eliminar usuarios"
        )

    # Buscar el usuario en todas las colecciones
    usuario_encontrado = None
    colecciones = [collection_distribuidores, collection_produccion, collection_facturas]
    for coleccion in colecciones:
        usuario_encontrado = await coleccion.find_one({"id": usuario_id})
        if usuario_encontrado:
            break

    if not usuario_encontrado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Eliminar el usuario de la colección correspondiente
    await coleccion.delete_one({"id": usuario_id})

    return {"message": "Usuario eliminado exitosamente"}

@app.get("/validate_token")  # ← Asegúrate de que el nombre coincide
async def validate_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"valid": True, "exp": payload.get("exp")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

## Endpoint de Estadísticas Generales
@app.get("/api/estadisticas/generales")
async def obtener_estadisticas_generales():
    """
    Accesible para cualquier usuario
    """
    try:
        # 1. Pedidos totales
        total_pedidos = await collection_pedidos.count_documents({})
        
        # 2. Cantidad de productos
        try:
            total_productos = await collection_productos.count_documents({
                "activo": True,
                "eliminado": {"$ne": True}  # Filtro adicional por si usas borrado lógico
            })
        except Exception as e:
            print(f"❌ Error al contar productos: {str(e)}")
            total_productos = 0  # Mantener 0 como valor seguro si hay error
        
        # 3. Cantidad de distribuidores
        total_distribuidores = await collection_distribuidores.count_documents({})
        
        # 4. Ventas mensuales
        fecha_inicio_mes = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        fecha_fin_mes = (fecha_inicio_mes + timedelta(days=32)).replace(day=1)
        
        pipeline_ventas = [
            {
                "$match": {
                    "fecha": {"$gte": fecha_inicio_mes, "$lt": fecha_fin_mes},
                    "estado": "facturado"
                }
            },
            {"$unwind": "$productos"},
            {
                "$group": {
                    "_id": None,
                    "total_ventas": {
                        "$sum": {"$multiply": ["$productos.cantidad", "$productos.precio"]}
                    },
                    "count_ventas": {"$sum": 1}  # Contar número de transacciones
                }
            }
        ]
        
        ventas_mensuales = await collection_pedidos.aggregate(pipeline_ventas).to_list(length=1)
        total_ventas = ventas_mensuales[0]["total_ventas"] if ventas_mensuales and "total_ventas" in ventas_mensuales[0] else 0
        
        return {
            "pedidos_totales": total_pedidos,
            "total_productos": total_productos,
            "total_distribuidores": total_distribuidores,
            "ventas_mensuales": total_ventas,
            "fecha_consulta": datetime.now().isoformat()  # Para debugging
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )

## Endpoint de Pedidos Recientes
@app.get("/api/pedidos/recientes")
async def obtener_pedidos_recientes():
    """
    Accesible para cualquier usuario
    """
    pedidos = await collection_pedidos.find({}) \
        .sort("fecha", -1) \
        .limit(5) \
        .to_list(length=None)
    
    # Formatear respuesta
    for pedido in pedidos:
        pedido["id"] = str(pedido["_id"])
        pedido["total"] = sum(p["cantidad"] * p["precio"] for p in pedido["productos"])
        del pedido["_id"]
    
    return pedidos

## Endpoint de Productos Populares
@app.get("/api/productos/populares")
async def obtener_productos_populares(current_user: dict = Depends(get_current_user)):
    """
    Accesible para: admin, produccion
    Devuelve los 5 productos más vendidos en el mes actual
    """
    # Debug inicial
    print(f"🔍 Iniciando consulta para {current_user['email']} (Rol: {current_user['rol']})")
    
    # Validación de roles
    if current_user["rol"].lower() == "facturacion":
        print("⛔ Acceso denegado a facturación")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver esta información"
        )
    
    # Configurar fechas para el mes actual
    hoy = datetime.now()
    fecha_inicio_mes = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    fecha_fin_mes = (fecha_inicio_mes + timedelta(days=32)).replace(day=1)
    print(f"📅 Rango del mes: {fecha_inicio_mes} a {fecha_fin_mes}")

    # Pipeline de agregación mejorado
    pipeline = [
        {
            "$match": {
                "fecha": {
                    "$gte": fecha_inicio_mes,
                    "$lt": fecha_fin_mes
                },
                "estado": "facturado",
                "productos": {"$exists": True, "$not": {"$size": 0}}  # Asegura que hay productos
            }
        },
        {"$unwind": "$productos"},
        {
            "$match": {
                "productos.id": {"$exists": True},  # Valida que tenga ID
                "productos.cantidad": {"$gt": 0}    # Solo productos con cantidad > 0
            }
        },
        {
            "$group": {
                "_id": "$productos.id",
                "nombre": {"$first": "$productos.nombre"},
                "categoria": {"$first": "$productos.categoria"},
                "precio": {"$avg": "$productos.precio"},  # Usamos avg por si hay variaciones
                "vendidos": {"$sum": "$productos.cantidad"},
                "num_pedidos": {"$sum": 1}  # Para saber en cuántos pedidos apareció
            }
        },
        {"$sort": {"vendidos": -1}},
        {"$limit": 5},
        {
            "$lookup": {
                "from": "productos",
                "localField": "_id",
                "foreignField": "id",
                "as": "producto_info"
            }
        },
        {"$unwind": "$producto_info"},
        {
            "$addFields": {
                "stock": "$producto_info.stock",
                "activo": "$producto_info.activo",
                "imagen": "$producto_info.imagen"  # Agregar más campos si es necesario
            }
        },
        {
            "$project": {
                "_id": 0,
                "id": "$_id",
                "nombre": 1,
                "categoria": 1,
                "precio": 1,
                "vendidos": 1,
                "stock": 1,
                "activo": 1,
                "imagen": 1,
                "num_pedidos": 1,
                "en_produccion": "$producto_info.en_produccion"
            }
        }
    ]
    
    print("🔎 Ejecutando pipeline de agregación...")
    try:
        productos = await collection_pedidos.aggregate(pipeline).to_list(length=None)
        print(f"✅ Productos encontrados: {len(productos)}")
        
        # Filtrado adicional para producción
        if current_user["rol"].lower() == "produccion":
            productos = [p for p in productos if p.get("en_produccion", False)]
            print(f"🛠️ Filtrados para producción: {len(productos)}")
        
        # Validar si hay resultados
        if not productos:
            print("⚠️ No se encontraron productos populares este mes")
            # Opcional: devolver productos aleatorios o más recientes como fallback
            return []
        
        return productos
        
    except Exception as e:
        print(f"❌ Error en agregación: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener productos populares: {str(e)}"
        )


# ENDPOINT PARA TRAER LOS DATOS DEL NEGOCIO AUTENTICADO
# @app.get("/negocios/perfil")
# async def obtener_perfil_negocio(current_user: dict = Depends(get_current_user)):
#     # Verificar que el usuario tenga el rol "Negocio"
#     if current_user["rol"] != "Negocio":
#         raise HTTPException(status_code=403, detail="Acceso denegado. Solo para negocios.")

#     # Buscar el negocio en la colección de negocios
#     negocio = await collection_bussiness.find_one({"correo_electronico": current_user["email"]})
#     if not negocio:
#         raise HTTPException(status_code=404, detail="Negocio no encontrado.")

#     # Devolver los datos del negocio (excluyendo la contraseña)
#     return {
#         "nombre": negocio.get("nombre"),
#         "pais": negocio.get("pais"),
#         "whatsapp": negocio.get("whatsapp"),
#         "correo_electronico": negocio.get("correo_electronico"),
#         "rol": negocio.get("rol"),
#     }


##############################################################################################################

# ENDPOINT PARA TRAER LOS DATOS DEL DISTRIBUIDOR AUTENTICADO
# @app.get("/distribuidor/me", response_model=Distribuidor)
# async def obtener_distribuidor_autenticado(current_user: dict = Depends(get_current_user)):
#     # Verificar si el usuario es un distribuidor
#     if current_user["rol"] != "Distribuidor":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Solo los distribuidores pueden acceder a este recurso",
#         )
#     # Buscar al distribuidor en la base de datos
#     distribuidor = await collection_distribuidor.find_one({"correo_electronico": current_user["email"]})
#     if not distribuidor:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Distribuidor no encontrado",
#         )
#     # Devolver los datos del distribuidor
#     return Distribuidor(
#         nombre=distribuidor["nombre"],
#         telefono=distribuidor["telefono"],
#         correo_electronico=distribuidor["correo_electronico"],
#         pais=distribuidor["pais"],
#         id=str(distribuidor["_id"]),  # Convertir ObjectId a string
#         negocio_id=distribuidor["negocio_id"],
#         rol=distribuidor["rol"],
#     )

# # ENDPOINT PARA ELIMINAR UN EMBAJADOR POR EL DISTRIBUIDOR
# @app.delete("/embajadores/{embajador_id}")
# async def eliminar_embajador(
#     embajador_id: str,
#     current_user: dict = Depends(get_current_user)  # Verifica autenticación
# ):
#     # Verificar que el usuario autenticado sea un distribuidor
#     if current_user["rol"] != "Distribuidor":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Solo los distribuidores pueden eliminar embajadores"
#         )

#     # Obtener el ID del distribuidor autenticado
#     distribuidor = await collection_distribuidor.find_one({"correo_electronico": current_user["email"]})
#     if not distribuidor:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="El distribuidor autenticado no existe en la base de datos"
#         )

#     # Convertir `distribuidor["_id"]` a `ObjectId` si no lo es
#     distribuidor_id_obj = distribuidor["_id"] if isinstance(distribuidor["_id"], ObjectId) else ObjectId(distribuidor["_id"])

#     # Validar y convertir embajador_id a ObjectId
#     if not ObjectId.is_valid(embajador_id):
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="El ID del embajador no es válido"
#         )
    
#     embajador_id_obj = ObjectId(embajador_id)

#     # Buscar el embajador en la base de datos
#     embajador = await collection.find_one(
#         {"_id": embajador_id_obj, "distribuidor_id": distribuidor_id_obj}  # <-- Comparar como ObjectId
#     )
#     if not embajador:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="El embajador no existe o no pertenece a este distribuidor"
#         )

#     # Eliminar el embajador
#     await collection.delete_one({"_id": embajador_id_obj})

#     return {"message": "Embajador eliminado correctamente"}


# # ENDPOINT PARA PARA MOSTRAR LOS EMBAJADORES POR DISTRIBUIDOR
# @app.get("/embajadores", response_model=list)
# async def obtener_embajadores(
#     current_user: dict = Depends(get_current_user)
# ):
#     # Verificar que el usuario autenticado sea un distribuidor
#     if current_user["rol"] != "Distribuidor":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Solo los distribuidores pueden ver sus embajadores"
#         )

#     # Buscar el distribuidor en la base de datos
#     distribuidor = await collection_distribuidor.find_one({"correo_electronico": current_user["email"]})
#     if not distribuidor:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="El distribuidor autenticado no existe en la base de datos"
#         )

#     distribuidor_id_obj = distribuidor["_id"]  # Usar directamente el ObjectId

#     # Buscar los embajadores asociados a este distribuidor
#     embajadores = await collection.find({"distribuidor_id": distribuidor_id_obj}).to_list(length=None)

#     if not embajadores:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="No se encontraron embajadores para este distribuidor"
#         )

#     # Convertir ObjectId a string para evitar errores en la respuesta JSON
#     for embajador in embajadores:
#         embajador["_id"] = str(embajador["_id"])
#         embajador["distribuidor_id"] = str(embajador["distribuidor_id"])

#     return embajadores
