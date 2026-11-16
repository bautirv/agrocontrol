# Publicar AgroControl en internet (gratis)

Se publican 3 piezas por separado: base de datos, backend y front.
Orden: **1) base de datos → 2) backend → 3) front → 4) conectar el CORS**.

## 1. Base de datos (Aiven o TiDB Cloud, plan gratis)
1. Creá una cuenta y un servicio **MySQL** gratis.
2. Creá la base `agrocontrol` (o usá la que viene por defecto).
3. Copiá los datos de conexión y armá la URL así:
   `mysql+pymysql://USUARIO:CLAVE@HOST:PUERTO/NOMBRE_BASE`
4. Las tablas se crean solas cuando arranca el backend. No hace falta correr los .sql.

## 2. Backend en Render
1. En render.com: **New → Web Service** y conectá el repo.
2. **Root Directory:** `backend agrocontrol`
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Environment Variables:**
   - `DATABASE_URL` = la URL del paso 1
   - `JWT_SECRET_KEY` = una clave larga cualquiera
   - `DB_SSL` = `true`
   - `CORS_ORIGINS` = (se completa en el paso 4)
6. Al terminar te da un link tipo `https://agrocontrol-api.onrender.com`.
   Abrí `/docs` para comprobar que anda.

## 3. Crear el usuario administrador
Desde tu PC, en la carpeta del backend, apuntando a la base de la nube:
```
set DATABASE_URL=mysql+pymysql://USUARIO:CLAVE@HOST:PUERTO/NOMBRE_BASE
set DB_SSL=true
python create_admin.py
```
(En Git Bash usá `export` en vez de `set`.)

## 4. Front en Vercel
1. En vercel.com: **Add New → Project** y elegí el repo.
2. **Root Directory:** `agrocontrol`
3. **Environment Variables:** `VITE_API_URL` = el link del backend (sin barra al final).
4. Deploy. Te da un link tipo `https://agrocontrol.vercel.app`.

## 5. Conectar los dos (CORS)
Volvé a Render → Environment y poné `CORS_ORIGINS` = el link de Vercel
(ej. `https://agrocontrol.vercel.app`, sin barra al final). Render reinicia solo.

## Notas
- El backend gratis de Render se duerme tras ~15 min sin uso: la primera carga tarda cerca de un minuto.
- Si algo falla, mirá la pestaña **Logs** de Render.
