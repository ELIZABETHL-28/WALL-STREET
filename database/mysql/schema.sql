DROP DATABASE IF EXISTS hotel_wall_street;

CREATE DATABASE hotel_wall_street
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE hotel_wall_street;

CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    supabase_uid VARCHAR(100) NOT NULL UNIQUE,
    id_rol INT NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    nombre_mostrar VARCHAR(100),
    avatar_url TEXT,
    proveedor_auth ENUM('GOOGLE', 'EMAIL') NOT NULL,
    estado ENUM('ACTIVO', 'INACTIVO', 'BLOQUEADO')
        DEFAULT 'ACTIVO',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES roles(id_rol)
);

CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(25),
    tipo_documento ENUM(
        'DPI',
        'PASAPORTE',
        'OTRO'
    ) DEFAULT 'DPI',
    numero_documento VARCHAR(50) UNIQUE,
    fecha_nacimiento DATE,
    nacionalidad VARCHAR(80),
    direccion VARCHAR(255),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cliente_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
);

CREATE TABLE empleados (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NULL UNIQUE,
    codigo_empleado VARCHAR(30) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    puesto VARCHAR(100) NOT NULL,
    telefono VARCHAR(25),
    correo_corporativo VARCHAR(150) UNIQUE,
    fecha_contratacion DATE,
    salario DECIMAL(10,2),
    estado ENUM(
        'ACTIVO',
        'INACTIVO',
        'VACACIONES',
        'SUSPENDIDO'
    ) DEFAULT 'ACTIVO',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_empleado_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE SET NULL
);

CREATE TABLE tipos_habitacion (
    id_tipo_habitacion INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    precio_base DECIMAL(10,2) NOT NULL,
    capacidad_base INT NOT NULL,
    estado ENUM('ACTIVO', 'INACTIVO')
        DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_tipo_precio
        CHECK (precio_base >= 0),

    CONSTRAINT chk_tipo_capacidad
        CHECK (capacidad_base > 0)
);

CREATE TABLE habitaciones (
    id_habitacion INT AUTO_INCREMENT PRIMARY KEY,
    id_tipo_habitacion INT NOT NULL,
    numero_habitacion VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150),
    piso INT NOT NULL,
    capacidad_maxima INT NOT NULL,
    precio_noche DECIMAL(10,2) NOT NULL,
    descripcion TEXT,
    estado ENUM(
        'DISPONIBLE',
        'RESERVADA',
        'OCUPADA',
        'LIMPIEZA',
        'MANTENIMIENTO'
    ) DEFAULT 'DISPONIBLE',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_habitacion_tipo
        FOREIGN KEY (id_tipo_habitacion)
        REFERENCES tipos_habitacion(id_tipo_habitacion),

    CONSTRAINT chk_habitacion_capacidad
        CHECK (capacidad_maxima > 0),

    CONSTRAINT chk_habitacion_precio
        CHECK (precio_noche >= 0)
);

CREATE TABLE tipos_cama (
    id_tipo_cama INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    capacidad_personas INT NOT NULL DEFAULT 1,

    CONSTRAINT chk_cama_capacidad
        CHECK (capacidad_personas > 0)
);

CREATE TABLE habitacion_camas (
    id_habitacion_cama INT AUTO_INCREMENT PRIMARY KEY,
    id_habitacion INT NOT NULL,
    id_tipo_cama INT NOT NULL,
    cantidad INT NOT NULL,

    CONSTRAINT fk_habitacion_cama_habitacion
        FOREIGN KEY (id_habitacion)
        REFERENCES habitaciones(id_habitacion)
        ON DELETE CASCADE,

    CONSTRAINT fk_habitacion_cama_tipo
        FOREIGN KEY (id_tipo_cama)
        REFERENCES tipos_cama(id_tipo_cama),

    CONSTRAINT chk_cantidad_camas
        CHECK (cantidad > 0),

    CONSTRAINT uq_habitacion_tipo_cama
        UNIQUE (id_habitacion, id_tipo_cama)
);


