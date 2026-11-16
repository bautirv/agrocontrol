
from sqlalchemy import (
    Column,
    Integer,
    Date,
    Numeric,
    String,
    Text,
    ForeignKey,
    CheckConstraint,
)
from sqlalchemy.orm import relationship

from database.database import Base


class Cosecha(Base):
    __tablename__ = "cosecha"

    __table_args__ = (
        CheckConstraint(
            "cantidad_cosechada > 0",
            name="ck_cosecha_cantidad_positiva",
        ),
    )

    id_cosecha = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False)
    dtve = Column(String(50), nullable=False)
    cantidad_cosechada = Column(Numeric(12, 2), nullable=False)
    observaciones = Column(Text, nullable=True)

    id_lote = Column(
        Integer,
        ForeignKey("lote.id_lote"),
        nullable=False,
    )
    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario"),
        nullable=False,
    )

    lote = relationship("Lote", back_populates="cosechas")
    usuario = relationship("Usuario", back_populates="cosechas")
    camiones = relationship(
        "CamionCosecha",
        back_populates="cosecha",
        cascade="all, delete-orphan",
    )
