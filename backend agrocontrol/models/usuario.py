
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from database.database import Base


class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False)
    apellido = Column(String(50), nullable=False)
    nombre_usuario = Column(String(50), unique=True, nullable=False)
    contrasena = Column(String(255), nullable=False)
    rol = Column(String(30), nullable=False)

    movimientos_stock = relationship(
        "MovimientoStock",
        back_populates="usuario",
    )
    labores = relationship("Labor", back_populates="usuario")
    riegos = relationship("Riego", back_populates="usuario")
    aplicaciones = relationship("Aplicacion", back_populates="usuario")
    cosechas = relationship("Cosecha", back_populates="usuario")
