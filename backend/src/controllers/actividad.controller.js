/**
 * actividad.controller.js
 * Controladores para el módulo de Actividades.
 * La identidad del cliente proviene SOLO de req.user — nunca del body.
 */
const svc = require('../services/actividad.service');

const ESTADOS_ACTIVIDAD = ['PROGRAMADA', 'ACTIVA', 'FINALIZADA', 'CANCELADA'];

// ─── helpers ──────────────────────────────────────────────────────────────────

function idValido(val) {
  const n = parseInt(val, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function decimalValido(val) {
  const n = parseFloat(val);
  return !isNaN(n) && n >= 0 ? n : null;
}

function fechaValida(str) {
  if (typeof str !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

function horaValida(str) {
  if (typeof str !== 'string') return false;
  return /^\d{2}:\d{2}(:\d{2})?$/.test(str);
}

function manejarError(err, res, next) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }
  return next(err);
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

/**
 * GET /api/actividades/admin
 */
async function listarAdmin(req, res, next) {
  try {
    const actividades = await svc.listarActividadesAdmin();
    return res.status(200).json({ success: true, actividades });
  } catch (err) { return next(err); }
}

/**
 * GET /api/actividades/admin/:id
 */
async function obtenerAdmin(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido.' });

    const actividad = await svc.obtenerActividad(id);
    if (!actividad) return res.status(404).json({ success: false, error: 'Actividad no encontrada.' });

    return res.status(200).json({ success: true, actividad });
  } catch (err) { return next(err); }
}

/**
 * POST /api/actividades/admin
 */
async function crearAdmin(req, res, next) {
  try {
    const {
      nombre, descripcion, fechaActividad, horaInicio,
      ubicacion, precio, cupoMaximo, estado,
    } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0)
      return res.status(400).json({ success: false, error: 'nombre es requerido.' });
    if (nombre.trim().length > 150)
      return res.status(400).json({ success: false, error: 'nombre supera 150 caracteres.' });

    if (!fechaActividad || !fechaValida(fechaActividad))
      return res.status(400).json({ success: false, error: 'fechaActividad debe ser una fecha válida YYYY-MM-DD.' });

    if (!horaInicio || !horaValida(horaInicio))
      return res.status(400).json({ success: false, error: 'horaInicio debe ser un formato HH:MM o HH:MM:SS.' });

    const precioVal = precio !== undefined ? decimalValido(precio) : 0;
    if (precioVal === null)
      return res.status(400).json({ success: false, error: 'precio debe ser un número >= 0.' });

    const cupoVal = idValido(cupoMaximo);
    if (!cupoVal)
      return res.status(400).json({ success: false, error: 'cupoMaximo debe ser un entero > 0.' });

    if (estado && !ESTADOS_ACTIVIDAD.includes(estado))
      return res.status(400).json({ success: false, error: `estado debe ser: ${ESTADOS_ACTIVIDAD.join(', ')}.` });

    if (ubicacion && ubicacion.length > 200)
      return res.status(400).json({ success: false, error: 'ubicacion supera 200 caracteres.' });

    const actividad = await svc.crearActividad({
      nombre:         nombre.trim(),
      descripcion:    descripcion ?? null,
      fechaActividad,
      horaInicio,
      ubicacion:      ubicacion ?? null,
      precio:         precioVal,
      cupoMaximo:     cupoVal,
      estado:         estado ?? 'PROGRAMADA',
    });

    return res.status(201).json({ success: true, actividad });
  } catch (err) { return next(err); }
}

/**
 * PUT /api/actividades/admin/:id
 */
async function editarAdmin(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido.' });

    const {
      nombre, descripcion, fechaActividad, horaInicio,
      ubicacion, precio, cupoMaximo, estado,
    } = req.body;

    if (nombre !== undefined) {
      if (typeof nombre !== 'string' || nombre.trim().length === 0)
        return res.status(400).json({ success: false, error: 'nombre no puede estar vacío.' });
      if (nombre.trim().length > 150)
        return res.status(400).json({ success: false, error: 'nombre supera 150 caracteres.' });
    }

    if (fechaActividad !== undefined && !fechaValida(fechaActividad))
      return res.status(400).json({ success: false, error: 'fechaActividad debe ser YYYY-MM-DD.' });

    if (horaInicio !== undefined && !horaValida(horaInicio))
      return res.status(400).json({ success: false, error: 'horaInicio debe ser HH:MM o HH:MM:SS.' });

    let precioVal = undefined;
    if (precio !== undefined) {
      precioVal = decimalValido(precio);
      if (precioVal === null)
        return res.status(400).json({ success: false, error: 'precio debe ser un número >= 0.' });
    }

    let cupoVal = undefined;
    if (cupoMaximo !== undefined) {
      cupoVal = idValido(cupoMaximo);
      if (!cupoVal)
        return res.status(400).json({ success: false, error: 'cupoMaximo debe ser un entero > 0.' });
    }

    if (estado && !ESTADOS_ACTIVIDAD.includes(estado))
      return res.status(400).json({ success: false, error: `estado debe ser: ${ESTADOS_ACTIVIDAD.join(', ')}.` });

    if (ubicacion && ubicacion.length > 200)
      return res.status(400).json({ success: false, error: 'ubicacion supera 200 caracteres.' });

    const actividad = await svc.editarActividad(id, {
      nombre:        nombre?.trim(),
      descripcion,
      fechaActividad,
      horaInicio,
      ubicacion,
      precio:        precioVal,
      cupoMaximo:    cupoVal,
      estado,
    });
    if (!actividad) return res.status(404).json({ success: false, error: 'Actividad no encontrada.' });

    return res.status(200).json({ success: true, actividad });
  } catch (err) { return next(err); }
}

