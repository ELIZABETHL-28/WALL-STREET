import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/home.css';
import heroFacade from '../assets/hotel/facade.jpg';
import heroSuite from '../assets/hotel/suite_presidential.jpg';
import heroTerrace from '../assets/hotel/terrace.jpg';
import lobbyImage from '../assets/hotel/lobby.jpg';
import poolImage from '../assets/hotel/pool.jpg';


const SLIDES = [
  {
    image: heroFacade,
    eyebrow: 'HOTEL WALL STREET',
    title: 'Un refugio de calma, confort y elegancia.',
    text: 'Descubre un lugar donde cada detalle está pensado para brindar descanso, armonía y una estancia memorable.',
  },
  {
    image: heroSuite,
    eyebrow: 'SUITES Y HABITACIONES',
    title: 'Espacios que invitan a bajar el ritmo.',
    text: 'Ambientes cálidos, cómodos y serenos para recuperar energía después de un día intenso.',
  },
  {
    image: heroTerrace,
    eyebrow: 'UNA ESTANCIA A TU RITMO',
    title: 'Todo lo que necesitas, en un solo lugar.',
    text: 'Reservaciones, servicios, actividades y experiencias pensadas para hacer más simple cada momento de tu visita.',
  },
];

const BENEFITS = [
  {
    number: '01',
    title: 'Ambientes acogedores',
    text: 'Espacios diseñados para transmitir calma, armonía y bienestar desde el primer momento.',
  },
  {
    number: '02',
    title: 'Reservación sencilla',
    text: 'Consulta disponibilidad y organiza tu estancia de forma rápida, clara y segura.',
  },
  {
    number: '03',
    title: 'Servicios exclusivos',
    text: 'Complementa tu visita con opciones creadas para brindarte comodidad y atención personalizada.',
  },
  {
    number: '04',
    title: 'Experiencias memorables',
    text: 'Descubre actividades y pases especiales que hacen de cada estancia una experiencia distinta.',
  },
];

