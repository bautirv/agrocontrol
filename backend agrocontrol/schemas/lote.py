from datetime import date
from pydantic import BaseModel, ConfigDict, Field


class LoteCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    superficie: float = Field(gt=0)
    variedad: str = Field(min_length=1, max_length=100)
    fecha_siembra: date | None = None
    cantidad_semilla: float = Field(gt=0)

    model_config = ConfigDict(extra="forbid")


class LoteResponse(BaseModel):
    nombre: str
    superficie: float
    variedad: str
    fecha_siembra: date | None
    cantidad_semilla: float
    nombre_campo: str | None

    model_config = ConfigDict(from_attributes=True)