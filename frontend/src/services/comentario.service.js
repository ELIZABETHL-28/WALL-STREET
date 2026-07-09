import supabase from './supabase';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(method, path, body) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token || '';
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Error en la solicitud.');
  return json;
}

export const crearComentario = (data) => request('POST', '/comentarios', data);
export const getComentarioReservacion = (id) => request('GET', `/comentarios/mios/reservacion/${id}`);
export const getComentariosAdmin = (estado = '') => request('GET', `/comentarios/admin${estado ? `?estado=${estado}` : ''}`);
export const cambiarEstadoComentario = (id, estado) => request('PATCH', `/comentarios/admin/${id}/estado`, { estado });
