from fastapi import APIRouter, Depends, HTTPException
from app.auth.routes import get_current_user
from datetime import datetime
from bson import ObjectId
from app.orders.routes import enviar_correo
from app.core.database import (
    collection_productos,
    collection_pedidos,
    collection_bodegas,
    collection_distribuidores,
    collection_ordenes
)


router = APIRouter()


STOCK_BAJO_MIN = 1
STOCK_BAJO_MAX = 40

@router.get("/dashboard")
async def get_dashboard_bodega(current_user: dict = Depends(get_current_user)):
    print("current_user:", current_user)
    email = current_user["email"]
    rol = current_user["rol"]
    print("email:", email)
    print("rol:", rol)

    # Para admin se muestra todo
    if rol == "Admin":
        total_productos = await collection_productos.count_documents({})
        print("total_productos (Admin):", total_productos)

        # ✅ CORREGIDO: Buscar en collection_ordenes
        # Pedidos Medellín (con IVA o sin IVA)
        ordenes_pendientes_medellin = await collection_ordenes.count_documents(
            {"estado": "Orden de compra creada", "tipo_precio": {"$in": ["con_iva", "sin_iva"]}}
        )

        # Pedidos Guarne (sin IVA internacional)
        ordenes_pendientes_guarne = await collection_ordenes.count_documents(
            {"estado": "Orden de compra creada", "tipo_precio": "sin_iva_internacional"}
        )

        # Productos con bajo stock
        stock_bajo_cursor = collection_productos.find(
            {"$or": [
                {"$expr": {"$and": [
                    {"$gte": [{"$toInt": "$stock.medellin"}, 1]},
                    {"$lte": [{"$toInt": "$stock.medellin"}, 40]}
                ]}},
                {"$expr": {"$and": [
                    {"$gte": [{"$toInt": "$stock.guarne"}, 1]},
                    {"$lte": [{"$toInt": "$stock.guarne"}, 40]}
                ]}}
            ]},
            {"_id": 0, "id": 1, "nombre": 1, "stock": 1}
        )

        # Productos sin stock
        sin_stock_cursor = collection_productos.find(
            {"$or": [
                {"$expr": {"$eq": [{"$toInt": "$stock.medellin"}, 0]}},
                {"$expr": {"$eq": [{"$toInt": "$stock.guarne"}, 0]}}
            ]},
            {"_id": 0, "id": 1, "nombre": 1, "stock": 1}
        )

        stock_bajo = await stock_bajo_cursor.to_list(length=None)
        sin_stock = await sin_stock_cursor.to_list(length=None)

        return {
            "total_productos": total_productos,
            "stock_bajo": stock_bajo,
            "sin_stock": sin_stock,
            "ordenes_pendientes": {
                "medellin": ordenes_pendientes_medellin,
                "guarne": ordenes_pendientes_guarne
            }
        }

    # Para bodegas específicas
    bodega = await collection_bodegas.find_one({"correo_electronico": email})
    if not bodega:
        raise HTTPException(status_code=404, detail="Bodega no encontrada")

    cdi = bodega.get("cdi")  # "medellin" o "guarne"
    print("cdi:", cdi)

    total_productos = await collection_productos.count_documents({})
    print("total_productos (bodega):", total_productos)

    # ✅ CORREGIDO: Buscar en collection_ordenes
    # Ordenes pendientes según bodega
    if cdi == "medellin":
        ordenes_pendientes = await collection_ordenes.count_documents(
            {"estado": "Orden de compra creada", "tipo_precio": {"$in": ["con_iva", "sin_iva"]}}
        )
    else:  # guarne
        ordenes_pendientes = await collection_ordenes.count_documents(
            {"estado": "Orden de compra creada", "tipo_precio": "sin_iva_internacional"}
        )

    # Productos con bajo stock
    stock_bajo_cursor = collection_productos.find(
        {"$expr": {"$and": [
            {"$gte": [{"$toInt": f"$stock.{cdi}"}, 1]},
            {"$lte": [{"$toInt": f"$stock.{cdi}"}, 40]}
        ]}},
        {"_id": 0, "id": 1, "nombre": 1, f"stock.{cdi}": 1}
    )

    # Productos sin stock
    sin_stock_cursor = collection_productos.find(
        {"$expr": {"$eq": [{"$toInt": f"$stock.{cdi}"}, 0]}},
        {"_id": 0, "id": 1, "nombre": 1, f"stock.{cdi}": 1}
    )

    stock_bajo = await stock_bajo_cursor.to_list(length=None)
    sin_stock = await sin_stock_cursor.to_list(length=None)

    return {
        "total_productos": total_productos,
        "stock_bajo": stock_bajo,
        "sin_stock": sin_stock,
        "ordenes_pendientes": ordenes_pendientes
    }

