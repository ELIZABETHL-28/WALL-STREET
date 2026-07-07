import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 * ─────────────────────
 * Protege rutas que requieren autenticación y/o un rol específico.
 *
 * Esta protección es de experiencia de usuario únicamente.
 * El backend es la autoridad real para roles y permisos.
 *
 * Comportamiento de redirección:
 *   - Sin sesión                          → /login
 *   - ADMIN intenta acceder a ruta CLIENTE → /admin
 *   - CLIENTE intenta acceder a ruta ADMIN → /perfil
 *
 * Props:
 *   requiredRole  string opcional — 'ADMIN' | 'CLIENTE'
 *   redirectTo    string — ruta de redirección cuando no hay sesión (default: /login)
 */
export default function ProtectedRoute({ children, requiredRole, redirectTo = '/login' }) {
  const { session, systemUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Verificando sesión...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRole && systemUser?.rol !== requiredRole) {
    // Redirigir según el rol real del usuario:
    // ADMIN → su panel, CLIENTE (u otro) → perfil.
    // El rol proviene de systemUser obtenido desde el backend, nunca de localStorage.
    const fallback = systemUser?.rol === 'ADMIN' ? '/admin' : '/perfil';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