CREATE TABLE imagenes_habitacion (
    id_imagen INT AUTO_INCREMENT PRIMARY KEY,
    id_habitacion INT NOT NULL,
    url_imagen TEXT NOT NULL,
    texto_alternativo VARCHAR(255),
    orden_visualizacion INT DEFAULT 1,
    es_principal BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_imagen_habitacion
        FOREIGN KEY (id_habitacion)
        REFERENCES habitaciones(id_habitacion)
        ON DELETE CASCADE
);


-- ============================================================
-- FASE 2: RESERVACIONES, SERVICIOS, ACTIVIDADES, PASES,
--         CUPONES Y CONTROL DE ACCESO
-- ============================================================


-- ------------------------------------------------------------
-- reservaciones
-- Reservación principal realizada por un cliente.
-- La disponibilidad de una habitación se calcula dinámicamente:
-- una habitación no está disponible cuando existe una
-- reservación en estado CONFIRMADA o CHECK_IN cuyo rango
-- (fecha_entrada, fecha_salida) se superpone con el rango
-- solicitado. No se utiliza una tabla de disponibilidad
-- independiente.
-- ------------------------------------------------------------
CREATE TABLE reservaciones (
    id_reservacion       INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente           INT NOT NULL,
    codigo_reservacion   VARCHAR(40) NOT NULL UNIQUE,
    fecha_entrada        DATE NOT NULL,
    fecha_salida         DATE NOT NULL,
    cantidad_adultos     INT NOT NULL,
    cantidad_ninos       INT NOT NULL DEFAULT 0,
    cantidad_visitantes  INT NOT NULL,
    camas_requeridas     INT NOT NULL,
    subtotal             DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    descuento            DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total                DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    estado               ENUM(
                             'PENDIENTE',
                             'CONFIRMADA',
                             'CHECK_IN',
                             'CHECK_OUT',
                             'CANCELADA'
                         ) DEFAULT 'PENDIENTE',
    fecha_creacion       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP
                             DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_reservacion_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente),

    CONSTRAINT chk_res_fechas
        CHECK (fecha_salida > fecha_entrada),

    CONSTRAINT chk_res_adultos
        CHECK (cantidad_adultos > 0),

    CONSTRAINT chk_res_ninos
        CHECK (cantidad_ninos >= 0),

    CONSTRAINT chk_res_visitantes
        CHECK (cantidad_visitantes > 0),

    CONSTRAINT chk_res_camas
        CHECK (camas_requeridas > 0),

    CONSTRAINT chk_res_subtotal
        CHECK (subtotal >= 0),

    CONSTRAINT chk_res_descuento
        CHECK (descuento >= 0),

    CONSTRAINT chk_res_total
        CHECK (total >= 0)
);


-- ------------------------------------------------------------
-- reservacion_habitaciones
-- Asocia una o más habitaciones a una reservación.
-- Permite que en el futuro una reservación pueda abarcar
-- múltiples habitaciones.
-- ------------------------------------------------------------
CREATE TABLE reservacion_habitaciones (
    id_reservacion_habitacion INT AUTO_INCREMENT PRIMARY KEY,
    id_reservacion            INT NOT NULL,
    id_habitacion             INT NOT NULL,
    precio_noche_aplicado     DECIMAL(10,2) NOT NULL,
    cantidad_noches           INT NOT NULL,
    subtotal_habitacion       DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_res_hab_reservacion
        FOREIGN KEY (id_reservacion)
        REFERENCES reservaciones(id_reservacion)
        ON DELETE CASCADE,

    CONSTRAINT fk_res_hab_habitacion
        FOREIGN KEY (id_habitacion)
        REFERENCES habitaciones(id_habitacion),

    CONSTRAINT uq_reservacion_habitacion
        UNIQUE (id_reservacion, id_habitacion),

    CONSTRAINT chk_res_hab_precio
        CHECK (precio_noche_aplicado >= 0),

    CONSTRAINT chk_res_hab_noches
        CHECK (cantidad_noches > 0),

    CONSTRAINT chk_res_hab_subtotal
        CHECK (subtotal_habitacion >= 0)
);


