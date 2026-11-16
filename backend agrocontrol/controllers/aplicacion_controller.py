
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.aplicacion import AplicacionCreate, AplicacionResponse
from services.aplicacion_service import (
    listar_aplicaciones,
    crear_aplicacion,
    eliminar_aplicacion
)
from utils.auth import get_current_user


router = APIRouter(
    prefix="/aplicaciones",
    tags=["Aplicaciones"]
)


def aplicacion_a_respuesta(aplicacion):
    return {
        "id_aplicacion": aplicacion.id_aplicacion,
        "fecha": aplicacion.fecha,
        "temperatura": aplicacion.temperatura,
        "humedad": aplicacion.humedad,
        "viento": aplicacion.viento,
        "observaciones": aplicacion.observaciones,
        "nombre_campo": aplicacion.lote.campo.nombre,
        "nombre_lote": aplicacion.lote.nombre,
        "id_orden_aplicacion": aplicacion.id_orden_aplicacion,
        "nombre_usuario": aplicacion.usuario.nombre,
        "productos": [
            {
                "nombre_producto": detalle.producto.nombre_comercial,
                "cantidad": detalle.cantidad,
                "unidad_medida": detalle.producto.unidad_medida
            }
            for detalle in aplicacion.detalles
        ]
    }


@router.get(
    "/",
    response_model=list[AplicacionResponse]
)
def listar(
    nombre_campo: str | None = Query(default=None),
    nombre_lote: str | None = Query(default=None),
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    aplicaciones = listar_aplicaciones(
        db,
        nombre_campo,
        nombre_lote
    )

    return [
        aplicacion_a_respuesta(aplicacion)
        for aplicacion in aplicaciones
    ]


@router.post(
    "/",
    response_model=AplicacionResponse,
    status_code=status.HTTP_201_CREATED
)
def crear(
    datos: AplicacionCreate,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    try:
        aplicacion = crear_aplicacion(
            db,
            datos,
            usuario_actual
        )

        return aplicacion_a_respuesta(aplicacion)

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


@router.delete(
    "/{id_aplicacion}",
    status_code=status.HTTP_409_CONFLICT
)
def eliminar(
    id_aplicacion: int,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    try:
        eliminar_aplicacion(db, id_aplicacion)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )
