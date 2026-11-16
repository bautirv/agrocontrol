
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from models.usuario import Usuario
from schemas.usuario import UsuarioCreate, UsuarioUpdate
from utils.security import hash_password, verify_password


def crear_usuario(db: Session, usuario: UsuarioCreate):
    nuevo_usuario = Usuario(
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        nombre_usuario=usuario.nombre_usuario,
        contrasena=hash_password(usuario.contrasena),
        rol="CAMPO"
    )

    try:
        db.add(nuevo_usuario)
        db.commit()
        db.refresh(nuevo_usuario)
        return nuevo_usuario

    except IntegrityError:
        db.rollback()
        raise ValueError(
            "No se pudo crear el usuario. "
            "El nombre de usuario puede estar en uso."
        )

    except SQLAlchemyError:
        db.rollback()
        raise


def autenticar_usuario(
    db: Session,
    nombre_usuario: str,
    contrasena: str
):
    usuario = db.query(Usuario).filter(
        Usuario.nombre_usuario == nombre_usuario
    ).first()

    if usuario is None:
        return None

    if not verify_password(contrasena, usuario.contrasena):
        return None

    return usuario


def obtener_usuarios(db: Session):
    return db.query(Usuario).all()


def obtener_usuario(db: Session, id_usuario: int):
    return db.query(Usuario).filter(
        Usuario.id_usuario == id_usuario
    ).first()


def _cantidad_admins(db: Session) -> int:
    return db.query(Usuario).filter(Usuario.rol == "ADMIN").count()


def actualizar_usuario(
    db: Session,
    id_usuario: int,
    datos: UsuarioUpdate,
    usuario_actual: Usuario | None = None
):
    usuario_db = obtener_usuario(db, id_usuario)

    if usuario_db is None:
        return None

    cambios = datos.model_dump(exclude_unset=True)

    for campo, valor in cambios.items():
        if valor is None:
            raise ValueError(
                f"El campo '{campo}' no puede ser nulo."
            )

    # Reglas para cambiar roles: un admin no se saca el rol a sí mismo
    # y siempre tiene que quedar al menos un administrador.
    if "rol" in cambios and cambios["rol"] != usuario_db.rol:
        if usuario_actual is not None and usuario_actual.id_usuario == id_usuario:
            raise ValueError("No podés cambiar tu propio rol.")

        if usuario_db.rol == "ADMIN" and _cantidad_admins(db) <= 1:
            raise ValueError(
                "No se puede quitar el rol al único administrador."
            )

    # Comprobar que el nombre no pertenezca a otra cuenta.
    if "nombre_usuario" in cambios:
        usuario_existente = db.query(Usuario).filter(
            Usuario.nombre_usuario == cambios["nombre_usuario"],
            Usuario.id_usuario != id_usuario
        ).first()

        if usuario_existente is not None:
            raise ValueError(
                "Ese nombre de usuario ya está siendo "
                "utilizado por otra cuenta."
            )

    # Solo cambiar la contraseña si fue enviada.
    if "contrasena" in cambios:
        cambios["contrasena"] = hash_password(
            cambios["contrasena"]
        )

    try:
        for campo, valor in cambios.items():
            setattr(usuario_db, campo, valor)

        db.commit()
        db.refresh(usuario_db)
        return usuario_db

    except IntegrityError:
        db.rollback()
        raise ValueError(
            "No se pudo actualizar el usuario. "
            "Verificá que el nombre de usuario no esté "
            "siendo utilizado por otra cuenta."
        )

    except SQLAlchemyError:
        db.rollback()
        raise


def eliminar_usuario(
    db: Session,
    id_usuario: int,
    usuario_actual: Usuario | None = None
):
    usuario_db = obtener_usuario(db, id_usuario)

    if usuario_db is None:
        return None

    if usuario_actual is not None and usuario_actual.id_usuario == id_usuario:
        raise ValueError("No podés eliminar tu propia cuenta.")

    if usuario_db.rol == "ADMIN" and _cantidad_admins(db) <= 1:
        raise ValueError("No se puede eliminar al único administrador.")

    try:
        db.delete(usuario_db)
        db.commit()
        return usuario_db

    except IntegrityError:
        db.rollback()
        raise ValueError(
            "No se puede eliminar el usuario porque tiene registros "
            "asociados (labores, riegos, aplicaciones, cosechas o "
            "movimientos de stock)."
        )

    except SQLAlchemyError:
        db.rollback()
        raise
