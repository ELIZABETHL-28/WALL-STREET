const { pool } = require('../config/mysql');

/**
 * getClientProfile
 * Busca el perfil cliente asociado a un id_usuario.
 * Devuelve null si todavía no existe (no lanza error 500).
 */
async function getClientProfile(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT
       id_cliente,
       id_usuario,
       nombres,
       apellidos,
       telefono,
       tipo_documento,
       numero_documento,
       fecha_nacimiento,
       nacionalidad,
       direccion,
       fecha_registro
     FROM clientes
     WHERE id_usuario = ?
     LIMIT 1`,
    [idUsuario]
  );

  return rows.length ? rows[0] : null;
}

/**
 * createClientProfile
 * Crea el perfil cliente para un id_usuario que todavía no tiene uno.
 * Solo acepta campos permitidos — id_usuario proviene del sistema, nunca del body.
 */
async function createClientProfile(idUsuario, data) {
  const {
    nombres,
    apellidos,
    telefono      = null,
    tipoDocumento = 'DPI',
    numeroDocumento = null,
    fechaNacimiento = null,
    nacionalidad  = null,
    direccion     = null,
  } = data;

  await pool.execute(
    `INSERT INTO clientes
       (id_usuario, nombres, apellidos, telefono, tipo_documento,
        numero_documento, fecha_nacimiento, nacionalidad, direccion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      idUsuario,
      nombres,
      apellidos,
      telefono,
      tipoDocumento,
      numeroDocumento,
      fechaNacimiento || null,
      nacionalidad,
      direccion,
    ]
  );

  return getClientProfile(idUsuario);
}

/**
 * updateClientProfile
 * Actualiza únicamente los campos permitidos del perfil cliente.
 * Nunca actualiza id_usuario, id_rol, supabase_uid ni correo.
 */
async function updateClientProfile(idUsuario, data) {
  const {
    nombres,
    apellidos,
    telefono,
    tipoDocumento,
    numeroDocumento,
    fechaNacimiento,
    nacionalidad,
    direccion,
  } = data;

  await pool.execute(
    `UPDATE clientes
     SET
       nombres          = COALESCE(?, nombres),
       apellidos        = COALESCE(?, apellidos),
       telefono         = COALESCE(?, telefono),
       tipo_documento   = COALESCE(?, tipo_documento),
       numero_documento = COALESCE(?, numero_documento),
       fecha_nacimiento = COALESCE(?, fecha_nacimiento),
       nacionalidad     = COALESCE(?, nacionalidad),
       direccion        = COALESCE(?, direccion)
     WHERE id_usuario = ?`,
    [
      nombres        ?? null,
      apellidos      ?? null,
      telefono       ?? null,
      tipoDocumento  ?? null,
      numeroDocumento ?? null,
      fechaNacimiento ?? null,
      nacionalidad   ?? null,
      direccion      ?? null,
      idUsuario,
    ]
  );

  return getClientProfile(idUsuario);
}

module.exports = { getClientProfile, createClientProfile, updateClientProfile };
