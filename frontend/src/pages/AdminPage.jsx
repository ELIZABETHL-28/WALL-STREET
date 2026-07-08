import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HabitacionesSection   from './admin/HabitacionesSection';
import ReservacionesSection  from './admin/ReservacionesSection';
import ServiciosSection      from './admin/ServiciosSection';
import ActividadesSection     from './admin/ActividadesSection';
import '../styles/admin.css';

const SECCIONES = [
  { id: 'habitaciones',  label: 'Habitaciones',  icono: '🏨' },
  { id: 'reservaciones', label: 'Reservaciones', icono: '📋' },
  { id: 'servicios',     label: 'Servicios',     icono: '🛎️' },
  { id: 'actividades',   label: 'Actividades',   icono: '🎟️' },
];

export default function AdminPage() {
  const { systemUser, logout } = useAuth();
  const navigate               = useNavigate();
  const [seccion, setSeccion]  = useState('habitaciones');

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-layout">
      {/* ── Barra lateral ─────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <p className="admin-sidebar-brand">Hotel Wall Street</p>
        <p className="admin-sidebar-sub">Panel Admin</p>
 
        <nav>
          <ul className="admin-nav">
            {SECCIONES.map(s => (
              <li key={s.id}>
                <button
                  className={`admin-nav-item ${seccion === s.id ? 'active' : ''}`}
                  onClick={() => setSeccion(s.id)}
                >
                  <span className="admin-nav-icon">{s.icono}</span>
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <p className="admin-sidebar-user">{systemUser?.correo}</p>
          <button className="btn-logout" style={{ width: '100%' }} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Contenido ─────────────────────────────────────────── */}
      <div className="admin-content">
        <header className="admin-topbar">
          <span className="admin-topbar-title">
            {SECCIONES.find(s => s.id === seccion)?.label || 'Panel'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
              {systemUser?.correo}
            </span>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em',
              color: '#c9a84c', textTransform: 'uppercase',
            }}>
              {systemUser?.rol}
            </span>
          </div>
        </header>

        <main className="admin-main">
          {seccion === 'habitaciones'  && <HabitacionesSection />}
          {seccion === 'reservaciones' && <ReservacionesSection />}
          {seccion === 'servicios'     && <ServiciosSection />}
          {seccion === 'actividades'   && <ActividadesSection />}
        </main>
      </div>
    </div>
  );
}
