
import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash


# Cargar las variables del archivo .env
load_dotenv()

# Configuración del hash de contraseñas
password_hash = PasswordHash.recommended()

# Configuración de JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "Falta configurar JWT_SECRET_KEY en el archivo .env."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def hash_password(contrasena: str) -> str:
    """Genera un hash seguro de una contraseña."""
    return password_hash.hash(contrasena)


def verify_password(
    contrasena_plana: str,
    contrasena_hash: str
) -> bool:
    """Verifica una contraseña contra su hash."""
    try:
        return password_hash.verify(
            contrasena_plana,
            contrasena_hash
        )
    except (ValueError, TypeError):
        return False


def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None
) -> str:
    """Genera un token JWT para identificar al usuario."""
    ahora = datetime.now(timezone.utc)

    duracion = expires_delta or timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": subject,
        "iat": ahora,
        "exp": ahora + duracion
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def decode_access_token(token: str) -> dict:
    """Verifica un JWT y devuelve los datos contenidos en él."""
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM]
    )
