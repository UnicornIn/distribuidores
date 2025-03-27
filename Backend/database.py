from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import timedelta, datetime, timezone
from urllib.parse import quote_plus
import jwt
from dotenv import load_dotenv
import os

# Cargar variables de entorno desde el archivo .env
load_dotenv()

# Conexión a MongoDB Atlas
uri = os.getenv("MONGODB_URI")
client = AsyncIOMotorClient(uri)
db = client["DatabaseInvetary"]
collection_productos = db["productos"]
collection_pedidos = db["pedidos"]
collection_distribuidores = db["distribuidores"]
collection_facturas = db["facturadores"]
collection_produccion = db["produccion"]
collection_admin = db["admin"]



# Configuración de JWT y bcrypt
SECRET_KEY = "fcef76643904c159a46a66620f2d21aec3c055369bbb84b6ddbfb33a28bea14d"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Verificar contraseñas
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Crear un token de acceso
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt