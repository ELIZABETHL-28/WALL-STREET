USE hotel_wall_street;

INSERT INTO roles (
    nombre,
    descripcion
)
VALUES
(
    'ADMIN',
    'Administrador general del sistema'
),
(
    'CLIENTE',
    'Cliente registrado del hotel'
);

INSERT INTO tipos_cama (
    nombre,
    capacidad_personas
)
VALUES
('INDIVIDUAL', 1),
('MATRIMONIAL', 2),
('QUEEN', 2),
('KING', 2),
('SOFÁ CAMA', 2);


INSERT INTO tipos_habitacion (
    nombre,
    descripcion,
    precio_base,
    capacidad_base
)
VALUES
(
    'ESTÁNDAR',
    'Habitación moderna para estadías individuales o de negocios',
    450.00,
    2
),
(
    'DOBLE EJECUTIVA',
    'Habitación ejecutiva amplia',
    700.00,
    4
),
(
    'FAMILIAR',
    'Habitación diseñada para familias',
    950.00,
    6
),
(
    'SUITE EJECUTIVA',
    'Suite premium para huéspedes corporativos',
    1500.00,
    3
),
(
    'SUITE PRESIDENCIAL',
    'Suite exclusiva con servicios premium',
    3500.00,
    6
);


-- ============================================================
-- FASE 2: DATOS INICIALES
-- ============================================================


-- ------------------------------------------------------------
-- Servicios adicionales del hotel
-- ------------------------------------------------------------
INSERT INTO servicios (
    nombre,
    descripcion,
    precio,
    estado
)
VALUES
(
    'SPA EJECUTIVO',
    'Acceso al spa con tratamientos de relajación y bienestar para huéspedes corporativos',
    350.00,
    'ACTIVO'
),
(
    'TRANSPORTE AEROPUERTO',
    'Servicio de traslado privado entre el aeropuerto internacional y el hotel',
    280.00,
    'ACTIVO'
),
(
    'LAVANDERÍA',
    'Servicio de lavado, secado y planchado de prendas con entrega en habitación en menos de 24 horas',
    120.00,
    'ACTIVO'
),
(
    'ROOM SERVICE',
    'Servicio de alimentos y bebidas a la habitación disponible las 24 horas',
    0.00,
    'ACTIVO'
),
(
    'ESTACIONAMIENTO PREMIUM',
    'Espacio de estacionamiento techado con servicio de valet parking',
    95.00,
    'ACTIVO'
);


-- ------------------------------------------------------------
-- Tipos de pases diarios
-- ------------------------------------------------------------
INSERT INTO tipos_pase (
    nombre,
    descripcion,
    precio,
    cantidad_maxima_personas,
    servicios_incluidos,
    estado
)
VALUES
(
    'PASE PISCINA',
    'Acceso completo a la piscina ejecutiva, vestidores y área de descanso',
    180.00,
    2,
    'Acceso a piscina, vestidores, área de descanso, toallas',
    'ACTIVO'
),
(
    'PASE BUSINESS DAY',
    'Acceso al Business Center con sala de reuniones, impresión y café ejecutivo',
    350.00,
    1,
    'Business Center, sala de reuniones por 2 horas, impresión, café ejecutivo',
    'ACTIVO'
),
(
    'PASE COMPLETO',
    'Acceso completo a todas las instalaciones del hotel durante un día',
    650.00,
    2,
    'Piscina, spa básico, Business Center, gimnasio, restaurante (desayuno incluido)',
    'ACTIVO'
),
(
    'PASE FAMILIAR',
    'Acceso familiar a las instalaciones recreativas y acuáticas del hotel',
    480.00,
    5,
    'Piscina, área recreativa, restaurante (menú infantil incluido), vestidores',
    'ACTIVO'
);


-- ------------------------------------------------------------
-- Actividades de demostración
-- ------------------------------------------------------------
INSERT INTO actividades (
    nombre,
    descripcion,
    fecha_actividad,
    hora_inicio,
    ubicacion,
    precio,
    cupo_maximo,
    estado
)
VALUES
(
    'NETWORKING EJECUTIVO',
    'Sesión de networking exclusiva para huéspedes corporativos. Incluye coctelería de bienvenida, presentaciones breves y espacio para intercambio de contactos en un ambiente premium.',
    '2026-08-15',
    '19:00:00',
    'Salón Presidencial — Nivel 12',
    250.00,
    40,
    'PROGRAMADA'
),
(
    'CATA DE VINOS PREMIUM',
    'Experiencia guiada de cata con selección de vinos internacionales presentados por un sommelier certificado. Maridaje incluido.',
    '2026-08-22',
    '20:00:00',
    'Terraza Wall Street — Nivel 14',
    320.00,
    20,
    'PROGRAMADA'
),
(
    'TOUR PANORÁMICO CORPORATIVO',
    'Recorrido privado por las instalaciones del hotel con historia de la marca, acceso a áreas VIP y vista panorámica desde el helipuerto. Disponible para grupos de huéspedes registrados.',
    '2026-08-10',
    '10:00:00',
    'Lobby Principal — Punto de encuentro',
    0.00,
    15,
    'PROGRAMADA'
);
