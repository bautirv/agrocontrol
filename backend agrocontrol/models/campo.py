from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from database.database import Base


class Campo(Base):
    __tablename__ = "campo"

    id_campo = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    ubicacion = Column(String(150))
    superficie_total = Column(Numeric(10, 2), nullable=False)

    id_campania = Column(
        Integer,
        ForeignKey("campania.id_campania"),
        nullable=False
    )

    campania = relationship(
        "Campania",
        back_populates="campos"
    )

    lotes = relationship(
        "Lote",
        back_populates="campo"
    )