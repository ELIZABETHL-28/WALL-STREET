/**
 * habitacion.controller.js
 * Controladores ADMIN para gestión de habitaciones.
 * Valida todos los inputs antes de llamar al servicio.
 * Nunca interpola req.body/params en SQL directamente.
 */
const svc = require('../services/habitacion.service');

// Estados válidos según schema.sql
const ESTADOS_HABITACION = ['DISPONIBLE', 'RESERVADA', 'OCUPADA', 'LIMPIEZA', 'MANTENIMIENTO'];
const ESTADOS_TIPO       = ['ACTIVO', 'INACTIVO'];

// ─── helpers de validación ────────────────────────────────────────────────────

function idValido(val) {
  const n = parseInt(val, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function decimalValido(val) {
  const n = parseFloat(val);
  return !isNaN(n) && n >= 0 ? n : null;
}

// ─── tipos_habitacion ─────────────────────────────────────────────────────────

async function listarTipos(req, res, next) {
  try {
    const tipos = await svc.listarTiposHabitacion();
    return res.status(200).json({ success: true, tipos });
  } catch (err) { return next(err); }
}

async function crearTipo(req, res, next) {
  try {
    const { nombre, descripcion, precioBase, capacidadBase, estado } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0)
      return res.status(400).json({ success: false, error: 'nombre es requerido.' });
    if (nombre.trim().length > 100)
      return res.status(400).json({ success: false, error: 'nombre supera 100 caracteres.' });

    const precio = decimalValido(precioBase);
    if (precio === null)
      return res.status(400).json({ success: false, error: 'precioBase debe ser un número >= 0.' });

    const capacidad = idValido(capacidadBase);
    if (!capacidad)
      return res.status(400).json({ success: false, error: 'capacidadBase debe ser un entero > 0.' });

    if (estado && !ESTADOS_TIPO.includes(estado))
      return res.status(400).json({ success: false, error: `estado debe ser: ${ESTADOS_TIPO.join(', ')}.` });

    const tipo = await svc.crearTipoHabitacion({
      nombre: nombre.trim(), descripcion, precioBase: precio,
      capacidadBase: capacidad, estado,
    });
    return res.status(201).json({ success: true, tipo });
  } catch (err) { return next(err); }
}

async function editarTipo(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido.' });

    const { nombre, descripcion, precioBase, capacidadBase, estado } = req.body;

    if (nombre !== undefined) {
      if (typeof nombre !== 'string' || nombre.trim().length === 0)
        return res.status(400).json({ success: false, error: 'nombre no puede estar vacío.' });
      if (nombre.trim().length > 100)
        return res.status(400).json({ success: false, error: 'nombre supera 100 caracteres.' });
    }

    let precio = undefined, capacidad = undefined;
    if (precioBase !== undefined) {
      precio = decimalValido(precioBase);
      if (precio === null)
        return res.status(400).json({ success: false, error: 'precioBase debe ser >= 0.' });
    }
    if (capacidadBase !== undefined) {
      capacidad = idValido(capacidadBase);
      if (!capacidad)
        return res.status(400).json({ success: false, error: 'capacidadBase debe ser > 0.' });
    }
    if (estado && !ESTADOS_TIPO.includes(estado))
      return res.status(400).json({ success: false, error: `estado debe ser: ${ESTADOS_TIPO.join(', ')}.` });

    const tipo = await svc.editarTipoHabitacion(id, {
      nombre: nombre?.trim(), descripcion, precioBase: precio,
      capacidadBase: capacidad, estado,
    });
    if (!tipo) return res.status(404).json({ success: false, error: 'Tipo de habitación no encontrado.' });

    return res.status(200).json({ success: true, tipo });
  } catch (err) { return next(err); }
}

// ─── habitaciones ─────────────────────────────────────────────────────────────

async function listarHabitaciones(req, res, next) {
  try {
    const { estado, idTipo } = req.query;

    if (estado && !ESTADOS_HABITACION.includes(estado))
      return res.status(400).json({ success: false, error: `estado inválido. Valores: ${ESTADOS_HABITACION.join(', ')}.` });

    let idTipoNum = undefined;
    if (idTipo) {
      idTipoNum = idValido(idTipo);
      if (!idTipoNum)
        return res.status(400).json({ success: false, error: 'idTipo debe ser un entero > 0.' });
    }

    const habitaciones = await svc.listarHabitaciones({ estado, idTipo: idTipoNum });
    return res.status(200).json({ success: true, habitaciones });
  } catch (err) { return next(err); }
}

async function obtenerHabitacion(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido.' });

    const habitacion = await svc.obtenerHabitacion(id);
    if (!habitacion) return res.status(404).json({ success: false, error: 'Habitación no encontrada.' });

    return res.status(200).json({ success: true, habitacion });
  } catch (err) { return next(err); }
}

