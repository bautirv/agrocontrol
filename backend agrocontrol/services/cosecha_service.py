
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from models.cosecha import Cosecha
from models.campo import Campo
from models.lote import Lote
from models.camion_cosecha import CamionCosecha
from schemas.cosecha import CosechaCreate


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


def obtener_cosecha(
    db: Session,
    id_cosecha: int
) -> Cosecha | None:
    return db.get(Cosecha, id_cosecha)


def listar_cosechas(
    db: Session,
    nombre_campo: str | None = None,
    nombre_lote: str | None = None
) -> list[Cosecha]:
    sentencia = (
        select(Cosecha)
        .join(Lote, Cosecha.id_lote == Lote.id_lote)
        .join(Campo, Lote.id_campo == Campo.id_campo)
    )

    if nombre_campo:
        sentencia = sentencia.where(Campo.nombre == nombre_campo)

    if nombre_lote:
        sentencia = sentencia.where(Lote.nombre == nombre_lote)

    sentencia = sentencia.order_by(Cosecha.fecha.desc())

    return list(db.scalars(sentencia).all())


def crear_cosecha(
    db: Session,
    datos: CosechaCreate,
    id_usuario: int
) -> Cosecha:
    lote = obtener_lote(
        db,
        datos.nombre_campo,
        datos.nombre_lote
    )

    if lote is None:
        raise ValueError("El lote indicado no existe en ese campo.")

    total_camiones = sum(
        (camion.cantidad_transportada for camion in datos.camiones),
        Decimal("0")
    )

    if total_camiones > datos.cantidad_cosechada:
        raise ValueError(
            "La suma transportada por los camiones no puede superar "
            "la cantidad cosechada."
        )

    nueva_cosecha = Cosecha(
        fecha=datos.fecha,
        dtve=datos.dtve.strip(),
        cantidad_cosechada=datos.cantidad_cosechada,
        observaciones=datos.observaciones,
        id_lote=lote.id_lote,
        id_usuario=id_usuario
    )

    if not nueva_cosecha.dtve:
        raise ValueError("El DTVe es obligatorio.")

    try:
        for datos_camion in datos.camiones:
            nuevo_camion = CamionCosecha(
                patente=datos_camion.patente.strip().upper(),
                cantidad_transportada=datos_camion.cantidad_transportada,
                destino=datos_camion.destino.strip(),
                observaciones=datos_camion.observaciones,
            )
            nueva_cosecha.camiones.append(nuevo_camion)

        db.add(nueva_cosecha)
        db.commit()
        db.refresh(nueva_cosecha)

        return nueva_cosecha

    except IntegrityError as error:
        db.rollback()
        raise ValueError(
            "No se pudo registrar la cosecha por un conflicto con los datos."
        ) from error
    except SQLAlchemyError:
        db.rollback()
        raise


def eliminar_cosecha(
    db: Session,
    id_cosecha: int
) -> Cosecha | None:
    cosecha = obtener_cosecha(db, id_cosecha)

    if cosecha is None:
        return None

    try:
        db.delete(cosecha)
        db.commit()
        return cosecha
    except IntegrityError as error:
        db.rollback()
        raise ValueError(
            "No se puede eliminar la cosecha porque tiene otros registros asociados."
        ) from error
    except SQLAlchemyError:
        db.rollback()
        raise


from decimal import Decimal
