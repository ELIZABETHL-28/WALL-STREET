import { useState, useEffect, useCallback } from 'react';
import {
  getHabitacion,
  asociarCama, actualizarCama, eliminarCama,
  agregarImagen, eliminarImagen,
} from '../../services/habitacion.service';

export default function CamasImagenesModal({ idHabitacion, tiposCama, onClose }) {
  const [hab, setHab]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  // Camas form
  const [idTipoCama, setIdTipoCama] = useState('');
  const [cantidad, setCantidad]     = useState(1);
  const [savingCama, setSavingCama] = useState(false);

  // Imágenes form
  const [urlImagen, setUrlImagen]         = useState('');
  const [textoAlt, setTextoAlt]           = useState('');
  const [esPrincipal, setEsPrincipal]     = useState(false);
  const [savingImg, setSavingImg]         = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getHabitacion(idHabitacion);
      setHab(data.habitacion);
    } catch {
      setError('No se pudo cargar la habitación.');
    } finally {
      setLoading(false);
    }
  }, [idHabitacion]);

  useEffect(() => { reload(); }, [reload]);

  const handleAgregarCama = async (e) => {
    e.preventDefault();
    setError('');
    if (!idTipoCama) { setError('Selecciona un tipo de cama.'); return; }
    if (cantidad < 1) { setError('La cantidad debe ser >= 1.'); return; }
    setSavingCama(true);
    try {
      await asociarCama(idHabitacion, { idTipoCama: Number(idTipoCama), cantidad: Number(cantidad) });
      setIdTipoCama(''); setCantidad(1);
      await reload();
    } catch (err) { setError(err.message); }
    finally { setSavingCama(false); }
  };

  const handleActualizarCama = async (idCama, nuevaCantidad) => {
    setError('');
    try {
      await actualizarCama(idHabitacion, idCama, { cantidad: Number(nuevaCantidad) });
      await reload();
    } catch (err) { setError(err.message); }
  };

  const handleEliminarCama = async (idCama) => {
    setError('');
    try {
      await eliminarCama(idHabitacion, idCama);
      await reload();
    } catch (err) { setError(err.message); }
  };

  const handleAgregarImagen = async (e) => {
    e.preventDefault();
    setError('');
    if (!urlImagen.trim()) { setError('La URL de imagen es requerida.'); return; }
    setSavingImg(true);
    try {
      await agregarImagen(idHabitacion, { urlImagen: urlImagen.trim(), textoAlternativo: textoAlt || null, esPrincipal });
      setUrlImagen(''); setTextoAlt(''); setEsPrincipal(false);
      await reload();
    } catch (err) { setError(err.message); }
    finally { setSavingImg(false); }
  };

  const handleEliminarImagen = async (idImg) => {
    setError('');
    try {
      await eliminarImagen(idHabitacion, idImg);
      await reload();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        <p className="modal-title">
          Camas e Imágenes
          {hab && <span style={{ color: '#7a8490', fontWeight: 400, fontSize: '0.82rem', marginLeft: '0.75rem' }}>
            Hab. {hab.numero_habitacion}
          </span>}
        </p>

        {error && <div className="admin-error">{error}</div>}

        {loading ? (
          <p className="admin-loading">Cargando...</p>
        ) : hab && (
          <>
            {/* ── Camas ──────────────────────────────────────────── */}
            <div className="detail-panel" style={{ marginBottom: '1.25rem' }}>
              <h4>Camas asociadas</h4>

              {hab.camas.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Sin camas registradas.</p>
              )}

              {hab.camas.map(c => (
                <div className="cama-row" key={c.id_habitacion_cama}>
                  <span>{c.tipo_cama_nombre}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="number" min="1"
                      defaultValue={c.cantidad}
                      style={{ width: '60px', padding: '0.3rem 0.5rem', background: '#ffffff', border: '1px solid #d8dfe5', borderRadius: '5px', color: '#17324d', fontSize: '0.82rem' }}
                      onBlur={e => { if (Number(e.target.value) !== c.cantidad) handleActualizarCama(c.id_habitacion_cama, e.target.value); }}
                    />
                    <button className="btn-icon danger" onClick={() => handleEliminarCama(c.id_habitacion_cama)} title="Eliminar">Eliminar</button>
                  </div>
                </div>
              ))}

              <form onSubmit={handleAgregarCama} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div className="form-field" style={{ flex: 2, marginBottom: 0 }}>
                  <label>Tipo de cama</label>
                  <select value={idTipoCama} onChange={e => setIdTipoCama(e.target.value)} disabled={savingCama}>
                    <option value="">— Seleccionar —</option>
                    {tiposCama.map(t => <option key={t.id_tipo_cama} value={t.id_tipo_cama}>{t.nombre}</option>)}
                  </select>
                </div>
                <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Cantidad</label>
                  <input type="number" min="1" value={cantidad} onChange={e => setCantidad(e.target.value)} disabled={savingCama} />
                </div>
                <button type="submit" className="btn-save" style={{ marginBottom: 0 }} disabled={savingCama}>
                  {savingCama ? '...' : 'Agregar'}
                </button>
              </form>
            </div>

            {/* ── Imágenes ────────────────────────────────────────── */}
            <div className="detail-panel">
              <h4>Imágenes</h4>

              {hab.imagenes.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Sin imágenes registradas.</p>
              )}

              {hab.imagenes.map(img => (
                <div className="imagen-row" key={img.id_imagen}>
                  {img.url_imagen && (
                    <img src={img.url_imagen} alt={img.texto_alternativo || ''} className="hab-thumb"
                      onError={e => { e.target.style.display = 'none'; }} />
                  )}
                  <span className="imagen-url">{img.url_imagen}</span>
                  {img.es_principal && (
                    <span style={{ fontSize: '0.65rem', color: '#c9a84c', border: '1px solid rgba(201,168,76,.3)', borderRadius: '10px', padding: '0.1rem 0.4rem' }}>Principal</span>
                  )}
                  <button className="btn-icon danger" onClick={() => handleEliminarImagen(img.id_imagen)} title="Eliminar">Eliminar</button>
                </div>
              ))}

              <form onSubmit={handleAgregarImagen} style={{ marginTop: '1rem' }}>
                <div className="form-field">
                  <label>URL de imagen *</label>
                  <input value={urlImagen} onChange={e => setUrlImagen(e.target.value)} placeholder="https://..." disabled={savingImg} />
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Texto alternativo</label>
                    <input value={textoAlt} onChange={e => setTextoAlt(e.target.value)} maxLength={255} disabled={savingImg} />
                  </div>
                  <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.4rem' }}>
                    <input type="checkbox" id="principal" checked={esPrincipal} onChange={e => setEsPrincipal(e.target.checked)} style={{ width: 'auto' }} />
                    <label htmlFor="principal" style={{ marginBottom: 0 }}>Imagen principal</label>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn-save" disabled={savingImg}>
                    {savingImg ? 'Guardando...' : 'Agregar imagen'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
          <button type="button" className="btn-cancel" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
