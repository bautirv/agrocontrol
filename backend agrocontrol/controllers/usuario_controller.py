
from datetime import timedelta

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.usuario import (
    UsuarioCreate,
    UsuarioUpdate,
    UsuarioResponse,
    TokenResponse
)
from services.usuario_service import (
    crear_usuario,
    autenticar_usuario,
    obtener_usuarios,
    obtener_usuario,
    actualizar_usuario,
    eliminar_usuario
)
from utils.auth import get_current_user, require_admin
from utils.security import create_access_token


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)


@router.post(
    "/",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED
)
def crear(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db)
):
    try:
        return crear_usuario(db, usuario)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )


@router.post("/login", response_model=TokenResponse)
def login(
    formulario: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    usuario = autenticar_usuario(
        db,
        formulario.username,
        formulario.password
    )

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = create_access_token(
        subject=str(usuario.id_usuario),
        expires_delta=timedelta(minutes=30)
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "nombre_usuario": usuario.nombre_usuario,
        "rol": usuario.rol
    }


@router.get(
    "/",
    response_model=list[UsuarioResponse]
)
def listar(
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    return obtener_usuarios(db)


@router.get(
    "/{id_usuario}",
    response_model=UsuarioResponse
)
def obtener(
    id_usuario: int,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    usuario = obtener_usuario(db, id_usuario)

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    return usuario


@router.put(
    "/{id_usuario}",
    response_model=UsuarioResponse
)
def actualizar(
    id_usuario: int,
    datos: UsuarioUpdate,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        usuario = actualizar_usuario(
            db, id_usuario, datos, administrador
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    return usuario


@router.delete(
    "/{id_usuario}",
    response_model=UsuarioResponse
)
def eliminar(
    id_usuario: int,
    db: Session = Depends(get_db),
    administrador=Depends(require_admin)
):
    try:
        usuario = eliminar_usuario(db, id_usuario, administrador)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    return usuario
