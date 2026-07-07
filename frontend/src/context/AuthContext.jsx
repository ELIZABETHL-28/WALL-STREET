import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import supabase from '../services/supabase';
import { syncUser, getCurrentSystemUser, signOut as authSignOut } from '../services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession]         = useState(undefined); // undefined = cargando
  const [systemUser, setSystemUser]   = useState(null);
  const [loading, setLoading]         = useState(true);

  /**
   * Carga el usuario del sistema desde el backend.
   * El rol se obtiene desde MySQL — nunca desde localStorage.
   */
  const loadSystemUser = useCallback(async (accessToken) => {
    try {
      const user = await getCurrentSystemUser(accessToken);
      setSystemUser(user);
    } catch {
      setSystemUser(null);
    }
  }, []);

  /**
   * Sincroniza Supabase con MySQL y luego carga el usuario del sistema.
   * Se ejecuta después de detectar una sesión activa.
   */
  const syncAndLoad = useCallback(async (accessToken) => {
    try {
      await syncUser(accessToken);
      await loadSystemUser(accessToken);
    } catch {
      setSystemUser(null);
    }
  }, [loadSystemUser]);

  // Inicializar: obtener sesión actual y escuchar cambios
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();

      if (!isMounted) return;

      setSession(initialSession);

      if (initialSession?.access_token) {
        await syncAndLoad(initialSession.access_token);
      }

      setLoading(false);
    };

    init();

    // Listener de cambios de sesión (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        setSession(newSession);

        if (event === 'SIGNED_IN' && newSession?.access_token) {
          await syncAndLoad(newSession.access_token);
        }

        if (event === 'SIGNED_OUT') {
          setSystemUser(null);
        }

        if (event === 'TOKEN_REFRESHED' && newSession?.access_token) {
          await loadSystemUser(newSession.access_token);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncAndLoad, loadSystemUser]);

  const logout = async () => {
    await authSignOut();
    setSession(null);
    setSystemUser(null);
  };

  const value = {
    session,
    systemUser,
    loading,
    logout,
    isAuthenticated: !!session,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
