const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const clientRoutes = require('./client.routes');
const habitacionRoutes = require('./habitacion.routes');
const reservacionRoutes = require('./reservacion.routes');
const servicioRoutes = require('./servicio.routes');
const actividadRoutes = require('./actividad.routes');

const router = Router();

// GET /api/health
router.use('/health', healthRoutes);

// POST /api/auth/sync | GET /api/auth/me
router.use('/auth', authRoutes);

// GET|POST|PUT /api/clientes/perfil
router.use('/clientes', clientRoutes);

// /api/habitaciones
router.use('/habitaciones', habitacionRoutes);

// /api/reservaciones
router.use('/reservaciones', reservacionRoutes);

// /api/servicios
router.use('/servicios', servicioRoutes);

// /api/actividades
router.use('/actividades', actividadRoutes);

module.exports = router;