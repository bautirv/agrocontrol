
from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey
from sqlalchemy.orm import relationship

from database.database import Base


class OrdenAplicacion(Base):
    __tablename__ = "orden_aplicacion"

    id_orden_aplicacion = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False)
    objetivo = Column(String(200), nullable=False)
    observaciones = Column(Text, nullable=True)
    estado = Column(String(20), nullable=False, default="PENDIENTE")

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

    lote = relationship("Lote", back_populates="ordenes_aplicacion")
    usuario = relationship("Usuario")
    aplicaciones = relationship(
        "Aplicacion",
        back_populates="orden",
        cascade="all, delete-orphan",
    )
