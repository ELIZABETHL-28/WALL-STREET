import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmail, signInWithGoogle, syncUser, getCurrentSystemUser } from '../../services/auth.service';
import supabase from '../../services/supabase';
import '../../styles/auth.css';

// Mensajes amigables para errores comunes de Supabase
function getFriendlyError(msg = '') {
  if (msg.includes('Invalid login credentials'))  return 'Correo o contraseña incorrectos.';
  if (msg.includes('Email not confirmed'))        return 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.';
  if (msg.includes('Too many requests'))          return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
  return 'No se pudo iniciar sesión. Verifica tus datos.';
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const data = await signInWithEmail(email.trim(), password);
      const accessToken = data.session?.access_token;

      if (!accessToken) {
        setError('No se obtuvo sesión. Verifica tu correo si necesitas confirmación.');
        return;
      }

      await syncUser(accessToken);
      const systemUser = await getCurrentSystemUser(accessToken);

      navigate(systemUser.rol === 'ADMIN' ? '/admin' : '/perfil', { replace: true });
    } catch (err) {
      setError(getFriendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithGoogle();
      // El flujo continúa en /auth/callback después del redirect de Google.
    } catch {
      setError('No se pudo iniciar el proceso con Google. Intenta de nuevo.');
    }
  };

  return (
    <div className="auth-layout">
      {/* Panel visual */}
      <div className="auth-visual">
        <div className="auth-visual-bg" />
        <div className="auth-visual-overlay" />
        <div className="auth-visual-content">
          <p className="auth-visual-brand">Hotel Wall Street</p>
          <h1 className="auth-visual-title">Experiencia<br />ejecutiva<br />sin igual.</h1>
          <p className="auth-visual-subtitle">
            Gestiona tu estadía, reservaciones y servicios desde un solo lugar.
          </p>
        </div>
      </div>

      {/* Panel de formulario */}
      <div className="auth-form-panel">
        <p className="auth-logo">Hotel Wall Street</p>

        <h2 className="auth-title">Iniciar sesión</h2>
        <p className="auth-subtitle">Accede a tu cuenta</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleLogin} noValidate>
          <div className="auth-field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Contraseña</label>
            <div className="auth-field-input-wrap">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="auth-divider">o continúa con</div>

        <button className="btn-google" onClick={handleGoogle} disabled={loading}>
          <span>G</span>
          Continuar con Google
        </button>

        <p className="auth-footer">
          ¿No tienes cuenta?{' '}
          <Link to="/registro">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
