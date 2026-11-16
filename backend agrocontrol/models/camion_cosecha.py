
from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    ForeignKey,
    CheckConstraint,
)
from sqlalchemy.orm import relationship

from database.database import Base


class CamionCosecha(Base):
    __tablename__ = "camion_cosecha"

    __table_args__ = (
        CheckConstraint(
            "cantidad_transportada > 0",
            name="ck_camion_cosecha_cantidad_positiva",
        ),
    )

    id_camion_cosecha = Column(Integer, primary_key=True, index=True)
    patente = Column(String(10), nullable=False)
    cantidad_transportada = Column(Numeric(12, 2), nullable=False)
    destino = Column(String(150), nullable=False)
    observaciones = Column(String(255), nullable=True)

    id_cosecha = Column(
        Integer,
        ForeignKey("cosecha.id_cosecha"),
        nullable=False,
    )

    cosecha = relationship("Cosecha", back_populates="camiones")
