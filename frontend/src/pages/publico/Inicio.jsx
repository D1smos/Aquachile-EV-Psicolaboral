import { Link } from 'react-router-dom';
import TarjetaMetrica from '../../components/TarjetaMetrica.jsx';

export default function Inicio() {
  return (
    <div className="pagina-postulacion">
      <section className="hero-postulacion">
        <span className="hero-etiqueta">Reclutamiento y Selección · AquaChile</span>
        <h1>Evaluaciones psicolaborales</h1>
        <p>
          Postula a nuestras ofertas en pocos minutos. Completa tus datos, adjunta tu CV y sigue
          tu proceso con un folio único de seguimiento.
        </p>
        <div className="cabecera-dashboard-acciones">
          <Link to="/postulacion" className="boton boton-primario boton-lg">
            <i className="bi bi-arrow-right" aria-hidden="true" /> Postular ahora
          </Link>
          <Link to="/login" className="boton boton-secundario boton-lg">
            <i className="bi bi-shield-check" aria-hidden="true" /> Soy evaluador
          </Link>
        </div>
      </section>

      <section className="contenedor contenido-formulario" aria-label="Cómo funciona el proceso">
        <div className="rejilla-kpi">
          <TarjetaMetrica
            titulo="1 · Postula"
            valor="Formulario"
            detalle="Datos básicos, cargo al que postulas y tu CV en PDF, DOC o DOCX."
            tono="azul"
            icono="bi-pencil-square"
          />
          <TarjetaMetrica
            titulo="2 · Evaluamos"
            valor="Entrevista"
            detalle="El equipo revisa tus antecedentes y registra la evaluación psicolaboral."
            tono="cian"
            icono="bi-clipboard2-check-fill"
          />
          <TarjetaMetrica
            titulo="3 · Resultado"
            valor="Folio único"
            detalle="Tu postulación avanza por etapas: Pendiente, En Proceso, Aprobado o Rechazado."
            tono="verde"
            icono="bi-patch-check-fill"
          />
        </div>
        <p className="nota-privacidad">
          <i className="bi bi-shield-check" aria-hidden="true" /> Tus datos se usan solo para este
          proceso de selección y no se comparten con terceros.
        </p>
      </section>
    </div>
  );
}
