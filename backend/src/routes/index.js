const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes   = require('./auth.routes');
const clientRoutes = require('./client.routes');

const router = Router();

// GET /api/health
router.use('/health',   healthRoutes);

// POST /api/auth/sync  |  GET /api/auth/me
router.use('/auth',     authRoutes);

// GET|POST|PUT /api/clientes/perfil
router.use('/clientes', clientRoutes);

module.exports = router;
