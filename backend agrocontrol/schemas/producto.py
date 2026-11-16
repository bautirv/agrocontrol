
from pydantic import BaseModel, ConfigDict, Field


class ProductoCreate(BaseModel):
    nombre_comercial: str = Field(min_length=1, max_length=100)
    principio_activo: str = Field(min_length=1, max_length=100)
    concentracion: str = Field(min_length=1, max_length=50)
    tipo: str = Field(min_length=1, max_length=50)
    unidad_medida: str = Field(min_length=1, max_length=20)

    model_config = ConfigDict(extra="forbid")


class ProductoResponse(BaseModel):
    id_producto: int
    nombre_comercial: str
    principio_activo: str
    concentracion: str
    tipo: str
    unidad_medida: str

    model_config = ConfigDict(from_attributes=True)
