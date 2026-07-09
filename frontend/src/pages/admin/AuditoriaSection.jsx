import { useEffect, useState } from 'react';
import { getAuditoria } from '../../services/auditoria.service';

export default function AuditoriaSection() {
  const [eventos, setEventos] = useState([]);
  const [modulo, setModulo] = useState('');
  const [accion, setAccion] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { getAuditoria({ modulo, accion }).then((d) => setEventos(d.eventos || [])).catch((e) => setError(e.message)); }, [modulo, accion]);
  return <div><div className="admin-section-header"><h2 className="admin-section-title">Auditoría</h2></div>{error && <div className="admin-error">{error}</div>}<div className="audit-filters"><div className="form-field"><label>Módulo</label><input value={modulo} onChange={(e) => setModulo(e.target.value.toUpperCase())} placeholder="RESERVACIONES" /></div><div className="form-field"><label>Acción</label><input value={accion} onChange={(e) => setAccion(e.target.value.toUpperCase())} placeholder="CREAR_RESERVACION" /></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Fecha</th><th>Usuario</th><th>Rol</th><th>Acción</th><th>Módulo</th><th>Entidad</th></tr></thead><tbody>{eventos.map((e) => <tr key={e._id}><td className="muted">{new Date(e.fecha).toLocaleString()}</td><td>#{e.idUsuario}</td><td>{e.rol}</td><td>{e.accion}</td><td>{e.modulo}</td><td className="muted">{String(e.entidadId ?? '—')}</td></tr>)}</tbody></table></div></div>;
}
