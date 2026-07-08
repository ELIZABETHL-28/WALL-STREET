-- ============================================================
-- HOTEL WALL STREET
-- SEED SEGURO PARA BASE EXISTENTE
-- No elimina usuarios, clientes, perfiles ni ADMIN actual.
-- Puede ejecutarse sobre hotel_wall_street existente.
-- ============================================================

USE hotel_wall_street;

-- ROLES
INSERT IGNORE INTO roles (nombre, descripcion)
VALUES
('ADMIN', 'Administrador general del sistema'),
('CLIENTE', 'Cliente registrado del hotel');

-- TIPOS DE CAMA
INSERT IGNORE INTO tipos_cama (nombre, capacidad_personas)
VALUES
('INDIVIDUAL', 1),
('MATRIMONIAL', 2),
('QUEEN', 2),
('KING', 2),
('SOFÁ CAMA', 2);

-- TIPOS DE HABITACIÓN
INSERT IGNORE INTO tipos_habitacion (
    nombre, descripcion, precio_base, capacidad_base
)
VALUES
('ESTÁNDAR', 'Habitación moderna para estadías individuales o de negocios', 450.00, 2),
('DOBLE EJECUTIVA', 'Habitación ejecutiva amplia', 700.00, 4),
('FAMILIAR', 'Habitación diseñada para familias', 950.00, 6),
('SUITE EJECUTIVA', 'Suite premium para huéspedes corporativos', 1500.00, 3),
('SUITE PRESIDENCIAL', 'Suite exclusiva con servicios premium', 3500.00, 6);

-- SERVICIOS
INSERT IGNORE INTO servicios (nombre, descripcion, precio, estado)
VALUES
('SPA EJECUTIVO', 'Acceso al spa con tratamientos de relajación y bienestar para huéspedes corporativos', 350.00, 'ACTIVO'),
('TRANSPORTE AEROPUERTO', 'Servicio de traslado privado entre el aeropuerto internacional y el hotel', 280.00, 'ACTIVO'),
('LAVANDERÍA', 'Servicio de lavado, secado y planchado de prendas con entrega en habitación en menos de 24 horas', 120.00, 'ACTIVO'),
('ROOM SERVICE', 'Servicio de alimentos y bebidas a la habitación disponible las 24 horas', 0.00, 'ACTIVO'),
('ESTACIONAMIENTO PREMIUM', 'Espacio de estacionamiento techado con servicio de valet parking', 95.00, 'ACTIVO');

-- TIPOS DE PASE
INSERT IGNORE INTO tipos_pase (
    nombre, descripcion, precio, cantidad_maxima_personas,
    servicios_incluidos, estado
)
VALUES
('PASE PISCINA', 'Acceso completo a la piscina ejecutiva, vestidores y área de descanso', 180.00, 2, 'Acceso a piscina, vestidores, área de descanso, toallas', 'ACTIVO'),
('PASE BUSINESS DAY', 'Acceso al Business Center con sala de reuniones, impresión y café ejecutivo', 350.00, 1, 'Business Center, sala de reuniones por 2 horas, impresión, café ejecutivo', 'ACTIVO'),
('PASE COMPLETO', 'Acceso completo a todas las instalaciones del hotel durante un día', 650.00, 2, 'Piscina, spa básico, Business Center, gimnasio, restaurante (desayuno incluido)', 'ACTIVO'),
('PASE FAMILIAR', 'Acceso familiar a las instalaciones recreativas y acuáticas del hotel', 480.00, 5, 'Piscina, área recreativa, restaurante (menú infantil incluido), vestidores', 'ACTIVO');

-- ACTIVIDADES
INSERT INTO actividades (
    nombre, descripcion, fecha_actividad, hora_inicio,
    ubicacion, precio, cupo_maximo, estado
)
SELECT
    'NETWORKING EJECUTIVO',
    'Sesión de networking exclusiva para huéspedes corporativos.',
    '2026-08-15', '19:00:00',
    'Salón Presidencial — Nivel 12',
    250.00, 40, 'PROGRAMADA'
WHERE NOT EXISTS (
    SELECT 1 FROM actividades
    WHERE nombre = 'NETWORKING EJECUTIVO'
      AND fecha_actividad = '2026-08-15'
);

INSERT INTO actividades (
    nombre, descripcion, fecha_actividad, hora_inicio,
    ubicacion, precio, cupo_maximo, estado
)
SELECT
    'CATA DE VINOS PREMIUM',
    'Experiencia guiada de cata con selección de vinos internacionales.',
    '2026-08-22', '20:00:00',
    'Terraza Wall Street — Nivel 14',
    320.00, 20, 'PROGRAMADA'
WHERE NOT EXISTS (
    SELECT 1 FROM actividades
    WHERE nombre = 'CATA DE VINOS PREMIUM'
      AND fecha_actividad = '2026-08-22'
);

INSERT INTO actividades (
    nombre, descripcion, fecha_actividad, hora_inicio,
    ubicacion, precio, cupo_maximo, estado
)
SELECT
    'TOUR PANORÁMICO CORPORATIVO',
    'Recorrido privado por las instalaciones del hotel.',
    '2026-08-10', '10:00:00',
    'Lobby Principal — Punto de encuentro',
    0.00, 15, 'PROGRAMADA'
WHERE NOT EXISTS (
    SELECT 1 FROM actividades
    WHERE nombre = 'TOUR PANORÁMICO CORPORATIVO'
      AND fecha_actividad = '2026-08-10'
);

-- ============================================================
-- HABITACIONES DEMO
-- ============================================================

