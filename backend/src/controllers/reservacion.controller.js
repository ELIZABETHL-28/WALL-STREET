/**
 * reservacion.controller.js
 * Controladores para el módulo de Reservaciones — Hotel Wall Street.
 *
 * Reglas:
 *  - Nunca interpola valores de req.body/params/query en SQL directamente.
 *  - La identidad del usuario proviene SOLO de req.user (puesto por auth.middleware).
 *  - Valida todos los inputs antes de llamar al servicio.
 *  - Responde con { success, ... } o { success: false, error: '...' }.
 */

const svc = require('../services/reservacion.service');

// ─── Constantes de validación ─────────────────────────────────────────────────

const ESTADOS_RESERVACION = ['PENDIENTE', 'CONFIRMADA', 'CHECK_IN', 'CHECK_OUT', 'CANCELADA'];
const TIPOS_DOCUMENTO     = ['DPI', 'PASAPORTE', 'OTRO'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function idValido(val) {
  const n = parseInt(val, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Valida que una cadena sea una fecha ISO YYYY-MM-DD. */
function fechaValida(str) {
  if (typeof str !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

/** Envía la respuesta de error apropiada según el statusCode del error. */
function manejarError(err, res, next) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }
  return next(err);
}

// ─── CLIENTE: Disponibilidad ──────────────────────────────────────────────────

/**
 * GET /api/reservaciones/disponibilidad
 * Query params: fechaEntrada, fechaSalida, cantidadVisitantes
 */
async function consultarDisponibilidad(req, res, next) {
  try {
    const { fechaEntrada, fechaSalida, cantidadVisitantes } = req.query;

    if (!fechaEntrada || !fechaValida(fechaEntrada))
      return res.status(400).json({ success: false, error: 'fechaEntrada debe ser una fecha válida YYYY-MM-DD.' });

    if (!fechaSalida || !fechaValida(fechaSalida))
      return res.status(400).json({ success: false, error: 'fechaSalida debe ser una fecha válida YYYY-MM-DD.' });

    if (new Date(fechaSalida) <= new Date(fechaEntrada))
      return res.status(400).json({ success: false, error: 'fechaSalida debe ser posterior a fechaEntrada.' });

    const visitantes = parseInt(cantidadVisitantes, 10);
    if (!Number.isInteger(visitantes) || visitantes < 1)
      return res.status(400).json({ success: false, error: 'cantidadVisitantes debe ser un entero >= 1.' });

    const resultado = await svc.consultarDisponibilidad({
      fechaEntrada,
      fechaSalida,
      cantidadVisitantes: visitantes,
    });

    return res.status(200).json({ success: true, ...resultado });
  } catch (err) {
    return manejarError(err, res, next);
  }
}

// ─── CLIENTE: Mis reservaciones ───────────────────────────────────────────────

/**
 * GET /api/reservaciones/mias
 */
async function listarMias(req, res, next) {
  try {
    const reservaciones = await svc.listarMisReservaciones(req.user.idUsuario);
    return res.status(200).json({ success: true, reservaciones });
  } catch (err) {
    return manejarError(err, res, next);
  }
}

/**
 * GET /api/reservaciones/mias/:id
 */
async function obtenerMia(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID de reservación inválido.' });

    const reservacion = await svc.obtenerMiReservacion(req.user.idUsuario, id);
    if (!reservacion) return res.status(404).json({ success: false, error: 'Reservación no encontrada.' });

    return res.status(200).json({ success: true, reservacion });
  } catch (err) {
    return manejarError(err, res, next);
  }
}

// ─── CLIENTE: Crear reservación ───────────────────────────────────────────────

/**
 * POST /api/reservaciones
 * Body: fechaEntrada, fechaSalida, cantidadAdultos, cantidadNinos?, visitantes?
 */
async function crearReservacion(req, res, next) {
  try {
    const {
      fechaEntrada,
      fechaSalida,
      cantidadAdultos,
      cantidadNinos = 0,
      visitantes    = [],
    } = req.body;

    // Validar fechas
    if (!fechaEntrada || !fechaValida(fechaEntrada))
      return res.status(400).json({ success: false, error: 'fechaEntrada debe ser una fecha válida YYYY-MM-DD.' });

    if (!fechaSalida || !fechaValida(fechaSalida))
      return res.status(400).json({ success: false, error: 'fechaSalida debe ser una fecha válida YYYY-MM-DD.' });

    if (new Date(fechaSalida) <= new Date(fechaEntrada))
      return res.status(400).json({ success: false, error: 'fechaSalida debe ser posterior a fechaEntrada.' });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (new Date(fechaEntrada + 'T00:00:00Z') < hoy)
      return res.status(400).json({ success: false, error: 'fechaEntrada no puede ser en el pasado.' });

    // Validar adultos
    const adultos = parseInt(cantidadAdultos, 10);
    if (!Number.isInteger(adultos) || adultos < 1)
      return res.status(400).json({ success: false, error: 'cantidadAdultos debe ser un entero >= 1.' });

    // Validar niños
    const ninos = parseInt(cantidadNinos, 10);
    if (!Number.isInteger(ninos) || ninos < 0)
      return res.status(400).json({ success: false, error: 'cantidadNinos debe ser un entero >= 0.' });

    // Validar visitantes (opcional)
    if (!Array.isArray(visitantes))
      return res.status(400).json({ success: false, error: 'visitantes debe ser un arreglo.' });

    for (let i = 0; i < visitantes.length; i++) {
      const v = visitantes[i];
      if (!v.nombres || typeof v.nombres !== 'string' || v.nombres.trim().length === 0)
        return res.status(400).json({ success: false, error: `visitantes[${i}].nombres es requerido.` });
      if (!v.apellidos || typeof v.apellidos !== 'string' || v.apellidos.trim().length === 0)
        return res.status(400).json({ success: false, error: `visitantes[${i}].apellidos es requerido.` });
      if (v.tipoDocumento && !TIPOS_DOCUMENTO.includes(v.tipoDocumento))
        return res.status(400).json({ success: false, error: `visitantes[${i}].tipoDocumento inválido. Valores: ${TIPOS_DOCUMENTO.join(', ')}.` });
    }

    const reservacion = await svc.crearReservacion(req.user.idUsuario, {
      fechaEntrada,
      fechaSalida,
      cantidadAdultos: adultos,
      cantidadNinos:   ninos,
      visitantes,
    });

    return res.status(201).json({ success: true, reservacion });
  } catch (err) {
    return manejarError(err, res, next);
  }
}

// ─── CLIENTE: Cancelar reservación ───────────────────────────────────────────

/**
 * PATCH /api/reservaciones/mias/:id/cancelar
 */
async function cancelarMia(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID de reservación inválido.' });

    const reservacion = await svc.cancelarMiReservacion(req.user.idUsuario, id);
    return res.status(200).json({ success: true, reservacion });
  } catch (err) {
    return manejarError(err, res, next);
  }
}

// ─── ADMIN: Listar todas ──────────────────────────────────────────────────────

/**
 * GET /api/reservaciones/admin
 * Query params opcionales: estado, fechaDesde, fechaHasta
 */
async function listarAdmin(req, res, next) {
  try {
    const { estado, fechaDesde, fechaHasta } = req.query;

    if (estado && !ESTADOS_RESERVACION.includes(estado))
      return res.status(400).json({ success: false, error: `estado inválido. Valores: ${ESTADOS_RESERVACION.join(', ')}.` });

    if (fechaDesde && !fechaValida(fechaDesde))
      return res.status(400).json({ success: false, error: 'fechaDesde debe ser YYYY-MM-DD.' });

    if (fechaHasta && !fechaValida(fechaHasta))
      return res.status(400).json({ success: false, error: 'fechaHasta debe ser YYYY-MM-DD.' });

    const reservaciones = await svc.listarReservacionesAdmin({ estado, fechaDesde, fechaHasta });
    return res.status(200).json({ success: true, reservaciones });
  } catch (err) {
    return manejarError(err, res, next);
  }
}

// ─── ADMIN: Detalle ───────────────────────────────────────────────────────────

/**
 * GET /api/reservaciones/admin/:id
 */
async function obtenerAdmin(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID de reservación inválido.' });

    const reservacion = await svc.obtenerReservacionAdmin(id);
    if (!reservacion) return res.status(404).json({ success: false, error: 'Reservación no encontrada.' });

    return res.status(200).json({ success: true, reservacion });
  } catch (err) {
    return manejarError(err, res, next);
  }
}

// ─── ADMIN: Cambiar estado ────────────────────────────────────────────────────

/**
 * PATCH /api/reservaciones/admin/:id/estado
 * Body: { estado }
 */
async function cambiarEstadoAdmin(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID de reservación inválido.' });

    const { estado } = req.body;
    if (!estado || !ESTADOS_RESERVACION.includes(estado))
      return res.status(400).json({ success: false, error: `estado debe ser uno de: ${ESTADOS_RESERVACION.join(', ')}.` });

    const reservacion = await svc.cambiarEstadoReservacion(id, estado);
    return res.status(200).json({ success: true, reservacion });
  } catch (err) {
    return manejarError(err, res, next);
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  consultarDisponibilidad,
  listarMias,
  obtenerMia,
  crearReservacion,
  cancelarMia,
  listarAdmin,
  obtenerAdmin,
  cambiarEstadoAdmin,
};