async function crearHabitacion(req, res, next) {
  try {
    const {
      idTipoHabitacion, numeroHabitacion, nombre,
      piso, capacidadMaxima, precioNoche, descripcion, estado,
    } = req.body;

    const idTipo = idValido(idTipoHabitacion);
    if (!idTipo)
      return res.status(400).json({ success: false, error: 'idTipoHabitacion debe ser un entero > 0.' });

    if (!numeroHabitacion || typeof numeroHabitacion !== 'string' || numeroHabitacion.trim().length === 0)
      return res.status(400).json({ success: false, error: 'numeroHabitacion es requerido.' });
    if (numeroHabitacion.trim().length > 20)
      return res.status(400).json({ success: false, error: 'numeroHabitacion supera 20 caracteres.' });

    const pisoNum = idValido(piso);
    if (!pisoNum && piso !== 0)
      return res.status(400).json({ success: false, error: 'piso debe ser un entero positivo.' });

    const capMax = idValido(capacidadMaxima);
    if (!capMax)
      return res.status(400).json({ success: false, error: 'capacidadMaxima debe ser un entero > 0.' });

    const precio = decimalValido(precioNoche);
    if (precio === null)
      return res.status(400).json({ success: false, error: 'precioNoche debe ser un número >= 0.' });

    if (nombre && nombre.length > 150)
      return res.status(400).json({ success: false, error: 'nombre supera 150 caracteres.' });

    if (estado && !ESTADOS_HABITACION.includes(estado))
      return res.status(400).json({ success: false, error: `estado inválido. Valores: ${ESTADOS_HABITACION.join(', ')}.` });

    const habitacion = await svc.crearHabitacion({
      idTipoHabitacion: idTipo,
      numeroHabitacion: numeroHabitacion.trim(),
      nombre: nombre ?? null,
      piso: parseInt(piso, 10),
      capacidadMaxima: capMax,
      precioNoche: precio,
      descripcion: descripcion ?? null,
      estado: estado ?? 'DISPONIBLE',
    });

    return res.status(201).json({ success: true, habitacion });
  } catch (err) { return next(err); }
}

async function editarHabitacion(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido.' });

    const {
      idTipoHabitacion, numeroHabitacion, nombre,
      piso, capacidadMaxima, precioNoche, descripcion, estado,
    } = req.body;

    let idTipo = undefined, pisoNum = undefined, capMax = undefined, precio = undefined;

    if (idTipoHabitacion !== undefined) {
      idTipo = idValido(idTipoHabitacion);
      if (!idTipo) return res.status(400).json({ success: false, error: 'idTipoHabitacion inválido.' });
    }
    if (piso !== undefined) {
      pisoNum = parseInt(piso, 10);
      if (!Number.isInteger(pisoNum) || pisoNum < 0)
        return res.status(400).json({ success: false, error: 'piso debe ser un entero >= 0.' });
    }
    if (capacidadMaxima !== undefined) {
      capMax = idValido(capacidadMaxima);
      if (!capMax) return res.status(400).json({ success: false, error: 'capacidadMaxima debe ser > 0.' });
    }
    if (precioNoche !== undefined) {
      precio = decimalValido(precioNoche);
      if (precio === null) return res.status(400).json({ success: false, error: 'precioNoche debe ser >= 0.' });
    }
    if (numeroHabitacion !== undefined && numeroHabitacion.length > 20)
      return res.status(400).json({ success: false, error: 'numeroHabitacion supera 20 caracteres.' });
    if (nombre !== undefined && nombre.length > 150)
      return res.status(400).json({ success: false, error: 'nombre supera 150 caracteres.' });
    if (estado && !ESTADOS_HABITACION.includes(estado))
      return res.status(400).json({ success: false, error: `estado inválido. Valores: ${ESTADOS_HABITACION.join(', ')}.` });

    const habitacion = await svc.editarHabitacion(id, {
      idTipoHabitacion: idTipo, numeroHabitacion, nombre,
      piso: pisoNum, capacidadMaxima: capMax,
      precioNoche: precio, descripcion, estado,
    });
    if (!habitacion) return res.status(404).json({ success: false, error: 'Habitación no encontrada.' });

    return res.status(200).json({ success: true, habitacion });
  } catch (err) { return next(err); }
}

async function cambiarEstado(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido.' });

    const { estado } = req.body;
    if (!estado || !ESTADOS_HABITACION.includes(estado))
      return res.status(400).json({ success: false, error: `estado debe ser: ${ESTADOS_HABITACION.join(', ')}.` });

    const habitacion = await svc.cambiarEstadoHabitacion(id, estado);
    if (!habitacion) return res.status(404).json({ success: false, error: 'Habitación no encontrada.' });

    return res.status(200).json({ success: true, habitacion });
  } catch (err) { return next(err); }
}

