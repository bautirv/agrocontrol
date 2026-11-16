import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from controllers.usuario_controller import router as usuario_router
from controllers.campania_controller import router as campania_router
from controllers.campo_controller import router as campo_router
from controllers.lote_controller import router as lote_router
from controllers.producto_controller import router as producto_router
from controllers.stock_controller import router as stock_router
from controllers.labor_controller import router as labor_router
from controllers.riego_controller import router as riego_router
from controllers.aplicacion_controller import router as aplicacion_router
from controllers.orden_aplicacion_controller import router as orden_aplicacion_router
from controllers.cosecha_controller import router as cosecha_router

from database.database import Base, engine
import models  # registra todas las tablas en Base

# Crea las tablas que falten al iniciar (no modifica las que ya existen)
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AgroControl",
    description="Sistema de gestión de producción de papa",
    version="1.0.0"
)


# Permite que el front (Vite) llame a la API desde el navegador.
# Se pueden agregar más orígenes con CORS_ORIGINS="https://a.com,https://b.com"
origenes = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
] + [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origenes,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(usuario_router)
app.include_router(campania_router)
app.include_router(campo_router)
app.include_router(lote_router)
app.include_router(producto_router)
app.include_router(stock_router)
app.include_router(labor_router)
app.include_router(riego_router)
app.include_router(orden_aplicacion_router)
app.include_router(aplicacion_router)
app.include_router(cosecha_router)



@app.get("/")
def inicio():
    return {
        "mensaje": "AgroControl funcionando"
    }
