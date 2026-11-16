
from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class OrdenAplicacionCreate(BaseModel):
    fecha: date
    objetivo: str = Field(min_length=1, max_length=200)
    observaciones: str | None = Field(
        default=None,
        max_length=2000
    )
    estado: Literal["PENDIENTE", "REALIZADA", "CANCELADA"] = "PENDIENTE"
    nombre_campo: str = Field(min_length=1, max_length=100)
    nombre_lote: str = Field(min_length=1, max_length=50)

    model_config = ConfigDict(extra="forbid")


class OrdenAplicacionResponse(BaseModel):
    id_orden_aplicacion: int
    fecha: date
    objetivo: str
    observaciones: str | None
    estado: str
    nombre_campo: str
    nombre_lote: str
    nombre_usuario: str

    model_config = ConfigDict(from_attributes=True)
