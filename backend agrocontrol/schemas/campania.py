from datetime import date
from pydantic import BaseModel, ConfigDict, Field, model_validator

class CampaniaCreate(BaseModel):
    nombre: str = Field(min_length=4, max_length=30)
    fecha_inicio: date
    fecha_fin: date | None = None

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def validar_fechas(self):
        if (
            self.fecha_fin is not None
            and self.fecha_fin < self.fecha_inicio
        ):
            raise ValueError(
                "La fecha de finalización no puede ser anterior "
                "a la fecha de inicio."
            )

        return self


class CampaniaResponse(BaseModel):
    id_campania: int
    nombre: str
    fecha_inicio: date
    fecha_fin: date | None

    model_config = ConfigDict(from_attributes=True)
