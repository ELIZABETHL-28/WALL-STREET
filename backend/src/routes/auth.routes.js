const { Router } = require('express');
const { syncUser, getMe } = require('../controllers/auth.controller');
const { authenticateSupabase, authenticate } = require('../middlewares/auth.middleware');

const router = Router();

/**
 * POST /api/auth/sync
 * Valida identidad Supabase y sincroniza el usuario con MySQL.
 * Solo requiere authenticateSupabase (el usuario puede no existir aún en MySQL).
 */
router.post('/sync', authenticateSupabase, syncUser);

/**
 * GET /api/auth/me
 * Valida identidad Supabase, carga usuario MySQL y devuelve la información.
 * El usuario debe haber ejecutado /sync previamente.
 */
router.get('/me', authenticate, getMe);

module.exports = router;
