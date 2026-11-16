# AgroControl

Sistema web para gestionar la producción de papa: campañas, campos, lotes, labores, riegos, aplicaciones de productos, cosechas y stock de insumos. Cada usuario ingresa con su cuenta y, según su rol (`ADMIN` o `CAMPO`), puede operar sobre distintas partes del sistema.

Trabajo Práctico Final — Desarrollo de Sistemas Web, ISFT N.º 194 (Tecnicatura Superior en Desarrollo de Software, 3.º año).

## Tecnologías

| Capa | Tecnología |
|---|---|
| Backend / API REST | Python 3.11+, FastAPI, Uvicorn |
| Validación | Pydantic v2 |
| Persistencia | SQLAlchemy 2 + PyMySQL |
| Base de datos | MySQL 8 |
| Autenticación | JWT (PyJWT) + hash de contraseñas con Argon2 (pwdlib) |
| Frontend | React 19 + TypeScript + Vite |
| Documentación | Swagger / OpenAPI automático de FastAPI (`/docs`) |

## Arquitectura

```
Usuario → Frontend (React) → HTTP → Controller (FastAPI) → Service → SQLAlchemy → MySQL
                                                                              ↓
Usuario ← Frontend ← Response JSON ← Controller ← Service ←───────────────────┘
```

```
AgroControl/
├── agrocontrol/              # Frontend (React + Vite)
│   └── src/                  # api.ts (cliente HTTP), servicios.ts, componentes .tsx
└── backend agrocontrol/      # Backend (FastAPI)
    ├── main.py               # App, CORS y registro de routers
    ├── controllers/          # Endpoints HTTP y códigos de respuesta
    ├── services/             # Reglas de negocio
    ├── schemas/              # Modelos Pydantic (Create / Update / Response)
    ├── models/               # Modelos SQLAlchemy
    ├── database/             # Conexión y sesiones
    ├── utils/                # JWT, hash de contraseñas, dependencias de autenticación
    ├── SQL/                  # Script de creación de la base de datos
    ├── create_admin.py       # Crea el primer usuario administrador
    ├── requirements.txt
    └── .env.example
```

Entidades principales: `usuario`, `campania`, `campo`, `lote`, `producto`, `movimientos_stock`, `labor`, `riego`, `orden_aplicacion`, `aplicacion`, `detalle_aplicacion`, `cosecha` y `camion_cosecha`. La jerarquía central es **Campaña → Campo → Lote → (labores, riegos, aplicaciones, cosechas)**.

## Requisitos previos

