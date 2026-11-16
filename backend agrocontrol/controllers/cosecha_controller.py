
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from utils.auth import get_current_user, require_admin
from models.cosecha import Cosecha
from models.usuario import Usuario
from schemas.cosecha import CosechaCreate, CosechaResponse
from services.cosecha_service import (
    listar_cosechas,
    obtener_cosecha,
    crear_cosecha,
    eliminar_cosecha
)


router = APIRouter(
    prefix="/cosechas",
    tags=["Cosechas"]
)


def convertir_cosecha(cosecha: Cosecha) -> CosechaResponse:
    return CosechaResponse(
        id_cosecha=cosecha.id_cosecha,
        fecha=cosecha.fecha,
        dtve=cosecha.dtve,
        cantidad_cosechada=cosecha.cantidad_cosechada,
        observaciones=cosecha.observaciones,
        nombre_campo=cosecha.lote.campo.nombre,
        nombre_lote=cosecha.lote.nombre,
        nombre_usuario=cosecha.usuario.nombre,
        camiones=cosecha.camiones
    )


@router.get("/", response_model=list[CosechaResponse])
def obtener_cosechas(
    nombre_campo: str | None = None,
    nombre_lote: str | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    cosechas = listar_cosechas(db, nombre_campo, nombre_lote)
    return [convertir_cosecha(cosecha) for cosecha in cosechas]


@router.get("/{id_cosecha}", response_model=CosechaResponse)
def obtener_cosecha_por_id(
    id_cosecha: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    cosecha = obtener_cosecha(db, id_cosecha)

    if cosecha is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La cosecha indicada no existe."
        )

    return convertir_cosecha(cosecha)


@router.post(
    "/",
    response_model=CosechaResponse,
    status_code=status.HTTP_201_CREATED
)
def registrar_cosecha(
    datos: CosechaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    try:
        cosecha = crear_cosecha(db, datos, usuario.id_usuario)
        return convertir_cosecha(cosecha)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        ) from error


@router.delete("/{id_cosecha}", status_code=status.HTTP_204_NO_CONTENT)
def borrar_cosecha(
    id_cosecha: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_admin)
):
    try:
        cosecha = eliminar_cosecha(db, id_cosecha)

        if cosecha is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La cosecha indicada no existe."
            )

        return None
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        ) from error