@router.post("/pedidos/procesar/{orden_id}")
async def procesar_pedido(orden_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    print(f"Procesando pedido para orden_id: {orden_id}")
    print(f"Usuario actual: {current_user}")
    print(f"Data recibida: {data}")

    # 🔍 Buscar la orden en la colección de órdenes (purchase_orders)
    orden = await collection_ordenes.find_one({"id": orden_id})
    
    if not orden:
        print("❌ Orden no encontrada en collection_ordenes")
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    print(f"✅ Orden encontrada: {orden['id']}")

    # ✅ Si llegamos aquí, la orden fue encontrada
    productos_actualizados = []
    subtotal, iva_total, total_orden = 0, 0, 0
    tipo_precio = orden.get("tipo_precio", "sin_iva_internacional")
    print(f"💰 Tipo de precio: {tipo_precio}")

    # Obtener información completa de productos desde la orden original
    productos_orden_original = orden.get("productos", [])
    
    # 🔄 ACTUALIZAR STOCK - Obtener bodega del usuario
    bodega_usuario = await collection_bodegas.find_one({"correo_electronico": current_user["email"]})
    if not bodega_usuario:
        raise HTTPException(status_code=404, detail="Bodega no encontrada para el usuario")
    
    cdi_bodega = bodega_usuario.get("cdi")  # "medellin" o "guarne"
    print(f"🏭 Bodega procesando: {cdi_bodega}")
    
    for p_data in data.get("productos", []):
        producto_id = p_data["id"]
        
        # Buscar el producto completo en la orden original
        producto_completo = None
        for prod in productos_orden_original:
            if prod.get("id") == producto_id:
                producto_completo = prod
                break
        
        if not producto_completo:
            print(f"⚠️ Producto {producto_id} no encontrado en orden original")
            continue
            
        print(f"🛍️ Procesando producto: {producto_completo}")
        
        cantidad_final = int(p_data.get("cantidad_final", producto_completo.get("cantidad", 0)))
        precio = float(p_data.get("precio", producto_completo.get("precio", 0)))
        iva_unitario = float(p_data.get("iva_unitario", producto_completo.get("iva_unitario", 0)))
        nombre = producto_completo.get("nombre", "Producto sin nombre")

        # 🔄 ACTUALIZAR STOCK del producto
        producto_db = await collection_productos.find_one({"id": producto_id})
        if producto_db:
            # Obtener stock actual (maneja tanto string como números)
            stock_actual = producto_db.get("stock", {}).get(cdi_bodega, "0")
            
            # Convertir a número entero
            try:
                if isinstance(stock_actual, str):
                    stock_actual = int(stock_actual) if stock_actual.isdigit() else 0
                else:
                    stock_actual = int(stock_actual)
            except (ValueError, TypeError):
                stock_actual = 0
            
            print(f"📦 Stock actual de {producto_id} en {cdi_bodega}: {stock_actual}")
            
            if cantidad_final > stock_actual:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente para producto {producto_id} en bodega {cdi_bodega}. Stock actual: {stock_actual}, Solicitado: {cantidad_final}")
            
            # Restar del stock y mantener como string (para consistencia con tu BD)
            nuevo_stock = stock_actual - cantidad_final
            await collection_productos.update_one(
                {"id": producto_id},
                {"$set": {f"stock.{cdi_bodega}": str(nuevo_stock)}}
            )
            print(f"📦 Stock actualizado: {producto_id} en {cdi_bodega} de {stock_actual} to {nuevo_stock}")
        else:
            print(f"⚠️ Producto {producto_id} no encontrado en BD para actualizar stock")
            raise HTTPException(status_code=404, detail=f"Producto {producto_id} no encontrado en inventario")

        total_producto = precio * cantidad_final
        subtotal += precio * cantidad_final
        iva_total += iva_unitario * cantidad_final
        total_orden += total_producto + (iva_unitario * cantidad_final if tipo_precio == "con_iva" else 0)

        productos_actualizados.append({
            "id": producto_id,
            "nombre": nombre,
            "cantidad": cantidad_final,
            "precio": precio,
            "precio_sin_iva": precio if tipo_precio != "con_iva" else precio - iva_unitario,
            "iva_unitario": iva_unitario,
            "total": total_producto
        })
    
    print(f"📦 Productos actualizados: {productos_actualizados}")
    print(f"🧮 Subtotal: {subtotal}, IVA total: {iva_total}, Total orden: {total_orden}")

    pedido_final = {
        **orden,
        "productos": productos_actualizados,
        "subtotal": subtotal,
        "iva": iva_total,
        "total": total_orden,
        "estado": "Pedido creado",
        "fecha_procesado": datetime.utcnow(),
        "notas": data.get("notas", ""),
        "procesado_por": current_user["email"],
        "bodega_procesadora": cdi_bodega
    }
    
    # Remover _id para evitar conflicto al insertar
    if "_id" in pedido_final:
        del pedido_final["_id"]
    
    print(f"✅ Pedido final a insertar: {pedido_final}")

    # ✅ Insertar en colección de PEDIDOS
    result_insert = await collection_pedidos.insert_one(pedido_final)
    print(f"📝 Pedido insertado en collection_pedidos con ID: {result_insert.inserted_id}")

    # ✅ ACTUALIZAR estado de la orden original también a "Pedido creado"
    await collection_ordenes.update_one(
        {"id": orden_id},
        {"$set": {
            "estado": "Pedido creado",
            "fecha_procesado": datetime.utcnow(),
            "procesado_por": current_user["email"],
            "bodega_procesadora": cdi_bodega
        }}
    )
    print(f"✅ Estado de orden {orden_id} actualizado a 'Pedido creado'")

    orden_compra_id = pedido_final["id"]
    distribuidor_nombre = orden.get("distribuidor_nombre", "")
    distribuidor_phone = orden.get("distribuidor_phone", orden.get("distribuidor_telefono", ""))
    fecha_orden = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    print(f"📧 Datos para correo: orden_compra_id={orden_compra_id}, distribuidor_nombre={distribuidor_nombre}")

    estilo_correo = """
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f1e9; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .logo { max-width: 150px; }
        .content { padding: 20px; background-color: #fff; border: 1px solid #e0e0e0; border-top: none; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
        .product-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .product-table th { background-color: #f8f1e9; text-align: left; padding: 10px; }
        .product-table td { padding: 10px; border-bottom: 1px solid #e0e0e0; }
        .totals { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .total-final { font-weight: bold; font-size: 1.1em; border-top: 1px solid #ddd; padding-top: 10px; }
        .status { display: inline-block; padding: 5px 10px; background-color: #e3f2fd; color: #1976d2; border-radius: 3px; }
    </style>
    """

    productos_html = """
    <table class="product-table">
        <thead>
            <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
    """
    for p in productos_actualizados:
        productos_html += f"""
        <tr>
            <td>{p['nombre']} (ID: {p['id']})</td>
            <td>{p['cantidad']}</td>
            <td>${p['precio']:,.0f}</td>
            <td>${p['total']:,.0f}</td>
        </tr>
        """
        if tipo_precio == "con_iva":
            productos_html += f"""
            <tr style="color: #666; font-size: 0.9em;">
                <td colspan="4">
                    (IVA incluido: ${p['iva_unitario']:,.0f} x {p['cantidad']} = ${p['iva_unitario'] * p['cantidad']:,.0f})
                </td>
            </tr>
            """
    productos_html += """
        </tbody>
    </table>
    """

    totales_html = f"""
    <div class="totals">
        <div class="totals-row">
            <span>Subtotal:</span>
            <span>${subtotal:,.0f}</span>
        </div>
        {f'<div class="totals-row"><span>IVA (19%):</span><span>${iva_total:,.0f}</span></div>' if tipo_precio == "con_iva" else ""}
        <div class="totals-row total-final">
            <span>Total del Pedido:</span>
            <span>${total_orden:,.0f}</span>
        </div>
    </div>
    """

    mensaje_admin = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Nuevo Pedido {orden_compra_id}</title>
        {estilo_correo}
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://rizosfelicesdata.s3.us-east-2.amazonaws.com/logo+principal+rosado+letra+blanco_Mesa+de+tra+(1).png" alt="Rizos Felices" class="logo">
                <h1>Nuevo Pedido Recibido</h1>
            </div>
            <div class="content">
                <h2>Detalles del Pedido</h2>
                <p><strong>Número de Pedido:</strong> {orden_compra_id}</p>
                <p><strong>Fecha y Hora:</strong> {fecha_orden}</p>
                <p><strong>Estado:</strong> <span class="status">Pedido creado</span></p>
                <h3>Información del Distribuidor</h3>
                <p><strong>Nombre:</strong> {distribuidor_nombre}</p>
                <p><strong>Teléfono:</strong> {distribuidor_phone}</p>
                <h3>Detalles de Entrega</h3>
                <p><strong>Dirección:</strong> {orden.get('direccion', 'No especificada')}</p>
                <p><strong>Notas:</strong> {orden.get('notas', 'Ninguna')}</p>
                <h3>Productos Confirmados</h3>
                {productos_html}
                {totales_html}
            </div>
            <div class="footer">
                <p>© {datetime.now().year} Rizos Felices. Todos los derechos reservados.</p>
                <p>Este es un correo automático, por favor no responder.</p>
            </div>
        </div>
    </body>
    </html>
    """

    mensaje_distribuidor = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Confirmación de Pedido {orden_compra_id}</title>
        {estilo_correo}
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://rizosfelicesdata.s3.us-east-2.amazonaws.com/logo+principal+rosado+letra+blanco_Mesa+de+tra+(1).png" alt="Rizos Felices" class="logo">
                <h1>¡Gracias por tu pedido!</h1>
            </div>
            <div class="content">
                <p>Tu pedido ha sido confirmado y será preparado para envío. Aquí tienes el resumen:</p>
                <h2>Resumen del Pedido</h2>
                <p><strong>Número de Pedido:</strong> {orden_compra_id}</p>
                <p><strong>Fecha and Hora:</strong> {fecha_orden}</p>
                <p><strong>Estado:</strong> <span class="status">Pedido creado</span></p>
                <h3>Detalles de Entrega</h3>
                <p><strong>Dirección:</strong> {orden.get('direccion', 'No especificada')}</p>
                <p><strong>Notas:</strong> {orden.get('notas', 'Ninguna')}</p>
                <h3>Productos</h3>
                {productos_html}
                {totales_html}
                <p style="margin-top: 20px;">
                    <strong>Nota:</strong> Te notificaremos cuando tu pedido esté en camino.
                    Para cualquier consulta, puedes responder a este correo o contactarnos al teléfono de soporte.
                </p>
            </div>
            <div class="footer">
                <p>© {datetime.now().year} Rizos Felices. Todos los derechos reservados.</p>
                <p>Este es un correo automático, por favor no responder.</p>
            </div>
        </div>
    </body>
    </html>
    """

    # ✅ CORREGIDO: Enviar los TRES correos como en el otro endpoint
    print("📤 Enviando correo a admin...")
    enviar_correo(
        "tesoreria@rizosfelices.co",
        f"📦 Nuevo Pedido: {orden_compra_id} - {distribuidor_nombre}",
        mensaje_admin
    )

    # ✅ CORREGIDO: Obtener CDI del distribuidor (no de la orden)
    distribuidor_info = await collection_distribuidores.find_one({"_id": ObjectId(orden["distribuidor_id"])})
    cdi_distribuidor = distribuidor_info.get("cdi", "").lower() if distribuidor_info else ""
    
    print(f"🏢 CDI distribuidor: {cdi_distribuidor}")
    correos_cdi = {
        "medellin": "cdimedellin@rizosfelices.co",
        "guarne": "produccion@rizosfelices.co"
    }
    correo_cdi = correos_cdi.get(cdi_distribuidor)
    print(f"📧 Correo CDI: {correo_cdi}")
    
    if correo_cdi:
        print("📤 Enviando correo a CDI...")
        enviar_correo(
            correo_cdi,
            f"📦 Pedido (CDI {cdi_distribuidor.capitalize()}): {orden_compra_id} - {distribuidor_nombre}",
            mensaje_admin
        )

    # ✅ CORREGIDO: Enviar correo al DISTRIBUIDOR (no al usuario actual)
    print("📤 Enviando correo a distribuidor...")
    enviar_correo(
        distribuidor_info.get("correo_electronico", "") if distribuidor_info else orden.get("distribuidor_email", ""),
        f"✅ Confirmación de Pedido: {orden_compra_id}",
        mensaje_distribuidor
    )

    print("✅ Pedido procesado correctamente y todos los correos enviados.")
    return {
        "message": "Pedido procesado y correos enviados",
        "pedido": {**pedido_final, "_id": str(result_insert.inserted_id)}
    }

@router.get("/get-all-orders/")
async def obtener_ordenes(current_user: dict = Depends(get_current_user)):
    try:
        email = current_user["email"]
        rol = current_user["rol"]
        filtro_pedidos = {}

        # Lógica para distribuidores (solo ven sus propios pedidos)
        if rol.startswith("distribuidor"):
            distribuidor = await collection_distribuidores.find_one({"correo_electronico": email})
            if not distribuidor:
                raise HTTPException(status_code=404, detail="Distribuidor no encontrado")
            
            distribuidor_id = str(distribuidor["_id"])
            filtro_pedidos = {"distribuidor_id": distribuidor_id}
        
        # Para admin, facturacion y produccion no aplicamos filtros (ven todos)
        elif rol in ["Admin", "facturacion", "produccion"]:
            pass  # No se aplica filtro
        
        # Lógica específica para bodegas
        elif rol == "bodega":
            bodega = await collection_bodegas.find_one({"correo_electronico": email})
            if not bodega:
                raise HTTPException(status_code=404, detail="Bodega no encontrada")
            
            cdi = bodega.get("cdi")
            if not cdi:
                raise HTTPException(status_code=400, detail="La bodega no tiene un CDI asignado")
            
            if cdi == "guarne":
                filtro_pedidos = {"tipo_precio": "sin_iva_internacional"}
            elif cdi == "medellin":
                filtro_pedidos = {"tipo_precio": {"$in": ["con_iva", "sin_iva"]}}
            else:
                raise HTTPException(status_code=400, detail="CDI de bodega no válido")

        # Obtener pedidos según filtro
        pedidos = await collection_ordenes.find(filtro_pedidos).to_list(None)
        
        # Filtrar solo los pedidos cuyo ID empiece con "OC-"
        pedidos = [pedido for pedido in pedidos if str(pedido.get("id", "")).startswith("OC-")]

        # Obtener todos los distribuidores relevantes en una sola consulta
        distribuidor_ids = list({pedido["distribuidor_id"] for pedido in pedidos})
        distribuidores = await collection_distribuidores.find(
            {"_id": {"$in": [ObjectId(id) for id in distribuidor_ids]}}
        ).to_list(None)
        
        # Crear mapa rápido de distribuidores
        distribuidor_map = {str(distribuidor["_id"]): {
            "nombre": distribuidor.get("nombre", "Desconocido"),
            "telefono": distribuidor.get("telefono", ""),
            "email": distribuidor.get("correo_electronico", "")
        } for distribuidor in distribuidores}
        
        # Formatear respuesta
        pedidos_formateados = []
        for pedido in pedidos:
            info_distribuidor = distribuidor_map.get(pedido["distribuidor_id"], {
                "nombre": "Desconocido",
                "telefono": "",
                "email": ""
            })
            
            # Adaptar precios para bodega Guarne (mostrar siempre sin IVA)
            if rol == "bodega" and bodega.get("cdi") == "guarne":
                for producto in pedido.get("productos", []):
                    producto["precio"] = producto.get("precio_sin_iva", producto["precio"])
                    producto["iva_unitario"] = 0
            
            pedido_formateado = {
                "id": pedido.get("id", str(pedido["_id"])),
                "_id": str(pedido["_id"]),
                "fecha": pedido.get("fecha", datetime.now()).isoformat(),
                "productos": pedido.get("productos", []),
                "estado": pedido.get("estado", "pendiente"),
                "tipo_precio": pedido.get("tipo_precio"),
                "distribuidor_nombre": info_distribuidor["nombre"],
                "distribuidor_telefono": info_distribuidor["telefono"],
                "distribuidor_email": info_distribuidor["email"],
                "distribuidor_id": pedido["distribuidor_id"],
                "total": sum(p["precio"] * p["cantidad"] for p in pedido.get("productos", [])),
                "total_iva": sum(p.get("iva_unitario", 0) * p["cantidad"] for p in pedido.get("productos", []))
            }
            pedidos_formateados.append(pedido_formateado)
        
        # Ordenar por fecha descendente
        pedidos_formateados.sort(key=lambda x: x["fecha"], reverse=True)
        
        return {"pedidos": pedidos_formateados}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error al obtener pedidos: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al obtener pedidos")

def parse_stock(value):
    """Convierte el stock a entero, manejando strings y enteros"""
    try:
        print(f"parse_stock: value={value}")
        return int(value)
    except (TypeError, ValueError):
        print(f"parse_stock: value={value} -> 0 (error)")
        return 0

@router.get("/store/inventario")
async def get_inventario(current_user: dict = Depends(get_current_user)):
    rol = current_user.get("rol")
    email = current_user.get("email")
    print(f"Usuario: {email}, Rol: {rol}")

    if rol not in ["Admin", "bodega"]:
        print("No autorizado")
        raise HTTPException(status_code=403, detail="No autorizado")

    # Determinar CDI
    if rol == "Admin":
        cdi = None
        bodega = None
        print("Rol Admin, sin CDI")
    else:
        bodega = await collection_bodegas.find_one({"correo_electronico": email})
        print(f"Bodega encontrada: {bodega}")
        if not bodega:
            print("Bodega no encontrada")
            raise HTTPException(status_code=404, detail="Bodega no encontrada")
        cdi = bodega.get("cdi")  # "medellin" o "guarne"
        print(f"CDI de bodega: {cdi}")

    # Filtrar productos solo del admin correspondiente
    admin_id = str(bodega.get("admin_id")) if bodega else None
    query = {"admin_id": admin_id} if admin_id else {}
    print(f"Query productos: {query}")

    productos_cursor = collection_productos.find(query)
    productos = await productos_cursor.to_list(length=None)
    print(f"Productos encontrados: {len(productos)}")

    inventario = []
    for p in productos:
        print(f"Procesando producto: {p.get('id')} - {p.get('nombre')}")

        activo = p.get("activo", False)
        print(f"Activo: {activo}")
        if not activo:
            print("Producto inactivo, skip")
            continue

        s = p.get("stock", {})
        stock_medellin = parse_stock(s.get("medellin"))
        stock_guarne = parse_stock(s.get("guarne"))
        print(f"Stock Medellin: {stock_medellin}, Stock Guarne: {stock_guarne}")

        # Mostrar solo el stock del CDI correspondiente
        if cdi == "medellin":
            stock_total = stock_medellin
            stock_info = {"medellin": stock_medellin, "total": stock_medellin}
        elif cdi == "guarne":
            stock_total = stock_guarne
            stock_info = {"guarne": stock_guarne, "total": stock_guarne}
        else:  # Admin ve todos
            stock_total = stock_medellin + stock_guarne
            stock_info = {
                "medellin": stock_medellin,
                "guarne": stock_guarne,
                "total": stock_total
            }

        # Estado de stock
        estado = "Normal"
        estado_class = "text-green-600"

        if stock_total == 0:
            estado = "Sin Stock"
            estado_class = "text-red-600 font-bold"
        elif 1 <= stock_total <= 50:   # 👈 aquí el cambio
            estado = "Stock Bajo"
            estado_class = "text-orange-600 font-bold"

        print(f"Estado: {estado}, Estado class: {estado_class}")

        inventario.append({
            "_id": str(p["_id"]),
            "id": p.get("id"),
            "nombre": p.get("nombre"),
            "categoria": p.get("categoria"),
            "precios": p.get("precios"),
            "stock": stock_info,
            "estado": estado,
            "estado_class": estado_class
        })

    print(f"Inventario final: {len(inventario)} productos")
    return {"inventario": inventario}

