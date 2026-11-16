
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from models.movimiento_stock import MovimientoStock
from models.producto import Producto
from models.usuario import Usuario
from schemas.stock import MovimientoStockCreate


def obtener_producto_por_nombre(
    db: Session,
    nombre_producto: str
) -> Producto | None:
    sentencia = select(Producto).where(
        Producto.nombre_comercial == nombre_producto
    )
    return db.scalars(sentencia).first()


def calcular_stock(
    db: Session,
    id_producto: int
) -> float:
    sentencia = select(MovimientoStock).where(
        MovimientoStock.id_producto == id_producto
    )

    movimientos = db.scalars(sentencia).all()

    stock = 0.0

    for movimiento in movimientos:
        if movimiento.tipo == "INGRESO":
            stock += movimiento.cantidad
        elif movimiento.tipo == "EGRESO":
            stock -= movimiento.cantidad

    return stock


def obtener_stock_producto(
    db: Session,
    nombre_producto: str
) -> dict | None:
    producto = obtener_producto_por_nombre(
        db,
        nombre_producto
    )

    if producto is None:
        return None

    return {
        "nombre_producto": producto.nombre_comercial,
        "unidad_medida": producto.unidad_medida,
        "stock_actual": calcular_stock(db, producto.id_producto)
    }


def listar_stock(db: Session) -> list[dict]:
    sentencia = select(Producto).order_by(
        Producto.nombre_comercial
    )

    productos = db.scalars(sentencia).all()

    return [
        {
            "nombre_producto": producto.nombre_comercial,
            "unidad_medida": producto.unidad_medida,
            "stock_actual": calcular_stock(
                db,
                producto.id_producto
            )
        }
        for producto in productos
    ]


def listar_movimientos(
    db: Session,
    nombre_producto: str | None = None
) -> list[MovimientoStock]:
    sentencia = select(MovimientoStock)

    if nombre_producto is not None:
        producto = obtener_producto_por_nombre(
            db,
            nombre_producto
        )

        if producto is None:
            return []

        sentencia = sentencia.where(
            MovimientoStock.id_producto == producto.id_producto
        )

    sentencia = sentencia.order_by(
        MovimientoStock.fecha.desc(),
        MovimientoStock.id_movimiento.desc()
    )

    return list(db.scalars(sentencia).all())


def registrar_movimiento(
    db: Session,
    datos: MovimientoStockCreate,
    usuario_actual: Usuario
) -> MovimientoStock:
    producto = obtener_producto_por_nombre(
        db,
        datos.nombre_producto
    )

    if producto is None:
        raise ValueError("El producto indicado no existe.")

    if datos.tipo == "EGRESO":
        stock_actual = calcular_stock(
            db,
            producto.id_producto
        )

        if datos.cantidad > stock_actual:
            raise ValueError(
                f"Stock insuficiente. Disponible: {stock_actual} "
                f"{producto.unidad_medida}."
            )

    movimiento = MovimientoStock(
        tipo=datos.tipo,
        cantidad=datos.cantidad,
        observacion=datos.observacion,
        id_producto=producto.id_producto,
        id_usuario=usuario_actual.id_usuario
    )

    try:
        db.add(movimiento)
        db.commit()
        db.refresh(movimiento)
        return movimiento

    except IntegrityError as error:
        db.rollback()
        raise ValueError(
            "No se pudo registrar el movimiento por un conflicto con los datos."
        ) from error

    except SQLAlchemyError:
        db.rollback()
        raise
