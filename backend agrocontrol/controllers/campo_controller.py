
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from models.campo import Campo
from models.campania import Campania
from schemas.campo import CampoCreate, CampoResponse
from services.campo_service import (
    crear_campo,
    obtener_campos,
    obtener_campo_por_nombre,
    actualizar_campo,
    eliminar_campo
)
from utils.auth import get_current_user, require_admin


router = APIRouter(
    prefix="/campos",
    tags=["Campos"]
)


def campo_a_respuesta(db: Session, campo: Campo) -> dict:
    campania = db.query(Campania).filter(
        Campania.id_campania == campo.id_campania
    ).first()

    return {
        "id_campo": campo.id_campo,
        "nombre": campo.nombre,
        "ubicacion": campo.ubicacion,
        "superficie_total": campo.superficie_total,
        "nombre_campania": campania.nombre if campania else None
    }


@router.post(
    "/",
    response_model=CampoResponse,
    status_code=status.HTTP_201_CREATED
)
def crear(
    datos: CampoCreate,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        campo = crear_campo(db, datos)
        return campo_a_respuesta(db, campo)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )


@router.get(
    "/",
    response_model=list[CampoResponse]
)
def listar(
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    campos = obtener_campos(db)

    return [
        campo_a_respuesta(db, campo)
        for campo in campos
    ]


@router.get(
    "/{nombre}",
    response_model=CampoResponse
)
def obtener(
    nombre: str,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    campo = obtener_campo_por_nombre(db, nombre)

    if campo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campo no encontrado."
        )

    return campo_a_respuesta(db, campo)


@router.put(
    "/{nombre_actual}",
    response_model=CampoResponse
)
def actualizar(
    nombre_actual: str,
    datos: CampoCreate,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        campo = actualizar_campo(
            db,
            nombre_actual,
            datos
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )

    if campo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campo no encontrado."
        )

    return campo_a_respuesta(db, campo)


@router.delete(
    "/{nombre}",
    response_model=CampoResponse
)
def eliminar(
    nombre: str,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        campo = eliminar_campo(db, nombre)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )

    if campo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campo no encontrado."
        )

    return campo_a_respuesta(db, campo)
