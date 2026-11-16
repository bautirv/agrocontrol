
from sqlalchemy import Column, Integer, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from database.database import Base


class DetalleAplicacion(Base):
    __tablename__ = "detalle_aplicacion"

    id_detalle_aplicacion = Column(Integer, primary_key=True, index=True)
    cantidad = Column(Numeric(10, 2), nullable=False)

    id_aplicacion = Column(
        Integer,
        ForeignKey("aplicacion.id_aplicacion"),
        nullable=False,
    )
    id_producto = Column(
        Integer,
        ForeignKey("producto.id_producto"),
        nullable=False,
    )

    aplicacion = relationship("Aplicacion", back_populates="detalles")
    producto = relationship(
        "Producto",
        back_populates="detalles_aplicacion",
    )
