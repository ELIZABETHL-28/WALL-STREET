import { useState, useEffect } from 'react';

const ESTADOS = ['DISPONIBLE', 'RESERVADA', 'OCUPADA', 'LIMPIEZA', 'MANTENIMIENTO'];

/**
 * Modal para crear o editar una habitación.
 * tiposHabitacion: array de tipos disponibles desde el backend.
 */
export default function HabitacionModal({ habitacion, tiposHabitacion, onSave, onClose, saving }) {
  const esNueva = !habitacion;

  const [form, setForm] = useState({
    idTipoHabitacion: '',
    numeroHabitacion: '',
    nombre: '',
    piso: '',
    capacidadMaxima: '',
    precioNoche: '',
    descripcion: '',
    estado: 'DISPONIBLE',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (habitacion) {
      setForm({
        idTipoHabitacion: habitacion.id_tipo_habitacion ?? '',
        numeroHabitacion: habitacion.numero_habitacion ?? '',
        nombre:           habitacion.nombre ?? '',
        piso:             habitacion.piso ?? '',
        capacidadMaxima:  habitacion.capacidad_maxima ?? '',
        precioNoche:      habitacion.precio_noche ?? '',
        descripcion:      habitacion.descripcion ?? '',
        estado:           habitacion.estado ?? 'DISPONIBLE',
      });
    }
  }, [habitacion]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.idTipoHabitacion) { setError('Selecciona un tipo de habitación.'); return; }
    if (!form.numeroHabitacion.trim()) { setError('El número de habitación es requerido.'); return; }
    if (!form.piso) { setError('El piso es requerido.'); return; }
    if (!form.capacidadMaxima || Number(form.capacidadMaxima) < 1) { setError('La capacidad máxima debe ser > 0.'); return; }
    if (form.precioNoche === '' || Number(form.precioNoche) < 0) { setError('El precio debe ser >= 0.'); return; }

    onSave({
      idTipoHabitacion: Number(form.idTipoHabitacion),
      numeroHabitacion: form.numeroHabitacion.trim(),
      nombre:           form.nombre.trim() || null,
      piso:             Number(form.piso),
      capacidadMaxima:  Number(form.capacidadMaxima),
      precioNoche:      Number(form.precioNoche),
      descripcion:      form.descripcion.trim() || null,
      estado:           form.estado,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <p className="modal-title">{esNueva ? 'Nueva Habitación' : 'Editar Habitación'}</p>

        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label>Número de habitación *</label>
              <input value={form.numeroHabitacion} onChange={e => set('numeroHabitacion', e.target.value)} maxLength={20} disabled={saving} />
            </div>
            <div className="form-field">
              <label>Piso *</label>
              <input type="number" min="0" value={form.piso} onChange={e => set('piso', e.target.value)} disabled={saving} />
            </div>
          </div>

          <div className="form-field">
            <label>Nombre / descripción corta</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} maxLength={150} disabled={saving} />
          </div>

          <div className="form-field">
            <label>Tipo de habitación *</label>
            <select value={form.idTipoHabitacion} onChange={e => set('idTipoHabitacion', e.target.value)} disabled={saving}>
              <option value="">— Seleccionar —</option>
              {tiposHabitacion.map(t => (
                <option key={t.id_tipo_habitacion} value={t.id_tipo_habitacion}>{t.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Capacidad máxima *</label>
              <input type="number" min="1" value={form.capacidadMaxima} onChange={e => set('capacidadMaxima', e.target.value)} disabled={saving} />
            </div>
            <div className="form-field">
              <label>Precio por noche (Q) *</label>
              <input type="number" min="0" step="0.01" value={form.precioNoche} onChange={e => set('precioNoche', e.target.value)} disabled={saving} />
            </div>
          </div>

          <div className="form-field">
            <label>Estado</label>
            <select value={form.estado} onChange={e => set('estado', e.target.value)} disabled={saving}>
              {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label>Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} disabled={saving} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
