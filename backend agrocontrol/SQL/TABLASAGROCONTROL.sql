CREATE DATABASE agrocontrol
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE agrocontrol;

-- 1. Usuarios
CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL
);

-- 2. Campañas
CREATE TABLE campania (
    id_campania INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE
);

-- 3. Campos
CREATE TABLE campo (
    id_campo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(150),
    superficie_total DECIMAL(10,2) NOT NULL,
    id_campania INT NOT NULL,

    CONSTRAINT fk_campo_campania
        FOREIGN KEY (id_campania)
        REFERENCES campania(id_campania),

    CONSTRAINT ck_campo_superficie
        CHECK (superficie_total > 0)
);

-- 4. Lotes
CREATE TABLE lote (
    id_lote INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    superficie DECIMAL(10,2) NOT NULL,
    variedad VARCHAR(100) NOT NULL,
    fecha_siembra DATE,
    cantidad_semilla DECIMAL(10,2),
    id_campo INT NOT NULL,

    CONSTRAINT fk_lote_campo
        FOREIGN KEY (id_campo)
        REFERENCES campo(id_campo),

    CONSTRAINT ck_lote_superficie
        CHECK (superficie > 0),

    CONSTRAINT ck_lote_semilla
        CHECK (cantidad_semilla IS NULL OR cantidad_semilla > 0)
);

-- 5. Productos
CREATE TABLE producto (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre_comercial VARCHAR(100) NOT NULL,
    principio_activo VARCHAR(100),
    concentracion VARCHAR(50),
    tipo VARCHAR(50) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL
);

-- 6. Movimientos de stock
-- El nombre plural coincide con models/movimiento_stock.py.
CREATE TABLE movimientos_stock (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(10) NOT NULL,
    cantidad FLOAT NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacion VARCHAR(255),
    id_producto INT NOT NULL,
    id_usuario INT NOT NULL,

    CONSTRAINT fk_movimiento_producto
        FOREIGN KEY (id_producto)
        REFERENCES producto(id_producto),

    CONSTRAINT fk_movimiento_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario),

    CONSTRAINT ck_movimiento_tipo
        CHECK (tipo IN ('INGRESO', 'EGRESO')),

    CONSTRAINT ck_movimiento_cantidad
        CHECK (cantidad > 0)
);

-- 7. Labores
CREATE TABLE labor (
    id_labor INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL,
    fecha DATE NOT NULL,
    observaciones TEXT,
    id_lote INT NOT NULL,
    id_usuario INT NOT NULL,

    CONSTRAINT fk_labor_lote
        FOREIGN KEY (id_lote)
        REFERENCES lote(id_lote),

    CONSTRAINT fk_labor_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
);

-- 8. Riegos
CREATE TABLE riego (
    id_riego INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    cantidad_agua DECIMAL(10,2) NOT NULL,
    observaciones TEXT,
    id_lote INT NOT NULL,
    id_usuario INT NOT NULL,

    CONSTRAINT fk_riego_lote
        FOREIGN KEY (id_lote)
        REFERENCES lote(id_lote),

    CONSTRAINT fk_riego_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario),

    CONSTRAINT ck_riego_cantidad
        CHECK (cantidad_agua > 0),

    CONSTRAINT ck_riego_horario
        CHECK (hora_fin > hora_inicio)
);

-- 9. Órdenes de aplicación
CREATE TABLE orden_aplicacion (
    id_orden_aplicacion INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    objetivo VARCHAR(200) NOT NULL,
    observaciones TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    id_lote INT NOT NULL,
    id_usuario INT NOT NULL,

    CONSTRAINT fk_orden_lote
        FOREIGN KEY (id_lote)
        REFERENCES lote(id_lote),

    CONSTRAINT fk_orden_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
);

-- 10. Aplicaciones
-- Una orden puede tener varias aplicaciones según el modelo actual.
CREATE TABLE aplicacion (
    id_aplicacion INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    temperatura DECIMAL(5,2) NOT NULL,
    humedad DECIMAL(5,2) NOT NULL,
    viento DECIMAL(5,2) NOT NULL,
    observaciones TEXT,
    id_lote INT NOT NULL,
    id_orden_aplicacion INT NOT NULL,
    id_usuario INT NOT NULL,

    CONSTRAINT fk_aplicacion_lote
        FOREIGN KEY (id_lote)
        REFERENCES lote(id_lote),

    CONSTRAINT fk_aplicacion_orden
        FOREIGN KEY (id_orden_aplicacion)
        REFERENCES orden_aplicacion(id_orden_aplicacion),

    CONSTRAINT fk_aplicacion_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario),

    CONSTRAINT ck_aplicacion_humedad
        CHECK (humedad >= 0 AND humedad <= 100),

    CONSTRAINT ck_aplicacion_viento
        CHECK (viento >= 0)
);

-- 11. Productos utilizados en cada aplicación
CREATE TABLE detalle_aplicacion (
    id_detalle_aplicacion INT AUTO_INCREMENT PRIMARY KEY,
    cantidad DECIMAL(10,2) NOT NULL,
    id_aplicacion INT NOT NULL,
    id_producto INT NOT NULL,

    CONSTRAINT fk_detalle_aplicacion
        FOREIGN KEY (id_aplicacion)
        REFERENCES aplicacion(id_aplicacion)
        ON DELETE CASCADE,

    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (id_producto)
        REFERENCES producto(id_producto),

    CONSTRAINT ck_detalle_cantidad
        CHECK (cantidad > 0)
);

-- 12. Cosechas
-- La DTVe se registra una vez por cosecha, no por camión.
CREATE TABLE cosecha (
    id_cosecha INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    dtve VARCHAR(50) NOT NULL,
    cantidad_cosechada DECIMAL(12,2) NOT NULL,
    observaciones TEXT,
    id_lote INT NOT NULL,
    id_usuario INT NOT NULL,

    CONSTRAINT fk_cosecha_lote
        FOREIGN KEY (id_lote)
        REFERENCES lote(id_lote),

    CONSTRAINT fk_cosecha_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario),

    CONSTRAINT ck_cosecha_cantidad
        CHECK (cantidad_cosechada > 0)
);

-- 13. Camiones asociados a una cosecha
CREATE TABLE camion_cosecha (
    id_camion_cosecha INT AUTO_INCREMENT PRIMARY KEY,
    patente VARCHAR(10) NOT NULL,
    cantidad_transportada DECIMAL(12,2) NOT NULL,
    destino VARCHAR(150) NOT NULL,
    observaciones VARCHAR(255),
    id_cosecha INT NOT NULL,

    CONSTRAINT fk_camion_cosecha
        FOREIGN KEY (id_cosecha)
        REFERENCES cosecha(id_cosecha)
        ON DELETE CASCADE,

    CONSTRAINT ck_camion_cantidad
        CHECK (cantidad_transportada > 0)
);
