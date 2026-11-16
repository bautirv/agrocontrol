
from sqlalchemy import (
    Column,
    Integer,
    Date,
    Numeric,
    Text,
    ForeignKey,
    CheckConstraint,
)
from sqlalchemy.orm import relationship

from database.database import Base


class Aplicacion(Base):
    __tablename__ = "aplicacion"

    __table_args__ = (
        CheckConstraint(
            "humedad >= 0 AND humedad <= 100",
            name="ck_aplicacion_humedad",
        ),
        CheckConstraint(
            "viento >= 0",
            name="ck_aplicacion_viento",
        ),
    )

    id_aplicacion = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False)
    temperatura = Column(Numeric(5, 2), nullable=False)
    humedad = Column(Numeric(5, 2), nullable=False)
    viento = Column(Numeric(5, 2), nullable=False)
    observaciones = Column(Text, nullable=True)

    id_lote = Column(
        Integer,
        ForeignKey("lote.id_lote"),
        nullable=False,
    )
    id_orden_aplicacion = Column(
        Integer,
        ForeignKey("orden_aplicacion.id_orden_aplicacion"),
        nullable=False,
    )
    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario"),
        nullable=False,
    )

    lote = relationship("Lote", back_populates="aplicaciones")
    orden = relationship("OrdenAplicacion", back_populates="aplicaciones")
    usuario = relationship("Usuario", back_populates="aplicaciones")
    detalles = relationship(
        "DetalleAplicacion",
        back_populates="aplicacion",
        cascade="all, delete-orphan",
    )
