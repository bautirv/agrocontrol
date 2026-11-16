
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.campania import CampaniaCreate, CampaniaResponse
from services.campania_service import (
    crear_campania,
    obtener_campanias,
    obtener_campania_por_nombre,
    actualizar_campania,
    eliminar_campania
)
from utils.auth import get_current_user, require_admin


router = APIRouter(
    prefix="/campanias",
    tags=["Campañas"]
)


@router.post(
    "/",
    response_model=CampaniaResponse,
    status_code=status.HTTP_201_CREATED
)
def crear(
    datos: CampaniaCreate,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        return crear_campania(db, datos)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )


@router.get(
    "/",
    response_model=list[CampaniaResponse]
)
def listar(
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    return obtener_campanias(db)


# ":path" permite nombres con barra, como "Campaña 2026/2027"
@router.get(
    "/{nombre:path}",
    response_model=CampaniaResponse
)
def obtener(
    nombre: str,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    campania = obtener_campania_por_nombre(db, nombre)

    if campania is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaña no encontrada."
        )

    return campania


@router.put(
    "/{nombre:path}",
    response_model=CampaniaResponse
)
def actualizar(
    nombre: str,
    datos: CampaniaCreate,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        campania = actualizar_campania(db, nombre, datos)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )

    if campania is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaña no encontrada."
        )

    return campania


@router.delete(
    "/{nombre:path}",
    response_model=CampaniaResponse
)
def eliminar(
    nombre: str,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        campania = eliminar_campania(db, nombre)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )

    if campania is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaña no encontrada."
        )

    return campania
