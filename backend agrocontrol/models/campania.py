from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.orm import relationship

from database.database import Base


class Campania(Base):
    __tablename__ = "campania"

    id_campania = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date)

    campos = relationship(
        "Campo",
        back_populates="campania"
    )