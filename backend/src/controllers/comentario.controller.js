const svc = require('../services/comentario.service');
const { registrarAuditoria } = require('../services/auditoria.service');

function idValido(valor) {
  const id = Number.parseInt(valor, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function responderError(error, res, next) {
  if (error.statusCode) return res.status(error.statusCode).json({ success: false, error: error.message });
  if (error?.code === 11000) return res.status(409).json({ success: false, error: 'Esta reservación ya fue calificada.' });
  return next(error);
}

async function crear(req, res, next) {
  try {
    const idReservacion = idValido(req.body.idReservacion);
    const calificacion = Number(req.body.calificacion);
    const comentario = typeof req.body.comentario === 'string' ? req.body.comentario.trim() : '';
    if (!idReservacion) return res.status(400).json({ success: false, error: 'idReservacion inválido.' });
    if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) return res.status(400).json({ success: false, error: 'calificacion debe estar entre 1 y 5.' });
    if (!comentario || comentario.length > 1000) return res.status(400).json({ success: false, error: 'El comentario es requerido y debe tener máximo 1000 caracteres.' });

    const resultado = await svc.crearComentario(req.user.idUsuario, { idReservacion, calificacion, comentario });
    void registrarAuditoria({ idUsuario: req.user.idUsuario, rol: req.user.rol, accion: 'CREAR_CALIFICACION', modulo: 'COMENTARIOS', entidadId: String(resultado._id), detalle: { idReservacion, calificacion } });
    return res.status(201).json({ success: true, comentario: resultado });
  } catch (error) { return responderError(error, res, next); }
}

async function obtenerMio(req, res, next) {
  try {
    const id = idValido(req.params.idReservacion);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido.' });
    const comentario = await svc.obtenerComentarioReservacion(req.user.idUsuario, id);
    return res.json({ success: true, comentario });
  } catch (error) { return responderError(error, res, next); }
}

async function listarAdmin(req, res, next) {
  try {
    const estado = req.query.estado;
    if (estado && !['PUBLICADO', 'OCULTO'].includes(estado)) return res.status(400).json({ success: false, error: 'Estado inválido.' });
    const comentarios = await svc.listarComentariosAdmin({ estado });
    return res.json({ success: true, comentarios });
  } catch (error) { return next(error); }
}

async function cambiarEstado(req, res, next) {
  try {
    const { estado } = req.body;
    if (!['PUBLICADO', 'OCULTO'].includes(estado)) return res.status(400).json({ success: false, error: 'Estado inválido.' });
    const comentario = await svc.cambiarEstadoComentario(req.params.id, estado);
    if (!comentario) return res.status(404).json({ success: false, error: 'Comentario no encontrado.' });
    return res.json({ success: true, comentario });
  } catch (error) { return responderError(error, res, next); }
}

async function listarPublicos(req, res, next) {
  try {
    const comentarios = await svc.listarComentariosPublicos();
    return res.json({ success: true, comentarios });
  } catch (error) { return next(error); }
}

module.exports = { crear, obtenerMio, listarAdmin, cambiarEstado, listarPublicos };
