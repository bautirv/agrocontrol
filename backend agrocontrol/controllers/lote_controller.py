
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from models.lote import Lote
from models.campo import Campo
from schemas.lote import LoteCreate, LoteResponse
from services.lote_service import (
    crear_lote,
    obtener_lote_por_nombre,
    obtener_lotes_de_campo,
    actualizar_lote,
    eliminar_lote
)
from utils.auth import get_current_user, require_admin


router = APIRouter(
    prefix="/campos",
    tags=["Lotes"]
)


def lote_a_respuesta(db: Session, lote: Lote) -> dict:
    campo = db.get(Campo, lote.id_campo)

    return {
        "nombre": lote.nombre,
        "superficie": lote.superficie,
        "variedad": lote.variedad,
        "fecha_siembra": lote.fecha_siembra,
        "cantidad_semilla": lote.cantidad_semilla,
        "nombre_campo": campo.nombre if campo else None
    }


# Crear un lote dentro de un campo
@router.post(
    "/{nombre_campo}/lotes",
    response_model=LoteResponse,
    status_code=status.HTTP_201_CREATED
)
def crear(
    nombre_campo: str,
    datos: LoteCreate,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        lote = crear_lote(db, nombre_campo, datos)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )

    return lote_a_respuesta(db, lote)


# Listar todos los lotes de un campo
@router.get(
    "/{nombre_campo}/lotes",
    response_model=list[LoteResponse]
)
def listar(
    nombre_campo: str,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    lotes = obtener_lotes_de_campo(db, nombre_campo)

    if lotes is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campo no encontrado."
        )

    return [
        lote_a_respuesta(db, lote)
        for lote in lotes
    ]


# Consultar un lote específico dentro de un campo
@router.get(
    "/{nombre_campo}/lotes/{nombre_lote}",
    response_model=LoteResponse
)
def obtener(
    nombre_campo: str,
    nombre_lote: str,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    lote = obtener_lote_por_nombre(
        db,
        nombre_campo,
        nombre_lote
    )

    if lote is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el lote dentro del campo indicado."
        )

    return lote_a_respuesta(db, lote)


# Actualizar un lote específico
@router.put(
    "/{nombre_campo}/lotes/{nombre_lote}",
    response_model=LoteResponse
)
def actualizar(
    nombre_campo: str,
    nombre_lote: str,
    datos: LoteCreate,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        lote = actualizar_lote(
            db,
            nombre_campo,
            nombre_lote,
            datos
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )

    if lote is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el lote dentro del campo indicado."
        )

    return lote_a_respuesta(db, lote)


# Eliminar un lote específico
@router.delete(
    "/{nombre_campo}/lotes/{nombre_lote}",
    response_model=LoteResponse
)
def eliminar(
    nombre_campo: str,
    nombre_lote: str,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        lote = eliminar_lote(
            db,
            nombre_campo,
            nombre_lote
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )

    if lote is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el lote dentro del campo indicado."
        )

    return lote_a_respuesta(db, lote)
