import { Link } from 'react-router-dom';
import EstadoBadge from '../../components/EstadoBadge.jsx';

const PASOS = [
  {
    numero: '01',
    icono: 'bi-pencil-square',
    titulo: 'Postula en línea',
    detalle: 'Completa tus datos y adjunta tu CV en PDF, DOC o DOCX. Te tomará solo unos minutos.',
  },
  {
    numero: '02',
    icono: 'bi-clipboard2-check',
    titulo: 'Evaluamos tu perfil',
    detalle: 'Revisamos tus antecedentes y registramos la evaluación psicolaboral de forma confidencial.',
  },
  {
    numero: '03',
    icono: 'bi-patch-check',
    titulo: 'Recibe tu resultado',
    detalle: 'Consulta el estado de tu candidatura con tu folio: Pendiente, En Proceso, Aprobado o Rechazado.',
  },
];

export default function Inicio() {
  return (
    <div className="pagina-inicio">
      <section className="hero-postulacion hero-inicio">
        <div className="contenedor hero-inicio-grid">
          <div className="hero-inicio-copia">
            <span className="hero-etiqueta">
              <span className="hero-etiqueta-punto" aria-hidden="true" />
              Reclutamiento y Selección · AquaChile
            </span>
            <h1>
              Evaluaciones
              <br />
              <span>psicolaborales</span>
            </h1>
            <p className="hero-inicio-bajada">
              Postula en minutos, adjunta tu CV y revisa el avance de tu proceso cuando quieras.
              Todo en línea, con un folio único de seguimiento.
            </p>
            <div className="hero-inicio-acciones">
              <Link to="/postulacion" className="boton boton-primario boton-lg">
                Comenzar postulación
                <i className="bi bi-arrow-right" aria-hidden="true" />
              </Link>
              <Link to="/login" className="boton boton-secundario boton-lg">
                <i className="bi bi-shield-check" aria-hidden="true" />
                Acceso evaluadores
              </Link>
            </div>
            <Link to="/consulta" className="enlace-consulta-hero">
              ¿Ya postulaste? Revisa el estado de tu postulación
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>
          </div>

          <div className="hero-panel" aria-hidden="true">
            <div className="hero-panel-cabecera">
              <div>
                <span className="hero-panel-eyebrow">Seguimiento</span>
                <strong>Tu postulación</strong>
                <small>Folio AC-2026-0142</small>
              </div>
              <EstadoBadge estado="En Proceso" />
            </div>
            <ol className="hero-panel-pasos">
              <li className="completado">
                <span className="hero-panel-marca">
                  <i className="bi bi-check2" />
                </span>
                <div>
                  <strong>Postulación recibida</strong>
                  <small>Datos y CV validados</small>
                </div>
              </li>
              <li className="activo">
                <span className="hero-panel-marca">2</span>
                <div>
                  <strong>Entrevista psicolaboral</strong>
                  <small>En revisión por el equipo</small>
                </div>
              </li>
              <li>
                <span className="hero-panel-marca">3</span>
                <div>
                  <strong>Resultado final</strong>
                  <small>Te avisaremos por correo</small>
                </div>
              </li>
            </ol>
            <div className="hero-panel-pie">
              <i className="bi bi-shield-check" />
              Información confidencial
              <span>Etapa 2 de 3</span>
            </div>
          </div>
        </div>
      </section>

      <section className="contenedor seccion-proceso" aria-labelledby="titulo-proceso">
        <div className="seccion-proceso-panel">
          <div className="seccion-proceso-encabezado">
            <span className="seccion-eyebrow">Cómo funciona</span>
            <h2 id="titulo-proceso">Tres pasos, todo claro</h2>
            <p>Postula en línea y revisa tu avance cuando quieras. Cada etapa queda registrada.</p>
          </div>
          <ol className="rejilla-proceso">
            {PASOS.map((paso) => (
              <li key={paso.numero} className="paso-proceso">
                <div className="paso-proceso-cabecera">
                  <span className="paso-proceso-numero">{paso.numero}</span>
                  <i className={`bi ${paso.icono}`} aria-hidden="true" />
                </div>
                <h3>{paso.titulo}</h3>
                <p>{paso.detalle}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="contenedor cierre-inicio">
        <div className="cierre-inicio-panel">
          <div>
            <span className="seccion-eyebrow">Postulación en línea</span>
            <h2>Tu próxima oportunidad empieza aquí</h2>
            <p>Completa tu postulación en línea. Tu información está protegida y solo se usa en este proceso.</p>
          </div>
          <Link to="/postulacion" className="boton boton-primario boton-lg">
            Comenzar postulación
            <i className="bi bi-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
