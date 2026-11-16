
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from models.riego import Riego
from models.lote import Lote
from models.campo import Campo
from models.usuario import Usuario
from schemas.riego import RiegoCreate


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


def obtener_riego(
    db: Session,
    id_riego: int
) -> Riego | None:
    sentencia = select(Riego).where(
        Riego.id_riego == id_riego
    )

    return db.scalars(sentencia).first()


def listar_riegos(
    db: Session,
    nombre_campo: str | None = None,
    nombre_lote: str | None = None
) -> list[Riego]:
    sentencia = (
        select(Riego)
        .join(Lote, Riego.id_lote == Lote.id_lote)
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
        Riego.fecha.desc(),
        Riego.hora_inicio.desc()
    )

    return list(db.scalars(sentencia).all())


def crear_riego(
    db: Session,
    datos: RiegoCreate,
    usuario_actual: Usuario
) -> Riego:
    if datos.hora_fin <= datos.hora_inicio:
        raise ValueError(
            "La hora de fin debe ser posterior a la hora de inicio."
        )

    lote = obtener_lote(
        db,
        datos.nombre_campo,
        datos.nombre_lote
    )

    if lote is None:
        raise ValueError(
            "No existe el lote indicado dentro del campo especificado."
        )

    riego = Riego(
        fecha=datos.fecha,
        hora_inicio=datos.hora_inicio,
        hora_fin=datos.hora_fin,
        cantidad_agua=datos.cantidad_agua,
        observaciones=datos.observaciones,
        id_lote=lote.id_lote,
        id_usuario=usuario_actual.id_usuario
    )

    try:
        db.add(riego)
        db.commit()
        db.refresh(riego)
        return riego

    except IntegrityError as error:
        db.rollback()
        raise ValueError(
            "No se pudo registrar el riego por un conflicto con los datos."
        ) from error

    except SQLAlchemyError:
        db.rollback()
        raise


def actualizar_riego(
    db: Session,
    id_riego: int,
    datos: RiegoCreate
) -> Riego | None:
    riego = obtener_riego(db, id_riego)

    if riego is None:
        return None

    if datos.hora_fin <= datos.hora_inicio:
        raise ValueError(
            "La hora de fin debe ser posterior a la hora de inicio."
        )

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
        riego.fecha = datos.fecha
        riego.hora_inicio = datos.hora_inicio
        riego.hora_fin = datos.hora_fin
        riego.cantidad_agua = datos.cantidad_agua
        riego.observaciones = datos.observaciones
        riego.id_lote = lote.id_lote

        db.commit()
        db.refresh(riego)
        return riego

    except IntegrityError as error:
        db.rollback()
        raise ValueError(
            "No se pudo actualizar el riego por un conflicto con los datos."
        ) from error

    except SQLAlchemyError:
        db.rollback()
        raise


def eliminar_riego(
    db: Session,
    id_riego: int
) -> Riego | None:
    riego = obtener_riego(db, id_riego)

    if riego is None:
        return None

    try:
        db.delete(riego)
        db.commit()
        return riego

    except SQLAlchemyError:
        db.rollback()
        raise
