import { useEffect, useState } from 'react';
import {
  getActividadesAdmin,
  crearActividad,
  editarActividad,
  cambiarEstadoActividad,
} from '../../services/actividad.service';

const FORM_INICIAL = {
  nombre: '',
  descripcion: '',
  fechaActividad: '',
  horaInicio: '',
  ubicacion: '',
  precio: '0',
  cupoMaximo: '1',
  estado: 'PROGRAMADA',
};

const ESTADOS = ['PROGRAMADA', 'ACTIVA', 'FINALIZADA', 'CANCELADA'];

function fecha(valor) {
  if (!valor) return '—';
  return String(valor).split('T')[0];
}

function moneda(valor) {
  return `Q ${Number(valor || 0).toFixed(2)}`;
}

export default function ActividadesSection() {
  const [actividades, setActividades] = useState([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getActividadesAdmin();
      setActividades(data.actividades || []);
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

  const nueva = () => {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setMostrarForm(true);
    setError('');
  };

  const editar = (actividad) => {
    setEditandoId(actividad.id_actividad);
    setForm({
      nombre: actividad.nombre || '',
      descripcion: actividad.descripcion || '',
      fechaActividad: fecha(actividad.fecha_actividad),
      horaInicio: String(actividad.hora_inicio || '').slice(0, 5),
      ubicacion: actividad.ubicacion || '',
      precio: String(actividad.precio ?? 0),
      cupoMaximo: String(actividad.cupo_maximo ?? 1),
      estado: actividad.estado || 'PROGRAMADA',
    });
    setMostrarForm(true);
    setError('');
  };

  const handleChange = (event) => {
    setForm((actual) => ({
      ...actual,
      [event.target.name]: event.target.value,
    }));
  };

  const guardar = async (event) => {
    event.preventDefault();
    setGuardando(true);
    setError('');

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      fechaActividad: form.fechaActividad,
      horaInicio: form.horaInicio,
      ubicacion: form.ubicacion.trim() || null,
      precio: Number(form.precio),
      cupoMaximo: Number(form.cupoMaximo),
      estado: form.estado,
    };

    try {
      if (editandoId) {
        await editarActividad(editandoId, payload);
        flash('Actividad actualizada correctamente.');
      } else {
        await crearActividad(payload);
        flash('Actividad creada correctamente.');
      }

      setMostrarForm(false);
      setEditandoId(null);
      setForm(FORM_INICIAL);
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (id, estado) => {
    setError('');
    try {
      await cambiarEstadoActividad(id, estado);
      flash('Estado actualizado.');
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p className="admin-loading">Cargando actividades...</p>;
  }

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">Actividades</h2>
        <button className="btn-new" onClick={nueva}>
          + Nueva actividad
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      {mostrarForm && (
        <form
          onSubmit={guardar}
          style={{
            background: '#111',
            border: '1px solid #1e1e1e',
            borderRadius: 12,
            padding: '1.25rem',
            marginBottom: '1.5rem',
            maxWidth: 760,
          }}
        >
          <h3 style={{ color: '#f0f0f0', marginBottom: '1rem' }}>
            {editandoId ? 'Editar actividad' : 'Nueva actividad'}
          </h3>

          <div className="form-field">
            <label htmlFor="actividad-nombre">Nombre</label>
            <input
              id="actividad-nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              maxLength="150"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="actividad-descripcion">Descripción</label>
            <textarea
              id="actividad-descripcion"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-field">
              <label htmlFor="actividad-fecha">Fecha</label>
              <input
                id="actividad-fecha"
                name="fechaActividad"
                type="date"
                value={form.fechaActividad}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="actividad-hora">Hora de inicio</label>
              <input
                id="actividad-hora"
                name="horaInicio"
                type="time"
                value={form.horaInicio}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="actividad-ubicacion">Ubicación</label>
              <input
                id="actividad-ubicacion"
                name="ubicacion"
                value={form.ubicacion}
                onChange={handleChange}
                maxLength="200"
              />
            </div>

            <div className="form-field">
              <label htmlFor="actividad-precio">Precio</label>
              <input
                id="actividad-precio"
                name="precio"
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="actividad-cupo">Cupo máximo</label>
              <input
                id="actividad-cupo"
                name="cupoMaximo"
                type="number"
                min="1"
                value={form.cupoMaximo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="actividad-estado">Estado</label>
              <select
                id="actividad-estado"
                name="estado"
                value={form.estado}
                onChange={handleChange}
              >
                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '.6rem', marginTop: '1rem' }}>
            <button className="btn-save" type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              className="btn-cancel"
              type="button"
              onClick={() => setMostrarForm(false)}
              disabled={guardando}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {actividades.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,.35)', padding: '2rem 0' }}>
          No hay actividades registradas.
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Actividad</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Ubicación</th>
                <th>Precio</th>
                <th>Cupo</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {actividades.map((actividad) => (
                <tr key={actividad.id_actividad}>
                  <td>
                    <strong>{actividad.nombre}</strong>
                    <div className="muted" style={{ fontSize: '.72rem' }}>
                      {actividad.descripcion || 'Sin descripción'}
                    </div>
                  </td>
                  <td className="muted">{fecha(actividad.fecha_actividad)}</td>
                  <td className="muted">{String(actividad.hora_inicio || '').slice(0, 5)}</td>
                  <td className="muted">{actividad.ubicacion || '—'}</td>
                  <td>{moneda(actividad.precio)}</td>
                  <td>
                    {Number(actividad.inscritos_actuales || 0)} / {actividad.cupo_maximo}
                  </td>
                  <td>
                    <select
                      value={actividad.estado}
                      onChange={(event) =>
                        cambiarEstado(actividad.id_actividad, event.target.value)
                      }
                    >
                      {ESTADOS.map((estado) => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn-icon"
                      onClick={() => editar(actividad)}
                    >
                      Editar
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
