/**
 * servicio.service.js
 * Lógica de acceso a datos para el módulo de Servicios Adicionales.
 * Fuente de verdad: schema.sql — tablas servicios y reservacion_servicios.
 * Todas las consultas usan pool.execute() con placeholders ?.
 */
const { pool } = require('../config/mysql');

// ─── helpers privados ──────────────────────────────────────────────────────────

/**
 * Busca el id_cliente asociado a un id_usuario.
 * Nunca confía en id_cliente del frontend.
 */
async function getClienteByUsuario(idUsuario) {
  const [rows] = await pool.execute(
    'SELECT id_cliente FROM clientes WHERE id_usuario = ? LIMIT 1',
    [idUsuario]
  );
  return rows.length ? rows[0].id_cliente : null;
}

// ─── Servicios (catálogo) ──────────────────────────────────────────────────────

/**
 * Lista todos los servicios (ADMIN: todos los estados).
 */
async function listarServiciosAdmin() {
  const [rows] = await pool.execute(
    `SELECT id_servicio, nombre, descripcion, precio, estado,
            fecha_creacion, ultima_actualizacion
     FROM servicios
     ORDER BY nombre ASC`
  );
  return rows;
}

/**
 * Lista servicios disponibles para un CLIENTE (solo ACTIVO).
 */
async function listarServiciosActivos() {
  const [rows] = await pool.execute(
    `SELECT id_servicio, nombre, descripcion, precio, estado, fecha_creacion
     FROM servicios
     WHERE estado = 'ACTIVO'
     ORDER BY nombre ASC`
  );
  return rows;
}

/**
 * Obtiene un servicio por ID.
 */
async function obtenerServicio(idServicio) {
  const [rows] = await pool.execute(
    `SELECT id_servicio, nombre, descripcion, precio, estado,
            fecha_creacion, ultima_actualizacion
     FROM servicios
     WHERE id_servicio = ?
     LIMIT 1`,
    [idServicio]
  );
  return rows.length ? rows[0] : null;
}

/**
 * Crea un nuevo servicio (ADMIN).
 */
async function crearServicio({ nombre, descripcion, precio, estado }) {
  const [result] = await pool.execute(
    `INSERT INTO servicios (nombre, descripcion, precio, estado)
     VALUES (?, ?, ?, ?)`,
    [nombre, descripcion ?? null, precio, estado ?? 'ACTIVO']
  );
  return obtenerServicio(result.insertId);
}

/**
 * Edita un servicio existente (ADMIN). Parcial: solo actualiza campos enviados.
 */
async function editarServicio(idServicio, { nombre, descripcion, precio, estado }) {
  await pool.execute(
    `UPDATE servicios
     SET nombre       = COALESCE(?, nombre),
         descripcion  = COALESCE(?, descripcion),
         precio       = COALESCE(?, precio),
         estado       = COALESCE(?, estado)
     WHERE id_servicio = ?`,
    [
      nombre      ?? null,
      descripcion ?? null,
      precio      ?? null,
      estado      ?? null,
      idServicio,
    ]
  );
  return obtenerServicio(idServicio);
}

/**
 * Cambia el estado de un servicio (ADMIN): ACTIVO / INACTIVO.
 */
async function cambiarEstadoServicio(idServicio, estado) {
  await pool.execute(
    'UPDATE servicios SET estado = ? WHERE id_servicio = ?',
    [estado, idServicio]
  );
  return obtenerServicio(idServicio);
}

// ─── reservacion_servicios ────────────────────────────────────────────────────

/**
 * Estados de reservación que NO permiten agregar ni quitar servicios.
 */
const ESTADOS_BLOQUEADOS = ['CANCELADA', 'CHECK_OUT'];

/**
 * Devuelve los servicios asociados a una reservación con su detalle.
 */
async function listarServiciosReservacion(idReservacion) {
  const [rows] = await pool.execute(
    `SELECT
       rs.id_reservacion_servicio,
       rs.id_servicio,
       rs.cantidad,
       rs.precio_unitario_aplicado,
       rs.subtotal,
       s.nombre              AS servicio_nombre,
       s.descripcion         AS servicio_descripcion,
       s.estado              AS servicio_estado
     FROM reservacion_servicios rs
     INNER JOIN servicios s ON s.id_servicio = rs.id_servicio
     WHERE rs.id_reservacion = ?
     ORDER BY s.nombre ASC`,
    [idReservacion]
  );
  return rows;
}

/**
 * Agrega un servicio a una reservación propia del CLIENTE autenticado.
 *
 * Validaciones:
 *  - Reservación existe y pertenece al cliente.
 *  - Estado de la reservación no es CANCELADA ni CHECK_OUT.
 *  - Servicio existe y está ACTIVO.
 *  - cantidad >= 1.
 *
 * Si el mismo servicio ya existe en la reservación, incrementa la cantidad.
 * precio_unitario_aplicado = precio actual del servicio en el momento de agregar.
 */
