from pydantic import BaseModel, ConfigDict


class CamionCosechaCreate(BaseModel):
    patente: str
    peso: float
    destino: str | None = None
    id_cosecha: int


class CamionCosechaResponse(BaseModel):
    id_camion: int
    patente: str
    peso: float
    destino: str | None
    id_cosecha: int

    model_config = ConfigDict(from_attributes=True)