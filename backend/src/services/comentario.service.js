const { pool } = require('../config/mysql');
const ComentarioHotel = require('../models/ComentarioHotel');

async function getClienteByUsuario(idUsuario) {
  const [rows] = await pool.execute(
    'SELECT id_cliente FROM clientes WHERE id_usuario = ? LIMIT 1',
    [idUsuario]
  );
  return rows.length ? rows[0].id_cliente : null;
}

async function validarReservacionFinalizada(idUsuario, idReservacion) {
  const idCliente = await getClienteByUsuario(idUsuario);
  if (!idCliente) {
    const err = new Error('Debes completar tu perfil de cliente.');
    err.statusCode = 422;
    throw err;
  }

  const [rows] = await pool.execute(
    `SELECT id_reservacion, estado
     FROM reservaciones
     WHERE id_reservacion = ? AND id_cliente = ?
     LIMIT 1`,
    [idReservacion, idCliente]
  );

  if (!rows.length) {
    const err = new Error('Reservación no encontrada.');
    err.statusCode = 404;
    throw err;
  }

  if (rows[0].estado !== 'CHECK_OUT') {
    const err = new Error('Solo puedes calificar una estancia finalizada en CHECK_OUT.');
    err.statusCode = 409;
    throw err;
  }

  return idCliente;
}

async function crearComentario(idUsuario, { idReservacion, calificacion, comentario }) {
  const idCliente = await validarReservacionFinalizada(idUsuario, idReservacion);

  const existente = await ComentarioHotel.findOne({ idReservacion }).lean();
  if (existente) {
    const err = new Error('Esta reservación ya tiene una calificación registrada.');
    err.statusCode = 409;
    throw err;
  }

  return ComentarioHotel.create({
    idUsuario,
    idCliente,
    idReservacion,
    calificacion,
    comentario: comentario.trim(),
  });
}

async function obtenerComentarioReservacion(idUsuario, idReservacion) {
  const idCliente = await getClienteByUsuario(idUsuario);
  if (!idCliente) return null;

  const [rows] = await pool.execute(
    'SELECT id_reservacion FROM reservaciones WHERE id_reservacion = ? AND id_cliente = ? LIMIT 1',
    [idReservacion, idCliente]
  );
  if (!rows.length) return null;

  return ComentarioHotel.findOne({ idReservacion }).lean();
}

async function listarComentariosAdmin({ estado } = {}) {
  const filtro = estado ? { estado } : {};
  return ComentarioHotel.find(filtro).sort({ fechaCreacion: -1 }).lean();
}

async function cambiarEstadoComentario(idComentario, estado) {
  return ComentarioHotel.findByIdAndUpdate(
    idComentario,
    { estado },
    { new: true, runValidators: true }
  ).lean();
}

async function listarComentariosPublicos() {
  return ComentarioHotel.find({ estado: 'PUBLICADO' })
    .sort({ fechaCreacion: -1 })
    .limit(12)
    .select('idReservacion calificacion comentario fechaCreacion')
    .lean();
}

module.exports = {
  crearComentario,
  obtenerComentarioReservacion,
  listarComentariosAdmin,
  cambiarEstadoComentario,
  listarComentariosPublicos,
};
