
from getpass import getpass

from sqlalchemy.exc import IntegrityError

from database.database import SessionLocal
from models.usuario import Usuario
from utils.security import hash_password


def main():
    print("=== Crear administrador de AgroControl ===")

    nombre = input("Nombre: ").strip()
    apellido = input("Apellido: ").strip()
    nombre_usuario = input("Nombre de usuario: ").strip()

    if not nombre or not apellido or not nombre_usuario:
        print("Error: todos los campos son obligatorios.")
        return

    contrasena = getpass("Contraseña (mínimo 8 caracteres): ")
    confirmacion = getpass("Repetí la contraseña: ")

    if len(contrasena) < 8:
        print("Error: la contraseña debe tener al menos 8 caracteres.")
        return

    if contrasena != confirmacion:
        print("Error: las contraseñas no coinciden.")
        return

    db = SessionLocal()

    try:
        existente = db.query(Usuario).filter(
            Usuario.nombre_usuario == nombre_usuario
        ).first()

        if existente:
            print(
                "Error: ese nombre de usuario ya existe. "
                "No se modificó ninguna cuenta."
            )
            return

        administrador = Usuario(
            nombre=nombre,
            apellido=apellido,
            nombre_usuario=nombre_usuario,
            contrasena=hash_password(contrasena),
            rol="ADMIN"
        )

        db.add(administrador)
        db.commit()

        print(
            f"Administrador '{nombre_usuario}' creado correctamente."
        )

    except IntegrityError:
        db.rollback()
        print("Error: no se pudo crear el administrador.")
        print("Puede que el nombre de usuario ya esté en uso.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
