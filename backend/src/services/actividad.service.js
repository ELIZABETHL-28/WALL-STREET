/**
 * actividad.service.js
 * Lógica de acceso a datos para el módulo de Actividades.
 * Fuente de verdad: schema.sql — tablas actividades e inscripciones_actividades.
 * Todas las consultas usan pool.execute() con placeholders ?.
 *
 * CONCURRENCIA:
 * La inscripción con cupo limitado usa una transacción con SELECT ... FOR UPDATE
 * sobre la fila de la actividad para evitar sobrecupo bajo condiciones de carrera.
 * La restricción UNIQUE (id_actividad, id_cliente) en la tabla inscripciones_actividades
 * garantiza a nivel de base de datos que un cliente no se inscribe dos veces.
 */
const { pool } = require('../config/mysql');

// ─── helpers privados ──────────────────────────────────────────────────────────

async function getClienteByUsuario(idUsuario, conn) {
  const executor = conn || pool;
  const [rows] = await executor.execute(
    'SELECT id_cliente FROM clientes WHERE id_usuario = ? LIMIT 1',
    [idUsuario]
  );
  return rows.length ? rows[0].id_cliente : null;
}

// ─── Actividades (catálogo) ────────────────────────────────────────────────────

/**
 * Devuelve una actividad completa incluyendo inscritos actuales.
 */
async function getActividadCompleta(idActividad, conn) {
  const executor = conn || pool;
  const [rows] = await executor.execute(
    `SELECT
       a.id_actividad,
       a.nombre,
       a.descripcion,
       a.fecha_actividad,
       a.hora_inicio,
       a.ubicacion,
       a.precio,
       a.cupo_maximo,
       a.estado,
       a.fecha_creacion,
       a.ultima_actualizacion,
       COALESCE(
         (SELECT SUM(ia.cantidad_personas)
          FROM inscripciones_actividades ia
          WHERE ia.id_actividad = a.id_actividad
            AND ia.estado = 'CONFIRMADA'),
         0
       ) AS inscritos_actuales
     FROM actividades a
     WHERE a.id_actividad = ?
     LIMIT 1`,
    [idActividad]
  );
  return rows.length ? rows[0] : null;
}

/**
 * Lista todas las actividades (ADMIN).
 */
async function listarActividadesAdmin() {
  const [rows] = await pool.execute(
    `SELECT
       a.id_actividad,
       a.nombre,
       a.descripcion,
       a.fecha_actividad,
       a.hora_inicio,
       a.ubicacion,
       a.precio,
       a.cupo_maximo,
       a.estado,
       a.fecha_creacion,
       a.ultima_actualizacion,
       COALESCE(
         (SELECT SUM(ia.cantidad_personas)
          FROM inscripciones_actividades ia
          WHERE ia.id_actividad = a.id_actividad
            AND ia.estado = 'CONFIRMADA'),
         0
       ) AS inscritos_actuales
     FROM actividades a
     ORDER BY a.fecha_actividad ASC, a.hora_inicio ASC`
  );
  return rows;
}

/**
 * Lista actividades disponibles para CLIENTE (PROGRAMADA o ACTIVA,
 * con cupo disponible y fecha no pasada).
 */
async function listarActividadesDisponibles() {
  const hoy = new Date().toISOString().split('T')[0];
  const [rows] = await pool.execute(
    `SELECT
       a.id_actividad,
       a.nombre,
       a.descripcion,
       a.fecha_actividad,
       a.hora_inicio,
       a.ubicacion,
       a.precio,
       a.cupo_maximo,
       a.estado,
       COALESCE(
         (SELECT SUM(ia.cantidad_personas)
          FROM inscripciones_actividades ia
          WHERE ia.id_actividad = a.id_actividad
            AND ia.estado = 'CONFIRMADA'),
         0
       ) AS inscritos_actuales
     FROM actividades a
     WHERE a.estado IN ('PROGRAMADA', 'ACTIVA')
       AND a.fecha_actividad >= ?
     ORDER BY a.fecha_actividad ASC, a.hora_inicio ASC`,
    [hoy]
  );
  return rows;
}

/**
 * Obtiene el detalle de una actividad por ID.
 */
async function obtenerActividad(idActividad) {
  return getActividadCompleta(idActividad);
}

/**
 * Crea una nueva actividad (ADMIN).
 */
