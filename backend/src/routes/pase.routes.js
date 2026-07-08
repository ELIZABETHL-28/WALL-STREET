const { Router } = require('express');
const paseController = require('../controllers/pase.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = Router();

// ============================================================
// ADMIN
// ============================================================

// Tipos de pase
router.get(
    '/admin/tipos',
    authenticate,
    requireRole('ADMIN'),
    paseController.listarTiposAdmin
);

router.get(
    '/admin/tipos/:id',
    authenticate,
    requireRole('ADMIN'),
    paseController.obtenerTipoAdmin
);

router.post(
    '/admin/tipos',
    authenticate,
    requireRole('ADMIN'),
    paseController.crearTipoAdmin
);

router.put(
    '/admin/tipos/:id',
    authenticate,
    requireRole('ADMIN'),
    paseController.editarTipoAdmin
);

router.patch(
    '/admin/tipos/:id/estado',
    authenticate,
    requireRole('ADMIN'),
    paseController.cambiarEstadoTipoAdmin
);

// Pases adquiridos por clientes
router.get(
    '/admin/adquiridos',
    authenticate,
    requireRole('ADMIN'),
    paseController.listarPasesAdquiridosAdmin
);

// ============================================================
// CLIENTE
// ============================================================

// Importante:
// Las rutas específicas deben declararse antes de /mis-pases/:id

router.get(
    '/tipos',
    authenticate,
    requireRole('CLIENTE'),
    paseController.listarTiposCliente
);

router.post(
    '/adquirir',
    authenticate,
    requireRole('CLIENTE'),
    paseController.adquirirPase
);

router.get(
    '/mis-pases',
    authenticate,
    requireRole('CLIENTE'),
    paseController.listarMisPases
);

router.get(
    '/mis-pases/:id',
    authenticate,
    requireRole('CLIENTE'),
    paseController.obtenerMiPase
);

module.exports = router;