async function agregarServicioReservacion(idUsuario, idReservacion, idServicio, cantidad) {
  const idCliente = await getClienteByUsuario(idUsuario);
  if (!idCliente) {
    const err = new Error('Debes completar tu perfil de cliente antes de usar este módulo.');
    err.statusCode = 422;
    throw err;
  }

  // Verificar propiedad de la reservación
  const [resRows] = await pool.execute(
    'SELECT id_reservacion, estado FROM reservaciones WHERE id_reservacion = ? AND id_cliente = ? LIMIT 1',
    [idReservacion, idCliente]
  );
  if (!resRows.length) {
    const err = new Error('Reservación no encontrada.');
    err.statusCode = 404;
    throw err;
  }

  const { estado: estadoRes } = resRows[0];
  if (ESTADOS_BLOQUEADOS.includes(estadoRes)) {
    const err = new Error(`No se pueden agregar servicios a una reservación en estado ${estadoRes}.`);
    err.statusCode = 409;
    throw err;
  }

  // Verificar servicio
  const servicio = await obtenerServicio(idServicio);
  if (!servicio) {
    const err = new Error('Servicio no encontrado.');
    err.statusCode = 404;
    throw err;
  }
  if (servicio.estado !== 'ACTIVO') {
    const err = new Error('El servicio no está disponible.');
    err.statusCode = 409;
    throw err;
  }

  const precioUnitario = parseFloat(servicio.precio);
  const subtotal       = parseFloat((precioUnitario * cantidad).toFixed(2));

  // Verificar si ya existe la asociación
  const [existing] = await pool.execute(
    'SELECT id_reservacion_servicio, cantidad FROM reservacion_servicios WHERE id_reservacion = ? AND id_servicio = ? LIMIT 1',
    [idReservacion, idServicio]
  );

  if (existing.length) {
    // Incrementar cantidad
    const nuevaCantidad  = existing[0].cantidad + cantidad;
    const nuevoSubtotal  = parseFloat((precioUnitario * nuevaCantidad).toFixed(2));
    await pool.execute(
      'UPDATE reservacion_servicios SET cantidad = ?, subtotal = ? WHERE id_reservacion_servicio = ?',
      [nuevaCantidad, nuevoSubtotal, existing[0].id_reservacion_servicio]
    );
  } else {
    await pool.execute(
      `INSERT INTO reservacion_servicios
         (id_reservacion, id_servicio, cantidad, precio_unitario_aplicado, subtotal)
       VALUES (?, ?, ?, ?, ?)`,
      [idReservacion, idServicio, cantidad, precioUnitario, subtotal]
    );
  }

  return listarServiciosReservacion(idReservacion);
}

/**
 * Lista los servicios de UNA reservación del CLIENTE autenticado.
 * Verifica propiedad antes de devolver.
 */
async function listarMisServiciosReservacion(idUsuario, idReservacion) {
  const idCliente = await getClienteByUsuario(idUsuario);
  if (!idCliente) return [];

  const [check] = await pool.execute(
    'SELECT id_reservacion FROM reservaciones WHERE id_reservacion = ? AND id_cliente = ? LIMIT 1',
    [idReservacion, idCliente]
  );
  if (!check.length) {
    const err = new Error('Reservación no encontrada.');
    err.statusCode = 404;
    throw err;
  }

  return listarServiciosReservacion(idReservacion);
}

/**
 * Elimina un servicio de una reservación propia del CLIENTE.
 * Solo se puede hacer si el estado de la reservación lo permite.
 */
async function quitarServicioReservacion(idUsuario, idReservacion, idReservacionServicio) {
  const idCliente = await getClienteByUsuario(idUsuario);
  if (!idCliente) {
    const err = new Error('Perfil de cliente no encontrado.');
    err.statusCode = 422;
    throw err;
  }

  // Verificar propiedad
  const [resRows] = await pool.execute(
    'SELECT id_reservacion, estado FROM reservaciones WHERE id_reservacion = ? AND id_cliente = ? LIMIT 1',
    [idReservacion, idCliente]
  );
  if (!resRows.length) {
    const err = new Error('Reservación no encontrada.');
    err.statusCode = 404;
    throw err;
  }

  const { estado: estadoRes } = resRows[0];
  if (ESTADOS_BLOQUEADOS.includes(estadoRes)) {
    const err = new Error(`No se pueden quitar servicios de una reservación en estado ${estadoRes}.`);
    err.statusCode = 409;
    throw err;
  }

  // Verificar que el registro pertenece a esta reservación
  const [rsRows] = await pool.execute(
    'SELECT id_reservacion_servicio FROM reservacion_servicios WHERE id_reservacion_servicio = ? AND id_reservacion = ? LIMIT 1',
    [idReservacionServicio, idReservacion]
  );
  if (!rsRows.length) {
    const err = new Error('Registro de servicio no encontrado en esta reservación.');
    err.statusCode = 404;
    throw err;
  }

  await pool.execute(
    'DELETE FROM reservacion_servicios WHERE id_reservacion_servicio = ?',
    [idReservacionServicio]
  );

  return listarServiciosReservacion(idReservacion);
}

module.exports = {
  listarServiciosAdmin,
  listarServiciosActivos,
  obtenerServicio,
  crearServicio,
  editarServicio,
  cambiarEstadoServicio,
  listarServiciosReservacion,
  agregarServicioReservacion,
  listarMisServiciosReservacion,
  quitarServicioReservacion,
};
