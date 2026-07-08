const { Router } = require('express');
const actividadController = require('../controllers/actividad.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = Router();

// =========================
// ADMIN
// =========================

router.get(
    '/admin',
    authenticate,
    requireRole('ADMIN'),
    actividadController.listarAdmin
);

router.get(
    '/admin/:id',
    authenticate,
    requireRole('ADMIN'),
    actividadController.obtenerAdmin
);

router.post(
    '/admin',
    authenticate,
    requireRole('ADMIN'),
    actividadController.crearAdmin
);

router.put(
    '/admin/:id',
    authenticate,
    requireRole('ADMIN'),
    actividadController.editarAdmin
);

router.patch(
    '/admin/:id/estado',
    authenticate,
    requireRole('ADMIN'),
    actividadController.cambiarEstadoAdmin
);

// =========================
// CLIENTE
// =========================

// Las rutas específicas deben ir antes de /:id

router.get(
    '/mis-inscripciones',
    authenticate,
    requireRole('CLIENTE'),
    actividadController.listarMisInscripciones
);

router.patch(
    '/inscripcion/:idInscripcion/cancelar',
    authenticate,
    requireRole('CLIENTE'),
    actividadController.cancelarInscripcion
);

router.get(
    '/',
    authenticate,
    requireRole('CLIENTE'),
    actividadController.listarCliente
);

router.post(
    '/:id/inscribirse',
    authenticate,
    requireRole('CLIENTE'),
    actividadController.inscribirse
);

router.get(
    '/:id',
    authenticate,
    requireRole('CLIENTE'),
    actividadController.obtenerCliente
);

module.exports = router;