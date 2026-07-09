import { useState } from 'react';

const ESTADOS = ['DISPONIBLE', 'RESERVADA', 'OCUPADA', 'LIMPIEZA', 'MANTENIMIENTO'];

export default function EstadoModal({ habitacion, onSave, onClose, saving }) {
  const [estado, setEstado] = useState(habitacion?.estado || 'DISPONIBLE');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(estado);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
        <p className="modal-title">Cambiar Estado</p>
        <p style={{ fontSize: '0.82rem', color: '#7a8490', marginBottom: '1rem' }}>
          Habitación: <strong style={{ color: '#17324d' }}>{habitacion?.numero_habitacion}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Nuevo estado</label>
            <select value={estado} onChange={e => setEstado(e.target.value)} disabled={saving}>
              {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Guardando...' : 'Aplicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
