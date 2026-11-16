
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.labor import LaborCreate, LaborResponse
from services.labor_service import (
    listar_labores,
    crear_labor,
    actualizar_labor,
    eliminar_labor
)
from utils.auth import get_current_user, require_admin


router = APIRouter(
    prefix="/labores",
    tags=["Labores"]
)


def labor_a_respuesta(labor):
    return {
        "id_labor": labor.id_labor,
        "tipo": labor.tipo,
        "fecha": labor.fecha,
        "observaciones": labor.observaciones,
        "nombre_lote": labor.lote.nombre,
        "nombre_campo": labor.lote.campo.nombre,
        "nombre_usuario": labor.usuario.nombre
    }


@router.get(
    "/",
    response_model=list[LaborResponse]
)
def listar(
    nombre_campo: str | None = Query(default=None),
    nombre_lote: str | None = Query(default=None),
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    labores = listar_labores(
        db,
        nombre_campo,
        nombre_lote
    )

    return [
        labor_a_respuesta(labor)
        for labor in labores
    ]


@router.post(
    "/",
    response_model=LaborResponse,
    status_code=status.HTTP_201_CREATED
)
def crear(
    datos: LaborCreate,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    try:
        labor = crear_labor(
            db,
            datos,
            usuario_actual
        )

        return labor_a_respuesta(labor)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )


@router.put(
    "/{id_labor}",
    response_model=LaborResponse
)
def actualizar(
    id_labor: int,
    datos: LaborCreate,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        labor = actualizar_labor(
            db,
            id_labor,
            datos
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )

    if labor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Labor no encontrada."
        )

    return labor_a_respuesta(labor)


@router.delete(
    "/{id_labor}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar(
    id_labor: int,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    labor = eliminar_labor(db, id_labor)

    if labor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Labor no encontrada."
        )

    return None
