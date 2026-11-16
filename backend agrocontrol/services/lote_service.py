
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from models.lote import Lote
from models.campo import Campo
from schemas.lote import LoteCreate


def obtener_campo_por_nombre(
    db: Session,
    nombre_campo: str
) -> Campo | None:
    sentencia = select(Campo).where(
        Campo.nombre == nombre_campo
    )

    return db.scalars(sentencia).first()


def obtener_lote_por_nombre(
    db: Session,
    nombre_campo: str,
    nombre_lote: str
) -> Lote | None:
    campo = obtener_campo_por_nombre(
        db,
        nombre_campo
    )

    if campo is None:
        return None

    sentencia = select(Lote).where(
        Lote.nombre == nombre_lote,
        Lote.id_campo == campo.id_campo
    )

    return db.scalars(sentencia).first()


def crear_lote(
    db: Session,
    nombre_campo: str,
    datos: LoteCreate
) -> Lote:
    campo = obtener_campo_por_nombre(
        db,
        nombre_campo
    )

    if campo is None:
        raise ValueError("El campo indicado no existe.")

    sentencia = select(Lote).where(
        Lote.nombre == datos.nombre,
        Lote.id_campo == campo.id_campo
    )

    existente = db.scalars(sentencia).first()

    if existente is not None:
        raise ValueError(
            "Ya existe un lote con ese nombre dentro del campo."
        )

    nuevo_lote = Lote(
        nombre=datos.nombre,
        superficie=datos.superficie,
        variedad=datos.variedad,
        fecha_siembra=datos.fecha_siembra,
        cantidad_semilla=datos.cantidad_semilla,
        id_campo=campo.id_campo
    )

    try:
        db.add(nuevo_lote)
        db.commit()
        db.refresh(nuevo_lote)

        return nuevo_lote

    except IntegrityError as error:
        db.rollback()

        raise ValueError(
            "No se pudo crear el lote por un conflicto con los datos."
        ) from error

    except SQLAlchemyError:
        db.rollback()
        raise


def obtener_lotes_de_campo(
    db: Session,
    nombre_campo: str
) -> list[Lote] | None:
    campo = obtener_campo_por_nombre(
        db,
        nombre_campo
    )

    if campo is None:
        return None

    sentencia = (
        select(Lote)
        .where(Lote.id_campo == campo.id_campo)
        .order_by(Lote.nombre.asc())
    )

    return list(db.scalars(sentencia).all())


def actualizar_lote(
    db: Session,
    nombre_campo: str,
    nombre_lote: str,
    datos: LoteCreate
) -> Lote | None:
    lote = obtener_lote_por_nombre(
        db,
        nombre_campo,
        nombre_lote
    )

    if lote is None:
        return None

    id_lote_actual = lote.id_lote

    sentencia = select(Lote).where(
        Lote.nombre == datos.nombre,
        Lote.id_campo == lote.id_campo,
        Lote.id_lote != id_lote_actual
    )

    otro_lote = db.scalars(sentencia).first()

    if otro_lote is not None:
        raise ValueError(
            "Ya existe otro lote con ese nombre dentro del campo."
        )

    try:
        lote.nombre = datos.nombre
        lote.superficie = datos.superficie
        lote.variedad = datos.variedad
        lote.fecha_siembra = datos.fecha_siembra
        lote.cantidad_semilla = datos.cantidad_semilla

        db.commit()
        db.refresh(lote)

        return lote

    except IntegrityError as error:
        db.rollback()

        raise ValueError(
            "No se pudo actualizar el lote por un conflicto con los datos."
        ) from error

    except SQLAlchemyError:
        db.rollback()
        raise


def eliminar_lote(
    db: Session,
    nombre_campo: str,
    nombre_lote: str
) -> Lote | None:
    lote = obtener_lote_por_nombre(
        db,
        nombre_campo,
        nombre_lote
    )

    if lote is None:
        return None

    try:
        db.delete(lote)
        db.commit()

        return lote

    except IntegrityError as error:
        db.rollback()

        raise ValueError(
            "No se puede eliminar el lote porque tiene registros asociados."
        ) from error

    except SQLAlchemyError:
        db.rollback()
        raise