/**
 * PATCH /api/actividades/admin/:id/estado
 */
async function cambiarEstadoAdmin(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido.' });

    const { estado } = req.body;
    if (!estado || !ESTADOS_ACTIVIDAD.includes(estado))
      return res.status(400).json({ success: false, error: `estado debe ser: ${ESTADOS_ACTIVIDAD.join(', ')}.` });

    const actividad = await svc.cambiarEstadoActividad(id, estado);
    if (!actividad) return res.status(404).json({ success: false, error: 'Actividad no encontrada.' });

    return res.status(200).json({ success: true, actividad });
  } catch (err) { return next(err); }
}

// ─── CLIENTE ──────────────────────────────────────────────────────────────────

/**
 * GET /api/actividades
 */
async function listarCliente(req, res, next) {
  try {
    const actividades = await svc.listarActividadesDisponibles();
    return res.status(200).json({ success: true, actividades });
  } catch (err) { return next(err); }
}

/**
 * GET /api/actividades/:id
 */
async function obtenerCliente(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido.' });

    const actividad = await svc.obtenerActividad(id);
    if (!actividad) return res.status(404).json({ success: false, error: 'Actividad no encontrada.' });

    return res.status(200).json({ success: true, actividad });
  } catch (err) { return next(err); }
}

/**
 * POST /api/actividades/:id/inscribirse
 * Body: { cantidadPersonas? }
 */
async function inscribirse(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID de actividad inválido.' });

    const cantidadPersonas = req.body.cantidadPersonas !== undefined
      ? parseInt(req.body.cantidadPersonas, 10)
      : 1;

    if (!Number.isInteger(cantidadPersonas) || cantidadPersonas < 1)
      return res.status(400).json({ success: false, error: 'cantidadPersonas debe ser un entero >= 1.' });

    const inscripcion = await svc.inscribirseActividad(req.user.idUsuario, id, cantidadPersonas);
    return res.status(201).json({ success: true, inscripcion });
  } catch (err) { return manejarError(err, res, next); }
}

/**
 * GET /api/actividades/mis-inscripciones
 */
async function listarMisInscripciones(req, res, next) {
  try {
    const inscripciones = await svc.listarMisInscripciones(req.user.idUsuario);
    return res.status(200).json({ success: true, inscripciones });
  } catch (err) { return next(err); }
}

/**
 * PATCH /api/actividades/inscripcion/:idInscripcion/cancelar
 */
async function cancelarInscripcion(req, res, next) {
  try {
    const id = idValido(req.params.idInscripcion);
    if (!id) return res.status(400).json({ success: false, error: 'ID de inscripción inválido.' });

    const inscripcion = await svc.cancelarInscripcion(req.user.idUsuario, id);
    return res.status(200).json({ success: true, inscripcion });
  } catch (err) { return manejarError(err, res, next); }
}

module.exports = {
  listarAdmin,
  obtenerAdmin,
  crearAdmin,
  editarAdmin,
  cambiarEstadoAdmin,
  listarCliente,
  obtenerCliente,
  inscribirse,
  listarMisInscripciones,
  cancelarInscripcion,
};
