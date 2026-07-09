/**
 * ReservasPage.jsx
 * Módulo de Reservaciones para CLIENTE.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import serviceLaundry from '../assets/hotel/lava.jpg';

import {
  consultarDisponibilidad,
  crearReservacion,
  getMisReservaciones,
  getMiReservacion,
  cancelarReservacion,
} from '../services/reservacion.service';

import {
  getServiciosCliente,
  getServiciosReservacion,
  agregarServicioReservacion,
  quitarServicioReservacion,
} from '../services/servicio.service';

import {
  getActividadesCliente,
  inscribirseActividad,
  getMisInscripciones,
  cancelarInscripcion,
} from '../services/actividad.service';

import {
  getTiposPaseCliente,
  adquirirPase,
  getMisPases,
} from '../services/pase.service';

import '../styles/auth.css';
import '../styles/admin.css';

import HotelIcon from '../components/HotelIcon';
import CodigosAccesoSection from './client/CodigosAccesoSection';
import CalificacionesSection from './client/CalificacionesSection';

import roomStandard from '../assets/hotel/room_standard.jpg';
import roomDouble from '../assets/hotel/room_double.jpg';
import roomExecutive from '../assets/hotel/room_executive.jpg';
import roomFamily from '../assets/hotel/room_family.jpg';
import roomPresidential from '../assets/hotel/suite_presidential.jpg';

import activityTour from '../assets/hotel/lobby.jpg';
import activityWine from '../assets/hotel/wine.jpg';
import activityNetworking from '../assets/hotel/terrace.jpg';

import serviceSpa from '../assets/hotel/spa.jpg';
import serviceLobby from '../assets/hotel/lobby.jpg';
import serviceRoom from '../assets/hotel/room_standard.jpg';
import serviceFacade from '../assets/hotel/facade.jpg';
import serviceBreakfast from '../assets/hotel/break.jpg';
import serviceParking from '../assets/hotel/par.jpg';

// ── Helpers ───────────────────────────────────────────────────────────────────

function hoy() {
  return new Date().toISOString().split('T')[0];
}

function manana() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function formatFecha(iso) {
  if (!iso) return '—';
  return iso.split('T')[0];
}

function calcularNoches(entrada, salida) {
  if (!entrada || !salida) return 0;

  const ms = new Date(salida) - new Date(entrada);

  return Math.max(
    0,
    Math.round(ms / (1000 * 60 * 60 * 24))
  );
}

function formatMoneda(val) {
  if (val === null || val === undefined) {
    return 'Q 0.00';
  }

  return `Q ${parseFloat(val).toFixed(2)}`;
}

function normalizarTexto(valor = '') {
  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function imagenHabitacion(habitacion = {}) {
  if (habitacion.imagen_principal) {
    return habitacion.imagen_principal;
  }

  const nombre = normalizarTexto(
    `${habitacion.tipo_nombre || ''} ${habitacion.nombre || ''}`
  );

  if (nombre.includes('PRESIDENCIAL')) {
    return roomPresidential;
  }

  if (nombre.includes('FAMILIAR')) {
    return roomFamily;
  }

  if (nombre.includes('DOBLE')) {
    return roomDouble;
  }

  if (
    nombre.includes('EJECUTIVA') ||
    nombre.includes('SUITE')
  ) {
    return roomExecutive;
  }

  return roomStandard;
}

function imagenActividad(nombre = '') {
  const texto = normalizarTexto(nombre);

  if (
    texto.includes('VINO') ||
    texto.includes('CATA')
  ) {
    return activityWine;
  }

  if (texto.includes('NETWORK')) {
    return activityNetworking;
  }

  return activityTour;
}

function imagenServicio(nombre = '') {
  const texto = normalizarTexto(nombre);

  if (texto.includes('DESAYUNO')) {
    return serviceBreakfast;
  }

  if (
    texto.includes('ESTACIONAMIENTO') ||
    texto.includes('PARKING')
  ) {
    return serviceParking;
  }

  if (texto.includes('LAVANDER')) {
    return serviceLaundry;
  }

  if (texto.includes('SPA')) {
    return serviceSpa;
  }

  if (
    texto.includes('TRANSPORTE') ||
    texto.includes('AEROPUERTO')
  ) {
    return serviceLobby;
  }

  if (
    texto.includes('ROOM') ||
    texto.includes('HABITACION')
  ) {
    return serviceRoom;
  }

  return serviceFacade;
}

// ── Badges de estado ──────────────────────────────────────────────────────────

const ESTADO_COLORS = {
  PENDIENTE: {
    bg: 'rgba(201,168,76,.12)',
    color: '#b8964f',
    border: 'rgba(201,168,76,.3)',
  },
  CONFIRMADA: {
    bg: 'rgba(80,200,120,.12)',
    color: '#6be0a0',
    border: 'rgba(80,200,120,.25)',
  },
  CHECK_IN: {
    bg: 'rgba(100,180,255,.12)',
    color: '#80c0ff',
    border: 'rgba(100,180,255,.25)',
  },
  CHECK_OUT: {
    bg: 'rgba(200,160,255,.12)',
    color: '#c8a0ff',
    border: 'rgba(200,160,255,.25)',
  },
  CANCELADA: {
    bg: 'rgba(255,80,80,.12)',
    color: '#f08080',
    border: 'rgba(255,80,80,.25)',
  },
};

function EstadoBadge({ estado }) {
  const s = ESTADO_COLORS[estado] || {};

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.18rem 0.65rem',
        borderRadius: 20,
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {estado}
    </span>
  );
}

// ── Sección: Reservar habitación ──────────────────────────────────────────────

function ReservarSection() {
  const [step, setStep] = useState('buscar');

  const [form, setForm] = useState({
    fechaEntrada: hoy(),
    fechaSalida: manana(),
    cantidadAdultos: 1,
    cantidadNinos: 0,
    camasRequeridas: 1,
  });

  const [busqueda, setBusqueda] = useState(null);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [loadingConf, setLoadingConf] = useState(false);
  const [reservaCreada, setReservaCreada] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const obtenerDatosFormulario = () => {
    const cantidadAdultos = parseInt(
      form.cantidadAdultos,
      10
    );

    const cantidadNinos = parseInt(
      form.cantidadNinos,
      10
    );

    const camasRequeridas = parseInt(
      form.camasRequeridas,
      10
    );

    const cantidadVisitantes =
      cantidadAdultos + cantidadNinos;

    return {
      cantidadAdultos,
      cantidadNinos,
      camasRequeridas,
      cantidadVisitantes,
    };
  };

  const validarFormulario = () => {
    const {
      cantidadAdultos,
      cantidadNinos,
      camasRequeridas,
      cantidadVisitantes,
    } = obtenerDatosFormulario();

    if (
      !Number.isInteger(cantidadAdultos) ||
      cantidadAdultos < 1
    ) {
      return 'Debe existir al menos 1 adulto.';
    }

    if (
      !Number.isInteger(cantidadNinos) ||
      cantidadNinos < 0
    ) {
      return 'La cantidad de niños no puede ser negativa.';
    }

    if (
      !Number.isInteger(camasRequeridas) ||
      camasRequeridas < 1
    ) {
      return 'Debe solicitar al menos 1 cama.';
    }

    if (cantidadVisitantes < 1) {
      return 'Debe existir al menos 1 visitante.';
    }

    if (
      new Date(form.fechaSalida) <=
      new Date(form.fechaEntrada)
    ) {
      return 'La fecha de salida debe ser posterior a la fecha de entrada.';
    }

    return null;
  };

  const handleBuscar = async (e) => {
    e.preventDefault();

    setError('');
    setBusqueda(null);

    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    const {
      cantidadVisitantes,
      camasRequeridas,
    } = obtenerDatosFormulario();

    setLoadingBusca(true);

    try {
      const data = await consultarDisponibilidad(
        form.fechaEntrada,
        form.fechaSalida,
        cantidadVisitantes,
        camasRequeridas
      );

      setBusqueda(data);
      setStep('resultado');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingBusca(false);
    }
  };

  const handleConfirmar = async () => {
    if (!busqueda?.recomendada) {
      return;
    }

    setError('');
    setLoadingConf(true);

    try {
      const {
        cantidadAdultos,
        cantidadNinos,
        camasRequeridas,
      } = obtenerDatosFormulario();

      const data = await crearReservacion({
        fechaEntrada: form.fechaEntrada,
        fechaSalida: form.fechaSalida,
        cantidadAdultos,
        cantidadNinos,
        camasRequeridas,
        visitantes: [],
      });

      setReservaCreada(data.reservacion);
      setStep('confirmado');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingConf(false);
    }
  };

  const handleNueva = () => {
    setStep('buscar');
    setBusqueda(null);
    setReservaCreada(null);
    setError('');

    setForm({
      fechaEntrada: hoy(),
      fechaSalida: manana(),
      cantidadAdultos: 1,
      cantidadNinos: 0,
      camasRequeridas: 1,
    });
  };

  if (step === 'buscar') {
    return (
      <div>
        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#123c69',
            marginBottom: '1.5rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Reservar Habitación
        </h2>

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        <form
          onSubmit={handleBuscar}
          style={{ maxWidth: '600px' }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(2, minmax(0, 1fr))',
              gap: '1rem',
            }}
          >
            <div className="form-field">
              <label htmlFor="fechaEntrada">
                Fecha de entrada
              </label>

              <input
                id="fechaEntrada"
                name="fechaEntrada"
                type="date"
                min={hoy()}
                value={form.fechaEntrada}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="fechaSalida">
                Fecha de salida
              </label>

              <input
                id="fechaSalida"
                name="fechaSalida"
                type="date"
                min={form.fechaEntrada}
                value={form.fechaSalida}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="cantidadAdultos">
                Adultos
              </label>

              <input
                id="cantidadAdultos"
                name="cantidadAdultos"
                type="number"
                min="1"
                value={form.cantidadAdultos}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="cantidadNinos">
                Niños
              </label>

              <input
                id="cantidadNinos"
                name="cantidadNinos"
                type="number"
                min="0"
                value={form.cantidadNinos}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="camasRequeridas">
                Camas requeridas
              </label>

              <input
                id="camasRequeridas"
                name="camasRequeridas"
                type="number"
                min="1"
                value={form.camasRequeridas}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-new"
            disabled={loadingBusca}
            style={{ marginTop: '1.25rem' }}
          >
            {loadingBusca
              ? 'Consultando...'
              : 'Consultar disponibilidad'}
          </button>
        </form>
      </div>
    );
  }

  if (step === 'resultado') {
    const rec = busqueda?.recomendada;
    const noches = busqueda?.noches || 0;

    const {
      cantidadAdultos,
      cantidadNinos,
      camasRequeridas,
      cantidadVisitantes,
    } = obtenerDatosFormulario();

    return (
      <div>
        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#123c69',
            marginBottom: '1.5rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Habitación Recomendada
        </h2>

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        {!rec ? (
          <div
            style={{
              color: '#697582',
              fontSize: '0.9rem',
              padding: '2rem 0',
            }}
          >
            No hay habitaciones disponibles para los
            criterios seleccionados.

            <br />

            <button
              className="btn-cancel"
              style={{ marginTop: '1rem' }}
              onClick={handleNueva}
            >
              Volver a buscar
            </button>
          </div>
        ) : (
          <>
            <div className="client-room-card">
              <img
                className="client-room-image"
                src={imagenHabitacion(rec)}
                alt={`Habitación ${rec.numero_habitacion || ''} ${rec.nombre || ''}`.trim()}
              />

              <div className="client-room-card-body">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: '#b8964f',
                      textTransform: 'uppercase',
                    }}
                  >
                    Habitación Asignada
                  </span>

                  <span
                    className={`estado-badge estado-${rec.estado}`}
                  >
                    {rec.estado}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#123c69',
                    marginBottom: '0.25rem',
                  }}
                >
                  Hab. {rec.numero_habitacion}
                  {rec.nombre ? ` — ${rec.nombre}` : ''}
                </p>

                <p
                  style={{
                    fontSize: '0.82rem',
                    color: '#697582',
                    marginBottom: '1rem',
                  }}
                >
                  {rec.tipo_nombre}
                  {' · '}
                  Piso {rec.piso}
                  {' · '}
                  Capacidad {rec.capacidad_maxima} personas
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    fontSize: '0.85rem',
                  }}
                >
                  {[
                    ['Entrada', formatFecha(form.fechaEntrada)],
                    ['Salida', formatFecha(form.fechaSalida)],
                    ['Noches', noches],
                    ['Adultos', cantidadAdultos],
                    ['Niños', cantidadNinos],
                    ['Visitantes', cantidadVisitantes],
                    ['Camas requeridas', camasRequeridas],
                    ['Camas habitación', rec.total_camas || 0],
                    ['Precio/noche', formatMoneda(rec.precio_noche)],
                    [
                      'Total estimado',
                      formatMoneda(
                        parseFloat(rec.precio_noche) * noches
                      ),
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p
                        style={{
                          fontSize: '0.7rem',
                          color: '#7a8490',
                          marginBottom: '0.2rem',
                        }}
                      >
                        {label}
                      </p>

                      <p
                        style={{
                          color: '#123c69',
                          fontWeight: 600,
                        }}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <button
                className="btn-new"
                onClick={handleConfirmar}
                disabled={loadingConf}
              >
                {loadingConf
                  ? 'Confirmando...'
                  : 'Confirmar reservación'}
              </button>

              <button
                className="btn-cancel"
                onClick={handleNueva}
                disabled={loadingConf}
              >
                Volver
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (step === 'confirmado') {
    const habitacion =
      reservaCreada?.habitaciones?.[0];

    return (
      <div>
        <div className="admin-success">
          Reservación creada correctamente.
        </div>

        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#123c69',
            marginBottom: '1.5rem',
            marginTop: '1.5rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Detalle de Reservación
        </h2>

        <div className="client-room-card">
          {habitacion && (
            <img
              className="client-room-image"
              src={imagenHabitacion({
                ...habitacion,
                tipo_nombre: habitacion.tipo_nombre,
                nombre: habitacion.habitacion_nombre,
              })}
              alt={`Habitación ${habitacion.numero_habitacion || ''}`.trim()}
            />
          )}

          <div className="client-room-card-body">
            {[
              ['Código', reservaCreada?.codigo_reservacion],
              ['Estado', null],
              [
                'Habitación',
                habitacion
                  ? `Hab. ${habitacion.numero_habitacion}`
                  : '—',
              ],
              ['Adultos', reservaCreada?.cantidad_adultos],
              ['Niños', reservaCreada?.cantidad_ninos],
              ['Visitantes', reservaCreada?.cantidad_visitantes],
              ['Camas requeridas', reservaCreada?.camas_requeridas],
              ['Subtotal', formatMoneda(reservaCreada?.subtotal)],
              ['Total', formatMoneda(reservaCreada?.total)],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #161616',
                  padding: '0.45rem 0',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ color: '#7a8490' }}>
                  {label}
                </span>

                <span
                  style={{
                    fontWeight: 600,
                    color: '#123c69',
                  }}
                >
                  {label === 'Estado' ? (
                    <EstadoBadge
                      estado={reservaCreada?.estado}
                    />
                  ) : (
                    value
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          className="btn-new"
          onClick={handleNueva}
        >
          Nueva reservación
        </button>
      </div>
    );
  }

  return null;
}

// ── Sección: Mis Reservaciones ────────────────────────────────────────────────

function MisReservacionesSection() {
  const [reservaciones, setReservaciones] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [msgCancelada, setMsgCancelada] = useState('');

  const cargar = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getMisReservaciones();
      setReservaciones(data.reservaciones);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const verDetalle = async (id) => {
    setLoadingDetalle(true);
    setMsgCancelada('');

    try {
      const data = await getMiReservacion(id);
      setDetalle(data.reservacion);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleCancelar = async (id) => {
    if (
      !window.confirm(
        '¿Confirmas que deseas cancelar esta reservación?'
      )
    ) {
      return;
    }

    setCancelando(true);
    setMsgCancelada('');

    try {
      const data = await cancelarReservacion(id);

      setMsgCancelada('Reservación cancelada.');
      setDetalle(data.reservacion);

      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelando(false);
    }
  };

  if (loading) {
    return (
      <p className="admin-loading">
        Cargando reservaciones...
      </p>
    );
  }

  if (error) {
    return <div className="admin-error">{error}</div>;
  }

  if (detalle) {
    const hab = detalle.habitaciones?.[0];

    const noches =
      hab?.cantidad_noches ||
      calcularNoches(
        detalle.fecha_entrada,
        detalle.fecha_salida
      );

    const puedeCancel = [
      'PENDIENTE',
      'CONFIRMADA',
    ].includes(detalle.estado);

    return (
      <div>
        <button
          className="btn-cancel"
          style={{ marginBottom: '1.25rem' }}
          onClick={() => setDetalle(null)}
        >
          ← Volver a mis reservaciones
        </button>

        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#123c69',
            marginBottom: '1.5rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Detalle de Reservación #{detalle.id_reservacion}
        </h2>

        {msgCancelada && (
          <div className="admin-success">
            {msgCancelada}
          </div>
        )}

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #1e1e1e',
            borderRadius: 12,
            padding: '1.5rem',
            maxWidth: 540,
            marginBottom: '1.25rem',
          }}
        >
          {[
            ['Código', detalle.codigo_reservacion],
            ['Estado', null],
            [
              'Habitación',
              hab
                ? `${hab.numero_habitacion}${hab.habitacion_nombre
                  ? ` — ${hab.habitacion_nombre}`
                  : ''
                }`
                : '—',
            ],
            ['Tipo', hab?.tipo_nombre || '—'],
            ['Fecha entrada', formatFecha(detalle.fecha_entrada)],
            ['Fecha salida', formatFecha(detalle.fecha_salida)],
            ['Noches', noches],
            ['Visitantes', detalle.cantidad_visitantes],
            ['Precio/noche', formatMoneda(hab?.precio_noche_aplicado)],
            ['Total', formatMoneda(detalle.total)],
            ['Creada', formatFecha(detalle.fecha_creacion)],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid #161616',
                padding: '0.45rem 0',
                fontSize: '0.85rem',
              }}
            >
              <span style={{ color: '#7a8490' }}>
                {label}
              </span>

              <span
                style={{
                  fontWeight: 600,
                  color: '#123c69',
                }}
              >
                {label === 'Estado' ? (
                  <EstadoBadge estado={detalle.estado} />
                ) : (
                  value
                )}
              </span>
            </div>
          ))}
        </div>

        {puedeCancel && (
          <button
            className="btn-cancel"
            onClick={() =>
              handleCancelar(detalle.id_reservacion)
            }
            disabled={cancelando}
          >
            {cancelando
              ? 'Cancelando...'
              : 'Cancelar reservación'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">
          Mis Reservaciones
        </h2>

        <button
          className="btn-icon"
          onClick={cargar}
        >
          Actualizar
        </button>
      </div>

      {!reservaciones ||
        reservaciones.length === 0 ? (
        <p
          style={{
            color: '#7a8490',
            fontSize: '0.88rem',
            padding: '2rem 0',
          }}
        >
          No tienes reservaciones aún.
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Habitación</th>
                <th>Tipo</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {reservaciones.map((r) => (
                <tr key={r.id_reservacion}>
                  <td className="muted">
                    #{r.id_reservacion}
                  </td>

                  <td>
                    {r.numero_habitacion || '—'}
                  </td>

                  <td className="muted">
                    {r.tipo_habitacion || '—'}
                  </td>

                  <td className="muted">
                    {formatFecha(r.fecha_entrada)}
                  </td>

                  <td className="muted">
                    {formatFecha(r.fecha_salida)}
                  </td>

                  <td>
                    {formatMoneda(r.total)}
                  </td>

                  <td>
                    <EstadoBadge estado={r.estado} />
                  </td>

                  <td>
                    <button
                      className="btn-icon"
                      onClick={() =>
                        verDetalle(r.id_reservacion)
                      }
                      disabled={loadingDetalle}
                    >
                      Ver
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

// ── Servicios ─────────────────────────────────────────────────────────────────

function ServiciosClienteSection() {
  const [reservaciones, setReservaciones] = useState([]);
  const [selectedResId, setSelectedResId] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [associated, setAssociated] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargarReservaciones = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await getMisReservaciones();

      const compatibles = (
        res.reservaciones || []
      ).filter(
        (r) =>
          !['CANCELADA', 'CHECK_OUT'].includes(r.estado)
      );

      setReservaciones(compatibles);

      if (compatibles.length > 0) {
        setSelectedResId(
          String(compatibles[0].id_reservacion)
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarCatalog = async () => {
    try {
      const res = await getServiciosCliente();
      setCatalog(res.servicios || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarReservaciones();
    cargarCatalog();
  }, []);

  const cargarServiciosAsociados = async (resId) => {
    if (!resId) {
      return;
    }

    setLoadingServices(true);

    try {
      const res = await getServiciosReservacion(resId);
      setAssociated(res.servicios || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    if (selectedResId) {
      cargarServiciosAsociados(selectedResId);
    } else {
      setAssociated([]);
    }
  }, [selectedResId]);

  const flash = (msg) => {
    setSuccess(msg);

    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  const handleAgregarServicio = async (idServicio) => {
    if (!selectedResId) {
      return;
    }

    setError('');

    try {
      const res = await agregarServicioReservacion(
        selectedResId,
        idServicio,
        1
      );

      setAssociated(res.servicios || []);

      flash(
        'Servicio agregado correctamente a la reservación.'
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuitarServicio = async (
    idReservacionServicio
  ) => {
    if (!selectedResId) {
      return;
    }

    if (
      !window.confirm(
        '¿Confirmas que deseas quitar este servicio de la reservación?'
      )
    ) {
      return;
    }

    setError('');

    try {
      const res = await quitarServicioReservacion(
        selectedResId,
        idReservacionServicio
      );

      setAssociated(res.servicios || []);

      flash('Servicio removido correctamente.');
    } catch (err) {
      setError(err.message);
    }
  };

  const currentRes = reservaciones.find(
    (r) =>
      String(r.id_reservacion) === selectedResId
  );

  if (loading) {
    return (
      <p className="admin-loading">
        Cargando reservaciones...
      </p>
    );
  }

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">
          Servicios Adicionales
        </h2>
      </div>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-success">
          {success}
        </div>
      )}

      {reservaciones.length === 0 ? (
        <div
          style={{
            color: '#697582',
            fontSize: '0.9rem',
            padding: '2rem 0',
          }}
        >
          No tienes reservaciones activas compatibles
          para gestionar servicios adicionales.
        </div>
      ) : (
        <div>
          <div
            className="form-field"
            style={{
              maxWidth: '400px',
              marginBottom: '2rem',
            }}
          >
            <label htmlFor="select-reservacion">
              Selecciona una de tus Reservaciones Activas
            </label>

            <select
              id="select-reservacion"
              value={selectedResId}
              onChange={(e) =>
                setSelectedResId(e.target.value)
              }
            >
              {reservaciones.map((r) => (
                <option
                  key={r.id_reservacion}
                  value={r.id_reservacion}
                >
                  Reservación #{r.id_reservacion} -
                  Hab. {r.numero_habitacion || '—'}
                </option>
              ))}
            </select>

            {currentRes && (
              <div
                style={{
                  marginTop: '0.5rem',
                  fontSize: '0.8rem',
                }}
              >
                Estado de la reservación:{' '}
                <EstadoBadge estado={currentRes.estado} />
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#123c69',
                  marginBottom: '1rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Catálogo de Servicios Disponibles
              </h3>

              {catalog.length === 0 ? (
                <p className="muted">
                  No hay servicios adicionales activos.
                </p>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  {catalog.map((s) => (
                    <div
                      key={s.id_servicio}
                      className="client-service-card"
                    >
                      <img
                        className="client-service-image"
                        src={imagenServicio(s.nombre)}
                        alt={s.nombre}
                      />

                      <div className="client-service-copy">
                        <p
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#123c69',
                            margin: 0,
                          }}
                        >
                          {s.nombre}
                        </p>

                        <p
                          className="muted"
                          style={{
                            fontSize: '0.78rem',
                            margin: '0.25rem 0 0 0',
                            color: '#697582',
                          }}
                        >
                          {s.descripcion || 'Sin descripción'}
                        </p>

                        <p
                          style={{
                            fontSize: '0.85rem',
                            color: '#b8964f',
                            fontWeight: 600,
                            margin: '0.4rem 0 0 0',
                          }}
                        >
                          Q {Number(s.precio).toFixed(2)}
                        </p>
                      </div>

                      <button
                        className="btn-new"
                        onClick={() =>
                          handleAgregarServicio(s.id_servicio)
                        }
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.4rem 0.8rem',
                        }}
                      >
                        + Agregar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#123c69',
                  marginBottom: '1rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Servicios en esta Reservación
              </h3>

              {loadingServices ? (
                <p className="admin-loading">
                  Cargando servicios asociados...
                </p>
              ) : associated.length === 0 ? (
                <p className="muted">
                  No has agregado servicios adicionales.
                </p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Servicio</th>
                        <th>Cant.</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>

                    <tbody>
                      {associated.map((asoc) => (
                        <tr
                          key={asoc.id_reservacion_servicio}
                        >
                          <td>
                            {asoc.servicio_nombre}
                          </td>

                          <td>
                            {asoc.cantidad}
                          </td>

                          <td>
                            Q{' '}
                            {Number(
                              asoc.precio_unitario_aplicado
                            ).toFixed(2)}
                          </td>

                          <td>
                            Q{' '}
                            {Number(
                              asoc.subtotal
                            ).toFixed(2)}
                          </td>

                          <td>
                            <button
                              className="btn-icon danger"
                              onClick={() =>
                                handleQuitarServicio(
                                  asoc.id_reservacion_servicio
                                )
                              }
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div
                    style={{
                      padding: '0.8rem 1rem',
                      background: '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 700,
                    }}
                  >
                    <span>Total en Servicios:</span>

                    <span style={{ color: '#b8964f' }}>
                      Q{' '}
                      {associated
                        .reduce(
                          (sum, asoc) =>
                            sum +
                            parseFloat(asoc.subtotal),
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Actividades ───────────────────────────────────────────────────────────────

function ActividadesClienteSection() {
  const [actividades, setActividades] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargar = async () => {
    setLoading(true);
    setError('');

    try {
      const [actData, insData] = await Promise.all([
        getActividadesCliente(),
        getMisInscripciones(),
      ]);

      setActividades(actData.actividades || []);
      setInscripciones(insData.inscripciones || []);
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

    window.setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  const inscribirse = async (idActividad) => {
    const cantidad = Number(
      cantidades[idActividad] || 1
    );

    setProcesando(`act-${idActividad}`);
    setError('');

    try {
      await inscribirseActividad(
        idActividad,
        cantidad
      );

      flash('Inscripción realizada correctamente.');

      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(null);
    }
  };

  const cancelar = async (idInscripcion) => {
    if (
      !window.confirm(
        '¿Cancelar esta inscripción?'
      )
    ) {
      return;
    }

    setProcesando(`ins-${idInscripcion}`);
    setError('');

    try {
      await cancelarInscripcion(idInscripcion);

      flash('Inscripción cancelada.');

      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(null);
    }
  };

  const idsInscritos = new Set(
    inscripciones
      .filter(
        (ins) => ins.estado === 'CONFIRMADA'
      )
      .map((ins) => Number(ins.id_actividad))
  );

  if (loading) {
    return (
      <p className="admin-loading">
        Cargando actividades...
      </p>
    );
  }

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">
          Actividades del Hotel
        </h2>

        <button
          className="btn-icon"
          onClick={cargar}
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-success">
          {success}
        </div>
      )}

      <h3
        style={{
          color: '#123c69',
          fontSize: '.9rem',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          marginBottom: '1rem',
        }}
      >
        Disponibles
      </h3>

      {actividades.length === 0 ? (
        <p className="muted">
          No hay actividades disponibles.
        </p>
      ) : (
        <div className="client-activity-grid">
          {actividades.map((actividad) => {
            const inscritos = Number(
              actividad.inscritos_actuales || 0
            );

            const cupo = Number(
              actividad.cupo_maximo || 0
            );

            const disponible = Math.max(
              0,
              cupo - inscritos
            );

            const yaInscrito = idsInscritos.has(
              Number(actividad.id_actividad)
            );

            return (
              <article
                key={actividad.id_actividad}
                className="client-activity-card"
              >
                <img
                  className="client-activity-image"
                  src={imagenActividad(
                    actividad.nombre
                  )}
                  alt={actividad.nombre}
                />

                <div className="client-activity-body">
                  <p
                    style={{
                      color: '#b8964f',
                      fontSize: '.68rem',
                      fontWeight: 700,
                      letterSpacing: '.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {actividad.estado}
                  </p>

                  <h3
                    style={{
                      color: '#123c69',
                      margin: '.5rem 0',
                    }}
                  >
                    {actividad.nombre}
                  </h3>

                  <p
                    className="muted"
                    style={{ fontSize: '.82rem' }}
                  >
                    {actividad.descripcion ||
                      'Sin descripción'}
                  </p>

                  <div
                    style={{
                      marginTop: '1rem',
                      fontSize: '.82rem',
                      color: '#667789',
                    }}
                  >
                    <p>
                      {formatFecha(
                        actividad.fecha_actividad
                      )}
                    </p>

                    <p>
                      {String(
                        actividad.hora_inicio || ''
                      ).slice(0, 5)}
                    </p>

                    <p>
                      {actividad.ubicacion ||
                        'Sin ubicación'}
                    </p>

                    <p>
                      {formatMoneda(actividad.precio)}
                    </p>

                    <p>
                      Cupo disponible: {disponible}
                    </p>
                  </div>

                  {yaInscrito ? (
                    <p
                      style={{
                        color: '#6be0a0',
                        fontWeight: 700,
                        marginTop: '1rem',
                      }}
                    >
                      Ya estás inscrito
                    </p>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        gap: '.5rem',
                        marginTop: '1rem',
                      }}
                    >
                      <input
                        type="number"
                        min="1"
                        max={Math.max(1, disponible)}
                        value={
                          cantidades[
                          actividad.id_actividad
                          ] || 1
                        }
                        onChange={(event) =>
                          setCantidades((actual) => ({
                            ...actual,
                            [actividad.id_actividad]:
                              event.target.value,
                          }))
                        }
                        style={{ maxWidth: 80 }}
                      />

                      <button
                        className="btn-new"
                        onClick={() =>
                          inscribirse(
                            actividad.id_actividad
                          )
                        }
                        disabled={
                          disponible < 1 ||
                          procesando ===
                          `act-${actividad.id_actividad}`
                        }
                      >
                        {procesando ===
                          `act-${actividad.id_actividad}`
                          ? 'Inscribiendo...'
                          : 'Inscribirme'}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <h3
        style={{
          color: '#123c69',
          fontSize: '.9rem',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          marginBottom: '1rem',
        }}
      >
        Mis Inscripciones
      </h3>

      {inscripciones.length === 0 ? (
        <p className="muted">
          Todavía no tienes inscripciones.
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Actividad</th>
                <th>Fecha</th>
                <th>Personas</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {inscripciones.map((inscripcion) => (
                <tr key={inscripcion.id_inscripcion}>
                  <td>
                    {inscripcion.actividad_nombre}
                  </td>

                  <td className="muted">
                    {formatFecha(
                      inscripcion.fecha_actividad
                    )}
                  </td>

                  <td>
                    {inscripcion.cantidad_personas}
                  </td>

                  <td>
                    {formatMoneda(
                      inscripcion.precio_total
                    )}
                  </td>

                  <td>
                    {inscripcion.estado}
                  </td>

                  <td>
                    {inscripcion.estado ===
                      'CONFIRMADA' && (
                        <button
                          className="btn-icon danger"
                          onClick={() =>
                            cancelar(
                              inscripcion.id_inscripcion
                            )
                          }
                          disabled={
                            procesando ===
                            `ins-${inscripcion.id_inscripcion}`
                          }
                        >
                          Cancelar
                        </button>
                      )}
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

// ── Pases de Día ──────────────────────────────────────────────────────────────

function PasesClienteSection() {
  const [tipos, setTipos] = useState([]);
  const [misPases, setMisPases] = useState([]);
  const [fechaUso, setFechaUso] = useState(hoy());
  const [cantidades, setCantidades] = useState({});
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargar = async () => {
    setLoading(true);
    setError('');

    try {
      const [tiposData, pasesData] =
        await Promise.all([
          getTiposPaseCliente(),
          getMisPases(),
        ]);

      setTipos(tiposData.tipos || []);
      setMisPases(pasesData.pases || []);
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

    window.setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  const comprar = async (tipo) => {
    const cantidad = Number(
      cantidades[tipo.id_tipo_pase] || 1
    );

    setProcesando(tipo.id_tipo_pase);
    setError('');

    try {
      await adquirirPase({
        idTipoPase: tipo.id_tipo_pase,
        fechaUso,
        cantidadPersonas: cantidad,
      });

      flash('Pase adquirido correctamente.');

      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(null);
    }
  };

  if (loading) {
    return (
      <p className="admin-loading">
        Cargando pases...
      </p>
    );
  }

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">
          Pases de Día
        </h2>

        <button
          className="btn-icon"
          onClick={cargar}
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-success">
          {success}
        </div>
      )}

      <div
        className="form-field"
        style={{
          maxWidth: 320,
          marginBottom: '1.5rem',
        }}
      >
        <label htmlFor="fecha-uso-pase">
          Fecha de uso
        </label>

        <input
          id="fecha-uso-pase"
          type="date"
          min={hoy()}
          value={fechaUso}
          onChange={(e) =>
            setFechaUso(e.target.value)
          }
        />
      </div>

      <h3
        style={{
          color: '#123c69',
          marginBottom: '1rem',
        }}
      >
        Pases disponibles
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '2.5rem',
        }}
      >
        {tipos.map((tipo) => (
          <div
            key={tipo.id_tipo_pase}
            style={{
              background: '#ffffff',
              border: '1px solid #1e1e1e',
              borderRadius: 12,
              padding: '1.25rem',
            }}
          >
            <p
              style={{
                color: '#b8964f',
                fontSize: '.68rem',
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
              }}
            >
              {tipo.estado}
            </p>

            <h3
              style={{
                color: '#123c69',
                margin: '.5rem 0',
              }}
            >
              {tipo.nombre}
            </h3>

            <p
              className="muted"
              style={{ fontSize: '.82rem' }}
            >
              {tipo.descripcion ||
                'Sin descripción'}
            </p>

            <p
              style={{
                color: '#b8964f',
                fontWeight: 700,
                fontSize: '1.1rem',
                marginTop: '1rem',
              }}
            >
              {formatMoneda(tipo.precio)}
            </p>

            <p
              className="muted"
              style={{
                fontSize: '.8rem',
                marginTop: '.5rem',
              }}
            >
              Máximo {tipo.cantidad_maxima_personas}{' '}
              personas
            </p>

            <p
              className="muted"
              style={{
                fontSize: '.8rem',
                marginTop: '.5rem',
              }}
            >
              Incluye:{' '}
              {tipo.servicios_incluidos ||
                'Sin servicios especificados'}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '.5rem',
                marginTop: '1rem',
              }}
            >
              <input
                type="number"
                min="1"
                max={tipo.cantidad_maxima_personas}
                value={
                  cantidades[tipo.id_tipo_pase] || 1
                }
                onChange={(e) =>
                  setCantidades((actual) => ({
                    ...actual,
                    [tipo.id_tipo_pase]:
                      e.target.value,
                  }))
                }
                style={{ maxWidth: 80 }}
              />

              <button
                className="btn-new"
                onClick={() => comprar(tipo)}
                disabled={
                  procesando === tipo.id_tipo_pase
                }
              >
                {procesando === tipo.id_tipo_pase
                  ? 'Adquiriendo...'
                  : 'Adquirir pase'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <h3
        style={{
          color: '#123c69',
          marginBottom: '1rem',
        }}
      >
        Mis Pases
      </h3>

      {misPases.length === 0 ? (
        <p className="muted">
          Todavía no has adquirido pases.
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Fecha de uso</th>
                <th>Personas</th>
                <th>Precio</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {misPases.map((pase) => (
                <tr key={pase.id_pase_cliente}>
                  <td
                    style={{
                      fontWeight: 700,
                      color: '#b8964f',
                    }}
                  >
                    {pase.codigo_pase}
                  </td>

                  <td>
                    {pase.tipo_pase_nombre}
                  </td>

                  <td className="muted">
                    {formatFecha(pase.fecha_uso)}
                  </td>

                  <td>
                    {pase.cantidad_personas}
                  </td>

                  <td>
                    {formatMoneda(
                      pase.precio_aplicado
                    )}
                  </td>

                  <td>
                    {pase.estado}
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

// ── Página principal ──────────────────────────────────────────────────────────

const SECCIONES_CLIENTE = [
  {
    id: 'reservar',
    label: 'Reservar habitación',
    icon: 'room',
  },
  {
    id: 'misreservas',
    label: 'Mis reservaciones',
    icon: 'reservations',
  },
  {
    id: 'servicios',
    label: 'Servicios Adicionales',
    icon: 'services',
  },
  {
    id: 'actividades',
    label: 'Actividades',
    icon: 'activities',
  },
  {
    id: 'pases',
    label: 'Pases de Día',
    icon: 'pass',
  },
  {
    id: 'codigos',
    label: 'Códigos de acceso',
    icon: 'qr',
  },
  {
    id: 'calificaciones',
    label: 'Calificar estancia',
    icon: 'star',
  },
];

export default function ReservasPage() {
  const { systemUser, logout } = useAuth();
  const navigate = useNavigate();

  const [seccion, setSeccion] = useState('reservar');
  const [menuOpen, setMenuOpen] = useState(false);

  const selectSection = (id) => {
    setSeccion(id);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();

    navigate('/login', {
      replace: true,
    });
  };

  return (
    <div className="admin-layout client-layout">
      <button
        className="mobile-menu-button"
        onClick={() => setMenuOpen(true)}
        aria-label="Abrir menú"
      >
        <HotelIcon name="menu" />
      </button>

      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`admin-sidebar ${menuOpen ? 'open' : ''
          }`}
      >
        <button
          className="sidebar-close"
          onClick={() => setMenuOpen(false)}
          aria-label="Cerrar menú"
        >
          <HotelIcon name="close" />
        </button>

        <Link
          to="/"
          className="admin-brand-lockup brand-link"
        >
          <div
            className="admin-brand-mark"
            aria-hidden="true"
          >
            W
          </div>

          <div>
            <p className="admin-sidebar-brand">
              Hotel Wall Street
            </p>

            <p className="admin-sidebar-sub">
              Mi cuenta
            </p>
          </div>
        </Link>

        <nav>
          <ul className="admin-nav">
            <li>
              <button
                className="admin-nav-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/perfil');
                }}
              >
                <HotelIcon name="profile" />
                <span>Mi perfil</span>
              </button>
            </li>

            {SECCIONES_CLIENTE.map((s) => (
              <li key={s.id}>
                <button
                  className={`admin-nav-item ${seccion === s.id
                    ? 'active'
                    : ''
                    }`}
                  onClick={() =>
                    selectSection(s.id)
                  }
                >
                  <HotelIcon name={s.icon} />
                  <span>{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <p className="admin-sidebar-user">
            {systemUser?.correo}
          </p>

          <button
            className="btn-logout"
            style={{ width: '100%' }}
            onClick={handleLogout}
          >
            <HotelIcon name="logout" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-topbar">
          <span className="admin-topbar-title">
            {SECCIONES_CLIENTE.find(
              (s) => s.id === seccion
            )?.label || 'Reservaciones'}
          </span>

          <div>
            <span>{systemUser?.correo}</span>

            <span className="topbar-role">
              {systemUser?.rol}
            </span>
          </div>
        </header>

        <main className="admin-main">
          {seccion === 'reservar' && (
            <ReservarSection />
          )}

          {seccion === 'misreservas' && (
            <MisReservacionesSection />
          )}

          {seccion === 'servicios' && (
            <ServiciosClienteSection />
          )}

          {seccion === 'actividades' && (
            <ActividadesClienteSection />
          )}

          {seccion === 'pases' && (
            <PasesClienteSection />
          )}

          {seccion === 'codigos' && (
            <CodigosAccesoSection />
          )}

          {seccion === 'calificaciones' && (
            <CalificacionesSection />
          )}
        </main>
      </div>
    </div>
  );
}