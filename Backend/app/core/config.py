from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # Importa el middleware CORS
from dotenv import load_dotenv

# Importar routers de cada módulo
from app.auth.routes import router as auth_router
from app.users.routes import router as users_router
from app.orders.routes import router as orders_router
from app.products.routes import router as products_router
from app.store.routes import router as store_router

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",         # Desarrollo local
        "http://127.0.0.1:3000",         # Alternativa local
        "https://distribuidores.rizosfelices.co"  # Producción
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos HTTP
    allow_headers=["*"],  # Permite todos los headers
)
# Health Check Endpoint
@app.get("/")
async def read_root():
    return {"message": "Bienvenido a la API de inventario"}

# Incluir todos los routers
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(users_router, prefix="/api", tags=["Users"])
app.include_router(orders_router, prefix="/orders", tags=["Orders"])
app.include_router(products_router, prefix="/api", tags=["Products"])
app.include_router(store_router, prefix="/store", tags=["Store"])

