/**
 * habitacion.service.js
 * Lógica de acceso a datos para el módulo de habitaciones.
 * Todas las consultas usan pool.execute() con placeholders ?.
 * Columnas basadas en schema.sql — fuente de verdad.
 */
const { pool } = require('../config/mysql');

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Devuelve una habitación completa: datos base, tipo, camas e imágenes.
 * Retorna null si no existe.
 */
async function getHabitacionCompleta(idHabitacion) {
  // Datos base + tipo
  const [hab] = await pool.execute(
    `SELECT
       h.id_habitacion,
       h.numero_habitacion,
       h.nombre,
       h.piso,
       h.capacidad_maxima,
       h.precio_noche,
       h.descripcion,
       h.estado,
       h.fecha_registro,
       h.ultima_actualizacion,
       t.id_tipo_habitacion,
       t.nombre            AS tipo_nombre,
       t.descripcion       AS tipo_descripcion,
       t.precio_base       AS tipo_precio_base,
       t.capacidad_base    AS tipo_capacidad_base,
       t.estado            AS tipo_estado
     FROM habitaciones h
     INNER JOIN tipos_habitacion t ON t.id_tipo_habitacion = h.id_tipo_habitacion
     WHERE h.id_habitacion = ?
     LIMIT 1`,
    [idHabitacion]
  );

  if (!hab.length) return null;

  // Camas asociadas
  const [camas] = await pool.execute(
    `SELECT
       hc.id_habitacion_cama,
       hc.cantidad,
       tc.id_tipo_cama,
       tc.nombre           AS tipo_cama_nombre,
       tc.capacidad_personas
     FROM habitacion_camas hc
     INNER JOIN tipos_cama tc ON tc.id_tipo_cama = hc.id_tipo_cama
     WHERE hc.id_habitacion = ?
     ORDER BY tc.nombre`,
    [idHabitacion]
  );

  // Imágenes
  const [imagenes] = await pool.execute(
    `SELECT
       id_imagen,
       url_imagen,
       texto_alternativo,
       orden_visualizacion,
       es_principal,
       fecha_registro
     FROM imagenes_habitacion
     WHERE id_habitacion = ?
     ORDER BY es_principal DESC, orden_visualizacion ASC`,
    [idHabitacion]
  );

  return { ...hab[0], camas, imagenes };
}

// ─── tipos_habitacion ─────────────────────────────────────────────────────────

async function listarTiposHabitacion() {
  const [rows] = await pool.execute(
    `SELECT id_tipo_habitacion, nombre, descripcion,
            precio_base, capacidad_base, estado, fecha_creacion
     FROM tipos_habitacion
     ORDER BY nombre`
  );
  return rows;
}

async function crearTipoHabitacion({ nombre, descripcion, precioBase, capacidadBase, estado }) {
  const [result] = await pool.execute(
    `INSERT INTO tipos_habitacion (nombre, descripcion, precio_base, capacidad_base, estado)
     VALUES (?, ?, ?, ?, ?)`,
    [nombre, descripcion ?? null, precioBase, capacidadBase, estado ?? 'ACTIVO']
  );
  const [rows] = await pool.execute(
    'SELECT * FROM tipos_habitacion WHERE id_tipo_habitacion = ?',
    [result.insertId]
  );
  return rows[0];
}

async function editarTipoHabitacion(id, { nombre, descripcion, precioBase, capacidadBase, estado }) {
  await pool.execute(
    `UPDATE tipos_habitacion
     SET nombre          = COALESCE(?, nombre),
         descripcion     = COALESCE(?, descripcion),
         precio_base     = COALESCE(?, precio_base),
         capacidad_base  = COALESCE(?, capacidad_base),
         estado          = COALESCE(?, estado)
     WHERE id_tipo_habitacion = ?`,
    [nombre ?? null, descripcion ?? null, precioBase ?? null, capacidadBase ?? null, estado ?? null, id]
  );
  const [rows] = await pool.execute(
    'SELECT * FROM tipos_habitacion WHERE id_tipo_habitacion = ?',
    [id]
  );
  return rows.length ? rows[0] : null;
}

// ─── habitaciones ─────────────────────────────────────────────────────────────

