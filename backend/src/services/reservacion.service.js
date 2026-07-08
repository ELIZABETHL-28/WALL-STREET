/**
 * reservacion.service.js
 * Lógica de negocio y acceso a datos para el módulo de Reservaciones.
 *
 * Reglas fundamentales (fuente de verdad: schema.sql):
 *  - Disponibilidad se determina dinámicamente: una habitación está ocupada
 *    si existe una reservación CONFIRMADA o CHECK_IN cuyo rango se superpone
 *    con el rango solicitado (fecha_entrada < fechaSalidaSol AND fecha_salida > fechaEntradaSol).
 *  - No se usa tabla de disponibilidad independiente.
 *  - La asignación de habitación la hace el backend (ranking determinista).
 *  - Las transacciones usan pool.getConnection() + beginTransaction().
 *  - SELECT ... FOR UPDATE protege contra reservaciones concurrentes.
 *  - Todos los valores son parámetros ? en SQL — sin interpolación.
 */

const { pool } = require('../config/mysql');
const crypto = require('crypto');

// ─── Constantes ──────────────────────────────────────────────────────────────

// Solo estos estados bloquean disponibilidad de habitación.
const ESTADOS_BLOQUEAN = [
  'PENDIENTE',
  'CONFIRMADA',
  'CHECK_IN'
];

// Estados operativos de habitación que permiten ser reservadas.
const ESTADOS_RESERVABLES = ['DISPONIBLE', 'RESERVADA'];

// Transiciones de estado válidas para el ADMIN.
// Clave: estado actual → valores: estados a los que puede transicionar.
const TRANSICIONES_VALIDAS = {
  PENDIENTE: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['CHECK_IN', 'CANCELADA'],
  CHECK_IN: ['CHECK_OUT'],
  CHECK_OUT: [],           // Estado terminal
  CANCELADA: [],           // Estado terminal
};

// ─── Helpers privados ─────────────────────────────────────────────────────────

/**
 * Genera un código único de reservación estilo RES-XXXXXXXXXXXXXXXX.
 */
