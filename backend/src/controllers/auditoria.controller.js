const { listarAuditoria } = require('../services/auditoria.service');

async function listar(req, res, next) {
  try {
    const eventos = await listarAuditoria({
      modulo: req.query.modulo || undefined,
      accion: req.query.accion || undefined,
      limite: req.query.limite || 200,
    });
    return res.json({ success: true, eventos });
  } catch (error) { return next(error); }
}

module.exports = { listar };
