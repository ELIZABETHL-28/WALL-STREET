/**
 * reservacion.service.js — frontend
 * Todas las llamadas incluyen el Bearer Token de Supabase.
 * El rol lo valida el backend — nunca se envía desde aquí.
 */
import supabase from './supabase';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function token() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

async function request(method, path, body) {
  const tk = await token();
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${tk}`,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error en la solicitud.');
  return json;
}

// ── CLIENTE ───────────────────────────────────────────────────────────────────

/**
 * Consulta disponibilidad.
 * @param {string} fechaEntrada  YYYY-MM-DD
 * @param {string} fechaSalida   YYYY-MM-DD
 * @param {number} cantidadVisitantes
 */
export const consultarDisponibilidad = (fechaEntrada, fechaSalida, cantidadVisitantes) => {
  const qs = new URLSearchParams({
    fechaEntrada,
    fechaSalida,
    cantidadVisitantes: String(cantidadVisitantes),
  }).toString();
  return request('GET', `/reservaciones/disponibilidad?${qs}`);
};

/**
 * Crear una nueva reservación.
 * @param {object} data  { fechaEntrada, fechaSalida, cantidadAdultos, cantidadNinos?, visitantes? }
 */
export const crearReservacion = (data) =>
  request('POST', '/reservaciones', data);

/** Lista las reservaciones del cliente autenticado. */
export const getMisReservaciones = () =>
  request('GET', '/reservaciones/mias');

/** Detalle de una reservación propia. */
export const getMiReservacion = (id) =>
  request('GET', `/reservaciones/mias/${id}`);

/** Cancelar una reservación propia. */
export const cancelarReservacion = (id) =>
  request('PATCH', `/reservaciones/mias/${id}/cancelar`);

// ── ADMIN ─────────────────────────────────────────────────────────────────────

/**
 * Lista todas las reservaciones (admin).
 * @param {object} filtros  { estado?, fechaDesde?, fechaHasta? }
 */
export const getReservacionesAdmin = (filtros = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== ''))
  ).toString();
  return request('GET', `/reservaciones/admin${qs ? '?' + qs : ''}`);
};

/** Detalle de cualquier reservación (admin). */
export const getReservacionAdmin = (id) =>
  request('GET', `/reservaciones/admin/${id}`);

/** Cambiar estado de una reservación (admin). */
export const cambiarEstadoReservacion = (id, estado) =>
  request('PATCH', `/reservaciones/admin/${id}/estado`, { estado });
