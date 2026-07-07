const mysql = require('mysql2/promise');

// Pool de conexiones MySQL
// Las credenciales se obtienen exclusivamente desde variables de entorno.
const pool = mysql.createPool({
  host:             process.env.DB_HOST,
  port:             parseInt(process.env.DB_PORT, 10) || 3306,
  user:             process.env.DB_USER,
  password:         process.env.DB_PASSWORD,
  database:         process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0,
  multipleStatements: false,

});

/**
 * Comprueba si el pool MySQL puede resolver una consulta básica.
 * Devuelve un objeto { connected: true } si tiene éxito.
 * Lanza el error original si la conexión falla; el llamador decide cómo manejarlo.
 */
async function checkMySQLConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1 AS status');
    return { connected: true };
  } finally {
    connection.release();
  }
}

module.exports = { pool, checkMySQLConnection };
