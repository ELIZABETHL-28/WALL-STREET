const mongoose = require('mongoose');
const Auditoria = require('../models/Auditoria');

const CAMPOS_SENSIBLES = new Set([
  'password', 'contrasena', 'contraseña', 'access_token', 'refresh_token',
  'authorization', 'client_secret', 'secret', 'token',
]);

function limpiarDetalle(valor) {
  if (Array.isArray(valor)) return valor.map(limpiarDetalle);
  if (!valor || typeof valor !== 'object') return valor;

  return Object.fromEntries(
    Object.entries(valor)
      .filter(([clave]) => !CAMPOS_SENSIBLES.has(clave.toLowerCase()))
      .map(([clave, item]) => [clave, limpiarDetalle(item)])
  );
}

async function registrarAuditoria({ idUsuario, rol, accion, modulo, entidadId, detalle = {} }) {
  try {
    if (mongoose.connection.readyState !== 1) return false;

    await Auditoria.create({
      idUsuario,
      rol,
      accion,
      modulo,
      entidadId: entidadId ?? null,
      detalle: limpiarDetalle(detalle),
    });

    return true;
  } catch (error) {
    console.warn('[Auditoria] No se pudo registrar el evento:', error.message);
    return false;
  }
}

async function listarAuditoria({ modulo, accion, limite = 200 } = {}) {
  const filtro = {};
  if (modulo) filtro.modulo = modulo;
  if (accion) filtro.accion = accion;

  return Auditoria.find(filtro)
    .sort({ fecha: -1 })
    .limit(Math.min(Math.max(Number(limite) || 200, 1), 500))
    .lean();
}

module.exports = { registrarAuditoria, listarAuditoria };
