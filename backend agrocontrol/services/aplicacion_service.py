
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from models.aplicacion import Aplicacion
from models.detalle_aplicacion import DetalleAplicacion
from models.orden_aplicacion import OrdenAplicacion
from models.lote import Lote
from models.campo import Campo
from models.producto import Producto
from models.movimiento_stock import MovimientoStock
from models.usuario import Usuario
from schemas.aplicacion import AplicacionCreate


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


def obtener_aplicacion(
    db: Session,
    id_aplicacion: int
) -> Aplicacion | None:
    return db.scalars(
        select(Aplicacion).where(
            Aplicacion.id_aplicacion == id_aplicacion
        )
    ).first()


def listar_aplicaciones(
    db: Session,
    nombre_campo: str | None = None,
    nombre_lote: str | None = None
) -> list[Aplicacion]:
    sentencia = (
        select(Aplicacion)
        .join(Lote, Aplicacion.id_lote == Lote.id_lote)
        .join(Campo, Lote.id_campo == Campo.id_campo)
    )

    if nombre_campo is not None:
        sentencia = sentencia.where(Campo.nombre == nombre_campo)

    if nombre_lote is not None:
        sentencia = sentencia.where(Lote.nombre == nombre_lote)

    return list(
        db.scalars(
            sentencia.order_by(
                Aplicacion.fecha.desc(),
                Aplicacion.id_aplicacion.desc()
            )
        ).all()
    )


def _stock_actual(
    db: Session,
    id_producto: int
):
    movimientos = db.scalars(
        select(MovimientoStock).where(
            MovimientoStock.id_producto == id_producto
        )
    ).all()

    stock = 0

    for movimiento in movimientos:
        if movimiento.tipo == "INGRESO":
            stock += movimiento.cantidad
        elif movimiento.tipo == "EGRESO":
            stock -= movimiento.cantidad

    return stock


def crear_aplicacion(
    db: Session,
    datos: AplicacionCreate,
    usuario_actual: Usuario
) -> Aplicacion:
    lote = obtener_lote(
        db,
        datos.nombre_campo,
        datos.nombre_lote
    )

    if lote is None:
        raise ValueError(
            "No existe el lote indicado dentro del campo especificado."
        )

    orden = db.scalars(
        select(OrdenAplicacion).where(
            OrdenAplicacion.id_orden_aplicacion
            == datos.id_orden_aplicacion
        )
    ).first()

    if orden is None:
        raise ValueError("La orden de aplicación no existe.")

    if orden.id_lote != lote.id_lote:
        raise ValueError(
            "La orden de aplicación no pertenece al lote indicado."
        )

    if orden.estado != "PENDIENTE":
        raise ValueError(
            "Solo se pueden ejecutar órdenes que estén pendientes."
        )

    if not datos.productos:
        raise ValueError(
            "Debe incluir al menos un producto en la aplicación."
        )

    productos_resueltos = []
    cantidades_por_producto = {}

    for detalle in datos.productos:
        producto = db.scalars(
            select(Producto).where(
                Producto.nombre_comercial == detalle.nombre_producto
            )
        ).first()

        if producto is None:
            raise ValueError(
                f"El producto '{detalle.nombre_producto}' no existe."
            )

        id_producto = producto.id_producto

        cantidades_por_producto[id_producto] = (
            cantidades_por_producto.get(id_producto, 0)
            + detalle.cantidad
        )

        productos_resueltos.append(
            (producto, detalle.cantidad)
        )

    for id_producto, cantidad_total in cantidades_por_producto.items():
        disponible = _stock_actual(db, id_producto)

        if cantidad_total > disponible:
            raise ValueError(
                f"Stock insuficiente para uno de los productos. "
                f"Disponible: {disponible}."
            )

    aplicacion = Aplicacion(
        fecha=datos.fecha,
        temperatura=datos.temperatura,
        humedad=datos.humedad,
        viento=datos.viento,
        observaciones=datos.observaciones,
        id_lote=lote.id_lote,
        id_orden_aplicacion=orden.id_orden_aplicacion,
        id_usuario=usuario_actual.id_usuario
    )

    try:
        db.add(aplicacion)
        db.flush()

        for producto, cantidad in productos_resueltos:
            detalle = DetalleAplicacion(
                id_aplicacion=aplicacion.id_aplicacion,
                id_producto=producto.id_producto,
                cantidad=cantidad
            )
            db.add(detalle)

            movimiento = MovimientoStock(
                tipo="EGRESO",
                cantidad=cantidad,
                observacion=(
                    f"Consumo por aplicación #{aplicacion.id_aplicacion}"
                ),
                id_producto=producto.id_producto,
                id_usuario=usuario_actual.id_usuario
            )
            db.add(movimiento)

        orden.estado = "REALIZADA"

        db.commit()
        db.refresh(aplicacion)

        return aplicacion

    except IntegrityError as error:
        db.rollback()
        raise ValueError(
            "No se pudo registrar la aplicación por un conflicto con los datos."
        ) from error

    except SQLAlchemyError:
        db.rollback()
        raise


def eliminar_aplicacion(
    db: Session,
    id_aplicacion: int
) -> Aplicacion | None:
    aplicacion = obtener_aplicacion(db, id_aplicacion)

    if aplicacion is None:
        return None

    raise ValueError(
        "No se permite eliminar una aplicación registrada porque tiene "
        "movimientos de stock asociados. Se debe implementar una anulación "
        "que revierta el consumo."
    )
