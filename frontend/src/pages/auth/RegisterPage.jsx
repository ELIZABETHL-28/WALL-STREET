import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signUpWithEmail, signInWithGoogle } from '../../services/auth.service';
import '../../styles/auth.css';

function getFriendlyError(msg = '') {
  if (msg.includes('User already registered')) return 'Ya existe una cuenta con este correo.';
  if (msg.includes('Password should be'))      return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('Unable to validate'))      return 'Correo electrónico inválido.';
  return 'No se pudo crear la cuenta. Intenta de nuevo.';
}

export default function RegisterPage() {
  const [nombre, setNombre]       = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [info, setInfo]           = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    // Validaciones frontend
    if (!nombre.trim()) {
      setError('El nombre para mostrar es requerido.');
      return;
    }
    if (!email.trim()) {
      setError('El correo electrónico es requerido.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (!password) {
      setError('La contraseña es requerida.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const data = await signUpWithEmail(email.trim(), password, nombre.trim());

      // Supabase puede requerir confirmación de correo antes de emitir sesión.
      if (!data.session) {
        setInfo('Cuenta creada. Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.');
      } else {
        // Si Supabase no requiere confirmación, la sesión está lista.
        setInfo('Cuenta creada correctamente. Puedes iniciar sesión.');
      }
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
          <h1 className="auth-visual-title">Únete a<br />la experiencia<br />premium.</h1>
          <p className="auth-visual-subtitle">
            Crea tu cuenta y accede a reservaciones, actividades exclusivas y mucho más.
          </p>
        </div>
      </div>

      {/* Panel de formulario */}
      <div className="auth-form-panel">
        <Link to="/" className="auth-logo-lockup brand-link">
          <span className="auth-logo-mark" aria-hidden="true">W</span>
          <p className="auth-logo">Hotel Wall Street</p>
        </Link>

        <h2 className="auth-title">Crear cuenta</h2>
        <p className="auth-subtitle">Completa los datos para registrarte</p>

        {error && <div className="auth-error">{error}</div>}
        {info  && <div className="auth-info">{info}</div>}

        <form onSubmit={handleRegister} noValidate>
          <div className="auth-field">
            <label htmlFor="nombre">Nombre para mostrar</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
              disabled={loading}
            />
          </div>

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
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
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

          <div className="auth-field">
            <label htmlFor="confirm">Confirmar contraseña</label>
            <div className="auth-field-input-wrap">
              <input
                id="confirm"
                type={showConf ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConf((v) => !v)}
                aria-label={showConf ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConf ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="auth-divider">o continúa con</div>

        <button className="btn-google" onClick={handleGoogle} disabled={loading}>
          <span>G</span>
          Continuar con Google
        </button>

        <p className="auth-footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
