import { useEffect, useState } from 'react';
import HotelIcon from '../../components/HotelIcon';
import { getMisReservaciones } from '../../services/reservacion.service';
import { crearComentario, getComentarioReservacion } from '../../services/comentario.service';

export default function CalificacionesSection() {
  const [reservaciones, setReservaciones] = useState([]);
  const [seleccionada, setSeleccionada] = useState('');
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [existente, setExistente] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getMisReservaciones()
      .then((data) => {
        const finalizadas = (data.reservaciones || []).filter((r) => r.estado === 'CHECK_OUT');
        setReservaciones(finalizadas);
        if (finalizadas[0]) setSeleccionada(String(finalizadas[0].id_reservacion));
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!seleccionada) { setExistente(null); return; }
    getComentarioReservacion(seleccionada)
      .then((data) => setExistente(data.comentario || null))
      .catch((err) => setError(err.message));
  }, [seleccionada]);

  const enviar = async (event) => {
    event.preventDefault();
    setError(''); setSuccess('');
    try {
      const data = await crearComentario({ idReservacion: Number(seleccionada), calificacion, comentario });
      setExistente(data.comentario);
      setSuccess('Gracias. Tu calificación fue registrada correctamente.');
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <div className="admin-section-header"><h2 className="admin-section-title">Calificar estancia</h2></div>
      <p className="client-section-copy">Puedes calificar reservaciones que ya finalizaron su proceso de check-out.</p>
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      {reservaciones.length === 0 ? <p className="muted">Todavía no tienes estancias finalizadas para calificar.</p> : (
        <div className="rating-card">
          <div className="form-field"><label htmlFor="rating-reserva">Reservación</label><select id="rating-reserva" value={seleccionada} onChange={(e) => setSeleccionada(e.target.value)}>{reservaciones.map((r) => <option key={r.id_reservacion} value={r.id_reservacion}>{r.codigo_reservacion} · Hab. {r.numero_habitacion || '—'}</option>)}</select></div>

          {existente ? (
            <div className="existing-review">
              <div className="rating-stars readonly">{[1,2,3,4,5].map((n) => <HotelIcon key={n} name="star" className={n <= existente.calificacion ? 'filled' : ''} />)}</div>
              <p>{existente.comentario}</p><span>{existente.estado}</span>
            </div>
          ) : (
            <form onSubmit={enviar}>
              <label className="rating-label">Tu calificación</label>
              <div className="rating-stars">{[1,2,3,4,5].map((n) => <button type="button" key={n} onClick={() => setCalificacion(n)} aria-label={`${n} estrellas`}><HotelIcon name="star" className={n <= calificacion ? 'filled' : ''} /></button>)}</div>
              <div className="form-field"><label htmlFor="comentario">Comentario</label><textarea id="comentario" rows="5" maxLength="1000" value={comentario} onChange={(e) => setComentario(e.target.value)} required /></div>
              <button className="btn-new" type="submit">Enviar calificación</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
