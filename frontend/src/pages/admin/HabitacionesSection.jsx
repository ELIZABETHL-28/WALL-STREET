import { useState, useEffect, useCallback } from 'react';
import {
  getHabitaciones, crearHabitacion, editarHabitacion, cambiarEstado,
  getTiposHabitacion, getTiposCama,
} from '../../services/habitacion.service';
import HabitacionModal    from '../../components/admin/HabitacionModal';
import EstadoModal        from '../../components/admin/EstadoModal';
import CamasImagenesModal from '../../components/admin/CamasImagenesModal';
import '../../styles/admin.css';

export default function HabitacionesSection() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [tipos, setTipos]               = useState([]);
  const [tiposCama, setTiposCama]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');

  // Modales
  const [modalHab, setModalHab]     = useState(null); // null | 'nueva' | habitacion obj
  const [modalEstado, setModalEstado] = useState(null);
  const [modalCamas, setModalCamas]  = useState(null); // id_habitacion
  const [saving, setSaving]          = useState(false);

  // Filtro
  const [filtroEstado, setFiltroEstado] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [habRes, tipoRes, camaRes] = await Promise.all([
        getHabitaciones(filtroEstado ? { estado: filtroEstado } : {}),
        getTiposHabitacion(),
        getTiposCama(),
      ]);
      setHabitaciones(habRes.habitaciones);
      setTipos(tipoRes.tipos);
      setTiposCama(camaRes.tipos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleGuardar = async (data) => {
    setSaving(true);
    setError('');
    try {
      if (modalHab === 'nueva') {
        await crearHabitacion(data);
        flash('Habitación creada correctamente.');
      } else {
        await editarHabitacion(modalHab.id_habitacion, data);
        flash('Habitación actualizada.');
      }
      setModalHab(null);
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarEstado = async (estado) => {
    setSaving(true);
    setError('');
    try {
      await cambiarEstado(modalEstado.id_habitacion, estado);
      flash('Estado actualizado.');
      setModalEstado(null);
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const ESTADOS = ['', 'DISPONIBLE', 'RESERVADA', 'OCUPADA', 'LIMPIEZA', 'MANTENIMIENTO'];

  return (
    <div>
      <div className="admin-section-header">
        <p className="admin-section-title">Habitaciones</p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            style={{ padding: '0.5rem 0.8rem', background: '#ffffff', border: '1px solid #d8dfe5', borderRadius: '7px', color: '#17324d', fontSize: '0.82rem' }}
          >
            {ESTADOS.map(s => <option key={s} value={s}>{s || 'Todos los estados'}</option>)}
          </select>
          <button className="btn-new" onClick={() => setModalHab('nueva')}>+ Nueva habitación</button>
        </div>
      </div>

      {error   && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      {loading ? (
        <p className="admin-loading">Cargando habitaciones...</p>
      ) : habitaciones.length === 0 ? (
        <p className="admin-loading">No hay habitaciones registradas.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Núm.</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Piso</th>
                <th>Capacidad</th>
                <th>Precio/noche</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {habitaciones.map(h => (
                <tr key={h.id_habitacion}>
                  <td>
                    {h.imagen_principal
                      ? <img src={h.imagen_principal} alt="" className="hab-thumb" onError={e => e.target.style.display='none'} />
                      : <div className="hab-thumb-placeholder">Sin img</div>}
                  </td>
                  <td style={{ fontWeight: 600 }}>{h.numero_habitacion}</td>
                  <td className="muted">{h.nombre || '—'}</td>
                  <td className="muted">{h.tipo_nombre}</td>
                  <td className="muted">{h.piso}</td>
                  <td className="muted">{h.capacidad_maxima}</td>
                  <td style={{ fontWeight: 500 }}>Q {Number(h.precio_noche).toFixed(2)}</td>
                  <td>
                    <span className={`estado-badge estado-${h.estado}`}>{h.estado}</span>
                  </td>
                  <td>
                    <button className="btn-icon" onClick={() => setModalHab(h)} title="Editar">Editar</button>
                    <button className="btn-icon" onClick={() => setModalEstado(h)} title="Estado">⟳</button>
                    <button className="btn-icon" onClick={() => setModalCamas(h.id_habitacion)} title="Camas / Imágenes">⊞</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      {modalHab !== null && (
        <HabitacionModal
          habitacion={modalHab === 'nueva' ? null : modalHab}
          tiposHabitacion={tipos}
          onSave={handleGuardar}
          onClose={() => setModalHab(null)}
          saving={saving}
        />
      )}

      {/* Modal cambiar estado */}
      {modalEstado && (
        <EstadoModal
          habitacion={modalEstado}
          onSave={handleCambiarEstado}
          onClose={() => setModalEstado(null)}
          saving={saving}
        />
      )}

      {/* Modal camas e imágenes */}
      {modalCamas !== null && (
        <CamasImagenesModal
          idHabitacion={modalCamas}
          tiposCama={tiposCama}
          onClose={() => { setModalCamas(null); cargar(); }}
        />
      )}
    </div>
  );
}
