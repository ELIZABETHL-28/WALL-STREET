import { useState, useEffect } from 'react';

export default function ServicioModal({ servicio, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    nombre:      '',
    descripcion: '',
    precio:      '0.00',
    estado:      'ACTIVO',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (servicio) {
      setForm({
        nombre:      servicio.nombre || '',
        descripcion: servicio.descripcion || '',
        precio:      String(servicio.precio) || '0.00',
        estado:      servicio.estado || 'ACTIVO',
      });
    }
  }, [servicio]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const nombreVal = form.nombre.trim();
    if (!nombreVal) {
      setError('El nombre del servicio es obligatorio.');
      return;
    }
    if (nombreVal.length > 120) {
      setError('El nombre no puede exceder los 120 caracteres.');
      return;
    }

    const precioVal = parseFloat(form.precio);
    if (isNaN(precioVal) || precioVal < 0) {
      setError('El precio debe ser un número mayor o igual a 0.');
      return;
    }

    onSave({
      nombre:      nombreVal,
      descripcion: form.descripcion.trim() || null,
      precio:      precioVal,
      estado:      form.estado,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <p className="modal-title">
          {servicio ? 'Editar Servicio' : 'Nuevo Servicio'}
        </p>

        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="nombre">Nombre del servicio *</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              disabled={saving}
              required
              maxLength={120}
            />
          </div>

          <div className="form-field">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              disabled={saving}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="precio">Precio (Q) *</label>
              <input
                id="precio"
                name="precio"
                type="number"
                step="0.01"
                min="0"
                value={form.precio}
                onChange={handleChange}
                disabled={saving}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="estado">Estado *</label>
              <select
                id="estado"
                name="estado"
                value={form.estado}
                onChange={handleChange}
                disabled={saving}
                required
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
