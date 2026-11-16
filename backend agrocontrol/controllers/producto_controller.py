
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.producto import ProductoCreate, ProductoResponse
from services.producto_service import (
    crear_producto,
    obtener_productos,
    obtener_producto_por_nombre,
    actualizar_producto,
    eliminar_producto
)
from utils.auth import get_current_user, require_admin


router = APIRouter(
    prefix="/productos",
    tags=["Productos"]
)


# Crear un producto
@router.post(
    "/",
    response_model=ProductoResponse,
    status_code=status.HTTP_201_CREATED
)
def crear(
    datos: ProductoCreate,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        return crear_producto(db, datos)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )


# Listar todos los productos
@router.get(
    "/",
    response_model=list[ProductoResponse]
)
def listar(
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    return obtener_productos(db)


# Consultar un producto por nombre comercial
@router.get(
    "/{nombre_comercial}",
    response_model=ProductoResponse
)
def obtener(
    nombre_comercial: str,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    producto = obtener_producto_por_nombre(
        db,
        nombre_comercial
    )

    if producto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado."
        )

    return producto


# Actualizar un producto
@router.put(
    "/{nombre_actual}",
    response_model=ProductoResponse
)
def actualizar(
    nombre_actual: str,
    datos: ProductoCreate,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        producto = actualizar_producto(
            db,
            nombre_actual,
            datos
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )

    if producto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado."
        )

    return producto


# Eliminar un producto
@router.delete(
    "/{nombre_comercial}",
    response_model=ProductoResponse
)
def eliminar(
    nombre_comercial: str,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        producto = eliminar_producto(
            db,
            nombre_comercial
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )

    if producto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado."
        )

    return producto
