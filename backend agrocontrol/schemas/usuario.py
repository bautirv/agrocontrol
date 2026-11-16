
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class UsuarioCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=50)
    apellido: str = Field(min_length=1, max_length=50)
    nombre_usuario: str = Field(min_length=3, max_length=50)
    contrasena: str = Field(min_length=8, max_length=128)

    model_config = ConfigDict(extra="forbid")


class UsuarioUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=50)
    apellido: str | None = Field(default=None, min_length=1, max_length=50)
    nombre_usuario: str | None = Field(
        default=None, min_length=3, max_length=50
    )
    contrasena: str | None = Field(
        default=None, min_length=8, max_length=128
    )
    rol: Literal["ADMIN", "CAMPO"] | None = None

    model_config = ConfigDict(extra="forbid")


class UsuarioResponse(BaseModel):
    id_usuario: int
    nombre: str
    apellido: str
    nombre_usuario: str
    rol: str

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    nombre_usuario: str
    rol: str