async function crearActividad({
  nombre, descripcion, fechaActividad, horaInicio,
  ubicacion, precio, cupoMaximo, estado,
}) {
  const [result] = await pool.execute(
    `INSERT INTO actividades
       (nombre, descripcion, fecha_actividad, hora_inicio,
        ubicacion, precio, cupo_maximo, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nombre,
      descripcion     ?? null,
      fechaActividad,
      horaInicio,
      ubicacion       ?? null,
      precio,
      cupoMaximo,
      estado          ?? 'PROGRAMADA',
    ]
  );
  return getActividadCompleta(result.insertId);
}

/**
 * Edita una actividad (ADMIN). Parcial.
 */
async function editarActividad(idActividad, {
  nombre, descripcion, fechaActividad, horaInicio,
  ubicacion, precio, cupoMaximo, estado,
}) {
  await pool.execute(
    `UPDATE actividades
     SET nombre          = COALESCE(?, nombre),
         descripcion     = COALESCE(?, descripcion),
         fecha_actividad = COALESCE(?, fecha_actividad),
         hora_inicio     = COALESCE(?, hora_inicio),
         ubicacion       = COALESCE(?, ubicacion),
         precio          = COALESCE(?, precio),
         cupo_maximo     = COALESCE(?, cupo_maximo),
         estado          = COALESCE(?, estado)
     WHERE id_actividad = ?`,
    [
      nombre          ?? null,
      descripcion     ?? null,
      fechaActividad  ?? null,
      horaInicio      ?? null,
      ubicacion       ?? null,
      precio          ?? null,
      cupoMaximo      ?? null,
      estado          ?? null,
      idActividad,
    ]
  );
  return getActividadCompleta(idActividad);
}

/**
 * Cambia el estado de una actividad (ADMIN).
 * Estados válidos: PROGRAMADA, ACTIVA, FINALIZADA, CANCELADA.
 */
async function cambiarEstadoActividad(idActividad, estado) {
  await pool.execute(
    'UPDATE actividades SET estado = ? WHERE id_actividad = ?',
    [estado, idActividad]
  );
  return getActividadCompleta(idActividad);
}

// ─── inscripciones_actividades ────────────────────────────────────────────────

/**
 * Devuelve el detalle de una inscripción con info de la actividad.
 */
async function getInscripcionCompleta(idInscripcion) {
  const [rows] = await pool.execute(
    `SELECT
       ia.id_inscripcion,
       ia.id_actividad,
       ia.id_cliente,
       ia.cantidad_personas,
       ia.precio_total,
       ia.estado,
       ia.fecha_inscripcion,
       a.nombre              AS actividad_nombre,
       a.descripcion         AS actividad_descripcion,
       a.fecha_actividad,
       a.hora_inicio,
       a.ubicacion,
       a.precio              AS precio_unitario,
       a.cupo_maximo,
       a.estado              AS actividad_estado
     FROM inscripciones_actividades ia
     INNER JOIN actividades a ON a.id_actividad = ia.id_actividad
     WHERE ia.id_inscripcion = ?
     LIMIT 1`,
    [idInscripcion]
  );
  return rows.length ? rows[0] : null;
}

/**
 * Inscribe a un CLIENTE en una actividad.
 *
 * Usa transacción con SELECT ... FOR UPDATE para bloquear la actividad
 * y evitar condición de carrera en el cupo.
 *
 * Validaciones:
 *  - Actividad existe, estado PROGRAMADA o ACTIVA.
 *  - Fecha de la actividad no ha pasado.
 *  - cupo_maximo - inscritos_actuales >= cantidad_personas.
 *  - No inscripción duplicada (cliente en misma actividad).
 */
async function inscribirseActividad(idUsuario, idActividad, cantidadPersonas) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Obtener id_cliente
    const idCliente = await getClienteByUsuario(idUsuario, connection);
    if (!idCliente) {
      const err = new Error('Debes completar tu perfil de cliente antes de inscribirte.');
      err.statusCode = 422;
      throw err;
    }

    // Bloquear la fila de la actividad para evitar condición de carrera
    const [actRows] = await connection.execute(
      `SELECT
         a.id_actividad,
         a.nombre,
         a.fecha_actividad,
         a.precio,
         a.cupo_maximo,
         a.estado,
         COALESCE(
           (SELECT SUM(ia2.cantidad_personas)
            FROM inscripciones_actividades ia2
            WHERE ia2.id_actividad = a.id_actividad
              AND ia2.estado = 'CONFIRMADA'),
           0
         ) AS inscritos_actuales
       FROM actividades a
       WHERE a.id_actividad = ?
       LIMIT 1
       FOR UPDATE`,
      [idActividad]
    );

    if (!actRows.length) {
      const err = new Error('Actividad no encontrada.');
      err.statusCode = 404;
      throw err;
    }

    const act = actRows[0];

    if (!['PROGRAMADA', 'ACTIVA'].includes(act.estado)) {
      const err = new Error(`No se puede inscribir en una actividad en estado ${act.estado}.`);
      err.statusCode = 409;
      throw err;
    }

    const hoy = new Date().toISOString().split('T')[0];
    if (act.fecha_actividad < hoy) {
      const err = new Error('La actividad ya ha pasado.');
      err.statusCode = 409;
      throw err;
    }

    // Verificar cupo
    const cupoDisponible = act.cupo_maximo - Number(act.inscritos_actuales);
    if (cantidadPersonas > cupoDisponible) {
      const err = new Error(
        `Cupo insuficiente. Disponible: ${cupoDisponible}, solicitado: ${cantidadPersonas}.`
      );
      err.statusCode = 409;
      throw err;
    }

    // Verificar inscripción duplicada (el UNIQUE en la tabla lo protege a nivel DB también)
    const [dupRows] = await connection.execute(
      'SELECT id_inscripcion FROM inscripciones_actividades WHERE id_actividad = ? AND id_cliente = ? LIMIT 1',
      [idActividad, idCliente]
    );
    if (dupRows.length) {
      const err = new Error('Ya estás inscrito en esta actividad.');
      err.statusCode = 409;
      throw err;
    }

    const precioTotal = parseFloat((parseFloat(act.precio) * cantidadPersonas).toFixed(2));

    const [result] = await connection.execute(
      `INSERT INTO inscripciones_actividades
         (id_actividad, id_cliente, cantidad_personas, precio_total, estado)
       VALUES (?, ?, ?, ?, 'CONFIRMADA')`,
      [idActividad, idCliente, cantidadPersonas, precioTotal]
    );

    await connection.commit();

    return getInscripcionCompleta(result.insertId);

  } catch (err) {
    await connection.rollback();
    // Si el error es por UNIQUE duplicado (ER_DUP_ENTRY), devolver mensaje claro
    if (err.code === 'ER_DUP_ENTRY') {
      const dupErr = new Error('Ya estás inscrito en esta actividad.');
      dupErr.statusCode = 409;
      throw dupErr;
    }
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Lista las inscripciones del CLIENTE autenticado.
 */
async function listarMisInscripciones(idUsuario) {
  const idCliente = await getClienteByUsuario(idUsuario);
  if (!idCliente) return [];

  const [rows] = await pool.execute(
    `SELECT
       ia.id_inscripcion,
       ia.id_actividad,
       ia.cantidad_personas,
       ia.precio_total,
       ia.estado,
       ia.fecha_inscripcion,
       a.nombre              AS actividad_nombre,
       a.fecha_actividad,
       a.hora_inicio,
       a.ubicacion,
       a.precio              AS precio_unitario,
       a.estado              AS actividad_estado
     FROM inscripciones_actividades ia
     INNER JOIN actividades a ON a.id_actividad = ia.id_actividad
     WHERE ia.id_cliente = ?
     ORDER BY a.fecha_actividad ASC, ia.fecha_inscripcion DESC`,
    [idCliente]
  );
  return rows;
}

/**
 * Cancela una inscripción propia del CLIENTE.
 * Solo se puede cancelar si el estado de la inscripción es CONFIRMADA
 * y la actividad no ha pasado.
 */
async function cancelarInscripcion(idUsuario, idInscripcion) {
  const idCliente = await getClienteByUsuario(idUsuario);
  if (!idCliente) {
    const err = new Error('Perfil de cliente no encontrado.');
    err.statusCode = 422;
    throw err;
  }

  const [rows] = await pool.execute(
    `SELECT ia.id_inscripcion, ia.estado, a.fecha_actividad
     FROM inscripciones_actividades ia
     INNER JOIN actividades a ON a.id_actividad = ia.id_actividad
     WHERE ia.id_inscripcion = ? AND ia.id_cliente = ?
     LIMIT 1`,
    [idInscripcion, idCliente]
  );

  if (!rows.length) {
    const err = new Error('Inscripción no encontrada.');
    err.statusCode = 404;
    throw err;
  }

  const { estado, fecha_actividad } = rows[0];

  if (estado !== 'CONFIRMADA') {
    const err = new Error(`No se puede cancelar una inscripción en estado ${estado}.`);
    err.statusCode = 409;
    throw err;
  }

  const hoy = new Date().toISOString().split('T')[0];
  if (fecha_actividad < hoy) {
    const err = new Error('No se puede cancelar una actividad que ya ha pasado.');
    err.statusCode = 409;
    throw err;
  }

  await pool.execute(
    "UPDATE inscripciones_actividades SET estado = 'CANCELADA' WHERE id_inscripcion = ?",
    [idInscripcion]
  );

  return getInscripcionCompleta(idInscripcion);
}

module.exports = {
  listarActividadesAdmin,
  listarActividadesDisponibles,
  obtenerActividad,
  crearActividad,
  editarActividad,
  cambiarEstadoActividad,
  inscribirseActividad,
  listarMisInscripciones,
  cancelarInscripcion,
};
