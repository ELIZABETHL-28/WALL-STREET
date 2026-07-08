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
export const getTiposPaseAdmin = () =>
    authFetch('/pases/admin/tipos');

export const crearTipoPase = (body) =>
    authFetch('/pases/admin/tipos', {
        method: 'POST',
        body: JSON.stringify(body),
    });

export const editarTipoPase = (id, body) =>
    authFetch(`/pases/admin/tipos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });

export const cambiarEstadoTipoPase = (id, estado) =>
    authFetch(`/pases/admin/tipos/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
    });

export const getPasesAdquiridosAdmin = () =>
    authFetch('/pases/admin/adquiridos');

// CLIENTE
export const getTiposPaseCliente = () =>
    authFetch('/pases/tipos');

export const adquirirPase = (body) =>
    authFetch('/pases/adquirir', {
        method: 'POST',
        body: JSON.stringify(body),
    });

export const getMisPases = () =>
    authFetch('/pases/mis-pases');

export const getMiPase = (id) =>
    authFetch(`/pases/mis-pases/${id}`);