INSERT INTO habitaciones (
    id_tipo_habitacion, numero_habitacion, nombre,
    piso, capacidad_maxima, precio_noche, descripcion, estado
)
SELECT
    th.id_tipo_habitacion,
    '101',
    'Estándar Business 101',
    1, 2, 450.00,
    'Habitación moderna para estadías individuales y de negocios.',
    'DISPONIBLE'
FROM tipos_habitacion th
WHERE th.nombre = 'ESTÁNDAR'
  AND NOT EXISTS (
      SELECT 1 FROM habitaciones WHERE numero_habitacion = '101'
  );

INSERT INTO habitaciones (
    id_tipo_habitacion, numero_habitacion, nombre,
    piso, capacidad_maxima, precio_noche, descripcion, estado
)
SELECT
    th.id_tipo_habitacion,
    '201',
    'Doble Ejecutiva 201',
    2, 4, 700.00,
    'Habitación ejecutiva amplia para grupos pequeños.',
    'DISPONIBLE'
FROM tipos_habitacion th
WHERE th.nombre = 'DOBLE EJECUTIVA'
  AND NOT EXISTS (
      SELECT 1 FROM habitaciones WHERE numero_habitacion = '201'
  );

INSERT INTO habitaciones (
    id_tipo_habitacion, numero_habitacion, nombre,
    piso, capacidad_maxima, precio_noche, descripcion, estado
)
SELECT
    th.id_tipo_habitacion,
    '301',
    'Familiar 301',
    3, 6, 950.00,
    'Habitación amplia diseñada para familias.',
    'DISPONIBLE'
FROM tipos_habitacion th
WHERE th.nombre = 'FAMILIAR'
  AND NOT EXISTS (
      SELECT 1 FROM habitaciones WHERE numero_habitacion = '301'
  );

INSERT INTO habitaciones (
    id_tipo_habitacion, numero_habitacion, nombre,
    piso, capacidad_maxima, precio_noche, descripcion, estado
)
SELECT
    th.id_tipo_habitacion,
    '1201',
    'Suite Ejecutiva 1201',
    12, 3, 1500.00,
    'Suite premium para huéspedes corporativos.',
    'DISPONIBLE'
FROM tipos_habitacion th
WHERE th.nombre = 'SUITE EJECUTIVA'
  AND NOT EXISTS (
      SELECT 1 FROM habitaciones WHERE numero_habitacion = '1201'
  );

INSERT INTO habitaciones (
    id_tipo_habitacion, numero_habitacion, nombre,
    piso, capacidad_maxima, precio_noche, descripcion, estado
)
SELECT
    th.id_tipo_habitacion,
    '1401',
    'Suite Presidencial 1401',
    14, 6, 3500.00,
    'Suite exclusiva con servicios premium.',
    'DISPONIBLE'
FROM tipos_habitacion th
WHERE th.nombre = 'SUITE PRESIDENCIAL'
  AND NOT EXISTS (
      SELECT 1 FROM habitaciones WHERE numero_habitacion = '1401'
  );

-- ============================================================
-- CAMAS POR HABITACIÓN
-- ============================================================

INSERT IGNORE INTO habitacion_camas (id_habitacion, id_tipo_cama, cantidad)
SELECT h.id_habitacion, tc.id_tipo_cama, 1
FROM habitaciones h
JOIN tipos_cama tc ON tc.nombre = 'QUEEN'
WHERE h.numero_habitacion = '101';

INSERT IGNORE INTO habitacion_camas (id_habitacion, id_tipo_cama, cantidad)
SELECT h.id_habitacion, tc.id_tipo_cama, 2
FROM habitaciones h
JOIN tipos_cama tc ON tc.nombre = 'MATRIMONIAL'
WHERE h.numero_habitacion = '201';

INSERT IGNORE INTO habitacion_camas (id_habitacion, id_tipo_cama, cantidad)
SELECT h.id_habitacion, tc.id_tipo_cama, 2
FROM habitaciones h
JOIN tipos_cama tc ON tc.nombre = 'QUEEN'
WHERE h.numero_habitacion = '301';

INSERT IGNORE INTO habitacion_camas (id_habitacion, id_tipo_cama, cantidad)
SELECT h.id_habitacion, tc.id_tipo_cama, 1
FROM habitaciones h
JOIN tipos_cama tc ON tc.nombre = 'KING'
WHERE h.numero_habitacion = '1201';

INSERT IGNORE INTO habitacion_camas (id_habitacion, id_tipo_cama, cantidad)
SELECT h.id_habitacion, tc.id_tipo_cama, 1
FROM habitaciones h
JOIN tipos_cama tc ON tc.nombre = 'KING'
WHERE h.numero_habitacion = '1401';

INSERT IGNORE INTO habitacion_camas (id_habitacion, id_tipo_cama, cantidad)
SELECT h.id_habitacion, tc.id_tipo_cama, 2
FROM habitaciones h
JOIN tipos_cama tc ON tc.nombre = 'QUEEN'
WHERE h.numero_habitacion = '1401';

-- ============================================================
-- VERIFICACIÓN RÁPIDA
-- ============================================================

SELECT 'roles' AS tabla, COUNT(*) AS total FROM roles
UNION ALL
SELECT 'tipos_cama', COUNT(*) FROM tipos_cama
UNION ALL
SELECT 'tipos_habitacion', COUNT(*) FROM tipos_habitacion
UNION ALL
SELECT 'habitaciones', COUNT(*) FROM habitaciones
UNION ALL
SELECT 'habitacion_camas', COUNT(*) FROM habitacion_camas
UNION ALL
SELECT 'servicios', COUNT(*) FROM servicios
UNION ALL
SELECT 'tipos_pase', COUNT(*) FROM tipos_pase
UNION ALL
SELECT 'actividades', COUNT(*) FROM actividades;
