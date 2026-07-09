import { useEffect, useState } from 'react';
import { getMisReservaciones } from '../../services/reservacion.service';
import { getMisPases } from '../../services/pase.service';
import { getCodigoReservacion, getCodigoPase } from '../../services/codigoAcceso.service';

export default function CodigosAccesoSection() {
  const [reservaciones, setReservaciones] = useState([]);
  const [pases, setPases] = useState([]);
  const [codigo, setCodigo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getMisReservaciones(), getMisPases()])
      .then(([r, p]) => {
        setReservaciones(r.reservaciones || []);
        setPases(p.pases || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const mostrar = async (tipo, id) => {
    setError('');
    try {
      const data = tipo === 'RESERVACION'
        ? await getCodigoReservacion(id)
        : await getCodigoPase(id);
      setCodigo(data.codigo);
    } catch (err) { setError(err.message); }
  };

  if (loading) return <p className="admin-loading">Cargando códigos de acceso...</p>;

  return (
    <div>
      <div className="admin-section-header"><h2 className="admin-section-title">Mis códigos de acceso</h2></div>
      <p className="client-section-copy">El QR contiene únicamente un identificador único. Preséntalo al personal del hotel para su validación.</p>
      {error && <div className="admin-error">{error}</div>}

      <div className="access-grid">
        <section className="access-list-card">
          <h3>Reservaciones</h3>
          {reservaciones.length === 0 ? <p className="muted">No tienes reservaciones.</p> : reservaciones.map((item) => (
            <div className="access-row" key={item.id_reservacion}>
              <div><strong>{item.codigo_reservacion}</strong><span>{item.tipo_habitacion || 'Habitación'} · {item.estado}</span></div>
              <button className="btn-icon" onClick={() => mostrar('RESERVACION', item.id_reservacion)}>Ver QR</button>
            </div>
          ))}
        </section>
        <section className="access-list-card">
          <h3>Pases de día</h3>
          {pases.length === 0 ? <p className="muted">No tienes pases.</p> : pases.map((item) => (
            <div className="access-row" key={item.id_pase_cliente}>
              <div><strong>{item.codigo_pase}</strong><span>{item.tipo_pase_nombre} · {item.estado}</span></div>
              <button className="btn-icon" onClick={() => mostrar('PASE', item.id_pase_cliente)}>Ver QR</button>
            </div>
          ))}
        </section>
      </div>

      {codigo && (
        <div className="qr-card">
          <img src={codigo.qrDataUrl} alt={`Código QR ${codigo.codigo}`} />
          <div><span className={`estado-badge estado-${codigo.estado}`}>{codigo.estado}</span><h3>{codigo.codigo}</h3><p>{codigo.tipo === 'PASE' ? 'Pase de día' : 'Reservación'}</p></div>
        </div>
      )}
    </div>
  );
}
