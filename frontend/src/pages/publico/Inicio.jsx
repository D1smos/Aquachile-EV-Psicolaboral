import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EstadoBadge from '../../components/EstadoBadge.jsx';
import { api } from '../../services/api.js';

const CLAVE_SEGUIMIENTO = 'aquachile_ultima_postulacion';

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

const leerSeguimientoLocal = () => {
  try {
    const guardado = localStorage.getItem(CLAVE_SEGUIMIENTO);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
};

const calcularEtapa = (estado) => {
  if (!estado) {
    return 0;
  }
  if (estado === 'Pendiente') {
    return 1;
  }
  if (estado === 'En Proceso') {
    return 2;
  }
  return 3;
};

export default function Inicio() {
  const [seguimiento, setSeguimiento] = useState(leerSeguimientoLocal);

  useEffect(() => {
    const actual = leerSeguimientoLocal();
    if (!actual?.folio || !actual?.rut) {
      return undefined;
    }

    let activo = true;
    api
      .post('/postulaciones/consulta', { folio: actual.folio, rut: actual.rut })
      .then((datos) => {
        const remoto = datos?.candidato ?? datos?.postulacion;
        if (activo && remoto) {
          const actualizado = { ...actual, ...remoto };
          setSeguimiento(actualizado);
          try {
            localStorage.setItem(CLAVE_SEGUIMIENTO, JSON.stringify(actualizado));
          } catch {
            // Ignorar error de almacenamiento
          }
        }
      })
      .catch((error) => {
        if (activo && error?.codigo === 404) {
          setSeguimiento(null);
          try {
            localStorage.removeItem(CLAVE_SEGUIMIENTO);
          } catch {
            // Ignorar error de almacenamiento
          }
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  const etapa = calcularEtapa(seguimiento?.estado);
  const clasePaso1 = etapa > 1 ? 'completado' : etapa === 1 ? 'activo' : '';
  const clasePaso2 = etapa > 2 ? 'completado' : etapa === 2 ? 'activo' : '';
  const clasePaso3 = etapa === 3 ? 'completado' : '';

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

          <div className="hero-panel">
            <div className="hero-panel-cabecera">
              <div>
                <span className="hero-panel-eyebrow">Seguimiento</span>
                <strong>{seguimiento ? seguimiento.nombre : 'Tu postulación'}</strong>
                <small>
                  {seguimiento
                    ? `Folio ${seguimiento.folio} · ${seguimiento.cargo}`
                    : 'Aún no has enviado una postulación'}
                </small>
              </div>
              {seguimiento ? (
                <EstadoBadge estado={seguimiento.estado} />
              ) : (
                <span className="estado-badge estado-pendiente">Sin iniciar</span>
              )}
            </div>
            <ol className="hero-panel-pasos">
              <li className={clasePaso1}>
                <span className="hero-panel-marca">
                  {etapa > 1 ? <i className="bi bi-check2" /> : '1'}
                </span>
                <div>
                  <strong>Postulación recibida</strong>
                  <small>
                    {etapa >= 1
                      ? 'Datos y CV registrados'
                      : 'Completa el formulario y adjunta tu CV'}
                  </small>
                </div>
              </li>
              <li className={clasePaso2}>
                <span className="hero-panel-marca">
                  {etapa > 2 ? <i className="bi bi-check2" /> : '2'}
                </span>
                <div>
                  <strong>Entrevista psicolaboral</strong>
                  <small>
                    {etapa === 2
                      ? 'En revisión por el equipo'
                      : etapa > 2
                        ? 'Evaluación completada'
                        : 'Revisión del equipo de selección'}
                  </small>
                </div>
              </li>
              <li className={clasePaso3}>
                <span className="hero-panel-marca">
                  {etapa === 3 ? <i className="bi bi-check2" /> : '3'}
                </span>
                <div>
                  <strong>Resultado final</strong>
                  <small>
                    {etapa === 3
                      ? `Proceso finalizado (${seguimiento.estado})`
                      : 'Te avisaremos por correo'}
                  </small>
                </div>
              </li>
            </ol>
            <div className="hero-panel-pie">
              <i className="bi bi-shield-check" />
              Información confidencial
              <span>{`Etapa ${etapa} de 3`}</span>
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
