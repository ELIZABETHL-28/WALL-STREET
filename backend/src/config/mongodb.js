const mongoose = require('mongoose');

/**
 * Conecta a MongoDB mediante Mongoose.
 * La URI completa se obtiene desde la variable de entorno MONGODB_URI.
 * La base de datos prevista del proyecto es: hotel_wall_street_nosql
 * La URI configurada determinará la base de datos real a la que se conecta.
 *
 * Lanza el error original si la conexión falla; el llamador decide cómo manejarlo.
 */
async function connectMongoDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI no está definida en las variables de entorno.');
  }

  await mongoose.connect(uri);

  return { connected: true, host: mongoose.connection.host };
}

module.exports = { connectMongoDB };
