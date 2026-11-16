from pydantic import BaseModel, ConfigDict
from datetime import datetime


class MovimientoStockCreate(BaseModel):
    tipo_movimiento: str
    cantidad: float
    observacion: str | None = None
    id_producto: int
    id_usuario: int


class MovimientoStockResponse(BaseModel):
    id_movimiento: int
    fecha: datetime
    tipo_movimiento: str
    cantidad: float
    observacion: str | None
    id_producto: int
    id_usuario: int

    model_config = ConfigDict(from_attributes=True)