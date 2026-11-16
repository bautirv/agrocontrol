import os
import ssl

from dotenv import load_dotenv
from sqlalchemy import create_engine

# Lee las variables del archivo .env (en local) o del entorno (en la nube)
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "Falta DATABASE_URL. Crea un archivo .env en esta carpeta con "
        "DATABASE_URL=mysql+pymysql://usuario:clave@host:3306/agrocontrol "
        "y JWT_SECRET_KEY=una-clave-larga."
    )

# Las bases MySQL en la nube (Aiven, TiDB, etc.) exigen conexión cifrada.
# Para activarla, poné DB_SSL=true en las variables de entorno.
connect_args = {}
if os.getenv("DB_SSL", "false").lower() == "true":
    connect_args["ssl"] = ssl.create_default_context()

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,  # reconecta si la base cortó la conexión por inactividad
    pool_recycle=280,
    # Para ver en la consola cada consulta SQL, poné SQL_ECHO=true
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
)