-- ------------------------------------------------------------
-- reservacion_visitantes
-- Visitantes asociados a una reservación (huéspedes).
-- Se eliminarán en cascada si se elimina la reservación.
-- ------------------------------------------------------------
CREATE TABLE reservacion_visitantes (
    id_visitante     INT AUTO_INCREMENT PRIMARY KEY,
    id_reservacion   INT NOT NULL,
    nombres          VARCHAR(100) NOT NULL,
    apellidos        VARCHAR(100) NOT NULL,
    tipo_documento   ENUM('DPI', 'PASAPORTE', 'OTRO') DEFAULT 'DPI',
    numero_documento VARCHAR(60),
    es_titular       BOOLEAN DEFAULT FALSE,
    fecha_registro   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_visitante_reservacion
        FOREIGN KEY (id_reservacion)
        REFERENCES reservaciones(id_reservacion)
        ON DELETE CASCADE
);


-- ------------------------------------------------------------
-- servicios
-- Servicios adicionales ofrecidos por el hotel.
-- ------------------------------------------------------------
CREATE TABLE servicios (
    id_servicio          INT AUTO_INCREMENT PRIMARY KEY,
    nombre               VARCHAR(120) NOT NULL UNIQUE,
    descripcion          TEXT,
    precio               DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado               ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    fecha_creacion       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP
                             DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_servicio_precio
        CHECK (precio >= 0)
);


-- ------------------------------------------------------------
-- reservacion_servicios
-- Asocia servicios adicionales a una reservación.
-- ------------------------------------------------------------
CREATE TABLE reservacion_servicios (
    id_reservacion_servicio  INT AUTO_INCREMENT PRIMARY KEY,
    id_reservacion           INT NOT NULL,
    id_servicio              INT NOT NULL,
    cantidad                 INT NOT NULL DEFAULT 1,
    precio_unitario_aplicado DECIMAL(10,2) NOT NULL,
    subtotal                 DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_res_serv_reservacion
        FOREIGN KEY (id_reservacion)
        REFERENCES reservaciones(id_reservacion)
        ON DELETE CASCADE,

    CONSTRAINT fk_res_serv_servicio
        FOREIGN KEY (id_servicio)
        REFERENCES servicios(id_servicio),

    CONSTRAINT chk_res_serv_cantidad
        CHECK (cantidad > 0),

    CONSTRAINT chk_res_serv_precio_unit
        CHECK (precio_unitario_aplicado >= 0),

    CONSTRAINT chk_res_serv_subtotal
        CHECK (subtotal >= 0)
);


-- ------------------------------------------------------------
-- actividades
-- Actividades organizadas por el hotel.
-- ------------------------------------------------------------
CREATE TABLE actividades (
    id_actividad         INT AUTO_INCREMENT PRIMARY KEY,
    nombre               VARCHAR(150) NOT NULL,
    descripcion          TEXT,
    fecha_actividad      DATE NOT NULL,
    hora_inicio          TIME NOT NULL,
    ubicacion            VARCHAR(200),
    precio               DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cupo_maximo          INT NOT NULL,
    estado               ENUM(
                             'PROGRAMADA',
                             'ACTIVA',
                             'FINALIZADA',
                             'CANCELADA'
                         ) DEFAULT 'PROGRAMADA',
    fecha_creacion       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP
                             DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_actividad_precio
        CHECK (precio >= 0),

    CONSTRAINT chk_actividad_cupo
        CHECK (cupo_maximo > 0)
);


