
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from models.producto import Producto
from models.movimiento_stock import MovimientoStock
from models.detalle_aplicacion import DetalleAplicacion
from schemas.producto import ProductoCreate


def obtener_producto_por_nombre(
    db: Session,
    nombre_comercial: str
) -> Producto | None:
    return db.query(Producto).filter(
        Producto.nombre_comercial == nombre_comercial
    ).first()


def obtener_productos(db: Session) -> list[Producto]:
    return db.query(Producto).order_by(
        Producto.nombre_comercial
    ).all()


def crear_producto(
    db: Session,
    datos: ProductoCreate
) -> Producto:
    existente = obtener_producto_por_nombre(
        db,
        datos.nombre_comercial
    )

    if existente is not None:
        raise ValueError(
            "Ya existe un producto con ese nombre comercial."
        )

    producto = Producto(
        nombre_comercial=datos.nombre_comercial,
        principio_activo=datos.principio_activo,
        concentracion=datos.concentracion,
        tipo=datos.tipo,
        unidad_medida=datos.unidad_medida
    )

    try:
        db.add(producto)
        db.commit()
        db.refresh(producto)
        return producto

    except IntegrityError as error:
        db.rollback()
        raise ValueError(
            "No se pudo crear el producto por un conflicto con los datos."
        ) from error


def actualizar_producto(
    db: Session,
    nombre_actual: str,
    datos: ProductoCreate
) -> Producto | None:
    producto = obtener_producto_por_nombre(
        db,
        nombre_actual
    )

    if producto is None:
        return None

    otro_producto = db.query(Producto).filter(
        Producto.nombre_comercial == datos.nombre_comercial,
        Producto.id_producto != producto.id_producto
    ).first()

    if otro_producto is not None:
        raise ValueError(
            "Ya existe otro producto con ese nombre comercial."
        )

    producto.nombre_comercial = datos.nombre_comercial
    producto.principio_activo = datos.principio_activo
    producto.concentracion = datos.concentracion
    producto.tipo = datos.tipo
    producto.unidad_medida = datos.unidad_medida

    try:
        db.commit()
        db.refresh(producto)
        return producto

    except IntegrityError as error:
        db.rollback()
        raise ValueError(
            "No se pudo actualizar el producto por un conflicto con los datos."
        ) from error


def eliminar_producto(
    db: Session,
    nombre_comercial: str
) -> Producto | None:
    producto = obtener_producto_por_nombre(
        db,
        nombre_comercial
    )

    if producto is None:
        return None

    tiene_movimientos = db.query(MovimientoStock).filter(
        MovimientoStock.id_producto == producto.id_producto
    ).first()

    tiene_detalles = db.query(DetalleAplicacion).filter(
        DetalleAplicacion.id_producto == producto.id_producto
    ).first()

    if tiene_movimientos or tiene_detalles:
        raise ValueError(
            "No se puede eliminar el producto porque tiene movimientos "
            "de stock o registros de aplicaciones asociados."
        )

    try:
        db.delete(producto)
        db.commit()
        return producto

    except IntegrityError as error:
        db.rollback()
        raise ValueError(
            "No se puede eliminar el producto porque tiene registros asociados."
        ) from error
