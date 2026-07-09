import { useEffect, useState } from 'react';
import HotelIcon from '../../components/HotelIcon';
import {
  getComentariosAdmin,
  cambiarEstadoComentario
} from '../../services/comentario.service';

export default function ComentariosSection() {
  const [comentarios, setComentarios] = useState([]);
  const [estado, setEstado] = useState('');
  const [error, setError] = useState('');

  const cargar = () => {
    setError('');

    return getComentariosAdmin(estado)
      .then((d) => {
        setComentarios(d.comentarios || []);
      })
      .catch((e) => {
        setError(e.message);
      });
  };

  useEffect(() => {
    cargar();
  }, [estado]);

  const cambiar = async (id, nuevo) => {
    try {
      await cambiarEstadoComentario(id, nuevo);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">
          Comentarios y calificaciones
        </h2>

        <select
          className="admin-filter-control"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="PUBLICADO">Publicados</option>
          <option value="OCULTO">Ocultos</option>
        </select>
      </div>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      <div className="review-admin-grid">
        {comentarios.map((c) => (
          <article
            className="review-admin-card"
            key={c._id}
          >
            <div className="rating-stars readonly">
              {[1, 2, 3, 4, 5].map((n) => (
                <HotelIcon
                  key={n}
                  name="star"
                  className={n <= c.calificacion ? 'filled' : ''}
                />
              ))}
            </div>

            <p>{c.comentario}</p>

            <small>
              Reservación #{c.idReservacion} ·{' '}
              {new Date(c.fechaCreacion).toLocaleDateString()}
            </small>

            <div>
              <span
                className={`estado-badge estado-${c.estado}`}
              >
                {c.estado}
              </span>

              <button
                className="btn-icon"
                onClick={() =>
                  cambiar(
                    c._id,
                    c.estado === 'PUBLICADO'
                      ? 'OCULTO'
                      : 'PUBLICADO'
                  )
                }
              >
                {c.estado === 'PUBLICADO'
                  ? 'Ocultar'
                  : 'Publicar'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}