async function listarHabitaciones({ estado, idTipo } = {}) {
  let sql = `
    SELECT
      h.id_habitacion,
      h.numero_habitacion,
      h.nombre,
      h.piso,
      h.capacidad_maxima,
      h.precio_noche,
      h.descripcion,
      h.estado,
      h.fecha_registro,
      h.ultima_actualizacion,
      t.id_tipo_habitacion,
      t.nombre AS tipo_nombre,
      (SELECT url_imagen
         FROM imagenes_habitacion
        WHERE id_habitacion = h.id_habitacion AND es_principal = TRUE
        LIMIT 1)  AS imagen_principal
    FROM habitaciones h
    INNER JOIN tipos_habitacion t ON t.id_tipo_habitacion = h.id_tipo_habitacion
    WHERE 1=1`;

  const params = [];

  if (estado) {
    sql += ' AND h.estado = ?';
    params.push(estado);
  }
  if (idTipo) {
    sql += ' AND h.id_tipo_habitacion = ?';
    params.push(idTipo);
  }

  sql += ' ORDER BY h.piso ASC, h.numero_habitacion ASC';

  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function obtenerHabitacion(id) {
  return getHabitacionCompleta(id);
}

async function crearHabitacion({
  idTipoHabitacion, numeroHabitacion, nombre, piso,
  capacidadMaxima, precioNoche, descripcion, estado,
}) {
  const [result] = await pool.execute(
    `INSERT INTO habitaciones
       (id_tipo_habitacion, numero_habitacion, nombre, piso,
        capacidad_maxima, precio_noche, descripcion, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      idTipoHabitacion, numeroHabitacion,
      nombre ?? null, piso,
      capacidadMaxima, precioNoche,
      descripcion ?? null, estado ?? 'DISPONIBLE',
    ]
  );
  return getHabitacionCompleta(result.insertId);
}

async function editarHabitacion(id, {
  idTipoHabitacion, numeroHabitacion, nombre, piso,
  capacidadMaxima, precioNoche, descripcion, estado,
}) {
  await pool.execute(
    `UPDATE habitaciones
     SET id_tipo_habitacion = COALESCE(?, id_tipo_habitacion),
         numero_habitacion  = COALESCE(?, numero_habitacion),
         nombre             = COALESCE(?, nombre),
         piso               = COALESCE(?, piso),
         capacidad_maxima   = COALESCE(?, capacidad_maxima),
         precio_noche       = COALESCE(?, precio_noche),
         descripcion        = COALESCE(?, descripcion),
         estado             = COALESCE(?, estado)
     WHERE id_habitacion = ?`,
    [
      idTipoHabitacion ?? null, numeroHabitacion ?? null,
      nombre ?? null, piso ?? null,
      capacidadMaxima ?? null, precioNoche ?? null,
      descripcion ?? null, estado ?? null,
      id,
    ]
  );
  return getHabitacionCompleta(id);
}

async function cambiarEstadoHabitacion(id, estado) {
  await pool.execute(
    'UPDATE habitaciones SET estado = ? WHERE id_habitacion = ?',
    [estado, id]
  );
  return getHabitacionCompleta(id);
}

// ─── habitacion_camas ─────────────────────────────────────────────────────────

async function listarTiposCama() {
  const [rows] = await pool.execute(
    'SELECT id_tipo_cama, nombre, capacidad_personas FROM tipos_cama ORDER BY nombre'
  );
  return rows;
}

async function asociarCama(idHabitacion, idTipoCama, cantidad) {
  await pool.execute(
    `INSERT INTO habitacion_camas (id_habitacion, id_tipo_cama, cantidad)
     VALUES (?, ?, ?)`,
    [idHabitacion, idTipoCama, cantidad]
  );
  const [rows] = await pool.execute(
    `SELECT hc.id_habitacion_cama, hc.cantidad,
            tc.id_tipo_cama, tc.nombre AS tipo_cama_nombre, tc.capacidad_personas
     FROM habitacion_camas hc
     INNER JOIN tipos_cama tc ON tc.id_tipo_cama = hc.id_tipo_cama
     WHERE hc.id_habitacion = ? AND hc.id_tipo_cama = ?`,
    [idHabitacion, idTipoCama]
  );
  return rows[0] ?? null;
}

async function actualizarCantidadCama(idHabitacionCama, cantidad) {
  await pool.execute(
    'UPDATE habitacion_camas SET cantidad = ? WHERE id_habitacion_cama = ?',
    [cantidad, idHabitacionCama]
  );
  const [rows] = await pool.execute(
    `SELECT hc.id_habitacion_cama, hc.cantidad,
            tc.id_tipo_cama, tc.nombre AS tipo_cama_nombre, tc.capacidad_personas
     FROM habitacion_camas hc
     INNER JOIN tipos_cama tc ON tc.id_tipo_cama = hc.id_tipo_cama
     WHERE hc.id_habitacion_cama = ?`,
    [idHabitacionCama]
  );
  return rows[0] ?? null;
}

async function eliminarAsociacionCama(idHabitacionCama) {
  const [result] = await pool.execute(
    'DELETE FROM habitacion_camas WHERE id_habitacion_cama = ?',
    [idHabitacionCama]
  );
  return result.affectedRows > 0;
}

// ─── imagenes_habitacion ──────────────────────────────────────────────────────

async function agregarImagen(idHabitacion, { urlImagen, textoAlternativo, ordenVisualizacion, esPrincipal }) {
  const [result] = await pool.execute(
    `INSERT INTO imagenes_habitacion
       (id_habitacion, url_imagen, texto_alternativo, orden_visualizacion, es_principal)
     VALUES (?, ?, ?, ?, ?)`,
    [
      idHabitacion, urlImagen,
      textoAlternativo   ?? null,
      ordenVisualizacion ?? 1,
      esPrincipal        ?? false,
    ]
  );
  const [rows] = await pool.execute(
    'SELECT * FROM imagenes_habitacion WHERE id_imagen = ?',
    [result.insertId]
  );
  return rows[0] ?? null;
}

async function listarImagenes(idHabitacion) {
  const [rows] = await pool.execute(
    `SELECT id_imagen, url_imagen, texto_alternativo,
            orden_visualizacion, es_principal, fecha_registro
     FROM imagenes_habitacion
     WHERE id_habitacion = ?
     ORDER BY es_principal DESC, orden_visualizacion ASC`,
    [idHabitacion]
  );
  return rows;
}

async function eliminarImagen(idImagen) {
  const [result] = await pool.execute(
    'DELETE FROM imagenes_habitacion WHERE id_imagen = ?',
    [idImagen]
  );
  return result.affectedRows > 0;
}

module.exports = {
  listarTiposHabitacion,
  crearTipoHabitacion,
  editarTipoHabitacion,
  listarHabitaciones,
  obtenerHabitacion,
  crearHabitacion,
  editarHabitacion,
  cambiarEstadoHabitacion,
  listarTiposCama,
  asociarCama,
  actualizarCantidadCama,
  eliminarAsociacionCama,
  agregarImagen,
  listarImagenes,
  eliminarImagen,
};
