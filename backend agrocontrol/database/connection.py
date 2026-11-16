import os

from dotenv import load_dotenv
from sqlalchemy import create_engine

# Lee las variables del archivo .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
    )

engine = create_engine(
    DATABASE_URL,
    # Para ver en la consola cada consulta SQL, poné SQL_ECHO=true en el .env
    echo=os.getenv("SQL_ECHO", "false").lower() == "true"
)
