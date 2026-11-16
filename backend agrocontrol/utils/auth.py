from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt

from database.database import get_db
from models.usuario import Usuario
from utils.security import decode_access_token


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/usuarios/login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Usuario:
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o vencido.",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")

        if subject is None:
            raise credenciales_invalidas

        id_usuario = int(subject)

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise credenciales_invalidas

    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == id_usuario
    ).first()

    if usuario is None:
        raise credenciales_invalidas

    return usuario


def require_admin(
    usuario: Usuario = Depends(get_current_user)
) -> Usuario:
    if usuario.rol != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tenés permisos para realizar esta operación."
        )

    return usuario
