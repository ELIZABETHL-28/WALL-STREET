const { syncSupabaseUser } = require('../services/auth.service');

/**
 * POST /api/auth/sync
 * ─────────────────────────────
 * Sincroniza la identidad Supabase validada con MySQL.
 * La identidad proviene de req.auth (adjuntada por authenticateSupabase).
 * No lee supabase_uid ni correo desde req.body.
 */
async function syncUser(req, res, next) {
  try {
    const usuario = await syncSupabaseUser(req.auth);

    return res.status(200).json({
      success: true,
      user: {
        idUsuario:     usuario.idUsuario,
        correo:        usuario.correo,
        nombreMostrar: usuario.nombreMostrar,
        avatarUrl:     usuario.avatarUrl,
        estado:        usuario.estado,
        rol:           usuario.rol,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/auth/me
 * ─────────────────────────────
 * Devuelve la información del usuario autenticado registrado en MySQL.
 * Requiere authenticate (authenticateSupabase + loadSystemUser).
 * No devuelve contraseñas, tokens ni información interna de Supabase.
 */
async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: {
      idUsuario:     req.user.idUsuario,
      correo:        req.user.correo,
      nombreMostrar: req.user.nombreMostrar,
      avatarUrl:     req.user.avatarUrl,
      estado:        req.user.estado,
      rol:           req.user.rol,
    },
  });
}

module.exports = { syncUser, getMe };
