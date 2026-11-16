
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.stock import (
    MovimientoStockCreate,
    MovimientoStockResponse,
    StockProductoResponse
)
from services.stock_service import (
    listar_stock,
    obtener_stock_producto,
    listar_movimientos,
    registrar_movimiento
)
from utils.auth import get_current_user, require_admin


router = APIRouter(
    prefix="/stock",
    tags=["Stock"]
)


def movimiento_a_respuesta(movimiento):
    return {
        "id_movimiento": movimiento.id_movimiento,
        "tipo": movimiento.tipo,
        "cantidad": movimiento.cantidad,
        "fecha": movimiento.fecha,
        "observacion": movimiento.observacion,
        "nombre_producto": movimiento.producto.nombre_comercial,
        "nombre_usuario": movimiento.usuario.nombre
    }


@router.get(
    "/",
    response_model=list[StockProductoResponse]
)
def consultar_stock(
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    return listar_stock(db)


@router.get(
    "/{nombre_producto}",
    response_model=StockProductoResponse
)
def consultar_stock_producto(
    nombre_producto: str,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    stock = obtener_stock_producto(
        db,
        nombre_producto
    )

    if stock is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado."
        )

    return stock


@router.get(
    "/movimientos/listado",
    response_model=list[MovimientoStockResponse]
)
def consultar_movimientos(
    nombre_producto: str | None = Query(default=None),
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    movimientos = listar_movimientos(
        db,
        nombre_producto
    )

    return [
        movimiento_a_respuesta(movimiento)
        for movimiento in movimientos
    ]


@router.post(
    "/movimientos",
    response_model=MovimientoStockResponse,
    status_code=status.HTTP_201_CREATED
)
def crear_movimiento(
    datos: MovimientoStockCreate,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        movimiento = registrar_movimiento(
            db,
            datos,
            administrador
        )

        return movimiento_a_respuesta(movimiento)

    except ValueError as error:
        mensaje = str(error)

        codigo = (
            status.HTTP_422_UNPROCESSABLE_ENTITY
            if "Stock insuficiente" in mensaje
            else status.HTTP_409_CONFLICT
        )

        raise HTTPException(
            status_code=codigo,
            detail=mensaje
        )
