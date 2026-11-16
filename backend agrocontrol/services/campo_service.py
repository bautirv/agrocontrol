
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from models.campo import Campo
from models.campania import Campania
from schemas.campo import CampoCreate


def crear_campo(db: Session, datos: CampoCreate):
    campania = db.query(Campania).filter(
        Campania.nombre == datos.nombre_campania
    ).first()

    if campania is None:
        raise ValueError("La campaña indicada no existe.")

    existente = db.query(Campo).filter(
        Campo.nombre == datos.nombre
    ).first()

    if existente:
        raise ValueError("Ya existe un campo con ese nombre.")

    nuevo_campo = Campo(
        nombre=datos.nombre,
        ubicacion=datos.ubicacion,
        superficie_total=datos.superficie_total,
        id_campania=campania.id_campania
    )

    try:
        db.add(nuevo_campo)
        db.commit()
        db.refresh(nuevo_campo)
        return nuevo_campo

    except IntegrityError:
        db.rollback()
        raise ValueError(
            "No se pudo crear el campo por un conflicto con los datos."
        )

    except SQLAlchemyError:
        db.rollback()
        raise


def obtener_campos(db: Session):
    return db.query(Campo).order_by(
        Campo.nombre.asc()
    ).all()


def obtener_campo_por_nombre(db: Session, nombre: str):
    return db.query(Campo).filter(
        Campo.nombre == nombre
    ).first()


def actualizar_campo(
    db: Session,
    nombre_actual: str,
    datos: CampoCreate
):
    campo_db = obtener_campo_por_nombre(db, nombre_actual)

    if campo_db is None:
        return None

    campania = db.query(Campania).filter(
        Campania.nombre == datos.nombre_campania
    ).first()

    if campania is None:
        raise ValueError("La campaña indicada no existe.")

    otro_campo = db.query(Campo).filter(
        Campo.nombre == datos.nombre,
        Campo.id_campo != campo_db.id_campo
    ).first()

    if otro_campo:
        raise ValueError("Ya existe otro campo con ese nombre.")

    try:
        campo_db.nombre = datos.nombre
        campo_db.ubicacion = datos.ubicacion
        campo_db.superficie_total = datos.superficie_total
        campo_db.id_campania = campania.id_campania

        db.commit()
        db.refresh(campo_db)
        return campo_db

    except IntegrityError:
        db.rollback()
        raise ValueError(
            "No se pudo actualizar el campo por un conflicto con los datos."
        )

    except SQLAlchemyError:
        db.rollback()
        raise


def eliminar_campo(db: Session, nombre: str):
    campo_db = obtener_campo_por_nombre(db, nombre)

    if campo_db is None:
        return None

    try:
        db.delete(campo_db)
        db.commit()
        return campo_db

    except IntegrityError:
        db.rollback()
        raise ValueError(
            "No se puede eliminar el campo porque tiene lotes asociados."
        )

    except SQLAlchemyError:
        db.rollback()
        raise
