/**
 * habitacion.routes.js
 * Todas las rutas requieren autenticación Bearer Token + rol ADMIN.
 */
const { Router } = require('express');
const ctrl = require('../controllers/habitacion.controller');
const { authenticate }   = require('../middlewares/auth.middleware');
const { requireRole }    = require('../middlewares/role.middleware');

const router = Router();

// Aplicar authenticate + requireRole('ADMIN') a todas las rutas de este módulo.
router.use(authenticate, requireRole('ADMIN'));

// ── Tipos de habitación ───────────────────────────────────────────────────────
router.get   ('/tipos',       ctrl.listarTipos);
router.post  ('/tipos',       ctrl.crearTipo);
router.put   ('/tipos/:id',   ctrl.editarTipo);

// ── Tipos de cama (catálogo de referencia) ────────────────────────────────────
router.get   ('/tipos-cama',  ctrl.listarTiposCama);

// ── Habitaciones ──────────────────────────────────────────────────────────────
router.get   ('/',            ctrl.listarHabitaciones);
router.post  ('/',            ctrl.crearHabitacion);
router.get   ('/:id',         ctrl.obtenerHabitacion);
router.put   ('/:id',         ctrl.editarHabitacion);
router.patch ('/:id/estado',  ctrl.cambiarEstado);

// ── Camas de una habitación ───────────────────────────────────────────────────
router.post  ('/:id/camas',                ctrl.asociarCama);
router.put   ('/:id/camas/:idCama',        ctrl.actualizarCama);
router.delete('/:id/camas/:idCama',        ctrl.eliminarCama);

// ── Imágenes de una habitación ────────────────────────────────────────────────
router.get   ('/:id/imagenes',             ctrl.listarImagenes);
router.post  ('/:id/imagenes',             ctrl.agregarImagen);
router.delete('/:id/imagenes/:idImagen',   ctrl.eliminarImagen);

module.exports = router;
