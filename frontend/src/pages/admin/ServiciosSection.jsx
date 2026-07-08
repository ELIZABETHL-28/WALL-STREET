import { useState, useEffect, useCallback } from 'react';
import {
  getServiciosAdmin,
  crearServicioAdmin,
  editarServicioAdmin,
  cambiarEstadoServicioAdmin,
} from '../../services/servicio.service';
import ServicioModal from '../../components/admin/ServicioModal';
import '../../styles/admin.css';

export default function ServiciosSection() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  // Modales
  const [modalServicio, setModalServicio] = useState(null); // null | 'nuevo' | servicio obj
  const [saving, setSaving]               = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getServiciosAdmin();
      setServicios(res.servicios || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3500);
  };

  const handleGuardar = async (data) => {
    setSaving(true);
    setError('');
    try {
      if (modalServicio === 'nuevo') {
        await crearServicioAdmin(data);
        flash('Servicio creado correctamente.');
      } else {
        await editarServicioAdmin(modalServicio.id_servicio, data);
        flash('Servicio actualizado.');
      }
      setModalServicio(null);
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (s) => {
    const nuevoEstado = s.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    setError('');
    try {
      await cambiarEstadoServicioAdmin(s.id_servicio, nuevoEstado);
      flash(`Servicio ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'} correctamente.`);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="admin-section-header">
        <p className="admin-section-title">Servicios Adicionales</p>
        <button className="btn-new" onClick={() => setModalServicio('nuevo')}>
          + Nuevo servicio
        </button>
      </div>

      {error   && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      {loading ? (
        <p className="admin-loading">Cargando servicios...</p>
      ) : servicios.length === 0 ? (
        <p className="admin-loading">No hay servicios registrados en el catálogo.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map(s => (
                <tr key={s.id_servicio}>
                  <td className="muted">#{s.id_servicio}</td>
                  <td style={{ fontWeight: 600 }}>{s.nombre}</td>
                  <td className="muted" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.descripcion || '—'}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    Q {Number(s.precio).toFixed(2)}
                  </td>
                  <td>
                    <span className={`estado-badge estado-${s.estado}`}>{s.estado}</span>
                  </td>
                  <td>
                    <button
                      className="btn-icon"
                      onClick={() => setModalServicio(s)}
                      title="Editar"
                    >
                      ✎
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => toggleEstado(s)}
                      title={s.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                    >
                      ⟳
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalServicio !== null && (
        <ServicioModal
          servicio={modalServicio === 'nuevo' ? null : modalServicio}
          onSave={handleGuardar}
          onClose={() => setModalServicio(null)}
          saving={saving}
        />
      )}
    </div>
  );
}
