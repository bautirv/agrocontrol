
from sqlalchemy import (
    Column,
    Integer,
    Date,
    Time,
    Numeric,
    Text,
    ForeignKey,
    CheckConstraint,
)
from sqlalchemy.orm import relationship

from database.database import Base


class Riego(Base):
    __tablename__ = "riego"

    __table_args__ = (
        CheckConstraint(
            "hora_fin > hora_inicio",
            name="ck_riego_hora_fin_posterior",
        ),
        CheckConstraint(
            "cantidad_agua > 0",
            name="ck_riego_cantidad_positiva",
        ),
    )

    id_riego = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    cantidad_agua = Column(Numeric(10, 2), nullable=False)
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

    lote = relationship("Lote", back_populates="riegos")
    usuario = relationship("Usuario", back_populates="riegos")
