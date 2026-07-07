import supabase from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Registrar usuario con correo y contraseña.
 * El nombre para mostrar se envía como metadata — no determina el rol.
 */
export async function signUpWithEmail(email, password, nombreMostrar) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: nombreMostrar },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Iniciar sesión con correo y contraseña.
 */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Iniciar sesión con Google OAuth.
 * La URL de callback procesa la sesión y redirige según el rol.
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Cerrar sesión.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Obtener la sesión Supabase actual.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Sincronizar el usuario Supabase autenticado con MySQL.
 * Envía el access_token al backend — nunca la contraseña.
 */
export async function syncUser(accessToken) {
  const res = await fetch(`${API_URL}/auth/sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || 'Error al sincronizar el usuario.');
  }

  return body.user;
}

/**
 * Obtener el usuario del sistema (MySQL) con su rol.
 * El rol proviene del backend — nunca de localStorage.
 */
export async function getCurrentSystemUser(accessToken) {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || 'No se pudo obtener el usuario.');
  }

  return body.user;
}
