const supabase      = require('../config/supabase');
const { pool }      = require('../config/mysql');

/**
 * authenticateSupabase
 * ─────────────────────
 * Valida el Bearer token con Supabase y adjunta req.auth con la identidad.
 * NO busca al usuario en MySQL ni lo crea.
 * Úsalo como primer eslabón en rutas que necesitan identidad Supabase.
 */
async function authenticateSupabase(req, res, next) {
  try {
    // Si Supabase no está configurado, informar claramente sin exponer detalles.
    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'El servicio de autenticación no está disponible. Configura SUPABASE_URL y SUPABASE_ANON_KEY.',
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Se requiere autorización.',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Formato de autorización inválido. Se esperaba Bearer Token.',
      });
    }

    const accessToken = authHeader.slice(7).trim();

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Token no proporcionado.',
      });
    }

    // Validar el token con Supabase — verificación oficial del lado del servidor.
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        error: 'Sesión inválida o expirada.',
      });
    }

    // Adjuntar identidad Supabase validada para uso en middlewares siguientes.
    req.auth = {
      supabaseUid:  data.user.id,
      email:        data.user.email,
      userMetadata: data.user.user_metadata || {},
      appMetadata:  data.user.app_metadata  || {},
      identities:   data.user.identities    || [],
    };

    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * loadSystemUser
 * ─────────────────────
 * Requiere que authenticateSupabase haya corrido antes (req.auth debe existir).
 * Busca al usuario en MySQL mediante su supabase_uid.
 * Adjunta req.user con el usuario del sistema si existe.
 * Si no existe en MySQL, responde 401 (debe sincronizarse primero).
 * Bloquea INACTIVO (401) y BLOQUEADO (403).
 */
async function loadSystemUser(req, res, next) {
  try {
    if (!req.auth?.supabaseUid) {
      return res.status(401).json({
        success: false,
        error: 'Sesión inválida.',
      });
    }

    // Consulta parametrizada — nunca se concatena supabase_uid en el SQL.
    const sql = `
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

    const [rows] = await pool.execute(sql, [req.auth.supabaseUid]);

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado en el sistema. Ejecuta /api/auth/sync primero.',
      });
    }

    const usuario = rows[0];

    if (usuario.estado === 'INACTIVO') {
      return res.status(401).json({
        success: false,
        error: 'Cuenta inactiva.',
      });
    }

    if (usuario.estado === 'BLOQUEADO') {
      return res.status(403).json({
        success: false,
        error: 'Cuenta bloqueada.',
      });
    }

    // Adjuntar usuario del sistema para controladores y middleware de roles.
    req.user = {
      idUsuario:    usuario.id_usuario,
      supabaseUid:  usuario.supabase_uid,
      correo:       usuario.correo,
      nombreMostrar: usuario.nombre_mostrar,
      avatarUrl:    usuario.avatar_url,
      estado:       usuario.estado,
      rol:          usuario.rol,
    };

    return next();
  } catch (err) {
    return next(err);
  }
}

// Middleware combinado: valida Supabase Y carga usuario MySQL.
// Conveniente para rutas donde el usuario ya debe existir en el sistema.
async function authenticate(req, res, next) {
  await authenticateSupabase(req, res, async (err) => {
    if (err) return next(err);
    await loadSystemUser(req, res, next);
  });
}

module.exports = { authenticateSupabase, loadSystemUser, authenticate };