function today() {
  return new Date().toISOString().split('T')[0];
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

export default function HomePage() {
  const navigate = useNavigate();
  const { systemUser } = useAuth();
  const [active, setActive] = useState(0);
  const [form, setForm] = useState({
    entrada: today(),
    salida: tomorrow(),
    huespedes: 1,
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % SLIDES.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, []);

  const accountRoute = systemUser
    ? systemUser.rol === 'ADMIN'
      ? '/admin'
      : '/reservas'
    : '/login';

  const handleAvailability = (event) => {
    event.preventDefault();

    if (!systemUser) {
      navigate('/login');
      return;
    }

    navigate(systemUser.rol === 'ADMIN' ? '/admin' : '/reservas');
  };

  return (
    <main className="hotel-home">
      <section className="home-hero" id="inicio">
        <div className="hero-slider" aria-hidden="true">
          {SLIDES.map((slide, index) => (
            <div
              key={slide.image}
              className={`hero-slide ${index === active ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
        </div>

        <div className="hero-overlay" />

        <div className="hero-shell">
          <nav className="home-nav">
            <button className="home-brand" onClick={() => navigate('/')}>
              <span className="home-brand-mark">W</span>
              <span>
                <strong>Hotel Wall Street</strong>
                <small>Sistema Web Integral de Gestión Hotelera y Reservaciones</small>
              </span>
            </button>

            <div className="home-nav-links">
              <a href="#hotel">El hotel</a>
              <a href="#elegirnos">Por qué elegirnos</a>
              <a href="#reservar">Reservaciones</a>
              <a href="#contacto">Contacto</a>
            </div>

            <button className="home-account" onClick={() => navigate(accountRoute)}>
              {systemUser ? 'Ir a mi cuenta' : 'Iniciar sesión'}
            </button>
          </nav>

          <div className="hero-content">
            <p className="hero-eyebrow">{SLIDES[active].eyebrow}</p>
            <h1>{SLIDES[active].title}</h1>
            <p className="hero-copy">{SLIDES[active].text}</p>

            <div className="hero-actions">
              <a className="hero-primary" href="#reservar">Ver disponibilidad</a>
              {!systemUser && (
                <button className="hero-secondary" onClick={() => navigate('/registro')}>
                  Crear cuenta
                </button>
              )}
            </div>
          </div>

          <form className="availability-bar" id="reservar" onSubmit={handleAvailability}>
            <label>
              <span>Entrada</span>
              <input
                type="date"
                min={today()}
                value={form.entrada}
                onChange={(event) => setForm({ ...form, entrada: event.target.value })}
              />
            </label>

            <label>
              <span>Salida</span>
              <input
                type="date"
                min={form.entrada}
                value={form.salida}
                onChange={(event) => setForm({ ...form, salida: event.target.value })}
              />
            </label>

            <label>
              <span>Huéspedes</span>
              <input
                type="number"
                min="1"
                value={form.huespedes}
                onChange={(event) => setForm({ ...form, huespedes: event.target.value })}
              />
            </label>

            <button type="submit">Ver disponibilidad</button>
          </form>

          <div className="hero-indicators" aria-label="Carrusel de imágenes">
            {SLIDES.map((slide, index) => (
              <button
                key={slide.image}
                type="button"
                className={index === active ? 'active' : ''}
                aria-label={`Mostrar imagen ${index + 1}`}
                onClick={() => setActive(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="hotel-story" id="hotel">
        <div className="story-image-wrap">
          <img
            className="story-image"
            src={lobbyImage}
            alt="Interior cálido y elegante de Hotel Wall Street"
          />
          <span className="story-monogram" aria-hidden="true">W</span>
        </div>

        <div className="story-card">
          <p className="section-kicker">Sobre Hotel Wall Street</p>
          <h2>Un espacio creado para respirar, descansar y sentirse bien.</h2>
          <p>
            En Hotel Wall Street ofrecemos una experiencia de hospedaje pensada
            para quienes valoran la tranquilidad, la comodidad y un servicio de
            calidad. Cada espacio busca transmitir serenidad y hacer que cada
            visita se sienta especial.
          </p>
          <p>
            Nuestra propuesta combina atención, organización y tecnología para
            que puedas gestionar tu estancia de forma sencilla, sin perder la
            calidez de una experiencia hotelera cercana.
          </p>
          <a className="text-link" href="#elegirnos">Descubre la experiencia</a>
        </div>
      </section>

      <section className="benefits-section" id="elegirnos">
        <div className="section-heading">
          <p className="section-kicker">La experiencia Wall Street</p>
          <h2>¿Por qué elegirnos?</h2>
          <p>
            Comodidad, atención y una experiencia digital pensada para hacer tu
            estancia más simple desde el primer contacto.
          </p>
        </div>

        <div className="benefits-grid">
          {BENEFITS.map((benefit) => (
            <article className="benefit-card" key={benefit.number}>
              <span>{benefit.number}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="experience-banner" style={{ backgroundImage: `linear-gradient(90deg, rgba(8,36,62,.88), rgba(8,36,62,.35)), url(${poolImage})` }}>
        <div>
          <p className="section-kicker">Tu próxima estancia comienza aquí</p>
          <h2>Regálate un momento de calma, confort y elegancia.</h2>
        </div>
        <button onClick={() => navigate(systemUser ? accountRoute : '/registro')}>
          {systemUser ? 'Ir a mi cuenta' : 'Crear mi cuenta'}
        </button>
      </section>

      <footer className="home-footer" id="contacto">
        <div className="footer-main">
          <div className="footer-brand">
            <span className="footer-mark">W</span>
            <h3>Hotel Wall Street</h3>
            <p>
              Elegancia, comodidad y tranquilidad para una estancia memorable.
            </p>
          </div>

          <div className="footer-column">
            <h4>Explora</h4>
            <a href="#inicio">Inicio</a>
            <a href="#hotel">El hotel</a>
            <a href="#elegirnos">Experiencia</a>
            <a href="#reservar">Reservaciones</a>
          </div>

          <div className="footer-column">
            <h4>Ayuda</h4>
            <button onClick={() => navigate('/login')}>Iniciar sesión</button>
            <button onClick={() => navigate('/registro')}>Crear cuenta</button>
            <span>Políticas de reservación</span>
            <span>Privacidad</span>
          </div>

          <div className="footer-column footer-contact">
            <h4>Contacto</h4>
            <span>Ciudad de Guatemala, Guatemala</span>
            <span>+502 0000-0000</span>
            <span>info@hotelwallstreet.com</span>
            <span>Atención 24 horas</span>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Hotel Wall Street. Todos los derechos reservados.</p>
          <div className="social-links" aria-label="Redes sociales">
            <a href="#contacto">Instagram</a>
            <a href="#contacto">Facebook</a>
            <a href="#contacto">WhatsApp</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
