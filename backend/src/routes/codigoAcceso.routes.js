const { Router } = require('express');
const ctrl = require('../controllers/codigoAcceso.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = Router();
router.get('/reservacion/:idReservacion', authenticate, requireRole('CLIENTE'), ctrl.obtenerReservacion);
router.get('/pase/:idPaseCliente', authenticate, requireRole('CLIENTE'), ctrl.obtenerPase);
router.post('/admin/validar', authenticate, requireRole('ADMIN'), ctrl.validar);
router.patch('/admin/:id/utilizar', authenticate, requireRole('ADMIN'), ctrl.utilizar);
module.exports = router;
