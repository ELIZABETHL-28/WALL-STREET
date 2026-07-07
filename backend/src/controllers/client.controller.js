const {
  getClientProfile,
  createClientProfile,
  updateClientProfile,
} = require('../services/client.service');

const TIPOS_DOCUMENTO_VALIDOS = ['DPI', 'PASAPORTE', 'OTRO'];

// Límites de longitud que coinciden con el schema MySQL de la tabla clientes.
const LIMITES = {
  telefono:        25,
  numeroDocumento: 50,
  nacionalidad:    80,
  direccion:       255,
};

/**
 * Devuelve true si el valor supera el máximo de caracteres permitido.
 * Solo evalúa el campo cuando realmente tiene un valor (no null/undefined).
 */
function excedeLongitud(valor, maximo) {
  return (
    valor !== undefined &&
    valor !== null &&
    (typeof valor !== 'string' || valor.trim().length > maximo)
  );
}

/**
 * Valida los límites de longitud de los campos con restricción VARCHAR en MySQL.
 * Retorna un mensaje de error string si encuentra un problema, o null si todo está bien.
 * Aplica tanto al crear como al actualizar el perfil.
 */
function validarLongitudes(body) {
  for (const [campo, maximo] of Object.entries(LIMITES)) {
    if (excedeLongitud(body[campo], maximo)) {
      return `${campo} supera el máximo permitido de ${maximo} caracteres.`;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/clientes/perfil
 * Devuelve el perfil cliente del usuario autenticado.
 * Si el perfil todavía no existe responde con profileComplete: false.
 */
async function getPerfil(req, res, next) {
  try {
    const perfil = await getClientProfile(req.user.idUsuario);

    if (!perfil) {
      return res.status(200).json({
        success:         true,
        profileComplete: false,
        message:         'El perfil de cliente aún no ha sido completado.',
        perfil:          null,
      });
    }

    return res.status(200).json({
      success:         true,
      profileComplete: true,
      perfil,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/clientes/perfil
 * Crea el perfil cliente por primera vez.
 * El id_usuario se obtiene de req.user — nunca de req.body.
 */
async function crearPerfil(req, res, next) {
  try {
    // Verificar si ya existe
    const existente = await getClientProfile(req.user.idUsuario);
    if (existente) {
      return res.status(409).json({
        success: false,
        error:   'El perfil ya existe. Usa PUT /api/clientes/perfil para actualizarlo.',
      });
    }

    const { nombres, apellidos, tipoDocumento, fechaNacimiento } = req.body;

    // --- Validaciones de campos requeridos ---
    if (!nombres || typeof nombres !== 'string' || nombres.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'El campo nombres es requerido.' });
    }
    if (nombres.trim().length > 100) {
      return res.status(400).json({ success: false, error: 'nombres supera el máximo permitido de 100 caracteres.' });
    }
    if (!apellidos || typeof apellidos !== 'string' || apellidos.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'El campo apellidos es requerido.' });
    }
    if (apellidos.trim().length > 100) {
      return res.status(400).json({ success: false, error: 'apellidos supera el máximo permitido de 100 caracteres.' });
    }
    if (tipoDocumento && !TIPOS_DOCUMENTO_VALIDOS.includes(tipoDocumento)) {
      return res.status(400).json({
        success: false,
        error:   `tipoDocumento debe ser uno de: ${TIPOS_DOCUMENTO_VALIDOS.join(', ')}.`,
      });
    }
    if (fechaNacimiento) {
      const d = new Date(fechaNacimiento);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ success: false, error: 'fechaNacimiento no es una fecha válida.' });
      }
    }

    // --- Validación de longitudes VARCHAR ---
    const errorLongitud = validarLongitudes(req.body);
    if (errorLongitud) {
      return res.status(400).json({ success: false, error: errorLongitud });
    }

    // Solo campos permitidos — se ignoran id_usuario, rol, supabase_uid, estado, correo, etc.
    const datosSeguros = {
      nombres:         nombres.trim(),
      apellidos:       apellidos.trim(),
      telefono:        req.body.telefono         ?? null,
      tipoDocumento:   tipoDocumento             ?? 'DPI',
      numeroDocumento: req.body.numeroDocumento  ?? null,
      fechaNacimiento: fechaNacimiento           ?? null,
      nacionalidad:    req.body.nacionalidad     ?? null,
      direccion:       req.body.direccion        ?? null,
    };

    const perfil = await createClientProfile(req.user.idUsuario, datosSeguros);

    return res.status(201).json({ success: true, perfil });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/clientes/perfil
 * Actualiza únicamente los campos permitidos del perfil.
 * No permite cambiar rol, id_usuario, supabase_uid, estado ni correo.
 */
async function actualizarPerfil(req, res, next) {
  try {
    const existente = await getClientProfile(req.user.idUsuario);
    if (!existente) {
      return res.status(404).json({
        success: false,
        error:   'El perfil no existe. Usa POST /api/clientes/perfil para crearlo.',
      });
    }

    const { tipoDocumento, fechaNacimiento, nombres, apellidos } = req.body;

    // --- Validaciones opcionales de campos presentes ---
    if (nombres !== undefined && (typeof nombres !== 'string' || nombres.trim().length === 0)) {
      return res.status(400).json({ success: false, error: 'El campo nombres no puede estar vacío.' });
    }
    if (nombres !== undefined && nombres.trim().length > 100) {
      return res.status(400).json({ success: false, error: 'nombres supera el máximo permitido de 100 caracteres.' });
    }
    if (apellidos !== undefined && (typeof apellidos !== 'string' || apellidos.trim().length === 0)) {
      return res.status(400).json({ success: false, error: 'El campo apellidos no puede estar vacío.' });
    }
    if (apellidos !== undefined && apellidos.trim().length > 100) {
      return res.status(400).json({ success: false, error: 'apellidos supera el máximo permitido de 100 caracteres.' });
    }
    if (tipoDocumento && !TIPOS_DOCUMENTO_VALIDOS.includes(tipoDocumento)) {
      return res.status(400).json({
        success: false,
        error:   `tipoDocumento debe ser uno de: ${TIPOS_DOCUMENTO_VALIDOS.join(', ')}.`,
      });
    }
    if (fechaNacimiento) {
      const d = new Date(fechaNacimiento);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ success: false, error: 'fechaNacimiento no es una fecha válida.' });
      }
    }

    // --- Validación de longitudes VARCHAR ---
    const errorLongitud = validarLongitudes(req.body);
    if (errorLongitud) {
      return res.status(400).json({ success: false, error: errorLongitud });
    }

    // Solo campos permitidos — campos no listados son ignorados.
    const datosSeguros = {
      nombres:         req.body.nombres          ?? undefined,
      apellidos:       req.body.apellidos        ?? undefined,
      telefono:        req.body.telefono         ?? undefined,
      tipoDocumento:   req.body.tipoDocumento    ?? undefined,
      numeroDocumento: req.body.numeroDocumento  ?? undefined,
      fechaNacimiento: req.body.fechaNacimiento  ?? undefined,
      nacionalidad:    req.body.nacionalidad     ?? undefined,
      direccion:       req.body.direccion        ?? undefined,
    };

    const perfil = await updateClientProfile(req.user.idUsuario, datosSeguros);

    return res.status(200).json({ success: true, perfil });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getPerfil, crearPerfil, actualizarPerfil };
