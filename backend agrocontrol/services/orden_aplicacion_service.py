
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from models.orden_aplicacion import OrdenAplicacion
from models.lote import Lote
from models.campo import Campo
from models.usuario import Usuario
from schemas.orden_aplicacion import OrdenAplicacionCreate


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


def listar_ordenes(
    db: Session,
    nombre_campo: str | None = None,
    nombre_lote: str | None = None,
    estado: str | None = None
) -> list[OrdenAplicacion]:
    sentencia = (
        select(OrdenAplicacion)
        .join(Lote, OrdenAplicacion.id_lote == Lote.id_lote)
        .join(Campo, Lote.id_campo == Campo.id_campo)
    )

    if nombre_campo is not None:
        sentencia = sentencia.where(Campo.nombre == nombre_campo)

    if nombre_lote is not None:
        sentencia = sentencia.where(Lote.nombre == nombre_lote)

    if estado is not None:
        sentencia = sentencia.where(OrdenAplicacion.estado == estado)

    sentencia = sentencia.order_by(
        OrdenAplicacion.fecha.desc(),
        OrdenAplicacion.id_orden_aplicacion.desc()
    )

    return list(db.scalars(sentencia).all())


def crear_orden(
    db: Session,
    datos: OrdenAplicacionCreate,
    usuario_actual: Usuario
) -> OrdenAplicacion:
    lote = obtener_lote(
        db,
        datos.nombre_campo,
        datos.nombre_lote
    )

    if lote is None:
        raise ValueError(
            "No existe el lote indicado dentro del campo especificado."
        )

    orden = OrdenAplicacion(
        fecha=datos.fecha,
        objetivo=datos.objetivo,
        observaciones=datos.observaciones,
        estado=datos.estado,
        id_lote=lote.id_lote,
        id_usuario=usuario_actual.id_usuario
    )

    try:
        db.add(orden)
        db.commit()
        db.refresh(orden)
        return orden

    except IntegrityError as error:
        db.rollback()
        raise ValueError(
            "No se pudo registrar la orden por un conflicto con los datos."
        ) from error

    except SQLAlchemyError:
        db.rollback()
        raise