// ─── tipos_cama ───────────────────────────────────────────────────────────────

async function listarTiposCama(req, res, next) {
  try {
    const tipos = await svc.listarTiposCama();
    return res.status(200).json({ success: true, tipos });
  } catch (err) { return next(err); }
}

// ─── habitacion_camas ─────────────────────────────────────────────────────────

async function asociarCama(req, res, next) {
  try {
    const idHab = idValido(req.params.id);
    if (!idHab) return res.status(400).json({ success: false, error: 'ID de habitación inválido.' });

    const { idTipoCama, cantidad } = req.body;
    const idCama = idValido(idTipoCama);
    if (!idCama) return res.status(400).json({ success: false, error: 'idTipoCama debe ser un entero > 0.' });

    const cant = idValido(cantidad);
    if (!cant) return res.status(400).json({ success: false, error: 'cantidad debe ser un entero > 0.' });

    const cama = await svc.asociarCama(idHab, idCama, cant);
    return res.status(201).json({ success: true, cama });
  } catch (err) { return next(err); }
}

async function actualizarCama(req, res, next) {
  try {
    const id = idValido(req.params.idCama);
    if (!id) return res.status(400).json({ success: false, error: 'ID de cama inválido.' });

    const cant = idValido(req.body.cantidad);
    if (!cant) return res.status(400).json({ success: false, error: 'cantidad debe ser un entero > 0.' });

    const cama = await svc.actualizarCantidadCama(id, cant);
    if (!cama) return res.status(404).json({ success: false, error: 'Asociación de cama no encontrada.' });

    return res.status(200).json({ success: true, cama });
  } catch (err) { return next(err); }
}

async function eliminarCama(req, res, next) {
  try {
    const id = idValido(req.params.idCama);
    if (!id) return res.status(400).json({ success: false, error: 'ID de cama inválido.' });

    const ok = await svc.eliminarAsociacionCama(id);
    if (!ok) return res.status(404).json({ success: false, error: 'Asociación de cama no encontrada.' });

    return res.status(200).json({ success: true, message: 'Asociación de cama eliminada.' });
  } catch (err) { return next(err); }
}

// ─── imagenes_habitacion ──────────────────────────────────────────────────────

async function agregarImagen(req, res, next) {
  try {
    const idHab = idValido(req.params.id);
    if (!idHab) return res.status(400).json({ success: false, error: 'ID de habitación inválido.' });

    const { urlImagen, textoAlternativo, ordenVisualizacion, esPrincipal } = req.body;

    if (!urlImagen || typeof urlImagen !== 'string' || urlImagen.trim().length === 0)
      return res.status(400).json({ success: false, error: 'urlImagen es requerida.' });
    if (textoAlternativo && textoAlternativo.length > 255)
      return res.status(400).json({ success: false, error: 'textoAlternativo supera 255 caracteres.' });

    const imagen = await svc.agregarImagen(idHab, {
      urlImagen: urlImagen.trim(),
      textoAlternativo: textoAlternativo ?? null,
      ordenVisualizacion: ordenVisualizacion ? parseInt(ordenVisualizacion, 10) : 1,
      esPrincipal: esPrincipal === true || esPrincipal === 'true',
    });

    return res.status(201).json({ success: true, imagen });
  } catch (err) { return next(err); }
}

async function listarImagenes(req, res, next) {
  try {
    const idHab = idValido(req.params.id);
    if (!idHab) return res.status(400).json({ success: false, error: 'ID de habitación inválido.' });

    const imagenes = await svc.listarImagenes(idHab);
    return res.status(200).json({ success: true, imagenes });
  } catch (err) { return next(err); }
}

async function eliminarImagen(req, res, next) {
  try {
    const id = idValido(req.params.idImagen);
    if (!id) return res.status(400).json({ success: false, error: 'ID de imagen inválido.' });

    const ok = await svc.eliminarImagen(id);
    if (!ok) return res.status(404).json({ success: false, error: 'Imagen no encontrada.' });

    return res.status(200).json({ success: true, message: 'Imagen eliminada.' });
  } catch (err) { return next(err); }
}

module.exports = {
  listarTipos, crearTipo, editarTipo,
  listarHabitaciones, obtenerHabitacion, crearHabitacion, editarHabitacion, cambiarEstado,
  listarTiposCama,
  asociarCama, actualizarCama, eliminarCama,
  agregarImagen, listarImagenes, eliminarImagen,
};
