const { Router } = require('express');
const { getPerfil, crearPerfil, actualizarPerfil } = require('../controllers/client.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = Router();

// Todas las rutas de cliente requieren autenticación y rol CLIENTE.
router.use(authenticate, requireRole('CLIENTE'));

/**
 * GET /api/clientes/perfil
 * Devuelve el perfil del cliente autenticado.
 */
router.get('/perfil', getPerfil);

/**
 * POST /api/clientes/perfil
 * Crea el perfil por primera vez.
 */
router.post('/perfil', crearPerfil);

/**
 * PUT /api/clientes/perfil
 * Actualiza campos permitidos del perfil.
 */
router.put('/perfil', actualizarPerfil);

module.exports = router;
