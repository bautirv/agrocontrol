
from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from database.database import Base


class Lote(Base):
    __tablename__ = "lote"

    id_lote = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False)
    superficie = Column(Numeric(10, 2), nullable=False)
    variedad = Column(String(100), nullable=False)
    fecha_siembra = Column(Date)
    cantidad_semilla = Column(Numeric(10, 2))

    id_campo = Column(
        Integer,
        ForeignKey("campo.id_campo"),
        nullable=False,
    )

    campo = relationship("Campo", back_populates="lotes")
    labores = relationship("Labor", back_populates="lote")
    riegos = relationship("Riego", back_populates="lote")
    ordenes_aplicacion = relationship(
        "OrdenAplicacion",
        back_populates="lote",
    )
    aplicaciones = relationship("Aplicacion", back_populates="lote")
    cosechas = relationship("Cosecha", back_populates="lote")
