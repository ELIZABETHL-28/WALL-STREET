/**
 * servicio.service.js — frontend
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

// ── ADMIN ─────────────────────────────────────────────────────────────────────

/** Lista todos los servicios del catálogo. */
export const getServiciosAdmin = () =>
  request('GET', '/servicios/admin');

/** Obtiene el detalle de un servicio. */
export const getServicioAdmin = (id) =>
  request('GET', `/servicios/admin/${id}`);

/** Crea un nuevo servicio en el catálogo. */
export const crearServicioAdmin = (data) =>
  request('POST', '/servicios/admin', data);

/** Edita un servicio del catálogo. */
export const editarServicioAdmin = (id, data) =>
  request('PUT', `/servicios/admin/${id}`, data);

/** Activa o desactiva un servicio. */
export const cambiarEstadoServicioAdmin = (id, estado) =>
  request('PATCH', `/servicios/admin/${id}/estado`, { estado });

// ── CLIENTE ───────────────────────────────────────────────────────────────────

/** Lista todos los servicios disponibles (activos). */
export const getServiciosCliente = () =>
  request('GET', '/servicios');

/** Lista los servicios asociados a una reservación propia. */
export const getServiciosReservacion = (idReservacion) =>
  request('GET', `/servicios/reservacion/${idReservacion}`);

/** Agrega un servicio a una reservación propia. */
export const agregarServicioReservacion = (idReservacion, idServicio, cantidad = 1) =>
  request('POST', `/servicios/reservacion/${idReservacion}`, { idServicio, cantidad });

/** Quita un servicio de una reservación propia. */
export const quitarServicioReservacion = (idReservacion, idReservacionServicio) =>
  request('DELETE', `/servicios/reservacion/${idReservacion}/${idReservacionServicio}`);
