import supabase from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function authFetch(path, options = {}) {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message || 'No se pudo obtener la sesión.');
  }

  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Sesión no válida. Inicia sesión nuevamente.');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({
    success: false,
    error: 'Respuesta inválida del servidor.',
  }));

  if (!response.ok) {
    throw new Error(payload.error || 'Error al procesar la solicitud.');
  }

  return payload;
}

// ADMIN
export const getActividadesAdmin = () =>
  authFetch('/actividades/admin');

export const crearActividad = (body) =>
  authFetch('/actividades/admin', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const editarActividad = (id, body) =>
  authFetch(`/actividades/admin/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

export const cambiarEstadoActividad = (id, estado) =>
  authFetch(`/actividades/admin/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });

// CLIENTE
export const getActividadesCliente = () =>
  authFetch('/actividades');

export const inscribirseActividad = (id, cantidadPersonas = 1) =>
  authFetch(`/actividades/${id}/inscribirse`, {
    method: 'POST',
    body: JSON.stringify({ cantidadPersonas }),
  });

export const getMisInscripciones = () =>
  authFetch('/actividades/mis-inscripciones');

export const cancelarInscripcion = (idInscripcion) =>
  authFetch(`/actividades/inscripcion/${idInscripcion}/cancelar`, {
    method: 'PATCH',
  });
