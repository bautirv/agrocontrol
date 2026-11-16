
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MovimientoStockCreate(BaseModel):
    tipo: str = Field(pattern=r"^(INGRESO|EGRESO)$")
    cantidad: float = Field(gt=0)
    observacion: str | None = Field(
        default=None,
        max_length=255
    )
    nombre_producto: str = Field(
        min_length=1,
        max_length=100
    )

    model_config = ConfigDict(extra="forbid")


class MovimientoStockResponse(BaseModel):
    id_movimiento: int
    tipo: str
    cantidad: float
    fecha: datetime
    observacion: str | None
    nombre_producto: str
    nombre_usuario: str

    model_config = ConfigDict(from_attributes=True)


class StockProductoResponse(BaseModel):
    nombre_producto: str
    unidad_medida: str
    stock_actual: float
