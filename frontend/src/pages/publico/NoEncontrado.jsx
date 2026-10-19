import { Link } from 'react-router-dom';

export default function NoEncontrado() {
  return (
    <div className="pagina-postulacion">
      <section className="hero-postulacion pagina-no-encontrada">
        <span className="hero-etiqueta">Error 404</span>
        <h1>Página no encontrada</h1>
        <p>La dirección que buscas no existe o fue movida. Puedes volver al inicio o ir a la postulación.</p>
        <div className="cabecera-dashboard-acciones">
          <Link to="/" className="boton boton-primario boton-lg">
            <i className="bi bi-house" aria-hidden="true" /> Ir al inicio
          </Link>
          <Link to="/postulacion" className="boton boton-secundario boton-lg">
            <i className="bi bi-arrow-right" aria-hidden="true" /> Postular
          </Link>
        </div>
      </section>
    </div>
  );
}
