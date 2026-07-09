const mongoose = require('mongoose');

const auditoriaSchema = new mongoose.Schema({
  idUsuario: { type: Number, required: true, index: true },
  rol: { type: String, required: true, trim: true, maxlength: 30 },
  accion: { type: String, required: true, trim: true, maxlength: 120, index: true },
  modulo: { type: String, required: true, trim: true, maxlength: 80, index: true },
  entidadId: { type: mongoose.Schema.Types.Mixed, default: null },
  detalle: { type: mongoose.Schema.Types.Mixed, default: {} },
  fecha: { type: Date, default: Date.now, index: true },
}, { collection: 'auditoria' });

module.exports = mongoose.model('Auditoria', auditoriaSchema);
