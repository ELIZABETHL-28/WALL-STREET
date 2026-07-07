const { Router }      = require('express');
const { healthCheck } = require('../controllers/health.controller');

const router = Router();

// GET /api/health
router.get('/', healthCheck);

module.exports = router;
