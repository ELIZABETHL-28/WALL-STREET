const { Router } = require('express');
const ctrl = require('../controllers/comentario.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = Router();
router.get('/publicos', ctrl.listarPublicos);
router.post('/', authenticate, requireRole('CLIENTE'), ctrl.crear);
router.get('/mios/reservacion/:idReservacion', authenticate, requireRole('CLIENTE'), ctrl.obtenerMio);
router.get('/admin', authenticate, requireRole('ADMIN'), ctrl.listarAdmin);
router.patch('/admin/:id/estado', authenticate, requireRole('ADMIN'), ctrl.cambiarEstado);
module.exports = router;
