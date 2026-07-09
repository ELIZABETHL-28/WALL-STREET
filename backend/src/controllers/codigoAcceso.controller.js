const svc = require('../services/codigoAcceso.service');
const { registrarAuditoria } = require('../services/auditoria.service');

function idValido(valor) {
  const id = Number.parseInt(valor, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function responderError(error, res, next) {
  if (error.statusCode) return res.status(error.statusCode).json({ success: false, error: error.message });
  return next(error);
}

async function obtenerReservacion(req, res, next) {
  try {
    const id = idValido(req.params.idReservacion);
    if (!id) return res.status(400).json({ success: false, error: 'ID de reservación inválido.' });
    const codigo = await svc.obtenerCodigoReservacion(req.user.idUsuario, id);
    return res.json({ success: true, codigo });
  } catch (error) { return responderError(error, res, next); }
}

async function obtenerPase(req, res, next) {
  try {
    const id = idValido(req.params.idPaseCliente);
    if (!id) return res.status(400).json({ success: false, error: 'ID de pase inválido.' });
    const codigo = await svc.obtenerCodigoPase(req.user.idUsuario, id);
    return res.json({ success: true, codigo });
  } catch (error) { return responderError(error, res, next); }
}

async function validar(req, res, next) {
  try {
    const { codigo } = req.body;
    if (!codigo || typeof codigo !== 'string') return res.status(400).json({ success: false, error: 'El código es requerido.' });
    const resultado = await svc.validarCodigo(codigo);
    void registrarAuditoria({ idUsuario: req.user.idUsuario, rol: req.user.rol, accion: 'VALIDAR_CODIGO', modulo: 'CODIGOS_ACCESO', entidadId: resultado.id_codigo_acceso, detalle: { tipo: resultado.tipo, estado: resultado.estado } });
    return res.json({ success: true, codigo: resultado });
  } catch (error) { return responderError(error, res, next); }
}

async function utilizar(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID de código inválido.' });
    const resultado = await svc.utilizarCodigo(id);
    void registrarAuditoria({ idUsuario: req.user.idUsuario, rol: req.user.rol, accion: 'UTILIZAR_CODIGO', modulo: 'CODIGOS_ACCESO', entidadId: id, detalle: { tipo: resultado.tipo } });
    return res.json({ success: true, codigo: resultado });
  } catch (error) { return responderError(error, res, next); }
}

module.exports = { obtenerReservacion, obtenerPase, validar, utilizar };
