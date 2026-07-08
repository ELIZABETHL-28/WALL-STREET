/**
 * servicio.controller.js
 * Controladores para el módulo de Servicios Adicionales.
 * La identidad del cliente proviene SOLO de req.user — nunca del body.
 * Todos los inputs son validados antes de llamar al servicio.
 */
const svc = require('../services/servicio.service');

const ESTADOS_SERVICIO = ['ACTIVO', 'INACTIVO'];

// ─── helpers ──────────────────────────────────────────────────────────────────

function idValido(val) {
  const n = parseInt(val, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function decimalValido(val) {
  const n = parseFloat(val);
  return !isNaN(n) && n >= 0 ? n : null;
}

function manejarError(err, res, next) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }
  return next(err);
}

// ─── ADMIN: catálogo de servicios ─────────────────────────────────────────────

/**
 * GET /api/servicios/admin
 */
async function listarAdmin(req, res, next) {
  try {
    const servicios = await svc.listarServiciosAdmin();
    return res.status(200).json({ success: true, servicios });
  } catch (err) { return next(err); }
}

/**
 * GET /api/servicios/admin/:id
 */
async function obtenerAdmin(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido.' });

    const servicio = await svc.obtenerServicio(id);
    if (!servicio) return res.status(404).json({ success: false, error: 'Servicio no encontrado.' });

    return res.status(200).json({ success: true, servicio });
  } catch (err) { return next(err); }
}

/**
 * POST /api/servicios/admin
 */
async function crearAdmin(req, res, next) {
  try {
    const { nombre, descripcion, precio, estado } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0)
      return res.status(400).json({ success: false, error: 'nombre es requerido.' });
    if (nombre.trim().length > 120)
      return res.status(400).json({ success: false, error: 'nombre supera 120 caracteres.' });

    const precioVal = decimalValido(precio);
    if (precioVal === null)
      return res.status(400).json({ success: false, error: 'precio debe ser un número >= 0.' });

    if (estado && !ESTADOS_SERVICIO.includes(estado))
      return res.status(400).json({ success: false, error: `estado debe ser: ${ESTADOS_SERVICIO.join(', ')}.` });

    const servicio = await svc.crearServicio({
      nombre:      nombre.trim(),
      descripcion: descripcion ?? null,
      precio:      precioVal,
      estado:      estado ?? 'ACTIVO',
    });

    return res.status(201).json({ success: true, servicio });
  } catch (err) { return next(err); }
}

/**
 * PUT /api/servicios/admin/:id
 */
async function editarAdmin(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido.' });

    const { nombre, descripcion, precio, estado } = req.body;

    if (nombre !== undefined) {
      if (typeof nombre !== 'string' || nombre.trim().length === 0)
        return res.status(400).json({ success: false, error: 'nombre no puede estar vacío.' });
      if (nombre.trim().length > 120)
        return res.status(400).json({ success: false, error: 'nombre supera 120 caracteres.' });
    }

    let precioVal = undefined;
    if (precio !== undefined) {
      precioVal = decimalValido(precio);
      if (precioVal === null)
        return res.status(400).json({ success: false, error: 'precio debe ser un número >= 0.' });
    }

    if (estado && !ESTADOS_SERVICIO.includes(estado))
      return res.status(400).json({ success: false, error: `estado debe ser: ${ESTADOS_SERVICIO.join(', ')}.` });

    const servicio = await svc.editarServicio(id, {
      nombre:      nombre?.trim(),
      descripcion,
      precio:      precioVal,
      estado,
    });
    if (!servicio) return res.status(404).json({ success: false, error: 'Servicio no encontrado.' });

    return res.status(200).json({ success: true, servicio });
  } catch (err) { return next(err); }
}

/**
 * PATCH /api/servicios/admin/:id/estado
 */
async function cambiarEstadoAdmin(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido.' });

    const { estado } = req.body;
    if (!estado || !ESTADOS_SERVICIO.includes(estado))
      return res.status(400).json({ success: false, error: `estado debe ser: ${ESTADOS_SERVICIO.join(', ')}.` });

    const servicio = await svc.cambiarEstadoServicio(id, estado);
    if (!servicio) return res.status(404).json({ success: false, error: 'Servicio no encontrado.' });

    return res.status(200).json({ success: true, servicio });
  } catch (err) { return next(err); }
}

// ─── CLIENTE: catálogo de servicios ──────────────────────────────────────────

/**
 * GET /api/servicios
 */
async function listarCliente(req, res, next) {
  try {
    const servicios = await svc.listarServiciosActivos();
    return res.status(200).json({ success: true, servicios });
  } catch (err) { return next(err); }
}

// ─── CLIENTE: reservacion_servicios ──────────────────────────────────────────

/**
 * GET /api/servicios/reservacion/:idReservacion
 * Lista servicios de una reservación propia.
 */
async function listarDeReservacion(req, res, next) {
  try {
    const idReservacion = idValido(req.params.idReservacion);
    if (!idReservacion) return res.status(400).json({ success: false, error: 'ID de reservación inválido.' });

    const servicios = await svc.listarMisServiciosReservacion(req.user.idUsuario, idReservacion);
    return res.status(200).json({ success: true, servicios });
  } catch (err) { return manejarError(err, res, next); }
}

/**
 * POST /api/servicios/reservacion/:idReservacion
 * Agrega un servicio a una reservación propia.
 * Body: { idServicio, cantidad? }
 */
async function agregarAReservacion(req, res, next) {
  try {
    const idReservacion = idValido(req.params.idReservacion);
    if (!idReservacion) return res.status(400).json({ success: false, error: 'ID de reservación inválido.' });

    const { idServicio, cantidad } = req.body;

    const idServicioVal = idValido(idServicio);
    if (!idServicioVal) return res.status(400).json({ success: false, error: 'idServicio debe ser un entero > 0.' });

    const cantidadVal = cantidad !== undefined ? parseInt(cantidad, 10) : 1;
    if (!Number.isInteger(cantidadVal) || cantidadVal < 1)
      return res.status(400).json({ success: false, error: 'cantidad debe ser un entero >= 1.' });

    const servicios = await svc.agregarServicioReservacion(
      req.user.idUsuario, idReservacion, idServicioVal, cantidadVal
    );

    return res.status(200).json({ success: true, servicios });
  } catch (err) { return manejarError(err, res, next); }
}

/**
 * DELETE /api/servicios/reservacion/:idReservacion/:idReservacionServicio
 * Quita un servicio de una reservación propia.
 */
async function quitarDeReservacion(req, res, next) {
  try {
    const idReservacion         = idValido(req.params.idReservacion);
    const idReservacionServicio = idValido(req.params.idReservacionServicio);

    if (!idReservacion)
      return res.status(400).json({ success: false, error: 'ID de reservación inválido.' });
    if (!idReservacionServicio)
      return res.status(400).json({ success: false, error: 'ID de servicio-reservación inválido.' });

    const servicios = await svc.quitarServicioReservacion(
      req.user.idUsuario, idReservacion, idReservacionServicio
    );

    return res.status(200).json({ success: true, servicios });
  } catch (err) { return manejarError(err, res, next); }
}

module.exports = {
  listarAdmin,
  obtenerAdmin,
  crearAdmin,
  editarAdmin,
  cambiarEstadoAdmin,
  listarCliente,
  listarDeReservacion,
  agregarAReservacion,
  quitarDeReservacion,
};
