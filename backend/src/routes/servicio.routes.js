/**
 * servicio.routes.js
 * Rutas del módulo de Servicios Adicionales — Hotel Wall Street.
 *
 * Rutas ADMIN (authenticate + requireRole('ADMIN')):
 *   GET    /api/servicios/admin               → listar todos los servicios
 *   POST   /api/servicios/admin               → crear servicio
 *   GET    /api/servicios/admin/:id           → detalle
 *   PUT    /api/servicios/admin/:id           → editar
 *   PATCH  /api/servicios/admin/:id/estado    → activar / desactivar
 *
 * Rutas CLIENTE (authenticate + requireRole('CLIENTE')):
 *   GET    /api/servicios                          → listar servicios activos
 *   GET    /api/servicios/reservacion/:idRes       → servicios de mi reservación
 *   POST   /api/servicios/reservacion/:idRes       → agregar servicio a mi reservación
 *   DELETE /api/servicios/reservacion/:idRes/:idRS → quitar servicio de mi reservación
 */
const { Router }       = require('express');
const ctrl             = require('../controllers/servicio.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole }  = require('../middlewares/role.middleware');

const router = Router();

// ── Rutas ADMIN ───────────────────────────────────────────────────────────────

router.get(
  '/admin',
  authenticate, requireRole('ADMIN'),
  ctrl.listarAdmin
);

router.post(
  '/admin',
  authenticate, requireRole('ADMIN'),
  ctrl.crearAdmin
);

router.get(
  '/admin/:id',
  authenticate, requireRole('ADMIN'),
  ctrl.obtenerAdmin
);

router.put(
  '/admin/:id',
  authenticate, requireRole('ADMIN'),
  ctrl.editarAdmin
);

router.patch(
  '/admin/:id/estado',
  authenticate, requireRole('ADMIN'),
  ctrl.cambiarEstadoAdmin
);

// ── Rutas CLIENTE ─────────────────────────────────────────────────────────────

// Listar servicios activos
router.get(
  '/',
  authenticate, requireRole('CLIENTE'),
  ctrl.listarCliente
);

// Servicios de una reservación propia
router.get(
  '/reservacion/:idReservacion',
  authenticate, requireRole('CLIENTE'),
  ctrl.listarDeReservacion
);

// Agregar servicio a una reservación propia
router.post(
  '/reservacion/:idReservacion',
  authenticate, requireRole('CLIENTE'),
  ctrl.agregarAReservacion
);

// Quitar servicio de una reservación propia
router.delete(
  '/reservacion/:idReservacion/:idReservacionServicio',
  authenticate, requireRole('CLIENTE'),
  ctrl.quitarDeReservacion
);

module.exports = router;
