/**
 * habitacion.service.js — frontend
 * Todas las llamadas incluyen Bearer Token. El rol lo valida el backend.
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

// ── Tipos de habitación ───────────────────────────────────────────────────────
export const getTiposHabitacion = ()           => request('GET', '/habitaciones/tipos');
export const crearTipoHabitacion = (data)      => request('POST', '/habitaciones/tipos', data);
export const editarTipoHabitacion = (id, data) => request('PUT', `/habitaciones/tipos/${id}`, data);

// ── Tipos de cama ─────────────────────────────────────────────────────────────
export const getTiposCama = () => request('GET', '/habitaciones/tipos-cama');

// ── Habitaciones ──────────────────────────────────────────────────────────────
export const getHabitaciones    = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request('GET', `/habitaciones${qs ? '?' + qs : ''}`);
};
export const getHabitacion      = (id)        => request('GET', `/habitaciones/${id}`);
export const crearHabitacion    = (data)      => request('POST', '/habitaciones', data);
export const editarHabitacion   = (id, data)  => request('PUT', `/habitaciones/${id}`, data);
export const cambiarEstado      = (id, estado)=> request('PATCH', `/habitaciones/${id}/estado`, { estado });

// ── Camas ─────────────────────────────────────────────────────────────────────
export const asociarCama        = (idHab, data)         => request('POST',   `/habitaciones/${idHab}/camas`, data);
export const actualizarCama     = (idHab, idCama, data) => request('PUT',    `/habitaciones/${idHab}/camas/${idCama}`, data);
export const eliminarCama       = (idHab, idCama)       => request('DELETE', `/habitaciones/${idHab}/camas/${idCama}`);

// ── Imágenes ──────────────────────────────────────────────────────────────────
export const getImagenes        = (idHab)               => request('GET',    `/habitaciones/${idHab}/imagenes`);
export const agregarImagen      = (idHab, data)         => request('POST',   `/habitaciones/${idHab}/imagenes`, data);
export const eliminarImagen     = (idHab, idImg)        => request('DELETE', `/habitaciones/${idHab}/imagenes/${idImg}`);
