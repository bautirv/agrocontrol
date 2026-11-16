
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.database import Base


class MovimientoStock(Base):
    __tablename__ = "movimientos_stock"

    __table_args__ = (
        CheckConstraint(
            "cantidad > 0",
            name="ck_movimiento_stock_cantidad_positiva",
        ),
        CheckConstraint(
            "tipo IN ('INGRESO', 'EGRESO')",
            name="ck_movimiento_stock_tipo",
        ),
    )

    id_movimiento = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(10), nullable=False)
    cantidad = Column(Float, nullable=False)
    fecha = Column(DateTime, nullable=False, server_default=func.now())
    observacion = Column(String(255), nullable=True)

    id_producto = Column(
        Integer,
        ForeignKey("producto.id_producto"),
        nullable=False,
    )
    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario"),
        nullable=False,
    )

    producto = relationship(
        "Producto",
        back_populates="movimientos_stock",
    )
    usuario = relationship(
        "Usuario",
        back_populates="movimientos_stock",
    )
