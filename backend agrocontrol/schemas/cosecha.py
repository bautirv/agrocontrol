
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CamionCosechaCreate(BaseModel):
    patente: str = Field(min_length=1, max_length=10)
    cantidad_transportada: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2
    )
    destino: str = Field(min_length=1, max_length=150)
    observaciones: str | None = Field(
        default=None,
        max_length=255
    )

    model_config = ConfigDict(extra="forbid")


class CamionCosechaResponse(BaseModel):
    id_camion_cosecha: int
    patente: str
    cantidad_transportada: Decimal
    destino: str
    observaciones: str | None

    model_config = ConfigDict(from_attributes=True)


class CosechaCreate(BaseModel):
    fecha: date
    dtve: str = Field(min_length=1, max_length=50)
    cantidad_cosechada: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2
    )
    observaciones: str | None = None
    nombre_campo: str = Field(min_length=1, max_length=100)
    nombre_lote: str = Field(min_length=1, max_length=50)
    camiones: list[CamionCosechaCreate] = Field(
        default_factory=list
    )

    model_config = ConfigDict(extra="forbid")


class CosechaResponse(BaseModel):
    id_cosecha: int
    fecha: date
    dtve: str
    cantidad_cosechada: Decimal
    observaciones: str | None
    nombre_campo: str
    nombre_lote: str
    nombre_usuario: str
    camiones: list[CamionCosechaResponse] = Field(
        default_factory=list
    )

    model_config = ConfigDict(from_attributes=True)
