from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from models.campania import Campania
from schemas.campania import CampaniaCreate


def crear_campania(db: Session, datos: CampaniaCreate):
    existente = db.query(Campania).filter(
        Campania.nombre == datos.nombre
    ).first()

    if existente:
        raise ValueError("Ya existe una campaña con ese nombre.")

    nueva = Campania(
        nombre=datos.nombre,
        fecha_inicio=datos.fecha_inicio,
        fecha_fin=datos.fecha_fin
    )

    try:
        db.add(nueva)
        db.commit()
        db.refresh(nueva)
        return nueva

    except IntegrityError:
        db.rollback()
        raise ValueError("Ya existe una campaña con ese nombre.")

    except SQLAlchemyError:
        db.rollback()
        raise


def obtener_campanias(db: Session):
    return db.query(Campania).order_by(
        Campania.fecha_inicio.desc()
    ).all()


def obtener_campania_por_nombre(db: Session, nombre: str):
    return db.query(Campania).filter(
        Campania.nombre == nombre
    ).first()


def actualizar_campania(
    db: Session,
    nombre: str,
    datos: CampaniaCreate
):
    campania = obtener_campania_por_nombre(db, nombre)

    if campania is None:
        return None

    otra = db.query(Campania).filter(
        Campania.nombre == datos.nombre,
        Campania.id_campania != campania.id_campania
    ).first()

    if otra:
        raise ValueError("Ya existe otra campaña con ese nombre.")

    try:
        campania.nombre = datos.nombre
        campania.fecha_inicio = datos.fecha_inicio
        campania.fecha_fin = datos.fecha_fin

        db.commit()
        db.refresh(campania)
        return campania

    except IntegrityError:
        db.rollback()
        raise ValueError("Ya existe otra campaña con ese nombre.")

    except SQLAlchemyError:
        db.rollback()
        raise


def eliminar_campania(db: Session, nombre: str):
    campania = obtener_campania_por_nombre(db, nombre)

    if campania is None:
        return None

    try:
        db.delete(campania)
        db.commit()
        return campania

    except IntegrityError:
        db.rollback()
        raise ValueError(
            "No se puede eliminar la campaña porque tiene "
            "campos asociados."
        )

    except SQLAlchemyError:
        db.rollback()
        raise
