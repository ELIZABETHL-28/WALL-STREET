import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../services/supabase';
import '../styles/auth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

export default function ProfilePage() {
  const { systemUser, logout } = useAuth();
  const navigate = useNavigate();

  const [perfil, setPerfil]           = useState(null);
  const [perfilComplete, setComplete] = useState(false);
  const [loadingPerfil, setLoading]   = useState(true);
  const [editMode, setEditMode]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  const [form, setForm] = useState({
    nombres: '', apellidos: '', telefono: '',
    tipoDocumento: 'DPI', numeroDocumento: '',
    fechaNacimiento: '', nacionalidad: '', direccion: '',
  });

  useEffect(() => {
    const fetchPerfil = async () => {
      setLoading(true);
      try {
        const token = await getAccessToken();
        if (!token) return;

        const res = await fetch(`${API_URL}/clientes/perfil`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json();

        if (body.profileComplete && body.perfil) {
          setPerfil(body.perfil);
          setComplete(true);
          setForm({
            nombres:         body.perfil.nombres         || '',
            apellidos:       body.perfil.apellidos       || '',
            telefono:        body.perfil.telefono        || '',
            tipoDocumento:   body.perfil.tipo_documento  || 'DPI',
            numeroDocumento: body.perfil.numero_documento|| '',
            fechaNacimiento: body.perfil.fecha_nacimiento|| '',
            nacionalidad:    body.perfil.nacionalidad    || '',
            direccion:       body.perfil.direccion       || '',
          });
        } else {
          setComplete(false);
          setEditMode(true);
        }
      } catch {
        setError('No se pudo cargar el perfil.');
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.nombres.trim() || !form.apellidos.trim()) {
      setError('Nombres y apellidos son requeridos.');
      return;
    }

    setSaving(true);
    try {
      const token = await getAccessToken();
      const method = perfilComplete ? 'PUT' : 'POST';

      const res = await fetch(`${API_URL}/clientes/perfil`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Error al guardar.');

      setPerfil(body.perfil);
      setComplete(true);
      setEditMode(false);
      setSuccess('Perfil guardado correctamente.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (loadingPerfil) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <p className="profile-brand">Hotel Wall Street</p>
          <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>

        {/* Información de la cuenta */}
        <div className="profile-card">
          <h2>Cuenta</h2>
          <div className="profile-info-row">
            <span className="profile-info-label">Correo</span>
            <span className="profile-info-value">{systemUser?.correo}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Nombre</span>
            <span className="profile-info-value">{systemUser?.nombreMostrar || '—'}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Rol</span>
            <span className={`role-badge ${systemUser?.rol === 'ADMIN' ? 'admin' : 'cliente'}`}>
              {systemUser?.rol}
            </span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Estado</span>
            <span className="profile-info-value">{systemUser?.estado}</span>
          </div>

          {systemUser?.rol === 'CLIENTE' && (
            <div style={{ marginTop: '1rem' }}>
              <button
                className="btn-primary"
                onClick={() => navigate('/reservas')}
                style={{ fontSize: '0.85rem' }}
              >
                🛏️ Mis Reservaciones
              </button>
            </div>
          )}
        </div>

        {/* Perfil personal */}
        <div className="profile-card">
          <h2>
            Perfil personal
            {perfilComplete && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#c9a84c', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Editar
              </button>
            )}
          </h2>

          {error   && <div className="auth-error">{error}</div>}
          {success && <div className="auth-info">{success}</div>}

          {!editMode && perfilComplete && perfil ? (
            <>
              {[
                ['Nombres',           perfil.nombres],
                ['Apellidos',         perfil.apellidos],
                ['Teléfono',          perfil.telefono        || '—'],
                ['Tipo de documento', perfil.tipo_documento  || '—'],
                ['Número documento',  perfil.numero_documento|| '—'],
                ['Fecha nacimiento',  perfil.fecha_nacimiento|| '—'],
                ['Nacionalidad',      perfil.nacionalidad    || '—'],
                ['Dirección',         perfil.direccion       || '—'],
              ].map(([label, value]) => (
                <div className="profile-info-row" key={label}>
                  <span className="profile-info-label">{label}</span>
                  <span className="profile-info-value">{value}</span>
                </div>
              ))}
            </>
          ) : (
            <form onSubmit={handleSave} noValidate>
              {!perfilComplete && (
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
                  Completa tu perfil para acceder a todas las funciones.
                </p>
              )}

              {[
                { name: 'nombres',         label: 'Nombres',           type: 'text'  },
                { name: 'apellidos',       label: 'Apellidos',         type: 'text'  },
                { name: 'telefono',        label: 'Teléfono',          type: 'tel'   },
                { name: 'numeroDocumento', label: 'Número de documento',type: 'text' },
                { name: 'fechaNacimiento', label: 'Fecha de nacimiento',type: 'date' },
                { name: 'nacionalidad',    label: 'Nacionalidad',      type: 'text'  },
                { name: 'direccion',       label: 'Dirección',         type: 'text'  },
              ].map(({ name, label, type }) => (
                <div className="auth-field" key={name}>
                  <label htmlFor={name}>{label}</label>
                  <input
                    id={name}
                    name={name}
                    type={type}
                    value={form[name]}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>
              ))}

              <div className="auth-field">
                <label htmlFor="tipoDocumento">Tipo de documento</label>
                <select
                  id="tipoDocumento"
                  name="tipoDocumento"
                  value={form.tipoDocumento}
                  onChange={handleChange}
                  disabled={saving}
                  style={{ width: '100%', padding: '0.75rem 1rem', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#f0f0f0', fontSize: '0.95rem' }}
                >
                  <option value="DPI">DPI</option>
                  <option value="PASAPORTE">Pasaporte</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar perfil'}
                </button>
                {perfilComplete && (
                  <button
                    type="button"
                    className="btn-logout"
                    onClick={() => setEditMode(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
