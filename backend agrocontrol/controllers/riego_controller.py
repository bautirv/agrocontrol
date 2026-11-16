
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.riego import RiegoCreate, RiegoResponse
from services.riego_service import (
    listar_riegos,
    crear_riego,
    actualizar_riego,
    eliminar_riego
)
from utils.auth import get_current_user, require_admin


router = APIRouter(
    prefix="/riegos",
    tags=["Riegos"]
)


def riego_a_respuesta(riego):
    return {
        "id_riego": riego.id_riego,
        "fecha": riego.fecha,
        "hora_inicio": riego.hora_inicio,
        "hora_fin": riego.hora_fin,
        "cantidad_agua": riego.cantidad_agua,
        "observaciones": riego.observaciones,
        "nombre_campo": riego.lote.campo.nombre,
        "nombre_lote": riego.lote.nombre,
        "nombre_usuario": riego.usuario.nombre
    }


@router.get(
    "/",
    response_model=list[RiegoResponse]
)
def listar(
    nombre_campo: str | None = Query(default=None),
    nombre_lote: str | None = Query(default=None),
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    riegos = listar_riegos(
        db,
        nombre_campo,
        nombre_lote
    )

    return [
        riego_a_respuesta(riego)
        for riego in riegos
    ]


@router.post(
    "/",
    response_model=RiegoResponse,
    status_code=status.HTTP_201_CREATED
)
def crear(
    datos: RiegoCreate,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    try:
        riego = crear_riego(
            db,
            datos,
            usuario_actual
        )
        return riego_a_respuesta(riego)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )


@router.put(
    "/{id_riego}",
    response_model=RiegoResponse
)
def actualizar(
    id_riego: int,
    datos: RiegoCreate,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        riego = actualizar_riego(
            db,
            id_riego,
            datos
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )

    if riego is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Riego no encontrado."
        )

    return riego_a_respuesta(riego)


@router.delete(
    "/{id_riego}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar(
    id_riego: int,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    riego = eliminar_riego(db, id_riego)

    if riego is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Riego no encontrado."
        )

    return None
