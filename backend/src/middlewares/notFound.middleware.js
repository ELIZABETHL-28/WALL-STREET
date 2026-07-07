/**
 * Middleware de ruta no encontrada.
 * Se ejecuta cuando ninguna ruta registrada coincide con la solicitud.
 */
function notFound(req, res) {
  res.status(404).json({
    success: false,
    error:   'Ruta no encontrada',
  });
}

module.exports = notFound;
