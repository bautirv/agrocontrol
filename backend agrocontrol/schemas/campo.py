
from pydantic import BaseModel, ConfigDict, Field


class CampoCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    ubicacion: str = Field(min_length=1, max_length=200)
    superficie_total: float = Field(gt=0)
    nombre_campania: str = Field(min_length=4, max_length=30)

    model_config = ConfigDict(extra="forbid")


class CampoResponse(BaseModel):
    id_campo: int
    nombre: str
    ubicacion: str
    superficie_total: float
    nombre_campania: str | None

    model_config = ConfigDict(from_attributes=True)
