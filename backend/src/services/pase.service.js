/**
 * pase.service.js
 * Lógica de acceso a datos para el módulo de Pases de Día.
 * Fuente de verdad: schema.sql — tablas tipos_pase y pases_cliente.
 * Todas las consultas usan pool.execute() con placeholders ?.
 */
const { pool } = require('../config/mysql');
const crypto   = require('crypto');

// ─── helpers privados ──────────────────────────────────────────────────────────

async function getClienteByUsuario(idUsuario) {
  const [rows] = await pool.execute(
    'SELECT id_cliente FROM clientes WHERE id_usuario = ? LIMIT 1',
    [idUsuario]
  );
  return rows.length ? rows[0].id_cliente : null;
}

/**
 * Genera un código único para el pase: PASE-XXXXXXXXXXXXXXXX.
 */
function generarCodigoPase() {
  return 'PASE-' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

// ─── tipos_pase ────────────────────────────────────────────────────────────────

/**
 * Devuelve un tipo de pase por ID.
 */
async function obtenerTipoPase(idTipoPase) {
  const [rows] = await pool.execute(
    `SELECT id_tipo_pase, nombre, descripcion, precio,
            cantidad_maxima_personas, servicios_incluidos,
            estado, fecha_creacion, ultima_actualizacion
     FROM tipos_pase
     WHERE id_tipo_pase = ?
     LIMIT 1`,
    [idTipoPase]
  );
  return rows.length ? rows[0] : null;
}

/**
 * Lista todos los tipos de pase (ADMIN).
 */
async function listarTiposPaseAdmin() {
  const [rows] = await pool.execute(
    `SELECT id_tipo_pase, nombre, descripcion, precio,
            cantidad_maxima_personas, servicios_incluidos,
            estado, fecha_creacion, ultima_actualizacion
     FROM tipos_pase
     ORDER BY nombre ASC`
  );
  return rows;
}

/**
 * Lista tipos de pase disponibles para CLIENTE (solo ACTIVO).
 */
async function listarTiposPaseActivos() {
  const [rows] = await pool.execute(
    `SELECT id_tipo_pase, nombre, descripcion, precio,
            cantidad_maxima_personas, servicios_incluidos, estado
     FROM tipos_pase
     WHERE estado = 'ACTIVO'
     ORDER BY nombre ASC`
  );
  return rows;
}

/**
 * Crea un nuevo tipo de pase (ADMIN).
 */
async function crearTipoPase({
  nombre, descripcion, precio,
  cantidadMaximaPersonas, serviciosIncluidos, estado,
}) {
  const [result] = await pool.execute(
    `INSERT INTO tipos_pase
       (nombre, descripcion, precio, cantidad_maxima_personas, servicios_incluidos, estado)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      nombre,
      descripcion             ?? null,
      precio,
      cantidadMaximaPersonas,
      serviciosIncluidos      ?? null,
      estado                  ?? 'ACTIVO',
    ]
  );
  return obtenerTipoPase(result.insertId);
}

/**
 * Edita un tipo de pase (ADMIN). Parcial.
 */
async function editarTipoPase(idTipoPase, {
  nombre, descripcion, precio,
  cantidadMaximaPersonas, serviciosIncluidos, estado,
}) {
  await pool.execute(
    `UPDATE tipos_pase
     SET nombre                  = COALESCE(?, nombre),
         descripcion             = COALESCE(?, descripcion),
         precio                  = COALESCE(?, precio),
         cantidad_maxima_personas= COALESCE(?, cantidad_maxima_personas),
         servicios_incluidos     = COALESCE(?, servicios_incluidos),
         estado                  = COALESCE(?, estado)
     WHERE id_tipo_pase = ?`,
    [
      nombre                  ?? null,
      descripcion             ?? null,
      precio                  ?? null,
      cantidadMaximaPersonas  ?? null,
      serviciosIncluidos      ?? null,
      estado                  ?? null,
      idTipoPase,
    ]
  );
  return obtenerTipoPase(idTipoPase);
}

/**
 * Cambia el estado de un tipo de pase: ACTIVO / INACTIVO (ADMIN).
 */
async function cambiarEstadoTipoPase(idTipoPase, estado) {
  await pool.execute(
    'UPDATE tipos_pase SET estado = ? WHERE id_tipo_pase = ?',
    [estado, idTipoPase]
  );
  return obtenerTipoPase(idTipoPase);
}

// ─── pases_cliente ────────────────────────────────────────────────────────────

/**
 * Devuelve un pase_cliente con info del tipo de pase.
 */
async function getPaseCompleto(idPaseCliente) {
  const [rows] = await pool.execute(
    `SELECT
       pc.id_pase_cliente,
       pc.id_cliente,
       pc.id_tipo_pase,
       pc.codigo_pase,
       pc.fecha_uso,
       pc.cantidad_personas,
       pc.precio_aplicado,
       pc.estado,
       pc.fecha_compra,
       tp.nombre               AS tipo_pase_nombre,
       tp.descripcion          AS tipo_pase_descripcion,
       tp.cantidad_maxima_personas,
       tp.servicios_incluidos
     FROM pases_cliente pc
     INNER JOIN tipos_pase tp ON tp.id_tipo_pase = pc.id_tipo_pase
     WHERE pc.id_pase_cliente = ?
     LIMIT 1`,
    [idPaseCliente]
  );
  return rows.length ? rows[0] : null;
}

/**
 * Lista todos los pases adquiridos por clientes (ADMIN).
 * Incluye nombre y apellidos del cliente.
 */
async function listarPasesAdmin({ idCliente } = {}) {
  let sql = `
    SELECT
      pc.id_pase_cliente,
      pc.codigo_pase,
      pc.fecha_uso,
      pc.cantidad_personas,
      pc.precio_aplicado,
      pc.estado,
      pc.fecha_compra,
      tp.nombre               AS tipo_pase_nombre,
      tp.precio               AS tipo_pase_precio,
      c.nombres               AS cliente_nombres,
      c.apellidos             AS cliente_apellidos
    FROM pases_cliente pc
    INNER JOIN tipos_pase tp ON tp.id_tipo_pase = pc.id_tipo_pase
    INNER JOIN clientes c    ON c.id_cliente    = pc.id_cliente
    WHERE 1=1
  `;

  const params = [];
  if (idCliente) {
    sql += ' AND pc.id_cliente = ?';
    params.push(idCliente);
  }

  sql += ' ORDER BY pc.fecha_compra DESC';

  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Adquiere un pase de día para el CLIENTE autenticado.
 *
 * Validaciones:
 *  - Tipo de pase existe y está ACTIVO.
 *  - fecha_uso >= hoy.
 *  - cantidad_personas >= 1 y <= cantidad_maxima_personas del tipo.
 *  - precio_aplicado = precio actual del tipo de pase × 1 (precio por persona no aplica,
 *    el precio del tipo es el total para la cantidad máxima; se aplica el precio directamente).
 */
async function adquirirPase(idUsuario, { idTipoPase, fechaUso, cantidadPersonas }) {
  const idCliente = await getClienteByUsuario(idUsuario);
  if (!idCliente) {
    const err = new Error('Debes completar tu perfil de cliente antes de adquirir un pase.');
    err.statusCode = 422;
    throw err;
  }

  // Verificar tipo de pase
  const tipoPase = await obtenerTipoPase(idTipoPase);
  if (!tipoPase) {
    const err = new Error('Tipo de pase no encontrado.');
    err.statusCode = 404;
    throw err;
  }
  if (tipoPase.estado !== 'ACTIVO') {
    const err = new Error('El tipo de pase no está disponible.');
    err.statusCode = 409;
    throw err;
  }

  // Validar fecha_uso >= hoy
  const hoy = new Date().toISOString().split('T')[0];
  if (fechaUso < hoy) {
    const err = new Error('La fecha de uso no puede ser en el pasado.');
    err.statusCode = 400;
    throw err;
  }

  // Validar cantidad_personas
  if (cantidadPersonas < 1 || cantidadPersonas > tipoPase.cantidad_maxima_personas) {
    const err = new Error(
      `cantidad_personas debe estar entre 1 y ${tipoPase.cantidad_maxima_personas} para este tipo de pase.`
    );
    err.statusCode = 400;
    throw err;
  }

  // Generar código único
  let codigoPase;
  let intentos = 0;
  do {
    codigoPase = generarCodigoPase();
    const [dup] = await pool.execute(
      'SELECT id_pase_cliente FROM pases_cliente WHERE codigo_pase = ? LIMIT 1',
      [codigoPase]
    );
    if (!dup.length) break;
    intentos++;
  } while (intentos < 5);

  const precioAplicado = parseFloat(tipoPase.precio);

  const [result] = await pool.execute(
    `INSERT INTO pases_cliente
       (id_cliente, id_tipo_pase, codigo_pase, fecha_uso,
        cantidad_personas, precio_aplicado, estado)
     VALUES (?, ?, ?, ?, ?, ?, 'ACTIVO')`,
    [idCliente, idTipoPase, codigoPase, fechaUso, cantidadPersonas, precioAplicado]
  );

  return getPaseCompleto(result.insertId);
}

/**
 * Lista los pases del CLIENTE autenticado.
 */
async function listarMisPases(idUsuario) {
  const idCliente = await getClienteByUsuario(idUsuario);
  if (!idCliente) return [];

  const [rows] = await pool.execute(
    `SELECT
       pc.id_pase_cliente,
       pc.codigo_pase,
       pc.fecha_uso,
       pc.cantidad_personas,
       pc.precio_aplicado,
       pc.estado,
       pc.fecha_compra,
       tp.nombre               AS tipo_pase_nombre,
       tp.descripcion          AS tipo_pase_descripcion,
       tp.servicios_incluidos
     FROM pases_cliente pc
     INNER JOIN tipos_pase tp ON tp.id_tipo_pase = pc.id_tipo_pase
     WHERE pc.id_cliente = ?
     ORDER BY pc.fecha_compra DESC`,
    [idCliente]
  );
  return rows;
}

/**
 * Obtiene el detalle de un pase propio del CLIENTE.
 */
async function obtenerMiPase(idUsuario, idPaseCliente) {
  const idCliente = await getClienteByUsuario(idUsuario);
  if (!idCliente) {
    const err = new Error('Perfil de cliente no encontrado.');
    err.statusCode = 404;
    throw err;
  }

  const [check] = await pool.execute(
    'SELECT id_pase_cliente FROM pases_cliente WHERE id_pase_cliente = ? AND id_cliente = ? LIMIT 1',
    [idPaseCliente, idCliente]
  );
  if (!check.length) {
    const err = new Error('Pase no encontrado.');
    err.statusCode = 404;
    throw err;
  }

  return getPaseCompleto(idPaseCliente);
}

module.exports = {
  listarTiposPaseAdmin,
  listarTiposPaseActivos,
  obtenerTipoPase,
  crearTipoPase,
  editarTipoPase,
  cambiarEstadoTipoPase,
  listarPasesAdmin,
  adquirirPase,
  listarMisPases,
  obtenerMiPase,
};