- [Python 3.11 o superior](https://www.python.org/downloads/)
- [Node.js 20 o superior](https://nodejs.org/) (incluye `npm`)
- [MySQL 8](https://dev.mysql.com/downloads/) en ejecución (o MariaDB equivalente)
- Git

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone <URL-DEL-REPOSITORIO>
cd <carpeta-del-repositorio>
```

### 2. Base de datos

Crear la base y las tablas ejecutando el script incluido (desde la raíz del repositorio):

```bash
mysql -u root -p < "backend agrocontrol/SQL/TABLASAGROCONTROL.sql"
```

También se puede abrir ese archivo en MySQL Workbench y ejecutarlo completo. El script crea la base `agrocontrol` (utf8mb4) y todas las tablas con sus claves foráneas y restricciones.

> Si preferís solo crear la base vacía (`CREATE DATABASE agrocontrol CHARACTER SET utf8mb4;`), el backend crea las tablas que falten al iniciar.

### 3. Backend

```bash
cd "backend agrocontrol"

# Entorno virtual
python -m venv .venv
source .venv/bin/activate          # Linux / macOS
.venv\Scripts\activate             # Windows (PowerShell o CMD)

# Dependencias
pip install -r requirements.txt

# Configuración
cp .env.example .env               # Windows: copy .env.example .env
```

Editar `.env` y completar:

- `DATABASE_URL`: usuario, contraseña y puerto de tu MySQL. Ejemplo: `mysql+pymysql://root:miclave@localhost:3306/agrocontrol`
- `JWT_SECRET_KEY`: una clave secreta propia. Se puede generar con:
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```

Crear el usuario administrador (pide nombre, apellido, usuario y contraseña de al menos 8 caracteres):

```bash
python create_admin.py
```

Iniciar el servidor:

```bash
uvicorn main:app --reload
```

El backend queda disponible en **http://127.0.0.1:8000**:

- Swagger UI: http://127.0.0.1:8000/docs

### 4. Frontend

En otra terminal, desde la raíz del repositorio:

```bash
cd agrocontrol
npm install
npm run dev
```

La aplicación queda disponible en **http://localhost:5173**.

Por defecto el frontend se conecta a `http://127.0.0.1:8000`. Si el backend corre en otra dirección, crear el archivo `agrocontrol/.env` con:

```
VITE_API_URL=http://direccion-del-backend:8000
```

TAMBIÉN ES POSIBLE INICIARLIZAR BACKEND Y FRONTEND CON EL ARCHIVO iniciar.bat, el cual ejecuta los comandos “uvicorn main:app –reload” y “npm run dev”.

## Uso rápido

1. Abrir http://localhost:5173 e ingresar con el administrador creado en el paso 3 (o registrar un usuario nuevo desde la pantalla de acceso).
2. Como administrador: crear una campaña, un campo dentro de ella, un lote dentro del campo y cargar productos y stock.
3. Registrar labores y riegos sobre el lote, emitir una orden de aplicación (admin), ejecutarla como aplicación (descuenta stock) y registrar la cosecha.

## Autenticación y roles

- **Registro** (`POST /usuarios/`): crea un usuario con rol `CAMPO`. Las contraseñas se guardan hasheadas con Argon2, nunca en texto plano.
- **Login** (`POST /usuarios/login`): recibe `username` y `password` (formulario) y devuelve un token JWT con vencimiento de 30 minutos.
- **Rutas protegidas**: casi todos los endpoints requieren el header `Authorization: Bearer <token>`.
- **Autorización por rol**:
  - `CAMPO`: consulta información y registra labores, riegos, aplicaciones y cosechas.
  - `ADMIN`: además crea, modifica y elimina campañas, campos, lotes y productos, gestiona usuarios, emite órdenes de aplicación y registra movimientos de stock.
- El único modo de crear un `ADMIN` es `python create_admin.py` (o que otro administrador cambie el rol desde `PUT /usuarios/{id}`).

### Probar la API desde Swagger

1. Abrir `/docs`.
2. `POST /usuarios/login` → ingresar usuario y contraseña → copiar el `access_token`.
3. Botón **Authorize** (arriba a la derecha) → ingresar usuario y contraseña (Swagger obtiene el token solo).
4. Probar cualquier endpoint protegido.

## Endpoints principales

| Recurso | Ruta base | Operaciones |
|---|---|---|
| Usuarios | `/usuarios` | alta, login, listar, obtener, modificar, eliminar |
| Campañas | `/campanias` | CRUD completo |
| Campos | `/campos` | CRUD completo |
| Lotes | `/campos/{nombre_campo}/lotes` | CRUD completo (anidado en campos) |
| Productos | `/productos` | CRUD completo |
| Stock | `/stock` | consultar stock, listar movimientos (`?nombre_producto=`), registrar movimiento |
| Labores | `/labores` | CRUD (filtros `?nombre_campo=&nombre_lote=`) |
| Riegos | `/riegos` | CRUD (filtros `?nombre_campo=&nombre_lote=`) |
| Órdenes de aplicación | `/ordenes-aplicacion` | crear y listar (filtro `?estado=`) |
| Aplicaciones | `/aplicaciones` | crear y listar (no se pueden eliminar: tienen movimientos de stock asociados) |
| Cosechas | `/cosechas` | crear, listar, obtener, eliminar |

La referencia completa, con schemas y ejemplos, está en `/docs`.

## Reglas de negocio e integridad

- No se puede registrar un egreso de stock mayor al stock disponible.
- No se permiten nombres de usuario, campañas, campos o productos duplicados.
- No se puede eliminar una campaña con campos, un campo con lotes ni un lote con registros asociados.
- Una aplicación solo puede ejecutar una orden de aplicación **pendiente** y que pertenezca al mismo lote; al registrarse descuenta el stock de los productos usados y marca la orden como `REALIZADA`. Si no hay stock suficiente, se rechaza.
- No se puede eliminar un producto con movimientos de stock o aplicaciones asociadas.
- Los datos se validan en dos niveles: estructura y rangos con Pydantic, y reglas dependientes del sistema en la capa de services.

## Códigos HTTP utilizados

| Código | Cuándo |
|---|---|
| `200 OK` / `201 Created` / `204 No Content` | Operaciones exitosas |
| `400 Bad Request` | Datos inválidos para la regla de negocio |
| `401 Unauthorized` | Token ausente, inválido o vencido; credenciales incorrectas |
| `403 Forbidden` | El usuario no tiene rol para la operación |
| `404 Not Found` | Recurso inexistente |
| `409 Conflict` | Duplicados o conflictos de integridad |
| `422 Unprocessable Entity` | Error de validación de Pydantic |

## Seguridad

- Contraseñas hasheadas con Argon2.
- Tokens JWT firmados con una clave que se lee desde `.env` (no está en el código ni en el repositorio).
- Autenticación y autorización verificadas del lado servidor.
- Las respuestas de usuario no incluyen la contraseña.
- CORS configurado para el frontend en `localhost:5173`. Para otros orígenes, usar la variable `CORS_ORIGINS`.

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `RuntimeError: Falta configurar ... DATABASE_URL` o `JWT_SECRET_KEY` | No existe el archivo `.env` o le faltan variables. Copiar `.env.example` y completarlo. |
| `Access denied for user` | Usuario o contraseña incorrectos en `DATABASE_URL`. |
| `Unknown database 'agrocontrol'` | No se ejecutó el script SQL del paso 2. |
| `'cryptography' package is required` | Ejecutar `pip install cryptography` (MySQL 8 usa `caching_sha2_password`). |
| El frontend muestra "No se pudo conectar con el servidor" | El backend no está iniciado o `VITE_API_URL` apunta a otra dirección. |
| Error de CORS en el navegador | El frontend corre en un puerto distinto de 5173: agregarlo en `CORS_ORIGINS`. |
| `ModuleNotFoundError` al iniciar uvicorn | Ejecutar `uvicorn` desde la carpeta `backend agrocontrol` con el entorno virtual activado. |

## Integrantes

- Franco Galante
- Bautista Rodríguez Viau

Docente: Rodrigo Soto
