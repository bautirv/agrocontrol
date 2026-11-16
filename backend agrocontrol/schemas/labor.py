
from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class LaborCreate(BaseModel):
    tipo: str = Field(min_length=1, max_length=100)
    fecha: date
    observaciones: str | None = Field(
        default=None,
        max_length=2000
    )
    nombre_lote: str = Field(min_length=1, max_length=50)
    nombre_campo: str = Field(min_length=1, max_length=100)

    model_config = ConfigDict(extra="forbid")


class LaborResponse(BaseModel):
    id_labor: int
    tipo: str
    fecha: date
    observaciones: str | None
    nombre_lote: str
    nombre_campo: str
    nombre_usuario: str

    model_config = ConfigDict(from_attributes=True)
