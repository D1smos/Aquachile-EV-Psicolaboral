import { Link } from 'react-router-dom'

export default function Inicio() {
  return (
    <div className="container-fluid p-0">
      {/* Hero Principal con Fondo Oscuro Profundo */}
      <div 
        className="text-white py-5 px-4 rounded-4 mb-4 shadow-lg position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0a192f 0%, #112240 60%, #1d3557 100%)',
          minHeight: '380px'
        }}
      >
        <div className="row align-items-center py-4 position-relative z-1">
          <div className="col-lg-9 mx-auto text-center">
            <span className="badge bg-info bg-opacity-20 text-info border border-info border-opacity-25 px-3 py-2 rounded-pill fw-bold mb-3 text-uppercase">
              Sistema de Gestión Psicolaboral • AquaChile
            </span>
            <h1 className="display-4 fw-black mb-3 text-white">
              Plataforma de Selección & Evaluaciones
            </h1>
            <p className="lead mb-4 text-light opacity-80 col-md-10 mx-auto fs-5">
              Gestión estandarizada de postulaciones, aplicación de baterías psicológicas e informes de aptitud laboral en tiempo real.
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <Link to="/postulacion" className="btn btn-warning btn-lg fw-bold px-4 py-3 shadow">
                Postular a una Vacante
              </Link>
              <Link to="/empresa/dashboard" className="btn btn-outline-light btn-lg fw-semibold px-4 py-3">
                Ingresar al Módulo RRHH
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Accesos Directos con Tarjetas Contrastadas */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm p-4 rounded-4 bg-white">
            <div className="fs-1 text-primary mb-2">📋</div>
            <h5 className="fw-bold text-dark">Portal de Postulaciones</h5>
            <p className="text-muted small">
              Formulario directo para candidatos interesados en ingresar a las áreas operativas y profesionales.
            </p>
            <Link to="/postulacion" className="btn btn-outline-primary btn-sm fw-bold mt-auto">
              Ir a Postular →
            </Link>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm p-4 rounded-4 bg-white border-top border-success border-4">
            <div className="fs-1 text-success mb-2">👥</div>
            <h5 className="fw-bold text-dark">Nómina de Candidatos</h5>
            <p className="text-muted small">
              Buscador centralizado, filtrado por RUT y seguimiento del estado del postulante.
            </p>
            <Link to="/empresa/candidatos" className="btn btn-outline-success btn-sm fw-bold mt-auto">
              Ver Candidatos →
            </Link>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm p-4 rounded-4 bg-white border-top border-info border-4">
            <div className="fs-1 text-info mb-2">🧠</div>
            <h5 className="fw-bold text-dark">Evaluaciones & Entrevistas</h5>
            <p className="text-muted small">
              Ficha por competencias, asignación de batería psicológica y dictamen de recomendación.
            </p>
            <Link to="/empresa/evaluaciones" className="btn btn-outline-info btn-sm fw-bold mt-auto">
              Ver Evaluaciones →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}