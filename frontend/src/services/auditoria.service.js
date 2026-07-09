import supabase from './supabase';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function getAuditoria(filtros = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token || '';
  const qs = new URLSearchParams(Object.entries(filtros).filter(([, value]) => value)).toString();
  const response = await fetch(`${API}/auditoria/admin${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'No se pudo cargar la auditoría.');
  return json;
}
