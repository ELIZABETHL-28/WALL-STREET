const crypto = require('crypto');
const QRCode = require('qrcode');
const { pool } = require('../config/mysql');

async function getClienteByUsuario(idUsuario, conn = pool) {
  const [rows] = await conn.execute(
    'SELECT id_cliente FROM clientes WHERE id_usuario = ? LIMIT 1',
    [idUsuario]
  );
  return rows.length ? rows[0].id_cliente : null;
}

function generarCodigo() {
  return 'ACC-' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

async function generarCodigoUnico(conn) {
  for (let intento = 0; intento < 5; intento += 1) {
    const codigo = generarCodigo();
    const [rows] = await conn.execute(
      'SELECT id_codigo_acceso FROM codigos_acceso WHERE codigo = ? LIMIT 1',
      [codigo]
    );
    if (!rows.length) return codigo;
  }
  const err = new Error('No se pudo generar un código de acceso único.');
  err.statusCode = 500;
  throw err;
}

async function asegurarCodigoPropio(idUsuario, tipo, idEntidad) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const idCliente = await getClienteByUsuario(idUsuario, conn);
    if (!idCliente) {
      const err = new Error('Perfil de cliente no encontrado.');
      err.statusCode = 422;
      throw err;
    }

    const config = tipo === 'RESERVACION'
      ? {
          tabla: 'reservaciones', id: 'id_reservacion', estado: 'estado',
          estadosInvalidos: ['CANCELADA'], fecha: 'fecha_salida', fk: 'id_reservacion', otroFk: 'id_pase_cliente',
        }
      : {
          tabla: 'pases_cliente', id: 'id_pase_cliente', estado: 'estado',
          estadosInvalidos: ['CANCELADO'], fecha: 'fecha_uso', fk: 'id_pase_cliente', otroFk: 'id_reservacion',
        };

    const [entidadRows] = await conn.execute(
      `SELECT ${config.id} AS id, ${config.estado} AS estado, ${config.fecha} AS fecha_referencia
       FROM ${config.tabla}
       WHERE ${config.id} = ? AND id_cliente = ?
       LIMIT 1
       FOR UPDATE`,
      [idEntidad, idCliente]
    );

    if (!entidadRows.length) {
      const err = new Error(tipo === 'RESERVACION' ? 'Reservación no encontrada.' : 'Pase no encontrado.');
      err.statusCode = 404;
      throw err;
    }

    const [codigoRows] = await conn.execute(
      `SELECT id_codigo_acceso, codigo, tipo, estado, fecha_generacion, fecha_ultimo_uso
       FROM codigos_acceso
       WHERE ${config.fk} = ?
       ORDER BY id_codigo_acceso DESC
       LIMIT 1
       FOR UPDATE`,
      [idEntidad]
    );

    let codigoAcceso = codigoRows[0];
    if (!codigoAcceso) {
      const codigo = await generarCodigoUnico(conn);
      const [insert] = await conn.execute(
        `INSERT INTO codigos_acceso (codigo, tipo, ${config.fk}, ${config.otroFk}, estado)
         VALUES (?, ?, ?, NULL, 'ACTIVO')`,
        [codigo, tipo, idEntidad]
      );
      codigoAcceso = {
        id_codigo_acceso: insert.insertId,
        codigo,
        tipo,
        estado: 'ACTIVO',
        fecha_generacion: new Date(),
        fecha_ultimo_uso: null,
      };
    }

    const hoy = new Date().toISOString().split('T')[0];
    const fechaReferencia = String(entidadRows[0].fecha_referencia).split('T')[0];

    if (config.estadosInvalidos.includes(entidadRows[0].estado) && codigoAcceso.estado === 'ACTIVO') {
      await conn.execute(
        "UPDATE codigos_acceso SET estado = 'INVALIDO' WHERE id_codigo_acceso = ?",
        [codigoAcceso.id_codigo_acceso]
      );
      codigoAcceso.estado = 'INVALIDO';
    } else if (fechaReferencia < hoy && codigoAcceso.estado === 'ACTIVO') {
      await conn.execute(
        "UPDATE codigos_acceso SET estado = 'VENCIDO' WHERE id_codigo_acceso = ?",
        [codigoAcceso.id_codigo_acceso]
      );
      codigoAcceso.estado = 'VENCIDO';
    }

    await conn.commit();
    const qrDataUrl = await QRCode.toDataURL(codigoAcceso.codigo, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    return { ...codigoAcceso, qrDataUrl };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function validarCodigo(codigo) {
  const [rows] = await pool.execute(
    `SELECT
       ca.id_codigo_acceso, ca.codigo, ca.tipo, ca.estado,
       ca.id_reservacion, ca.id_pase_cliente,
       ca.fecha_generacion, ca.fecha_ultimo_uso,
       c.id_cliente, c.nombres, c.apellidos,
       r.codigo_reservacion,
       pc.codigo_pase
     FROM codigos_acceso ca
     LEFT JOIN reservaciones r ON r.id_reservacion = ca.id_reservacion
     LEFT JOIN pases_cliente pc ON pc.id_pase_cliente = ca.id_pase_cliente
     LEFT JOIN clientes c ON c.id_cliente = COALESCE(r.id_cliente, pc.id_cliente)
     WHERE ca.codigo = ?
     LIMIT 1`,
    [String(codigo || '').trim().toUpperCase()]
  );

  if (!rows.length) {
    const err = new Error('Código de acceso no encontrado.');
    err.statusCode = 404;
    throw err;
  }
  return rows[0];
}

async function utilizarCodigo(idCodigoAcceso) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      `SELECT id_codigo_acceso, codigo, estado
       FROM codigos_acceso
       WHERE id_codigo_acceso = ?
       LIMIT 1
       FOR UPDATE`,
      [idCodigoAcceso]
    );
    if (!rows.length) {
      const err = new Error('Código de acceso no encontrado.');
      err.statusCode = 404;
      throw err;
    }
    if (rows[0].estado !== 'ACTIVO') {
      const err = new Error(`El código está en estado ${rows[0].estado} y no puede utilizarse.`);
      err.statusCode = 409;
      throw err;
    }

    await conn.execute(
      "UPDATE codigos_acceso SET estado = 'UTILIZADO', fecha_ultimo_uso = CURRENT_TIMESTAMP WHERE id_codigo_acceso = ?",
      [idCodigoAcceso]
    );
    await conn.commit();
    return validarCodigo(rows[0].codigo);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = {
  obtenerCodigoReservacion: (idUsuario, id) => asegurarCodigoPropio(idUsuario, 'RESERVACION', id),
  obtenerCodigoPase: (idUsuario, id) => asegurarCodigoPropio(idUsuario, 'PASE', id),
  validarCodigo,
  utilizarCodigo,
};