function generarCodigoReservacion() {
  return 'RES-' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

/**
 * Calcula la cantidad de noches entre dos fechas ISO (YYYY-MM-DD).
 * Siempre >= 1 (validado antes de llegar aquí).
 */
function calcularNoches(fechaEntrada, fechaSalida) {
  const ms = new Date(fechaSalida) - new Date(fechaEntrada);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * Busca el id_cliente relacionado con un id_usuario.
 * Nunca confía en id proveniente del frontend.
 * Retorna null si el usuario no tiene perfil de cliente creado.
 */
async function getClienteByUsuario(idUsuario, conn) {
  const executor = conn || pool;
  const [rows] = await executor.execute(
    'SELECT id_cliente FROM clientes WHERE id_usuario = ? LIMIT 1',
    [idUsuario]
  );
  return rows.length ? rows[0].id_cliente : null;
}

/**
 * Consulta habitaciones candidatas (sin transacción, para la vista de disponibilidad).
 * Devuelve habitaciones que:
 *   1. Estado operativo en ESTADOS_RESERVABLES.
 *   2. capacidad_maxima >= cantidadVisitantes.
 *   3. No tienen reservación CONFIRMADA o CHECK_IN superpuesta con el rango solicitado.
 * Incluye camas para calcular el ranking.
 */
async function consultarCandidatas(fechaEntrada, fechaSalida, cantidadVisitantes) {
  // Subquery de ids bloqueados por superposición
  const sql = `
    SELECT
      h.id_habitacion,
      h.numero_habitacion,
      h.nombre,
      h.piso,
      h.capacidad_maxima,
      h.precio_noche,
      h.descripcion,
      h.estado,
      t.id_tipo_habitacion,
      t.nombre          AS tipo_nombre,
      t.descripcion     AS tipo_descripcion,
      t.capacidad_base  AS tipo_capacidad_base,
      (
        SELECT SUM(hc2.cantidad * tc2.capacidad_personas)
        FROM habitacion_camas hc2
        INNER JOIN tipos_cama tc2 ON tc2.id_tipo_cama = hc2.id_tipo_cama
        WHERE hc2.id_habitacion = h.id_habitacion
      )                 AS capacidad_camas,
      (
        SELECT COUNT(*)
        FROM habitacion_camas hc3
        WHERE hc3.id_habitacion = h.id_habitacion
      )                 AS tipos_cama_count,
      (
        SELECT SUM(hc4.cantidad)
        FROM habitacion_camas hc4
        WHERE hc4.id_habitacion = h.id_habitacion
      )                 AS total_camas
    FROM habitaciones h
    INNER JOIN tipos_habitacion t ON t.id_tipo_habitacion = h.id_tipo_habitacion
    WHERE h.estado IN ('DISPONIBLE', 'RESERVADA')
      AND h.capacidad_maxima >= ?
      AND h.id_habitacion NOT IN (
        SELECT rh.id_habitacion
        FROM reservacion_habitaciones rh
        INNER JOIN reservaciones r ON r.id_reservacion = rh.id_reservacion
        WHERE r.estado IN ('PENDIENTE', 'CONFIRMADA', 'CHECK_IN')
          AND r.fecha_entrada < ?
          AND r.fecha_salida  > ?
      )
    ORDER BY h.precio_noche ASC, h.capacidad_maxima ASC
  `;

  const [rows] = await pool.execute(sql, [cantidadVisitantes, fechaSalida, fechaEntrada]);
  return rows;
}

/**
 * Versión de consultarCandidatas que usa una conexión existente y aplica
 * SELECT ... FOR UPDATE para bloquear las filas durante la transacción.
 * idExcluida: habitación ya seleccionada a la que se re-valida (puede ser null).
 */
async function consultarCandidatasConLock(conn, fechaEntrada, fechaSalida, cantidadVisitantes) {
  const sql = `
    SELECT
      h.id_habitacion,
      h.numero_habitacion,
      h.nombre,
      h.piso,
      h.capacidad_maxima,
      h.precio_noche,
      h.estado,
      (
        SELECT SUM(hc2.cantidad * tc2.capacidad_personas)
        FROM habitacion_camas hc2
        INNER JOIN tipos_cama tc2 ON tc2.id_tipo_cama = hc2.id_tipo_cama
        WHERE hc2.id_habitacion = h.id_habitacion
      ) AS capacidad_camas,
      (
        SELECT SUM(hc4.cantidad)
        FROM habitacion_camas hc4
        WHERE hc4.id_habitacion = h.id_habitacion
      ) AS total_camas
    FROM habitaciones h
    WHERE h.estado IN ('DISPONIBLE', 'RESERVADA')
      AND h.capacidad_maxima >= ?
      AND h.id_habitacion NOT IN (
        SELECT rh.id_habitacion
        FROM reservacion_habitaciones rh
        INNER JOIN reservaciones r ON r.id_reservacion = rh.id_reservacion
        WHERE r.estado IN ('PENDIENTE', 'CONFIRMADA', 'CHECK_IN')
          AND r.fecha_entrada < ?
          AND r.fecha_salida  > ?
      )
    ORDER BY h.precio_noche ASC, h.capacidad_maxima ASC
    FOR UPDATE
  `;

  const [rows] = await conn.execute(sql, [cantidadVisitantes, fechaSalida, fechaEntrada]);
  return rows;
}

/**
 * Aplica el ranking determinista para elegir la mejor habitación:
 *   1. Menor capacidad sobrante (capacidad_maxima - cantidadVisitantes).
 *   2. Menor cantidad de camas sobrantes.
 *   3. Menor precio_noche.
 * Nunca usa random.
 */
function seleccionarMejorHabitacion(candidatas, cantidadVisitantes) {
  if (!candidatas.length) return null;

  return candidatas.slice().sort((a, b) => {
    // 1. menor capacidad sobrante
    const sobraCapA = (a.capacidad_maxima - cantidadVisitantes);
    const sobraCapB = (b.capacidad_maxima - cantidadVisitantes);
    if (sobraCapA !== sobraCapB) return sobraCapA - sobraCapB;

    // 2. menor camas sobrantes (total_camas como proxy; capacidad_camas puede ser null)
    const sobraCamaA = (a.total_camas || 0);
    const sobraCamaB = (b.total_camas || 0);
    if (sobraCamaA !== sobraCamaB) return sobraCamaA - sobraCamaB;

    // 3. menor precio
    return parseFloat(a.precio_noche) - parseFloat(b.precio_noche);
  })[0];
}

/**
 * Devuelve una reservación completa con habitaciones y visitantes para respuesta al cliente.
 */
async function getReservacionCompleta(idReservacion) {
  const [res] = await pool.execute(
    `SELECT
       r.id_reservacion,
       r.codigo_reservacion,
       r.fecha_entrada,
       r.fecha_salida,
       r.cantidad_adultos,
       r.cantidad_ninos,
       r.cantidad_visitantes,
       r.camas_requeridas,
       r.subtotal,
       r.descuento,
       r.total,
       r.estado,
       r.fecha_creacion,
       r.ultima_actualizacion,
       c.id_cliente,
       c.nombres   AS cliente_nombres,
       c.apellidos AS cliente_apellidos,
       c.telefono  AS cliente_telefono
     FROM reservaciones r
     INNER JOIN clientes c ON c.id_cliente = r.id_cliente
     WHERE r.id_reservacion = ?
     LIMIT 1`,
    [idReservacion]
  );

  if (!res.length) return null;

  const [habitaciones] = await pool.execute(
    `SELECT
       rh.id_reservacion_habitacion,
       rh.id_habitacion,
       rh.precio_noche_aplicado,
       rh.cantidad_noches,
       rh.subtotal_habitacion,
       h.numero_habitacion,
       h.nombre              AS habitacion_nombre,
       h.piso,
       h.capacidad_maxima,
       t.nombre              AS tipo_nombre,
       (SELECT url_imagen
          FROM imagenes_habitacion
         WHERE id_habitacion = h.id_habitacion AND es_principal = TRUE
         LIMIT 1)            AS imagen_principal
     FROM reservacion_habitaciones rh
     INNER JOIN habitaciones h ON h.id_habitacion = rh.id_habitacion
     INNER JOIN tipos_habitacion t ON t.id_tipo_habitacion = h.id_tipo_habitacion
     WHERE rh.id_reservacion = ?`,
    [idReservacion]
  );

  const [visitantes] = await pool.execute(
    `SELECT
       id_visitante,
       nombres,
       apellidos,
       tipo_documento,
       numero_documento,
       es_titular
     FROM reservacion_visitantes
     WHERE id_reservacion = ?
     ORDER BY es_titular DESC, id_visitante ASC`,
    [idReservacion]
  );

  return { ...res[0], habitaciones, visitantes };
}

// ─── Disponibilidad ───────────────────────────────────────────────────────────

/**
 * Consulta habitaciones disponibles para un rango de fechas y cantidad de visitantes.
 * Incluye la habitación recomendada (primera según ranking).
 */
async function consultarDisponibilidad({ fechaEntrada, fechaSalida, cantidadVisitantes }) {
  const candidatas = await consultarCandidatas(fechaEntrada, fechaSalida, cantidadVisitantes);
  const recomendada = seleccionarMejorHabitacion(candidatas, cantidadVisitantes);
  const noches = calcularNoches(fechaEntrada, fechaSalida);

  return {
    fechaEntrada,
    fechaSalida,
    noches,
    cantidadVisitantes,
    totalDisponibles: candidatas.length,
    habitaciones: candidatas,
    recomendada: recomendada || null,
  };
}

// ─── Crear Reservación (CLIENTE) ──────────────────────────────────────────────

/**
 * Crea una reservación con transacción real y SELECT ... FOR UPDATE.
 * idUsuario proviene exclusivamente de req.user.idUsuario (nunca del body).
 *
 * @param {number} idUsuario     - ID del usuario autenticado (de req.user).
 * @param {object} datos         - Datos de la reservación.
 * @param {string} datos.fechaEntrada
 * @param {string} datos.fechaSalida
 * @param {number} datos.cantidadAdultos
 * @param {number} datos.cantidadNinos
 * @param {Array}  datos.visitantes      - Array opcional de objetos visitante.
 */
async function crearReservacion(idUsuario, datos) {
  const {
    fechaEntrada,
    fechaSalida,
    cantidadAdultos,
    cantidadNinos = 0,
    visitantes = [],
  } = datos;

  const cantidadVisitantes = cantidadAdultos + cantidadNinos;
  const noches = calcularNoches(fechaEntrada, fechaSalida);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verificar que el usuario tiene perfil de cliente
    const idCliente = await getClienteByUsuario(idUsuario, connection);
    if (!idCliente) {
      const err = new Error('Debes completar tu perfil de cliente antes de realizar una reservación.');
      err.statusCode = 422;
      throw err;
    }

    // 2. Consultar candidatas y bloquear filas con FOR UPDATE
    const candidatas = await consultarCandidatasConLock(
      connection, fechaEntrada, fechaSalida, cantidadVisitantes
    );

    if (!candidatas.length) {
      const err = new Error('No hay habitaciones disponibles para el período y cantidad de visitantes solicitados.');
      err.statusCode = 409;
      throw err;
    }

    // 3. Seleccionar la mejor habitación (ranking determinista)
    const habitacion = seleccionarMejorHabitacion(candidatas, cantidadVisitantes);
    if (!habitacion) {
      const err = new Error('No se pudo seleccionar una habitación disponible.');
      err.statusCode = 409;
      throw err;
    }

    // 4. Calcular montos
    const precioNoche = parseFloat(habitacion.precio_noche);
    const subtotalHab = parseFloat((precioNoche * noches).toFixed(2));
    const subtotalTotal = subtotalHab;
    const descuento = 0.00;
    const total = parseFloat((subtotalTotal - descuento).toFixed(2));
    const camasRequeridas = habitacion.total_camas || 1;

    // 5. Generar código único
    let codigoReservacion;
    let intentos = 0;
    do {
      codigoReservacion = generarCodigoReservacion();
      const [dup] = await connection.execute(
        'SELECT id_reservacion FROM reservaciones WHERE codigo_reservacion = ? LIMIT 1',
        [codigoReservacion]
      );
      if (!dup.length) break;
      intentos++;
    } while (intentos < 5);

    // 6. INSERT reservaciones
    const [resInsert] = await connection.execute(
      `INSERT INTO reservaciones
         (id_cliente, codigo_reservacion, fecha_entrada, fecha_salida,
          cantidad_adultos, cantidad_ninos, cantidad_visitantes, camas_requeridas,
          subtotal, descuento, total, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')`,
      [
        idCliente, codigoReservacion, fechaEntrada, fechaSalida,
        cantidadAdultos, cantidadNinos, cantidadVisitantes, camasRequeridas,
        subtotalTotal, descuento, total,
      ]
    );

    const idReservacion = resInsert.insertId;

    // 7. INSERT reservacion_habitaciones
    await connection.execute(
      `INSERT INTO reservacion_habitaciones
         (id_reservacion, id_habitacion, precio_noche_aplicado, cantidad_noches, subtotal_habitacion)
       VALUES (?, ?, ?, ?, ?)`,
      [idReservacion, habitacion.id_habitacion, precioNoche, noches, subtotalHab]
    );

    // 8. INSERT reservacion_visitantes (si se enviaron)
    if (visitantes.length > 0) {
      for (const v of visitantes) {
        await connection.execute(
          `INSERT INTO reservacion_visitantes
             (id_reservacion, nombres, apellidos, tipo_documento, numero_documento, es_titular)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            idReservacion,
            v.nombres || '',
            v.apellidos || '',
            v.tipoDocumento || 'DPI',
            v.numeroDocumento || null,
            v.esTitular === true ? 1 : 0,
          ]
        );
      }
    }

    await connection.commit();

    return getReservacionCompleta(idReservacion);

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// ─── Mis reservaciones (CLIENTE) ──────────────────────────────────────────────

/**
 * Lista todas las reservaciones del cliente autenticado.
 */
async function listarMisReservaciones(idUsuario) {
  const idCliente = await getClienteByUsuario(idUsuario);
  if (!idCliente) return [];

  const [rows] = await pool.execute(
    `SELECT
       r.id_reservacion,
       r.codigo_reservacion,
       r.fecha_entrada,
       r.fecha_salida,
       r.cantidad_visitantes,
       r.subtotal,
       r.descuento,
       r.total,
       r.estado,
       r.fecha_creacion,
       (
         SELECT h2.numero_habitacion
         FROM reservacion_habitaciones rh2
         INNER JOIN habitaciones h2 ON h2.id_habitacion = rh2.id_habitacion
         WHERE rh2.id_reservacion = r.id_reservacion
         LIMIT 1
       ) AS numero_habitacion,
       (
         SELECT t2.nombre
         FROM reservacion_habitaciones rh3
         INNER JOIN habitaciones h3 ON h3.id_habitacion = rh3.id_habitacion
         INNER JOIN tipos_habitacion t2 ON t2.id_tipo_habitacion = h3.id_tipo_habitacion
         WHERE rh3.id_reservacion = r.id_reservacion
         LIMIT 1
       ) AS tipo_habitacion
     FROM reservaciones r
     WHERE r.id_cliente = ?
     ORDER BY r.fecha_creacion DESC`,
    [idCliente]
  );

  return rows;
}

/**
 * Obtiene el detalle completo de una reservación del cliente autenticado.
 * Verifica que la reservación pertenezca al cliente (nunca confía en el ID solo).
 */
async function obtenerMiReservacion(idUsuario, idReservacion) {
  const idCliente = await getClienteByUsuario(idUsuario);
  if (!idCliente) return null;

  // Verificar propiedad antes de devolver detalle
  const [check] = await pool.execute(
    'SELECT id_reservacion FROM reservaciones WHERE id_reservacion = ? AND id_cliente = ? LIMIT 1',
    [idReservacion, idCliente]
  );

  if (!check.length) return null;

  return getReservacionCompleta(idReservacion);
}

/**
 * Cancela una reservación del cliente. Solo puede cancelar si el estado lo permite
 * (PENDIENTE o CONFIRMADA).
 */
async function cancelarMiReservacion(idUsuario, idReservacion) {
  const idCliente = await getClienteByUsuario(idUsuario);
  if (!idCliente) {
    const err = new Error('Perfil de cliente no encontrado.');
    err.statusCode = 422;
    throw err;
  }

  const [rows] = await pool.execute(
    'SELECT id_reservacion, estado FROM reservaciones WHERE id_reservacion = ? AND id_cliente = ? LIMIT 1',
    [idReservacion, idCliente]
  );

  if (!rows.length) {
    const err = new Error('Reservación no encontrada.');
    err.statusCode = 404;
    throw err;
  }

  const { estado } = rows[0];

  if (!['PENDIENTE', 'CONFIRMADA'].includes(estado)) {
    const err = new Error(`No se puede cancelar una reservación en estado ${estado}.`);
    err.statusCode = 409;
    throw err;
  }

  await pool.execute(
    "UPDATE reservaciones SET estado = 'CANCELADA' WHERE id_reservacion = ?",
    [idReservacion]
  );

  return getReservacionCompleta(idReservacion);
}

// ─── Administración (ADMIN) ───────────────────────────────────────────────────

/**
 * Lista todas las reservaciones con filtros opcionales de estado y fechas.
 */
async function listarReservacionesAdmin({ estado, fechaDesde, fechaHasta } = {}) {
  let sql = `
    SELECT
      r.id_reservacion,
      r.codigo_reservacion,
      r.fecha_entrada,
      r.fecha_salida,
      r.cantidad_visitantes,
      r.subtotal,
      r.descuento,
      r.total,
      r.estado,
      r.fecha_creacion,
      c.nombres   AS cliente_nombres,
      c.apellidos AS cliente_apellidos,
      c.telefono  AS cliente_telefono,
      (
        SELECT h2.numero_habitacion
        FROM reservacion_habitaciones rh2
        INNER JOIN habitaciones h2 ON h2.id_habitacion = rh2.id_habitacion
        WHERE rh2.id_reservacion = r.id_reservacion
        LIMIT 1
      ) AS numero_habitacion,
      (
        SELECT t2.nombre
        FROM reservacion_habitaciones rh3
        INNER JOIN habitaciones h3 ON h3.id_habitacion = rh3.id_habitacion
        INNER JOIN tipos_habitacion t2 ON t2.id_tipo_habitacion = h3.id_tipo_habitacion
        WHERE rh3.id_reservacion = r.id_reservacion
        LIMIT 1
      ) AS tipo_habitacion
    FROM reservaciones r
    INNER JOIN clientes c ON c.id_cliente = r.id_cliente
    WHERE 1=1
  `;

  const params = [];

  if (estado) {
    sql += ' AND r.estado = ?';
    params.push(estado);
  }
  if (fechaDesde) {
    sql += ' AND r.fecha_entrada >= ?';
    params.push(fechaDesde);
  }
  if (fechaHasta) {
    sql += ' AND r.fecha_entrada <= ?';
    params.push(fechaHasta);
  }

  sql += ' ORDER BY r.fecha_creacion DESC';

  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Obtiene el detalle completo de una reservación para el admin.
 */
async function obtenerReservacionAdmin(idReservacion) {
  return getReservacionCompleta(idReservacion);
}

/**
 * Cambia el estado de una reservación como ADMIN.
 * Valida que la transición sea válida según TRANSICIONES_VALIDAS.
 */
async function cambiarEstadoReservacion(idReservacion, nuevoEstado) {
  const [rows] = await pool.execute(
    'SELECT id_reservacion, estado FROM reservaciones WHERE id_reservacion = ? LIMIT 1',
    [idReservacion]
  );

  if (!rows.length) {
    const err = new Error('Reservación no encontrada.');
    err.statusCode = 404;
    throw err;
  }

  const estadoActual = rows[0].estado;
  const permitidos = TRANSICIONES_VALIDAS[estadoActual] || [];

  if (!permitidos.includes(nuevoEstado)) {
    const err = new Error(
      `Transición inválida: ${estadoActual} → ${nuevoEstado}. ` +
      `Transiciones permitidas desde ${estadoActual}: ${permitidos.join(', ') || 'ninguna'}.`
    );
    err.statusCode = 409;
    throw err;
  }

  await pool.execute(
    'UPDATE reservaciones SET estado = ? WHERE id_reservacion = ?',
    [nuevoEstado, idReservacion]
  );

  return getReservacionCompleta(idReservacion);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  consultarDisponibilidad,
  crearReservacion,
  listarMisReservaciones,
  obtenerMiReservacion,
  cancelarMiReservacion,
  listarReservacionesAdmin,
  obtenerReservacionAdmin,
  cambiarEstadoReservacion,
  // Exportado para pruebas
  TRANSICIONES_VALIDAS,
};
