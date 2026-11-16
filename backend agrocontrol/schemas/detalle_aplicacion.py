from pydantic import BaseModel, ConfigDict


class DetalleAplicacionCreate(BaseModel):
    id_aplicacion: int
    id_producto: int
    dosis: float
    cantidad_utilizada: float


class DetalleAplicacionResponse(BaseModel):
    id_detalle: int
    id_aplicacion: int
    id_producto: int
    dosis: float
    cantidad_utilizada: float

    model_config = ConfigDict(from_attributes=True)