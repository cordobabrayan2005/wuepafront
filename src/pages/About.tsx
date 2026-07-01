import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gem, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import AuthenticatedTopBar from '../components/AuthenticatedTopBar';
import MobileBottomNav from '../components/MobileBottomNav';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { useAuthStore } from '../stores/authStore';

const aboutFeatures = [
  {
    icon: Gem,
    title: 'Piezas con caracter',
    text: 'Curamos accesorios pensados para resaltar tu estilo diario, con acabados delicados y combinaciones faciles de usar.',
  },
  {
    icon: ShieldCheck,
    title: 'Compra clara',
    text: 'Cuidamos cada paso del pedido para que puedas revisar tus productos, confirmar tus datos y comprar con tranquilidad.',
  },
  {
    icon: HeartHandshake,
    title: 'Atencion cercana',
    text: 'Te acompanamos para elegir piezas, coordinar entregas y resolver dudas con una experiencia humana y sencilla.',
  },
];

export default function About() {
  const navigate = useNavigate();
  const { isAuthed } = useAuthStore();
  const isAuthenticated = isAuthed || Boolean(localStorage.getItem('user'));

  useEffect(() => {
    document.body.classList.remove('login-page');
  }, []);

  function handleGoBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(isAuthenticated ? '/buy' : '/');
  }

  return (
    <main className="about-page about-page-new" role="main" aria-labelledby="about-title">
      {isAuthenticated ? (
        <AuthenticatedTopBar active="home" />
      ) : (
        <header className="about-public-header">
          <Link to="/" className="buy-brand" aria-label="Ir al inicio">
            <h1>Wuepa</h1>
            <p>Jewelry</p>
          </Link>
          <nav aria-label="Navegacion principal">
            <Link to="/">Inicio</Link>
            <Link to="/productssin">Catalogo</Link>
            <Link to="/login" className="about-header-action">Ingresar</Link>
          </nav>
        </header>
      )}

      <section className="about-hero">
        <div className="about-hero-media" aria-hidden="true">
          <img src="/collagewue.png" alt="" />
        </div>
        <div className="about-hero-inner">
          <p className="about-kicker">
            <Sparkles aria-hidden="true" />
            Accesorios que hablan por ti
          </p>
          <h1 id="about-title">Wuepa Jewelry</h1>
          <p className="about-sub">Joyas y accesorios para acompanar tu esencia, tus planes y esos detalles que vuelven especial lo cotidiano.</p>
          <div className="about-hero-actions">
            <Link to={isAuthenticated ? '/products' : '/productssin'} className="primary-button">
              Ver colecciones
              <span aria-hidden="true">-&gt;</span>
            </Link>
            <button type="button" className="about-secondary-button" onClick={handleGoBack}>
              Volver
            </button>
          </div>
        </div>
      </section>

      <section className="about-content container" aria-label="Informacion sobre Wuepa">
        <div className="about-story">
          <p className="about-kicker">Nuestra historia</p>
          <h2 className="section-title">Detalles elegidos con intencion</h2>
          <p className="lead">
            Wuepa nace para reunir accesorios versatiles, expresivos y faciles de combinar. Cada pieza esta pensada para sentirse cercana:
            un brillo sutil para el dia a dia, un acento especial para salir, o un regalo que diga algo bonito sin explicarlo demasiado.
          </p>
        </div>

        <div className="features-grid">
          {aboutFeatures.map(({ icon: Icon, title, text }) => (
            <article className="feature-card" key={title}>
              <div className="feature-icon">
                <Icon aria-hidden="true" />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <section className="about-mission" aria-labelledby="about-mission-title">
          <div>
            <p className="about-kicker">Mision</p>
            <h2 id="about-mission-title" className="section-title">Que cada persona encuentre una pieza que se sienta suya</h2>
          </div>
          <p>
            Creemos que los accesorios no tienen que ser complicados para tener presencia. Nuestra mision es ofrecer joyas que inspiren
            confianza, alegria y una forma muy propia de brillar.
          </p>
        </section>

        <div className="version-row">
          <div className="version-box">
            <h3>Tienda digital Wuepa</h3>
            <div className="version-badges">
              <span className="badge">v1.0.0</span>
              <span className="badge green">Activa</span>
            </div>
            <p className="muted">Construida con React, Vite, TypeScript y SASS para mostrar catalogo, carrito y pedidos de forma clara.</p>
          </div>

          <div className="dev-box">
            <h3>Hecho por</h3>
            <div className="dev-badge">Joyeria Wuepa</div>
          </div>
        </div>
      </section>

      <ScrollToTopButton />
      <MobileBottomNav active={isAuthenticated ? 'home' : 'products'} variant={isAuthenticated ? 'auth' : 'public'} />
    </main>
  );
}