-- ------------------------------------------------------------
-- inscripciones_actividades
-- Relaciona clientes con actividades.
-- Un cliente no puede inscribirse dos veces en la misma
-- actividad (restricción UNIQUE).
-- ------------------------------------------------------------
CREATE TABLE inscripciones_actividades (
    id_inscripcion   INT AUTO_INCREMENT PRIMARY KEY,
    id_actividad     INT NOT NULL,
    id_cliente       INT NOT NULL,
    cantidad_personas INT NOT NULL DEFAULT 1,
    precio_total     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado           ENUM(
                         'CONFIRMADA',
                         'CANCELADA',
                         'ASISTIO',
                         'NO_ASISTIO'
                     ) DEFAULT 'CONFIRMADA',
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inscripcion_actividad
        FOREIGN KEY (id_actividad)
        REFERENCES actividades(id_actividad),

    CONSTRAINT fk_inscripcion_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente),

    CONSTRAINT uq_inscripcion_cliente_actividad
        UNIQUE (id_actividad, id_cliente),

    CONSTRAINT chk_inscripcion_cantidad
        CHECK (cantidad_personas > 0),

    CONSTRAINT chk_inscripcion_precio
        CHECK (precio_total >= 0)
);


-- ------------------------------------------------------------
-- tipos_pase
-- Tipos de pases diarios disponibles para clientes externos.
-- ------------------------------------------------------------
CREATE TABLE tipos_pase (
    id_tipo_pase           INT AUTO_INCREMENT PRIMARY KEY,
    nombre                 VARCHAR(120) NOT NULL UNIQUE,
    descripcion            TEXT,
    precio                 DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cantidad_maxima_personas INT NOT NULL DEFAULT 1,
    servicios_incluidos    TEXT,
    estado                 ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    fecha_creacion         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion   TIMESTAMP
                               DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_tipo_pase_precio
        CHECK (precio >= 0),

    CONSTRAINT chk_tipo_pase_cantidad
        CHECK (cantidad_maxima_personas > 0)
);


-- ------------------------------------------------------------
-- pases_cliente
-- Pases adquiridos por los clientes.
-- ------------------------------------------------------------
CREATE TABLE pases_cliente (
    id_pase_cliente      INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente           INT NOT NULL,
    id_tipo_pase         INT NOT NULL,
    codigo_pase          VARCHAR(40) NOT NULL UNIQUE,
    fecha_uso            DATE NOT NULL,
    cantidad_personas    INT NOT NULL DEFAULT 1,
    precio_aplicado      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado               ENUM(
                             'ACTIVO',
                             'UTILIZADO',
                             'VENCIDO',
                             'CANCELADO'
                         ) DEFAULT 'ACTIVO',
    fecha_compra         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pase_cliente_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente),

    CONSTRAINT fk_pase_cliente_tipo
        FOREIGN KEY (id_tipo_pase)
        REFERENCES tipos_pase(id_tipo_pase),

    CONSTRAINT chk_pase_cantidad
        CHECK (cantidad_personas > 0),

    CONSTRAINT chk_pase_precio
        CHECK (precio_aplicado >= 0)
);


-- ------------------------------------------------------------
-- cupones
-- Cupones de descuento generados por el administrador.
-- El código único se generará desde el backend en tiempo de
-- ejecución. Esta tabla únicamente prepara la estructura.
-- ------------------------------------------------------------
CREATE TABLE cupones (
    id_cupon             INT AUTO_INCREMENT PRIMARY KEY,
    codigo               VARCHAR(50) NOT NULL UNIQUE,
    tipo_descuento       ENUM('PORCENTAJE', 'MONTO_FIJO') NOT NULL,
    valor_descuento      DECIMAL(10,2) NOT NULL,
    fecha_inicio         DATE NOT NULL,
    fecha_vencimiento    DATE NOT NULL,
    limite_usos          INT NOT NULL,
    usos_actuales        INT NOT NULL DEFAULT 0,
    aplica_a             ENUM('RESERVACION', 'PASE', 'AMBOS') DEFAULT 'AMBOS',
    estado               ENUM('ACTIVO', 'INACTIVO', 'VENCIDO') DEFAULT 'ACTIVO',
    fecha_creacion       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_cupon_valor
        CHECK (valor_descuento > 0),

    CONSTRAINT chk_cupon_fechas
        CHECK (fecha_vencimiento >= fecha_inicio),

    CONSTRAINT chk_cupon_limite
        CHECK (limite_usos > 0),

    CONSTRAINT chk_cupon_usos_actuales
        CHECK (usos_actuales >= 0),

    CONSTRAINT chk_cupon_usos_limite
        CHECK (usos_actuales <= limite_usos)
);


