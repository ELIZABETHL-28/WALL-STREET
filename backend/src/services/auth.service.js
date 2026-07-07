const { pool } = require('../config/mysql');

/**
 * syncSupabaseUser
 * ─────────────────────────────
 * Sincroniza una identidad Supabase validada con la tabla usuarios de MySQL.
 *
 * Recibe únicamente información obtenida del usuario autenticado y verificado
 * por Supabase (req.auth). Nunca recibe el rol desde el frontend.
 *
 * Flujo:
 *  1. Buscar el usuario por supabase_uid.
 *  2. Si existe → devolver usuario + rol actuales.
 *  3. Si no existe → crear con rol CLIENTE (nunca ADMIN por defecto).
 *
 * Determinación de proveedor_auth:
 *  - Se examina la lista de identities de Supabase.
 *  - Si alguna identity tiene provider === 'google' → GOOGLE.
 *  - En cualquier otro caso (email, magic link, etc.) → EMAIL.
 *  - Decisión conservadora: si identities está vacío o es ambiguo, se usa EMAIL.
 *
 * @param {object} authData  Objeto req.auth adjuntado por authenticateSupabase.
 * @returns {object}         Usuario del sistema con su rol.
 */
async function syncSupabaseUser(authData) {
  const { supabaseUid, email, userMetadata, identities } = authData;

  // 1. Buscar usuario existente
  const selectSql = `
    SELECT
      u.id_usuario,
      u.supabase_uid,
      u.correo,
      u.nombre_mostrar,
      u.avatar_url,
      u.estado,
      r.nombre AS rol
    FROM usuarios u
    INNER JOIN roles r ON r.id_rol = u.id_rol
    WHERE u.supabase_uid = ?
    LIMIT 1
  `;

  const [existing] = await pool.execute(selectSql, [supabaseUid]);

  if (existing.length) {
    const u = existing[0];
    return {
      idUsuario:     u.id_usuario,
      correo:        u.correo,
      nombreMostrar: u.nombre_mostrar,
      avatarUrl:     u.avatar_url,
      estado:        u.estado,
      rol:           u.rol,
    };
  }

  // 2. Usuario nuevo → determinar proveedor_auth
  const isGoogle = Array.isArray(identities) &&
    identities.some((id) => id.provider === 'google');

  const proveedorAuth = isGoogle ? 'GOOGLE' : 'EMAIL';

  // Información visual desde metadata (solo para display, nunca para autorización)
  const nombreMostrar = userMetadata?.full_name
    || userMetadata?.name
    || null;
  const avatarUrl = userMetadata?.avatar_url || null;

  // 3. Obtener id_rol de CLIENTE desde MySQL (nunca asumir un id fijo)
  const [rolRows] = await pool.execute(
    "SELECT id_rol FROM roles WHERE nombre = 'CLIENTE' LIMIT 1"
  );

  if (!rolRows.length) {
    const err = new Error('El rol CLIENTE no existe en la base de datos.');
    err.statusCode = 500;
    throw err;
  }

  const idRolCliente = rolRows[0].id_rol;

  // 4. Insertar usuario con rol CLIENTE
  // La restricción UNIQUE en supabase_uid protege ante solicitudes simultáneas:
  // si dos requests llegan al mismo tiempo, una fallará con ER_DUP_ENTRY y
  // la segunda obtendrá el registro creado por la primera en la búsqueda siguiente.
  try {
    await pool.execute(
      `INSERT INTO usuarios
        (supabase_uid, id_rol, correo, nombre_mostrar, avatar_url, proveedor_auth)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [supabaseUid, idRolCliente, email, nombreMostrar, avatarUrl, proveedorAuth]
    );
  } catch (err) {
    // ER_DUP_ENTRY: otro request ya insertó el mismo supabase_uid.
    if (err.code === 'ER_DUP_ENTRY') {
      const [retry] = await pool.execute(selectSql, [supabaseUid]);
      if (retry.length) {
        const u = retry[0];
        return {
          idUsuario:     u.id_usuario,
          correo:        u.correo,
          nombreMostrar: u.nombre_mostrar,
          avatarUrl:     u.avatar_url,
          estado:        u.estado,
          rol:           u.rol,
        };
      }
    }
    // Cualquier otro error de base de datos no se expone al cliente.
    const dbErr = new Error('Error interno al sincronizar el usuario.');
    dbErr.statusCode = 500;
    throw dbErr;
  }

  // 5. Devolver el usuario recién creado
  const [created] = await pool.execute(selectSql, [supabaseUid]);
  const u = created[0];

  return {
    idUsuario:     u.id_usuario,
    correo:        u.correo,
    nombreMostrar: u.nombre_mostrar,
    avatarUrl:     u.avatar_url,
    estado:        u.estado,
    rol:           u.rol,
  };
}

module.exports = { syncSupabaseUser };
