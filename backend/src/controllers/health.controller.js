const mongoose                        = require('mongoose');
const { pool, checkMySQLConnection } = require('../config/mysql');

/**
 * GET /api/health
 *
 * Devuelve el estado actual de la API y sus conexiones a bases de datos.
 * - MySQL: comprueba el pool con SELECT 1.
 * - MongoDB: comprueba mongoose.connection.readyState.
 *
 * No se expone ninguna credencial, URI, usuario ni contraseña.
 *
 * Estados posibles:
 *   operational — ambas bases de datos conectadas.
 *   degraded    — al menos una base de datos no disponible.
 */
async function healthCheck(req, res) {
  // --- MySQL ---
  let mysqlStatus = 'disconnected';
  try {
    await checkMySQLConnection();
    mysqlStatus = 'connected';
  } catch {
    // La conexión falló; el estado permanece 'disconnected'.
  }

  // --- MongoDB ---
  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const mongoState    = mongoose.connection.readyState;
  const mongodbStatus = mongoState === 1 ? 'connected' : 'disconnected';

  // --- Resultado ---
  const allConnected = mysqlStatus === 'connected' && mongodbStatus === 'connected';

const statusCode = allConnected ? 200 : 503;

  return res.status(statusCode).json({
    success:   allConnected,
    service:   'HOTEL WALL STREET API',
    status:    allConnected ? 'operational' : 'degraded',
    databases: {
      mysql:   mysqlStatus,
      mongodb: mongodbStatus,
    },
    timestamp: new Date().toISOString(),
  });
}

module.exports = { healthCheck };