-- ------------------------------------------------------------
-- cupones_usados
-- Registra cada uso de un cupón asociado a una reservación
-- o a un pase cliente. No puede aplicarse a ambos
-- simultáneamente (restricción CHECK).
-- No se utiliza CASCADE para preservar el historial del
-- negocio aunque se elimine la reservación o el pase.
-- ------------------------------------------------------------
CREATE TABLE cupones_usados (
    id_cupon_usado      INT AUTO_INCREMENT PRIMARY KEY,
    id_cupon            INT NOT NULL,
    id_cliente          INT NOT NULL,
    id_reservacion      INT NULL,
    id_pase_cliente     INT NULL,
    descuento_aplicado  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fecha_uso           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cupon_usado_cupon
        FOREIGN KEY (id_cupon)
        REFERENCES cupones(id_cupon),

    CONSTRAINT fk_cupon_usado_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente),

    CONSTRAINT fk_cupon_usado_reservacion
        FOREIGN KEY (id_reservacion)
        REFERENCES reservaciones(id_reservacion),

    CONSTRAINT fk_cupon_usado_pase
        FOREIGN KEY (id_pase_cliente)
        REFERENCES pases_cliente(id_pase_cliente),

    -- Un uso de cupón debe aplicarse a una reservación o a un
    -- pase, pero nunca a ambos al mismo tiempo.
    CONSTRAINT chk_cupon_usado_exclusivo
        CHECK (
            (id_reservacion IS NOT NULL AND id_pase_cliente IS NULL)
            OR
            (id_pase_cliente IS NOT NULL AND id_reservacion IS NULL)
        ),

    CONSTRAINT chk_cupon_descuento
        CHECK (descuento_aplicado >= 0)
);


-- ------------------------------------------------------------
-- codigos_acceso
-- Almacena los identificadores únicos utilizados
-- posteriormente para generar los códigos QR.
-- Cada código pertenece exclusivamente a una reservación o
-- a un pase cliente, nunca a ambos.
-- ------------------------------------------------------------
CREATE TABLE codigos_acceso (
    id_codigo_acceso  INT AUTO_INCREMENT PRIMARY KEY,
    codigo            VARCHAR(60) NOT NULL UNIQUE,
    tipo              ENUM('RESERVACION', 'PASE') NOT NULL,
    id_reservacion    INT NULL,
    id_pase_cliente   INT NULL,
    estado            ENUM(
                          'ACTIVO',
                          'UTILIZADO',
                          'INVALIDO',
                          'VENCIDO'
                      ) DEFAULT 'ACTIVO',
    fecha_generacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultimo_uso  TIMESTAMP NULL,

    CONSTRAINT fk_codigo_reservacion
        FOREIGN KEY (id_reservacion)
        REFERENCES reservaciones(id_reservacion)
        ON DELETE CASCADE,

    CONSTRAINT fk_codigo_pase
        FOREIGN KEY (id_pase_cliente)
        REFERENCES pases_cliente(id_pase_cliente)
        ON DELETE CASCADE,

    -- Si el tipo es RESERVACION debe existir id_reservacion
    -- y no id_pase_cliente, y viceversa.
    CONSTRAINT chk_codigo_tipo_reservacion
        CHECK (
            tipo <> 'RESERVACION'
            OR (id_reservacion IS NOT NULL AND id_pase_cliente IS NULL)
        ),

    CONSTRAINT chk_codigo_tipo_pase
        CHECK (
            tipo <> 'PASE'
            OR (id_pase_cliente IS NOT NULL AND id_reservacion IS NULL)
        )
);
