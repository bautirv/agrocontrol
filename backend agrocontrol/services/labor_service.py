
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from models.labor import Labor
from models.lote import Lote
from models.campo import Campo
from models.usuario import Usuario
from schemas.labor import LaborCreate


def obtener_lote(
    db: Session,
    nombre_campo: str,
    nombre_lote: str
) -> Lote | None:
    sentencia = (
        select(Lote)
        .join(Campo, Lote.id_campo == Campo.id_campo)
        .where(
            Campo.nombre == nombre_campo,
            Lote.nombre == nombre_lote
        )
    )

    return db.scalars(sentencia).first()


def obtener_labor(
    db: Session,
    id_labor: int
) -> Labor | None:
    sentencia = select(Labor).where(
        Labor.id_labor == id_labor
    )

    return db.scalars(sentencia).first()


def listar_labores(
    db: Session,
    nombre_campo: str | None = None,
    nombre_lote: str | None = None
) -> list[Labor]:
    sentencia = (
        select(Labor)
        .join(Lote, Labor.id_lote == Lote.id_lote)
        .join(Campo, Lote.id_campo == Campo.id_campo)
    )

    if nombre_campo is not None:
        sentencia = sentencia.where(
            Campo.nombre == nombre_campo
        )

    if nombre_lote is not None:
        sentencia = sentencia.where(
            Lote.nombre == nombre_lote
        )

    sentencia = sentencia.order_by(
        Labor.fecha.desc(),
        Labor.id_labor.desc()
    )

    return list(db.scalars(sentencia).all())


def crear_labor(
    db: Session,
    datos: LaborCreate,
    usuario_actual: Usuario
) -> Labor:
    lote = obtener_lote(
        db,
        datos.nombre_campo,
        datos.nombre_lote
    )

    if lote is None:
        raise ValueError(
            "No existe el lote indicado dentro del campo especificado."
        )

    labor = Labor(
        tipo=datos.tipo.strip(),
        fecha=datos.fecha,
        observaciones=datos.observaciones,
        id_lote=lote.id_lote,
        id_usuario=usuario_actual.id_usuario
    )

    try:
        db.add(labor)
        db.commit()
        db.refresh(labor)

        return labor

    except IntegrityError as error:
        db.rollback()
        raise ValueError(
            "No se pudo registrar la labor por un conflicto con los datos."
        ) from error

    except SQLAlchemyError:
        db.rollback()
        raise


def actualizar_labor(
    db: Session,
    id_labor: int,
    datos: LaborCreate
) -> Labor | None:
    labor = obtener_labor(db, id_labor)

    if labor is None:
        return None

    lote = obtener_lote(
        db,
        datos.nombre_campo,
        datos.nombre_lote
    )

    if lote is None:
        raise ValueError(
            "No existe el lote indicado dentro del campo especificado."
        )

    try:
        labor.tipo = datos.tipo.strip()
        labor.fecha = datos.fecha
        labor.observaciones = datos.observaciones
        labor.id_lote = lote.id_lote

        db.commit()
        db.refresh(labor)

        return labor

    except IntegrityError as error:
        db.rollback()
        raise ValueError(
            "No se pudo actualizar la labor por un conflicto con los datos."
        ) from error

    except SQLAlchemyError:
        db.rollback()
        raise


def eliminar_labor(
    db: Session,
    id_labor: int
) -> Labor | None:
    labor = obtener_labor(db, id_labor)

    if labor is None:
        return None

    try:
        db.delete(labor)
        db.commit()

        return labor

    except SQLAlchemyError:
        db.rollback()
        raise
