
from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey
from sqlalchemy.orm import relationship

from database.database import Base


class Labor(Base):
    __tablename__ = "labor"

    id_labor = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(100), nullable=False)
    fecha = Column(Date, nullable=False)
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

    lote = relationship("Lote", back_populates="labores")
    usuario = relationship("Usuario", back_populates="labores")
