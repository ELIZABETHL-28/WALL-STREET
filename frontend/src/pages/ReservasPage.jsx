/**
 * ReservasPage.jsx
 * Módulo de Reservaciones para CLIENTE.
 * Navegación interna: Mi perfil | Reservar habitación | Mis reservaciones
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../services/supabase';
import {
  consultarDisponibilidad,
  crearReservacion,
  getMisReservaciones,
  getMiReservacion,
  cancelarReservacion,
} from '../services/reservacion.service';
import {
  getServiciosCliente,
  getServiciosReservacion,
  agregarServicioReservacion,
  quitarServicioReservacion,
} from '../services/servicio.service';
import {
  getActividadesCliente,
  inscribirseActividad,
  getMisInscripciones,
  cancelarInscripcion,
} from '../services/actividad.service';
import '../styles/auth.css';
import '../styles/admin.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

function hoy() {
  return new Date().toISOString().split('T')[0];
}

function manana() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function formatFecha(iso) {
  if (!iso) return '—';
  return iso.split('T')[0];
}

function calcularNoches(entrada, salida) {
  if (!entrada || !salida) return 0;
  const ms = new Date(salida) - new Date(entrada);
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function formatMoneda(val) {
  if (val === null || val === undefined) return 'Q 0.00';
  return `Q ${parseFloat(val).toFixed(2)}`;
}

// ── Badges de estado ──────────────────────────────────────────────────────────

const ESTADO_COLORS = {
  PENDIENTE:  { bg: 'rgba(201,168,76,.12)',  color: '#c9a84c',  border: 'rgba(201,168,76,.3)'  },
  CONFIRMADA: { bg: 'rgba(80,200,120,.12)',   color: '#6be0a0',  border: 'rgba(80,200,120,.25)' },
  CHECK_IN:   { bg: 'rgba(100,180,255,.12)',  color: '#80c0ff',  border: 'rgba(100,180,255,.25)'},
  CHECK_OUT:  { bg: 'rgba(200,160,255,.12)',  color: '#c8a0ff',  border: 'rgba(200,160,255,.25)'},
  CANCELADA:  { bg: 'rgba(255,80,80,.12)',    color: '#f08080',  border: 'rgba(255,80,80,.25)'  },
};

function EstadoBadge({ estado }) {
  const s = ESTADO_COLORS[estado] || {};
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.18rem 0.65rem',
      borderRadius: 20,
      fontSize: '0.72rem',
      fontWeight: 700,
      letterSpacing: '0.06em',
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {estado}
    </span>
  );
}

// ── Sección: Reservar habitación ──────────────────────────────────────────────

function ReservarSection() {
  const [step, setStep] = useState('buscar'); // buscar | resultado | confirmado
  const [form, setForm] = useState({
    fechaEntrada:       hoy(),
    fechaSalida:        manana(),
    cantidadVisitantes: 1,
  });
  const [busqueda, setBusqueda]         = useState(null);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [loadingConf, setLoadingConf]   = useState(false);
  const [reservaCreada, setReservaCreada] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBuscar = async (e) => {
    e.preventDefault();
    setError('');
    setBusqueda(null);

    const visitantes = parseInt(form.cantidadVisitantes, 10);
    if (!visitantes || visitantes < 1) {
      setError('Cantidad de visitantes debe ser >= 1.');
      return;
    }
    if (new Date(form.fechaSalida) <= new Date(form.fechaEntrada)) {
      setError('La fecha de salida debe ser posterior a la de entrada.');
      return;
    }

    setLoadingBusca(true);
    try {
      const data = await consultarDisponibilidad(
        form.fechaEntrada,
        form.fechaSalida,
        visitantes
      );
      setBusqueda(data);
      setStep('resultado');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingBusca(false);
    }
  };

  const handleConfirmar = async () => {
    if (!busqueda?.recomendada) return;
    setError('');
    setLoadingConf(true);
    try {
      const data = await crearReservacion({
        fechaEntrada:    form.fechaEntrada,
        fechaSalida:     form.fechaSalida,
        cantidadAdultos: parseInt(form.cantidadVisitantes, 10),
        cantidadNinos:   0,
      });
      setReservaCreada(data.reservacion);
      setStep('confirmado');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingConf(false);
    }
  };

  const handleNueva = () => {
    setStep('buscar');
    setBusqueda(null);
    setReservaCreada(null);
    setError('');
    setForm({ fechaEntrada: hoy(), fechaSalida: manana(), cantidadVisitantes: 1 });
  };

  // ── Paso: Buscar ─────────────────────────────────────────────────────────
  if (step === 'buscar') {
    return (
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0f0', marginBottom: '1.5rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Reservar Habitación
        </h2>

        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleBuscar} style={{ maxWidth: 480 }}>
          <div className="form-field">
            <label htmlFor="fechaEntrada">Fecha de entrada</label>
            <input
              id="fechaEntrada"
              name="fechaEntrada"
              type="date"
              value={form.fechaEntrada}
              min={hoy()}
              onChange={handleChange}
              disabled={loadingBusca}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="fechaSalida">Fecha de salida</label>
            <input
              id="fechaSalida"
              name="fechaSalida"
              type="date"
              value={form.fechaSalida}
              min={form.fechaEntrada || hoy()}
              onChange={handleChange}
              disabled={loadingBusca}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="cantidadVisitantes">Cantidad de visitantes</label>
            <input
              id="cantidadVisitantes"
              name="cantidadVisitantes"
              type="number"
              min="1"
              max="20"
              value={form.cantidadVisitantes}
              onChange={handleChange}
              disabled={loadingBusca}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-new"
            disabled={loadingBusca}
            style={{ marginTop: '0.5rem' }}
          >
            {loadingBusca ? 'Consultando...' : 'Consultar disponibilidad'}
          </button>
        </form>
      </div>
    );
  }

  // ── Paso: Resultado ──────────────────────────────────────────────────────
  if (step === 'resultado') {
    const rec = busqueda?.recomendada;
    const noches = busqueda?.noches || 0;

    return (
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0f0', marginBottom: '1.5rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Habitación Recomendada
        </h2>

        {error && <div className="admin-error">{error}</div>}

        {!rec ? (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', padding: '2rem 0' }}>
            No hay habitaciones disponibles para los criterios seleccionados.
            <br />
            <button
              className="btn-cancel"
              style={{ marginTop: '1rem' }}
              onClick={handleNueva}
            >
              Volver a buscar
            </button>
          </div>
        ) : (
          <>
            {/* Tarjeta de la habitación recomendada */}
            <div style={{
              background: '#111',
              border: '1px solid #1e1e1e',
              borderRadius: 12,
              padding: '1.5rem',
              maxWidth: 540,
              marginBottom: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: '#c9a84c', textTransform: 'uppercase' }}>
                  Habitación Asignada
                </span>
                <span className={`estado-badge estado-${rec.estado}`}>{rec.estado}</span>
              </div>

              <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f0f0f0', marginBottom: '0.25rem' }}>
                Hab. {rec.numero_habitacion}{rec.nombre ? ` — ${rec.nombre}` : ''}
              </p>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1rem' }}>
                {rec.tipo_nombre} · Piso {rec.piso} · Capacidad {rec.capacidad_maxima} personas
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                {[
                  ['Entrada',      formatFecha(form.fechaEntrada)],
                  ['Salida',       formatFecha(form.fechaSalida)],
                  ['Noches',       noches],
                  ['Visitantes',   busqueda.cantidadVisitantes],
                  ['Precio/noche', formatMoneda(rec.precio_noche)],
                  ['Total estimado', formatMoneda(parseFloat(rec.precio_noche) * noches)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.2rem' }}>{label}</p>
                    <p style={{ color: '#f0f0f0', fontWeight: 600 }}>{value}</p>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', marginTop: '1rem' }}>
                * El total se calcula por número de noches. No incluye servicios adicionales.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                className="btn-save"
                onClick={handleConfirmar}
                disabled={loadingConf}
              >
                {loadingConf ? 'Confirmando...' : 'Confirmar reservación'}
              </button>
              <button className="btn-cancel" onClick={handleNueva} disabled={loadingConf}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Paso: Confirmado ─────────────────────────────────────────────────────
  if (step === 'confirmado' && reservaCreada) {
    const hab    = reservaCreada.habitaciones?.[0];
    const noches = hab?.cantidad_noches || calcularNoches(reservaCreada.fecha_entrada, reservaCreada.fecha_salida);

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#6be0a0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Reservación Creada
          </h2>
        </div>

        <div style={{
          background: '#111',
          border: '1px solid #1e1e1e',
          borderRadius: 12,
          padding: '1.5rem',
          maxWidth: 540,
          marginBottom: '1.25rem',
        }}>
          {[
            ['ID Reservación',       `#${reservaCreada.id_reservacion}`],
            ['Código',               reservaCreada.codigo_reservacion],
            ['Estado',               null],
            ['Habitación',           hab ? `${hab.numero_habitacion}${hab.habitacion_nombre ? ` — ${hab.habitacion_nombre}` : ''}` : '—'],
            ['Tipo',                 hab?.tipo_nombre || '—'],
            ['Fecha entrada',        formatFecha(reservaCreada.fecha_entrada)],
            ['Fecha salida',         formatFecha(reservaCreada.fecha_salida)],
            ['Noches',               noches],
            ['Precio / noche',       formatMoneda(hab?.precio_noche_aplicado)],
            ['Total estimado',       formatMoneda(hab ? parseFloat(hab.precio_noche_aplicado) * noches : reservaCreada.total)],
          ].map(([label, value]) => (
            <div key={label} className="profile-info-row" style={{ borderBottom: '1px solid #161616', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>{label}</span>
              <span style={{ fontWeight: 600, color: '#f0f0f0' }}>
                {label === 'Estado' ? <EstadoBadge estado={reservaCreada.estado} /> : value}
              </span>
            </div>
          ))}
        </div>

        <button className="btn-new" onClick={handleNueva}>
          Nueva reservación
        </button>
      </div>
    );
  }

  return null;
}

// ── Sección: Mis Reservaciones ────────────────────────────────────────────────

function MisReservacionesSection() {
  const [reservaciones, setReservaciones] = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [detalle, setDetalle]             = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [cancelando, setCancelando]       = useState(false);
  const [msgCancelada, setMsgCancelada]   = useState('');

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMisReservaciones();
      setReservaciones(data.reservaciones);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar
  useState(() => { cargar(); }, []);
  // Equivalente funcional para efecto inicial:
  if (reservaciones === null && !loading && !error) {
    cargar();
  }

  const verDetalle = async (id) => {
    setLoadingDetalle(true);
    setMsgCancelada('');
    try {
      const data = await getMiReservacion(id);
      setDetalle(data.reservacion);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Confirmas que deseas cancelar esta reservación?')) return;
    setCancelando(true);
    setMsgCancelada('');
    try {
      const data = await cancelarReservacion(id);
      setMsgCancelada('Reservación cancelada.');
      setDetalle(data.reservacion);
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelando(false);
    }
  };

  if (loading) return <p className="admin-loading">Cargando reservaciones...</p>;
  if (error)   return <div className="admin-error">{error}</div>;

  if (detalle) {
    const hab    = detalle.habitaciones?.[0];
    const noches = hab?.cantidad_noches || calcularNoches(detalle.fecha_entrada, detalle.fecha_salida);
    const puedeCancel = ['PENDIENTE', 'CONFIRMADA'].includes(detalle.estado);

    return (
      <div>
        <button className="btn-cancel" style={{ marginBottom: '1.25rem' }} onClick={() => setDetalle(null)}>
          ← Volver a mis reservaciones
        </button>

        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0f0', marginBottom: '1.5rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Detalle de Reservación #{detalle.id_reservacion}
        </h2>

        {msgCancelada && <div className="admin-success">{msgCancelada}</div>}
        {error && <div className="admin-error">{error}</div>}

        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: '1.5rem', maxWidth: 540, marginBottom: '1.25rem' }}>
          {[
            ['Código',         detalle.codigo_reservacion],
            ['Estado',         null],
            ['Habitación',     hab ? `${hab.numero_habitacion}${hab.habitacion_nombre ? ` — ${hab.habitacion_nombre}` : ''}` : '—'],
            ['Tipo',           hab?.tipo_nombre || '—'],
            ['Fecha entrada',  formatFecha(detalle.fecha_entrada)],
            ['Fecha salida',   formatFecha(detalle.fecha_salida)],
            ['Noches',         noches],
            ['Visitantes',     detalle.cantidad_visitantes],
            ['Precio/noche',   formatMoneda(hab?.precio_noche_aplicado)],
            ['Total',          formatMoneda(detalle.total)],
            ['Creada',         formatFecha(detalle.fecha_creacion)],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #161616', padding: '0.45rem 0', fontSize: '0.85rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
              <span style={{ fontWeight: 600, color: '#f0f0f0' }}>
                {label === 'Estado' ? <EstadoBadge estado={detalle.estado} /> : value}
              </span>
            </div>
          ))}
        </div>

        {detalle.visitantes?.length > 0 && (
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: '1.25rem', maxWidth: 540, marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Visitantes
            </p>
            {detalle.visitantes.map((v) => (
              <div key={v.id_visitante} style={{ fontSize: '0.85rem', borderBottom: '1px solid #161616', padding: '0.4rem 0', color: 'rgba(255,255,255,0.7)' }}>
                {v.es_titular ? '👤 ' : ''}{v.nombres} {v.apellidos} · {v.tipo_documento} {v.numero_documento || ''}
              </div>
            ))}
          </div>
        )}

        {puedeCancel && (
          <button
            className="btn-cancel"
            onClick={() => handleCancelar(detalle.id_reservacion)}
            disabled={cancelando}
            style={{ border: '1px solid rgba(255,80,80,.4)', color: '#f08080' }}
          >
            {cancelando ? 'Cancelando...' : 'Cancelar reservación'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">Mis Reservaciones</h2>
        <button className="btn-icon" onClick={cargar}>↻ Actualizar</button>
      </div>

      {!reservaciones || reservaciones.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem', padding: '2rem 0' }}>
          No tienes reservaciones aún.
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Habitación</th>
                <th>Tipo</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservaciones.map((r) => (
                <tr key={r.id_reservacion}>
                  <td className="muted">#{r.id_reservacion}</td>
                  <td>{r.numero_habitacion || '—'}</td>
                  <td className="muted">{r.tipo_habitacion || '—'}</td>
                  <td className="muted">{formatFecha(r.fecha_entrada)}</td>
                  <td className="muted">{formatFecha(r.fecha_salida)}</td>
                  <td>{formatMoneda(r.total)}</td>
                  <td><EstadoBadge estado={r.estado} /></td>
                  <td>
                    <button
                      className="btn-icon"
                      onClick={() => verDetalle(r.id_reservacion)}
                      disabled={loadingDetalle}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Sección: Servicios Adicionales para Cliente ───────────────────────────────

function ServiciosClienteSection() {
  const [reservaciones, setReservaciones] = useState([]);
  const [selectedResId, setSelectedResId] = useState('');
  const [catalog, setCatalog]             = useState([]);
  const [associated, setAssociated]       = useState([]);
  const [loading, setLoading]             = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');

  const cargarReservaciones = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMisReservaciones();
      // Filtrar reservaciones compatibles (no canceladas ni check-out)
      const compatibles = (res.reservaciones || []).filter(
        r => !['CANCELADA', 'CHECK_OUT'].includes(r.estado)
      );
      setReservaciones(compatibles);
      if (compatibles.length > 0) {
        setSelectedResId(String(compatibles[0].id_reservacion));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarCatalog = async () => {
    try {
      const res = await getServiciosCliente();
      setCatalog(res.servicios || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarReservaciones();
    cargarCatalog();
  }, []);

  const cargarServiciosAsociados = async (resId) => {
    if (!resId) return;
    setLoadingServices(true);
    try {
      const res = await getServiciosReservacion(resId);
      setAssociated(res.servicios || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    if (selectedResId) {
      cargarServiciosAsociados(selectedResId);
    } else {
      setAssociated([]);
    }
  }, [selectedResId]);

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleAgregarServicio = async (idServicio) => {
    if (!selectedResId) return;
    setError('');
    try {
      const res = await agregarServicioReservacion(selectedResId, idServicio, 1);
      setAssociated(res.servicios || []);
      flash('Servicio agregado correctamente a la reservación.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuitarServicio = async (idReservacionServicio) => {
    if (!selectedResId) return;
    if (!window.confirm('¿Confirmas que deseas quitar este servicio de la reservación?')) return;
    setError('');
    try {
      const res = await quitarServicioReservacion(selectedResId, idReservacionServicio);
      setAssociated(res.servicios || []);
      flash('Servicio removido correctamente.');
    } catch (err) {
      setError(err.message);
    }
  };

  // Encontrar detalles de la reservación seleccionada para mostrar su estado
  const currentRes = reservaciones.find(r => String(r.id_reservacion) === selectedResId);

  if (loading) return <p className="admin-loading">Cargando reservaciones...</p>;

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">Servicios Adicionales</h2>
      </div>

      {error   && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      {reservaciones.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', padding: '2rem 0' }}>
          No tienes reservaciones activas compatibles (PENDIENTE, CONFIRMADA o CHECK_IN) para gestionar servicios adicionales.
        </div>
      ) : (
        <div>
          {/* Selector de reservación */}
          <div className="form-field" style={{ maxWidth: '400px', marginBottom: '2rem' }}>
            <label htmlFor="select-reservacion">Selecciona una de tus Reservaciones Activas</label>
            <select
              id="select-reservacion"
              value={selectedResId}
              onChange={e => setSelectedResId(e.target.value)}
              style={{ background: '#111', border: '1px solid #222' }}
            >
              {reservaciones.map(r => (
                <option key={r.id_reservacion} value={r.id_reservacion}>
                  Reservación #{r.id_reservacion} (Hab. {r.numero_habitacion || '—'}) [Entrada: {formatFecha(r.fecha_entrada)}]
                </option>
              ))}
            </select>
            {currentRes && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                Estado de la reservación: <EstadoBadge estado={currentRes.estado} />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            {/* Catálogo de Servicios Disponibles */}
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f0f0', marginBottom: '1rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Catálogo de Servicios Disponibles
              </h3>
              {catalog.length === 0 ? (
                <p className="muted" style={{ fontSize: '0.85rem' }}>No hay servicios adicionales activos en el hotel.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {catalog.map(s => (
                    <div key={s.id_servicio} style={{
                      background: '#111',
                      border: '1px solid #1e1e1e',
                      borderRadius: '8px',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div style={{ flex: 1, paddingRight: '1rem' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f0f0f0', margin: 0 }}>
                          {s.nombre}
                        </p>
                        <p className="muted" style={{ fontSize: '0.78rem', margin: '0.25rem 0 0 0', color: 'rgba(255,255,255,0.45)' }}>
                          {s.descripcion || 'Sin descripción'}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: '#c9a84c', fontWeight: 600, margin: '0.4rem 0 0 0' }}>
                          Q {Number(s.precio).toFixed(2)}
                        </p>
                      </div>
                      <button
                        className="btn-new"
                        onClick={() => handleAgregarServicio(s.id_servicio)}
                        style={{ fontSize: '0.72rem', padding: '0.4rem 0.8rem' }}
                      >
                        + Agregar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Servicios Asociados a la Reservación */}
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f0f0', marginBottom: '1rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Servicios en esta Reservación
              </h3>
              {loadingServices ? (
                <p className="admin-loading" style={{ padding: '1rem' }}>Cargando servicios asociados...</p>
              ) : associated.length === 0 ? (
                <p className="muted" style={{ fontSize: '0.85rem' }}>No has agregado servicios adicionales a esta reservación.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Servicio</th>
                        <th>Cant.</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {associated.map(asoc => (
                        <tr key={asoc.id_reservacion_servicio}>
                          <td style={{ fontWeight: 600 }}>
                            {asoc.servicio_nombre}
                          </td>
                          <td>{asoc.cantidad}</td>
                          <td>Q {Number(asoc.precio_unitario_aplicado).toFixed(2)}</td>
                          <td style={{ fontWeight: 600 }}>Q {Number(asoc.subtotal).toFixed(2)}</td>
                          <td>
                            <button
                              className="btn-icon danger"
                              onClick={() => handleQuitarServicio(asoc.id_reservacion_servicio)}
                              title="Quitar de la reservación"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding: '0.8rem 1rem', background: '#111', borderTop: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                    <span>Total en Servicios:</span>
                    <span style={{ color: '#c9a84c' }}>
                      Q {associated.reduce((sum, asoc) => sum + parseFloat(asoc.subtotal), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}


// ── Sección: Actividades para Cliente ─────────────────────────────────────────

function ActividadesClienteSection() {
  const [actividades, setActividades] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      const [actData, insData] = await Promise.all([
        getActividadesCliente(),
        getMisInscripciones(),
      ]);
      setActividades(actData.actividades || []);
      setInscripciones(insData.inscripciones || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const flash = (mensaje) => {
    setSuccess(mensaje);
    window.setTimeout(() => setSuccess(''), 3000);
  };

  const inscribirse = async (idActividad) => {
    const cantidad = Number(cantidades[idActividad] || 1);
    setProcesando(`act-${idActividad}`);
    setError('');
    try {
      await inscribirseActividad(idActividad, cantidad);
      flash('Inscripción realizada correctamente.');
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(null);
    }
  };

  const cancelar = async (idInscripcion) => {
    if (!window.confirm('¿Cancelar esta inscripción?')) return;
    setProcesando(`ins-${idInscripcion}`);
    setError('');
    try {
      await cancelarInscripcion(idInscripcion);
      flash('Inscripción cancelada.');
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(null);
    }
  };

  const idsInscritos = new Set(
    inscripciones
      .filter((ins) => ins.estado === 'CONFIRMADA')
      .map((ins) => Number(ins.id_actividad))
  );

  if (loading) {
    return <p className="admin-loading">Cargando actividades...</p>;
  }

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">Actividades del Hotel</h2>
        <button className="btn-icon" onClick={cargar}>↻ Actualizar</button>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <h3 style={{
        color: '#f0f0f0',
        fontSize: '.9rem',
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        marginBottom: '1rem',
      }}>
        Disponibles
      </h3>

      {actividades.length === 0 ? (
        <p className="muted">No hay actividades disponibles.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '2.5rem',
        }}>
          {actividades.map((actividad) => {
            const inscritos = Number(actividad.inscritos_actuales || 0);
            const cupo = Number(actividad.cupo_maximo || 0);
            const disponible = Math.max(0, cupo - inscritos);
            const yaInscrito = idsInscritos.has(Number(actividad.id_actividad));

            return (
              <div
                key={actividad.id_actividad}
                style={{
                  background: '#111',
                  border: '1px solid #1e1e1e',
                  borderRadius: 12,
                  padding: '1.25rem',
                }}
              >
                <p style={{
                  color: '#c9a84c',
                  fontSize: '.68rem',
                  fontWeight: 700,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                }}>
                  {actividad.estado}
                </p>
                <h3 style={{ color: '#f0f0f0', margin: '.5rem 0' }}>
                  {actividad.nombre}
                </h3>
                <p className="muted" style={{ fontSize: '.82rem' }}>
                  {actividad.descripcion || 'Sin descripción'}
                </p>

                <div style={{ marginTop: '1rem', fontSize: '.82rem', color: 'rgba(255,255,255,.65)' }}>
                  <p>📅 {formatFecha(actividad.fecha_actividad)}</p>
                  <p>🕒 {String(actividad.hora_inicio || '').slice(0, 5)}</p>
                  <p>📍 {actividad.ubicacion || 'Sin ubicación'}</p>
                  <p>💳 {formatMoneda(actividad.precio)}</p>
                  <p>👥 Cupo disponible: {disponible}</p>
                </div>

                {yaInscrito ? (
                  <p style={{ color: '#6be0a0', fontWeight: 700, marginTop: '1rem' }}>
                    Ya estás inscrito
                  </p>
                ) : (
                  <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
                    <input
                      type="number"
                      min="1"
                      max={Math.max(1, disponible)}
                      value={cantidades[actividad.id_actividad] || 1}
                      onChange={(event) =>
                        setCantidades((actual) => ({
                          ...actual,
                          [actividad.id_actividad]: event.target.value,
                        }))
                      }
                      style={{ maxWidth: 80 }}
                    />
                    <button
                      className="btn-new"
                      onClick={() => inscribirse(actividad.id_actividad)}
                      disabled={
                        disponible < 1 ||
                        procesando === `act-${actividad.id_actividad}`
                      }
                    >
                      {procesando === `act-${actividad.id_actividad}`
                        ? 'Inscribiendo...'
                        : 'Inscribirme'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <h3 style={{
        color: '#f0f0f0',
        fontSize: '.9rem',
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        marginBottom: '1rem',
      }}>
        Mis Inscripciones
      </h3>

      {inscripciones.length === 0 ? (
        <p className="muted">Todavía no tienes inscripciones.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Actividad</th>
                <th>Fecha</th>
                <th>Personas</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {inscripciones.map((inscripcion) => (
                <tr key={inscripcion.id_inscripcion}>
                  <td>{inscripcion.actividad_nombre}</td>
                  <td className="muted">{formatFecha(inscripcion.fecha_actividad)}</td>
                  <td>{inscripcion.cantidad_personas}</td>
                  <td>{formatMoneda(inscripcion.precio_total)}</td>
                  <td>{inscripcion.estado}</td>
                  <td>
                    {inscripcion.estado === 'CONFIRMADA' && (
                      <button
                        className="btn-icon danger"
                        onClick={() => cancelar(inscripcion.id_inscripcion)}
                        disabled={procesando === `ins-${inscripcion.id_inscripcion}`}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

const SECCIONES_CLIENTE = [
  { id: 'reservar',    label: 'Reservar habitación', icono: '🛏️' },
  { id: 'misreservas', label: 'Mis reservaciones',   icono: '📋' },
  { id: 'servicios',   label: 'Servicios Adicionales', icono: '🛎️' },
  { id: 'actividades', label: 'Actividades', icono: '🎟️' },
];

export default function ReservasPage() {
  const { systemUser, logout } = useAuth();
  const navigate               = useNavigate();
  const [seccion, setSeccion]  = useState('reservar');

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-layout">
      {/* ── Barra lateral ────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <p className="admin-sidebar-brand">Hotel Wall Street</p>
        <p className="admin-sidebar-sub">Mi cuenta</p>

        <nav>
          <ul className="admin-nav">
            <li>
              <button
                className="admin-nav-item"
                onClick={() => navigate('/perfil')}
              >
                <span className="admin-nav-icon">👤</span>
                Mi perfil
              </button>
            </li>
            {SECCIONES_CLIENTE.map(s => (
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
            {SECCIONES_CLIENTE.find(s => s.id === seccion)?.label || 'Reservaciones'}
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
          {seccion === 'reservar'    && <ReservarSection />}
          {seccion === 'misreservas' && <MisReservacionesSection />}
          {seccion === 'servicios'   && <ServiciosClienteSection />}
          {seccion === 'actividades' && <ActividadesClienteSection />}
        </main>
      </div>
    </div>
  );
}
