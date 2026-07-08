/**
 * reservacion.routes.js
 * Rutas del módulo de Reservaciones — Hotel Wall Street.
 *
 * Rutas CLIENTE (requieren authenticate + requireRole('CLIENTE')):
 *   GET  /api/reservaciones/disponibilidad
 *   GET  /api/reservaciones/mias
 *   POST /api/reservaciones
 *   GET  /api/reservaciones/mias/:id
 *   PATCH /api/reservaciones/mias/:id/cancelar
 *
 * Rutas ADMIN (requieren authenticate + requireRole('ADMIN')):
 *   GET  /api/reservaciones/admin
 *   GET  /api/reservaciones/admin/:id
 *   PATCH /api/reservaciones/admin/:id/estado
 */

const { Router }      = require('express');
const ctrl            = require('../controllers/reservacion.controller');
const { authenticate }  = require('../middlewares/auth.middleware');
const { requireRole }   = require('../middlewares/role.middleware');

const router = Router();

// ── Rutas CLIENTE ─────────────────────────────────────────────────────────────

// Disponibilidad — cualquier usuario autenticado con rol CLIENTE puede consultarla.
router.get(
  '/disponibilidad',
  authenticate, requireRole('CLIENTE'),
  ctrl.consultarDisponibilidad
);

// Listar mis reservaciones
router.get(
  '/mias',
  authenticate, requireRole('CLIENTE'),
  ctrl.listarMias
);

// Crear una reservación
router.post(
  '/',
  authenticate, requireRole('CLIENTE'),
  ctrl.crearReservacion
);

// Detalle de una reservación propia
router.get(
  '/mias/:id',
  authenticate, requireRole('CLIENTE'),
  ctrl.obtenerMia
);

// Cancelar una reservación propia
router.patch(
  '/mias/:id/cancelar',
  authenticate, requireRole('CLIENTE'),
  ctrl.cancelarMia
);

// ── Rutas ADMIN ───────────────────────────────────────────────────────────────

// Listar todas las reservaciones (filtros opcionales: estado, fechaDesde, fechaHasta)
router.get(
  '/admin',
  authenticate, requireRole('ADMIN'),
  ctrl.listarAdmin
);

// Detalle de cualquier reservación
router.get(
  '/admin/:id',
  authenticate, requireRole('ADMIN'),
  ctrl.obtenerAdmin
);

// Cambiar estado de una reservación
router.patch(
  '/admin/:id/estado',
  authenticate, requireRole('ADMIN'),
  ctrl.cambiarEstadoAdmin
);

module.exports = router;
