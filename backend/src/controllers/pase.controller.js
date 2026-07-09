/**
 * pase.controller.js
 * Controladores para el módulo de Pases de Día.
 * La identidad del cliente proviene SOLO de req.user — nunca del body.
 */
const svc = require('../services/pase.service');
const { registrarAuditoria } = require('../services/auditoria.service');

const ESTADOS_TIPO_PASE = ['ACTIVO', 'INACTIVO'];

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

function manejarError(err, res, next) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }
  return next(err);
}

// ─── ADMIN: tipos_pase ────────────────────────────────────────────────────────

/**
 * GET /api/pases/admin/tipos
 */
async function listarTiposAdmin(req, res, next) {
  try {
    const tipos = await svc.listarTiposPaseAdmin();
    return res.status(200).json({ success: true, tipos });
  } catch (err) { return next(err); }
}

/**
 * GET /api/pases/admin/tipos/:id
 */
async function obtenerTipoAdmin(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido.' });

    const tipo = await svc.obtenerTipoPase(id);
    if (!tipo) return res.status(404).json({ success: false, error: 'Tipo de pase no encontrado.' });

    return res.status(200).json({ success: true, tipo });
  } catch (err) { return next(err); }
}

/**
 * POST /api/pases/admin/tipos
 */
async function crearTipoAdmin(req, res, next) {
  try {
    const {
      nombre, descripcion, precio,
      cantidadMaximaPersonas, serviciosIncluidos, estado,
    } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0)
      return res.status(400).json({ success: false, error: 'nombre es requerido.' });
    if (nombre.trim().length > 120)
      return res.status(400).json({ success: false, error: 'nombre supera 120 caracteres.' });

    const precioVal = precio !== undefined ? decimalValido(precio) : 0;
    if (precioVal === null)
      return res.status(400).json({ success: false, error: 'precio debe ser un número >= 0.' });

    const cantPersonas = cantidadMaximaPersonas !== undefined
      ? idValido(cantidadMaximaPersonas)
      : 1;
    if (!cantPersonas)
      return res.status(400).json({ success: false, error: 'cantidadMaximaPersonas debe ser un entero > 0.' });

    if (estado && !ESTADOS_TIPO_PASE.includes(estado))
      return res.status(400).json({ success: false, error: `estado debe ser: ${ESTADOS_TIPO_PASE.join(', ')}.` });

    const tipo = await svc.crearTipoPase({
      nombre:                  nombre.trim(),
      descripcion:             descripcion           ?? null,
      precio:                  precioVal,
      cantidadMaximaPersonas:  cantPersonas,
      serviciosIncluidos:      serviciosIncluidos    ?? null,
      estado:                  estado                ?? 'ACTIVO',
    });

    return res.status(201).json({ success: true, tipo });
  } catch (err) { return next(err); }
}

/**
 * PUT /api/pases/admin/tipos/:id
 */
async function editarTipoAdmin(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido.' });

    const {
      nombre, descripcion, precio,
      cantidadMaximaPersonas, serviciosIncluidos, estado,
    } = req.body;

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

    let cantPersonas = undefined;
    if (cantidadMaximaPersonas !== undefined) {
      cantPersonas = idValido(cantidadMaximaPersonas);
      if (!cantPersonas)
        return res.status(400).json({ success: false, error: 'cantidadMaximaPersonas debe ser un entero > 0.' });
    }

    if (estado && !ESTADOS_TIPO_PASE.includes(estado))
      return res.status(400).json({ success: false, error: `estado debe ser: ${ESTADOS_TIPO_PASE.join(', ')}.` });

    const tipo = await svc.editarTipoPase(id, {
      nombre:                 nombre?.trim(),
      descripcion,
      precio:                 precioVal,
      cantidadMaximaPersonas: cantPersonas,
      serviciosIncluidos,
      estado,
    });
    if (!tipo) return res.status(404).json({ success: false, error: 'Tipo de pase no encontrado.' });

    return res.status(200).json({ success: true, tipo });
  } catch (err) { return next(err); }
}

