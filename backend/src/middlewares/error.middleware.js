/**
 * Middleware centralizado de manejo de errores.
 *
 * Regla de seguridad:
 *   - Errores HTTP < 500: se puede devolver el mensaje controlado del error.
 *   - Errores 500+: siempre se devuelve "Error interno del servidor" al cliente.
 *     Nunca se exponen mensajes de MySQL, Mongoose, stack traces ni detalles internos.
 *
 * En entorno development se incluye un campo `debug` con información de depuración.
 * En production `debug` nunca aparece en la respuesta.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode =
    err.statusCode ||
    err.status     ||
    500;

  const isDev         = process.env.NODE_ENV === 'development';
  const isServerError = statusCode >= 500;

  const response = {
    success: false,
    error:   isServerError
      ? 'Error interno del servidor'
      : err.message || 'No se pudo procesar la solicitud',
  };

  // Solo en development: adjuntar información de depuración.
  // Nunca se incluye en production para no exponer detalles internos.
  if (isDev) {
    response.debug = {
      message: err.message,
      stack:   err.stack,
    };
  }

  return res.status(statusCode).json(response);
}

module.exports = errorHandler;
