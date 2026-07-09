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

export const getCodigoReservacion = (id) => request('GET', `/codigos-acceso/reservacion/${id}`);
export const getCodigoPase = (id) => request('GET', `/codigos-acceso/pase/${id}`);
export const validarCodigoAcceso = (codigo) => request('POST', '/codigos-acceso/admin/validar', { codigo });
export const utilizarCodigoAcceso = (id) => request('PATCH', `/codigos-acceso/admin/${id}/utilizar`);
