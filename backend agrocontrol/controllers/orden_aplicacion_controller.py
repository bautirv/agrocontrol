
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.orden_aplicacion import (
    OrdenAplicacionCreate,
    OrdenAplicacionResponse
)
from services.orden_aplicacion_service import (
    listar_ordenes,
    crear_orden
)
from utils.auth import get_current_user, require_admin


router = APIRouter(
    prefix="/ordenes-aplicacion",
    tags=["Órdenes de aplicación"]
)


def orden_a_respuesta(orden):
    return {
        "id_orden_aplicacion": orden.id_orden_aplicacion,
        "fecha": orden.fecha,
        "objetivo": orden.objetivo,
        "observaciones": orden.observaciones,
        "estado": orden.estado,
        "nombre_campo": orden.lote.campo.nombre,
        "nombre_lote": orden.lote.nombre,
        "nombre_usuario": orden.usuario.nombre_usuario
    }


@router.get(
    "/",
    response_model=list[OrdenAplicacionResponse]
)
def listar(
    nombre_campo: str | None = Query(default=None),
    nombre_lote: str | None = Query(default=None),
    estado: str | None = Query(default=None),
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    ordenes = listar_ordenes(db, nombre_campo, nombre_lote, estado)

    return [orden_a_respuesta(orden) for orden in ordenes]


# Las órdenes las emite un administrador; los usuarios de campo
# las ejecutan cargando la aplicación correspondiente.
@router.post(
    "/",
    response_model=OrdenAplicacionResponse,
    status_code=status.HTTP_201_CREATED
)
def crear(
    datos: OrdenAplicacionCreate,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        orden = crear_orden(db, datos, administrador)
        return orden_a_respuesta(orden)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )
