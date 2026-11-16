
from datetime import date, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class RiegoCreate(BaseModel):
    fecha: date
    hora_inicio: time
    hora_fin: time
    cantidad_agua: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    observaciones: str | None = Field(
        default=None,
        max_length=2000
    )
    nombre_campo: str = Field(min_length=1, max_length=100)
    nombre_lote: str = Field(min_length=1, max_length=50)

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def validar_horarios(self):
        if self.hora_fin <= self.hora_inicio:
            raise ValueError(
                "La hora de fin debe ser posterior a la hora de inicio."
            )
        return self


class RiegoResponse(BaseModel):
    id_riego: int
    fecha: date
    hora_inicio: time
    hora_fin: time
    cantidad_agua: Decimal
    observaciones: str | None
    nombre_campo: str
    nombre_lote: str
    nombre_usuario: str

    model_config = ConfigDict(from_attributes=True)
