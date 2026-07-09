/**
 * ReservacionesSection.jsx
 * Sección de Reservaciones para el Panel de Administración.
 * Muestra listado con filtros, detalle y cambio de estado.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  getReservacionesAdmin,
  getReservacionAdmin,
  cambiarEstadoReservacion,
} from '../../services/reservacion.service';

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADOS = ['PENDIENTE', 'CONFIRMADA', 'CHECK_IN', 'CHECK_OUT', 'CANCELADA'];

// Transiciones válidas por estado actual
const TRANSICIONES = {
  PENDIENTE:  ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['CHECK_IN', 'CANCELADA'],
  CHECK_IN:   ['CHECK_OUT'],
  CHECK_OUT:  [],
  CANCELADA:  [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(iso) {
  if (!iso) return '—';
  return (iso + '').split('T')[0];
}

function formatMoneda(val) {
  if (val === null || val === undefined) return 'Q 0.00';
  return `Q ${parseFloat(val).toFixed(2)}`;
}

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
      fontSize: '0.7rem',
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

// ─── Modal de detalle ─────────────────────────────────────────────────────────

function DetalleModal({ id, onClose, onEstadoCambiado }) {
  const [reservacion, setReservacion] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [cambiando, setCambiando]     = useState(false);
  const [msgOk, setMsgOk]             = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    getReservacionAdmin(id)
      .then(data => {
        if (mounted) {
          setReservacion(data.reservacion);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [id]);

  const handleCambiarEstado = async () => {
    if (!nuevoEstado) return;
    setCambiando(true);
    setMsgOk('');
    setError('');
    try {
      const data = await cambiarEstadoReservacion(id, nuevoEstado);
      setReservacion(data.reservacion);
      setMsgOk(`Estado actualizado a ${nuevoEstado}.`);
      setNuevoEstado('');
      onEstadoCambiado?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setCambiando(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Detalle de reservación">
      <div className="modal-box" style={{ maxWidth: 620 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <p className="modal-title" style={{ margin: 0 }}>
            Reservación #{id}
          </p>
          <button className="btn-cancel" onClick={onClose} aria-label="Cerrar">Cerrar</button>
        </div>

        {loading && <p className="admin-loading">Cargando...</p>}
        {error   && <div className="admin-error">{error}</div>}
        {msgOk   && <div className="admin-success">{msgOk}</div>}

        {reservacion && (
          <>
            {/* Info general */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.25rem', marginBottom: '1.25rem' }}>
              {[
                ['Código',         reservacion.codigo_reservacion],
                ['Estado',         null],
                ['Cliente',        `${reservacion.cliente_nombres} ${reservacion.cliente_apellidos}`],
                ['Teléfono',       reservacion.cliente_telefono || '—'],
                ['Habitación',     reservacion.habitaciones?.[0]?.numero_habitacion || '—'],
                ['Tipo',           reservacion.habitaciones?.[0]?.tipo_nombre || '—'],
                ['Fecha entrada',  formatFecha(reservacion.fecha_entrada)],
                ['Fecha salida',   formatFecha(reservacion.fecha_salida)],
                ['Noches',         reservacion.habitaciones?.[0]?.cantidad_noches || '—'],
                ['Visitantes',     reservacion.cantidad_visitantes],
                ['Subtotal',       formatMoneda(reservacion.subtotal)],
                ['Descuento',      formatMoneda(reservacion.descuento)],
                ['Total',          formatMoneda(reservacion.total)],
                ['Precio/noche',   formatMoneda(reservacion.habitaciones?.[0]?.precio_noche_aplicado)],
                ['Creada',         formatFecha(reservacion.fecha_creacion)],
                ['Actualizada',    formatFecha(reservacion.ultima_actualizacion)],
              ].map(([label, value]) => (
                <div key={label} style={{ borderBottom: '1px solid #edf0f2', paddingBottom: '0.4rem' }}>
                  <p style={{ fontSize: '0.7rem', color: '#7a8490', marginBottom: '0.15rem' }}>{label}</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#17324d' }}>
                    {label === 'Estado' ? <EstadoBadge estado={reservacion.estado} /> : value}
                  </p>
                </div>
              ))}
            </div>

            {/* Visitantes */}
            {reservacion.visitantes?.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#7a8490', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                  Visitantes registrados
                </p>
                {reservacion.visitantes.map((v) => (
                  <div key={v.id_visitante} style={{ fontSize: '0.82rem', borderBottom: '1px solid #edf0f2', padding: '0.35rem 0', color: '#526273' }}>
                    {v.es_titular ? 'Titular: ' : ''}{v.nombres} {v.apellidos} · {v.tipo_documento} {v.numero_documento || ''}
                  </div>
                ))}
              </div>
            )}

            {/* Cambiar estado */}
            {TRANSICIONES[reservacion.estado]?.length > 0 && (
              <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#7a8490', marginBottom: '0.6rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Cambiar estado
                </p>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={nuevoEstado}
                    onChange={e => setNuevoEstado(e.target.value)}
                    disabled={cambiando}
                    style={{
                      background: '#ffffff', border: '1px solid #d8dfe5', borderRadius: 7,
                      color: '#17324d', padding: '0.55rem 0.85rem', fontSize: '0.88rem',
                      outline: 'none', cursor: 'pointer',
                    }}
                    aria-label="Seleccionar nuevo estado"
                  >
                    <option value="">Seleccionar estado</option>
                    {TRANSICIONES[reservacion.estado].map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                  <button
                    className="btn-save"
                    onClick={handleCambiarEstado}
                    disabled={!nuevoEstado || cambiando}
                  >
                    {cambiando ? 'Guardando...' : 'Aplicar'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ReservacionesSection() {
  const [reservaciones, setReservaciones] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [detalleId, setDetalleId]         = useState(null);

  // Filtros
  const [filtroEstado,    setFiltroEstado]    = useState('');
  const [filtroFechaDesde, setFiltroDesde]    = useState('');
  const [filtroFechaHasta, setFiltroHasta]    = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getReservacionesAdmin({
        estado:     filtroEstado    || undefined,
        fechaDesde: filtroFechaDesde || undefined,
        fechaHasta: filtroFechaHasta || undefined,
      });
      setReservaciones(data.reservaciones);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroFechaDesde, filtroFechaHasta]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div>
      {/* ── Cabecera + filtros ─────────────────────────────── */}
      <div className="admin-section-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <span className="admin-section-title">Reservaciones</span>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>

          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            aria-label="Filtrar por estado"
            style={{
              background: '#ffffff', border: '1px solid #d8dfe5', borderRadius: 7,
              color: filtroEstado ? '#f0f0f0' : 'rgba(255,255,255,0.35)',
              padding: '0.45rem 0.75rem', fontSize: '0.82rem',
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          <input
            type="date"
            value={filtroFechaDesde}
            onChange={e => setFiltroDesde(e.target.value)}
            aria-label="Fecha desde"
            style={{
              background: '#ffffff', border: '1px solid #d8dfe5', borderRadius: 7,
              color: filtroFechaDesde ? '#f0f0f0' : 'rgba(255,255,255,0.35)',
              padding: '0.45rem 0.75rem', fontSize: '0.82rem', outline: 'none',
            }}
          />

          <input
            type="date"
            value={filtroFechaHasta}
            onChange={e => setFiltroHasta(e.target.value)}
            aria-label="Fecha hasta"
            style={{
              background: '#ffffff', border: '1px solid #d8dfe5', borderRadius: 7,
              color: filtroFechaHasta ? '#f0f0f0' : 'rgba(255,255,255,0.35)',
              padding: '0.45rem 0.75rem', fontSize: '0.82rem', outline: 'none',
            }}
          />

          <button className="btn-icon" onClick={cargar} title="Actualizar">↻</button>
        </div>
      </div>

      {/* ── Feedback ──────────────────────────────────────────── */}
      {error && <div className="admin-error">{error}</div>}
      {loading && <p className="admin-loading">Cargando reservaciones...</p>}

      {/* ── Tabla ─────────────────────────────────────────────── */}
      {!loading && (
        reservaciones.length === 0 ? (
          <p style={{ color: '#7a8490', fontSize: '0.88rem', padding: '2rem 0' }}>
            No hay reservaciones que coincidan con los filtros.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Habitación</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reservaciones.map(r => (
                  <tr key={r.id_reservacion}>
                    <td className="muted">#{r.id_reservacion}</td>
                    <td className="muted" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {r.codigo_reservacion}
                    </td>
                    <td>{r.cliente_nombres} {r.cliente_apellidos}</td>
                    <td>{r.numero_habitacion || '—'}</td>
                    <td className="muted">{formatFecha(r.fecha_entrada)}</td>
                    <td className="muted">{formatFecha(r.fecha_salida)}</td>
                    <td>{formatMoneda(r.total)}</td>
                    <td><EstadoBadge estado={r.estado} /></td>
                    <td>
                      <button
                        className="btn-icon"
                        onClick={() => setDetalleId(r.id_reservacion)}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Modal de detalle ──────────────────────────────────── */}
      {detalleId && (
        <DetalleModal
          id={detalleId}
          onClose={() => setDetalleId(null)}
          onEstadoCambiado={cargar}
        />
      )}
    </div>
  );
}
