import { useState } from 'react';
import { validarCodigoAcceso, utilizarCodigoAcceso } from '../../services/codigoAcceso.service';

export default function CodigosAccesoSection() {
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const validar = async (e) => {
    e.preventDefault(); setError(''); setResultado(null);
    try { const data = await validarCodigoAcceso(codigo); setResultado(data.codigo); }
    catch (err) { setError(err.message); }
  };

  const utilizar = async () => {
    setError('');
    try { const data = await utilizarCodigoAcceso(resultado.id_codigo_acceso); setResultado(data.codigo); }
    catch (err) { setError(err.message); }
  };

  return <div>
    <div className="admin-section-header"><h2 className="admin-section-title">Validar códigos de acceso</h2></div>
    {error && <div className="admin-error">{error}</div>}
    <form className="access-validator" onSubmit={validar}><div className="form-field"><label htmlFor="access-code">Código</label><input id="access-code" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="ACC-XXXXXXXXXXXXXXXX" /></div><button className="btn-new" type="submit">Validar código</button></form>
    {resultado && <div className="validation-result"><span className={`estado-badge estado-${resultado.estado}`}>{resultado.estado}</span><h3>{resultado.codigo}</h3><dl><div><dt>Tipo</dt><dd>{resultado.tipo}</dd></div><div><dt>Cliente</dt><dd>{resultado.nombres} {resultado.apellidos}</dd></div><div><dt>Referencia</dt><dd>{resultado.codigo_reservacion || resultado.codigo_pase || '—'}</dd></div></dl>{resultado.estado === 'ACTIVO' && <button className="btn-new" onClick={utilizar}>Marcar como utilizado</button>}</div>}
  </div>;
}
