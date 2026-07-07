import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function AdminPage() {
  const { systemUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-page">
      <p className="auth-logo" style={{ marginBottom: '0.5rem' }}>Hotel Wall Street</p>
      <div className="admin-badge">Panel Administrativo</div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.75rem' }}>
        Bienvenido
      </h1>

      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
        {systemUser?.correo}
      </p>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
        Rol: <span style={{ color: '#c9a84c' }}>{systemUser?.rol}</span>
      </p>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginBottom: '2rem' }}>
        Estado: {systemUser?.estado}
      </p>

      <p style={{
        padding: '0.75rem 1.5rem',
        background: 'rgba(201,168,76,0.08)',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: '8px',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '0.875rem',
        marginBottom: '2rem',
      }}>
        Acceso administrativo autorizado.
      </p>

      <button className="btn-logout" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </div>
  );
}
