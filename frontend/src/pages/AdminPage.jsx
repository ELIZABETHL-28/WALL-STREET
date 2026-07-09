import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HabitacionesSection from './admin/HabitacionesSection';
import ReservacionesSection from './admin/ReservacionesSection';
import ServiciosSection from './admin/ServiciosSection';
import ActividadesSection from './admin/ActividadesSection';
import PasesSection from './admin/PasesSection';
import CodigosAccesoSection from './admin/CodigosAccesoSection';
import ComentariosSection from './admin/ComentariosSection';
import AuditoriaSection from './admin/AuditoriaSection';
import '../styles/admin.css';
import HotelIcon from '../components/HotelIcon';

const SECCIONES = [
  { id: 'habitaciones', label: 'Habitaciones', icon: 'room' },
  { id: 'reservaciones', label: 'Reservaciones', icon: 'reservations' },
  { id: 'servicios', label: 'Servicios', icon: 'services' },
  { id: 'actividades', label: 'Actividades', icon: 'activities' },
  { id: 'pases', label: 'Pases de Día', icon: 'pass' },
  { id: 'codigos', label: 'Códigos de acceso', icon: 'qr' },
  { id: 'comentarios', label: 'Calificaciones', icon: 'comments' },
  { id: 'auditoria', label: 'Auditoría', icon: 'audit' },
];

export default function AdminPage() {
  const { systemUser, logout } = useAuth();
  const navigate = useNavigate();
  const [seccion, setSeccion] = useState('habitaciones');
  const [menuOpen, setMenuOpen] = useState(false);

  const selectSection = (id) => { setSeccion(id); setMenuOpen(false); };
  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };

  return (
    <div className="admin-layout">
      <button className="mobile-menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menú"><HotelIcon name="menu" /></button>
      {menuOpen && <button className="sidebar-backdrop" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />}
      <aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`}>
        <button className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"><HotelIcon name="close" /></button>
        <Link to="/" className="admin-brand-lockup brand-link">
          <div className="admin-brand-mark" aria-hidden="true">W</div>
          <div><p className="admin-sidebar-brand">Hotel Wall Street</p><p className="admin-sidebar-sub">Panel Admin</p></div>
        </Link>
        <nav><ul className="admin-nav">{SECCIONES.map((s) => <li key={s.id}><button className={`admin-nav-item ${seccion === s.id ? 'active' : ''}`} onClick={() => selectSection(s.id)}><HotelIcon name={s.icon} /><span>{s.label}</span></button></li>)}</ul></nav>
        <div className="admin-sidebar-footer"><p className="admin-sidebar-user">{systemUser?.correo}</p><button className="btn-logout" style={{ width: '100%' }} onClick={handleLogout}><HotelIcon name="logout" /><span>Cerrar sesión</span></button></div>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar"><span className="admin-topbar-title">{SECCIONES.find((s) => s.id === seccion)?.label || 'Panel'}</span><div><span>{systemUser?.correo}</span><span className="topbar-role">{systemUser?.rol}</span></div></header>
        <main className="admin-main">
          {seccion === 'habitaciones' && <HabitacionesSection />}
          {seccion === 'reservaciones' && <ReservacionesSection />}
          {seccion === 'servicios' && <ServiciosSection />}
          {seccion === 'actividades' && <ActividadesSection />}
          {seccion === 'pases' && <PasesSection />}
          {seccion === 'codigos' && <CodigosAccesoSection />}
          {seccion === 'comentarios' && <ComentariosSection />}
          {seccion === 'auditoria' && <AuditoriaSection />}
        </main>
      </div>
    </div>
  );
}
