
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from database.database import Base


class Producto(Base):
    __tablename__ = "producto"

    id_producto = Column(Integer, primary_key=True, index=True)
    nombre_comercial = Column(String(100), nullable=False)
    principio_activo = Column(String(100))
    concentracion = Column(String(50))
    tipo = Column(String(50), nullable=False)
    unidad_medida = Column(String(20), nullable=False)

    movimientos_stock = relationship(
        "MovimientoStock",
        back_populates="producto",
    )
    detalles_aplicacion = relationship(
        "DetalleAplicacion",
        back_populates="producto",
    )
