const mongoose = require('mongoose');

const comentarioHotelSchema = new mongoose.Schema({
  idUsuario: { type: Number, required: true, index: true },
  idCliente: { type: Number, required: true, index: true },
  idReservacion: { type: Number, required: true, unique: true, index: true },
  calificacion: { type: Number, required: true, min: 1, max: 5 },
  comentario: { type: String, required: true, trim: true, maxlength: 1000 },
  estado: { type: String, enum: ['PUBLICADO', 'OCULTO'], default: 'PUBLICADO' },
}, {
  collection: 'comentarios_hotel',
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'ultimaActualizacion' },
});

module.exports = mongoose.model('ComentarioHotel', comentarioHotelSchema);
