// Cargar variables de entorno antes que cualquier otro módulo.
require('dotenv').config();

const app                        = require('./app');
const { checkMySQLConnection }   = require('./config/mysql');
const { connectMongoDB }         = require('./config/mongodb');

const PORT = process.env.PORT || 3000;

async function startServer() {
  // --- Verificar conexión MySQL ---
  try {
    await checkMySQLConnection();
    console.log('[MySQL] Conexion establecida correctamente.');
  } catch (err) {
    // El servidor arranca de todas formas; el health check reflejará el estado real.
    console.error('[MySQL] No se pudo conectar:', err.message);
  }

  // --- Conectar MongoDB ---
  try {
    const mongo = await connectMongoDB();
    console.log('[MongoDB] Conectado a:', mongo.host);
  } catch (err) {
    // El servidor arranca de todas formas; el health check reflejará el estado real.
    console.warn('[MongoDB] No se pudo conectar:', err.message);
  }

  // --- Iniciar servidor HTTP ---
  app.listen(PORT, () => {
    console.log('----------------------------------------');
    console.log('HOTEL WALL STREET API activa en puerto', PORT);
    console.log('Entorno:', process.env.NODE_ENV || 'development');
    console.log('Health:  http://localhost:' + PORT + '/api/health');
    console.log('----------------------------------------');
  });
}

startServer();
