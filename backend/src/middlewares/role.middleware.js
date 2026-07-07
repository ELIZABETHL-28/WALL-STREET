/**
 * requireRole(...allowedRoles)
 * ─────────────────────────────
 * Fábrica de middleware que restringe el acceso a uno o varios roles.
 * El rol se obtiene exclusivamente de req.user.rol, que proviene de MySQL
 * después de identificar al usuario por su supabase_uid.
 *
 * Nunca se lee el rol desde:
 *   - req.body
 *   - req.params
 *   - req.query
 *   - headers personalizados del frontend
 *
 * Uso:
 *   router.get('/admin', authenticate, requireRole('ADMIN'), handler)
 *   router.get('/mixto', authenticate, requireRole('ADMIN', 'CLIENTE'), handler)
 */
function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado.',
      });
    }

    if (!req.user.rol) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción.',
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción.',
      });
    }

    return next();
  };
}

module.exports = { requireRole };