/**
 * PATCH /api/pases/admin/tipos/:id/estado
 */
async function cambiarEstadoTipoAdmin(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido.' });

    const { estado } = req.body;
    if (!estado || !ESTADOS_TIPO_PASE.includes(estado))
      return res.status(400).json({ success: false, error: `estado debe ser: ${ESTADOS_TIPO_PASE.join(', ')}.` });

    const tipo = await svc.cambiarEstadoTipoPase(id, estado);
    if (!tipo) return res.status(404).json({ success: false, error: 'Tipo de pase no encontrado.' });

    return res.status(200).json({ success: true, tipo });
  } catch (err) { return next(err); }
}

/**
 * GET /api/pases/admin/adquiridos
 * Lista todos los pases adquiridos por clientes.
 * Query param opcional: idCliente
 */
async function listarPasesAdquiridosAdmin(req, res, next) {
  try {
    const { idCliente } = req.query;
    let idClienteVal = undefined;
    if (idCliente) {
      idClienteVal = idValido(idCliente);
      if (!idClienteVal) return res.status(400).json({ success: false, error: 'idCliente debe ser un entero > 0.' });
    }

    const pases = await svc.listarPasesAdmin({ idCliente: idClienteVal });
    return res.status(200).json({ success: true, pases });
  } catch (err) { return next(err); }
}

// ─── CLIENTE ──────────────────────────────────────────────────────────────────

/**
 * GET /api/pases/tipos
 */
async function listarTiposCliente(req, res, next) {
  try {
    const tipos = await svc.listarTiposPaseActivos();
    return res.status(200).json({ success: true, tipos });
  } catch (err) { return next(err); }
}

/**
 * POST /api/pases/adquirir
 * Body: { idTipoPase, fechaUso, cantidadPersonas? }
 */
async function adquirirPase(req, res, next) {
  try {
    const { idTipoPase, fechaUso, cantidadPersonas } = req.body;

    const idTipoPaseVal = idValido(idTipoPase);
    if (!idTipoPaseVal)
      return res.status(400).json({ success: false, error: 'idTipoPase debe ser un entero > 0.' });

    if (!fechaUso || !fechaValida(fechaUso))
      return res.status(400).json({ success: false, error: 'fechaUso debe ser una fecha válida YYYY-MM-DD.' });

    const cantPersonas = cantidadPersonas !== undefined
      ? parseInt(cantidadPersonas, 10)
      : 1;
    if (!Number.isInteger(cantPersonas) || cantPersonas < 1)
      return res.status(400).json({ success: false, error: 'cantidadPersonas debe ser un entero >= 1.' });

    const pase = await svc.adquirirPase(req.user.idUsuario, {
      idTipoPase:       idTipoPaseVal,
      fechaUso,
      cantidadPersonas: cantPersonas,
    });

    void registrarAuditoria({ idUsuario: req.user.idUsuario, rol: req.user.rol, accion: 'ADQUIRIR_PASE', modulo: 'PASES', entidadId: pase.id_pase_cliente, detalle: { codigo: pase.codigo_pase, fechaUso } });
    return res.status(201).json({ success: true, pase });
  } catch (err) { return manejarError(err, res, next); }
}

/**
 * GET /api/pases/mis-pases
 */
async function listarMisPases(req, res, next) {
  try {
    const pases = await svc.listarMisPases(req.user.idUsuario);
    return res.status(200).json({ success: true, pases });
  } catch (err) { return next(err); }
}

/**
 * GET /api/pases/mis-pases/:id
 */
async function obtenerMiPase(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido.' });

    const pase = await svc.obtenerMiPase(req.user.idUsuario, id);
    return res.status(200).json({ success: true, pase });
  } catch (err) { return manejarError(err, res, next); }
}

module.exports = {
  listarTiposAdmin,
  obtenerTipoAdmin,
  crearTipoAdmin,
  editarTipoAdmin,
  cambiarEstadoTipoAdmin,
  listarPasesAdquiridosAdmin,
  listarTiposCliente,
  adquirirPase,
  listarMisPases,
  obtenerMiPase,
};
