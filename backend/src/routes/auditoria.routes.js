const { Router } = require('express');
const ctrl = require('../controllers/auditoria.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = Router();
router.get('/admin', authenticate, requireRole('ADMIN'), ctrl.listar);
module.exports = router;
