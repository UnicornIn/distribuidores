
from fastapi import APIRouter, HTTPException, Form
from datetime import datetime, timedelta
from app.core.security import create_access_token, pwd_context, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
from fastapi.security import OAuth2PasswordBearer
from fastapi import status
from app.auth.models import TokenResponse
from jose import jwt, JWTError
from fastapi import Depends
from app.core.database import (
    collection_admin,
    collection_distribuidores,
    collection_produccion,
    collection_facturas,
    collection_bodegas
)
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

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
        
        if not email or not rol:
            raise credentials_exception
        return {"email": email, "rol": rol}
    except jwt.PyJWTError:
        raise credentials_exception

@router.post("/token", response_model=TokenResponse)
async def login(
    username: str = Form(...),  # Correo electrónico
    password: str = Form(...)   # Contraseña
):
    user = None
    rol = None

    # Normalizar username
    username = username.lower()

    collections = [
        (collection_admin, "collection_admin"),
        (collection_distribuidores, "collection_distribuidores"),
        (collection_produccion, "collection_produccion"),
        (collection_facturas, "collection_facturas"),
        (collection_bodegas, "collection_bodegas")
    ]

    print("Iniciando búsqueda de usuario en las colecciones...")
    for collection, name in collections:
        try:
            print(f"Buscando en {name} para el usuario: {username}")
            user = await collection.find_one({"correo_electronico": username})
            if user:
                print(f"Usuario encontrado en {name}: {user}")
                rol = user.get("rol")
                break
            else:
                print(f"Usuario no encontrado en {name}")
        except Exception as e:
            print(f"Error al conectar o buscar en {name}: {e}")

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

    # Extraer datos adicionales
    cdi = user.get("cdi")
    tipo_precio = user.get("tipo_precio")  # Tipo de precio
    unidades_individuales = user.get("unidades_individuales", False)  # Nuevo campo

    # Generar token con los datos
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user["correo_electronico"],
            "rol": rol,
            "nombre": user.get("nombre"),
            "pais": user.get("pais"),
            "cdi": cdi,
            "tipo_precio": tipo_precio,
            "unidades_individuales": unidades_individuales  # Incluido en el token
        },
        expires_delta=access_token_expires
    )

    # Respuesta con token y datos adicionales
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        rol=rol,
        nombre=user.get("nombre"),
        pais=user.get("pais"),
        email=user.get("correo_electronico"),
        cdi=cdi,
        tipo_precio=tipo_precio,
        unidades_individuales=unidades_individuales
    )


@router.get("/validate_token")
async def validate_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"valid": True, "exp": payload.get("exp")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
