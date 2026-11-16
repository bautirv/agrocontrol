
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class DetalleAplicacionCreate(BaseModel):
    nombre_producto: str = Field(min_length=1, max_length=100)
    cantidad: Decimal = Field(gt=0, max_digits=10, decimal_places=2)

    model_config = ConfigDict(extra="forbid")


class AplicacionCreate(BaseModel):
    fecha: date
    temperatura: Decimal = Field(max_digits=5, decimal_places=2)
    humedad: Decimal = Field(ge=0, le=100, max_digits=5, decimal_places=2)
    viento: Decimal = Field(ge=0, max_digits=5, decimal_places=2)
    observaciones: str | None = Field(
        default=None,
        max_length=2000
    )
    nombre_campo: str = Field(min_length=1, max_length=100)
    nombre_lote: str = Field(min_length=1, max_length=50)
    id_orden_aplicacion: int = Field(gt=0)
    productos: list[DetalleAplicacionCreate] = Field(min_length=1)

    model_config = ConfigDict(extra="forbid")


class DetalleAplicacionResponse(BaseModel):
    nombre_producto: str
    cantidad: Decimal
    unidad_medida: str

    model_config = ConfigDict(from_attributes=True)


class AplicacionResponse(BaseModel):
    id_aplicacion: int
    fecha: date
    temperatura: Decimal
    humedad: Decimal
    viento: Decimal
    observaciones: str | None
    nombre_campo: str
    nombre_lote: str
    id_orden_aplicacion: int
    nombre_usuario: str
    productos: list[DetalleAplicacionResponse]

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def validar_condiciones(self):
        if self.humedad < 0 or self.humedad > 100:
            raise ValueError("La humedad debe estar entre 0 y 100.")
        if self.viento < 0:
            raise ValueError("El viento no puede ser negativo.")
        return self
