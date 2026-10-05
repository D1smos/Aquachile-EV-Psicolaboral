import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const candidatosDemo = [
  { id: 1, nombre: 'Juan Pérez', rut: '12.345.678-9', cargo: 'Operario de Planta' },
  { id: 2, nombre: 'María Silva', rut: '15.987.654-3', cargo: 'Analista de Calidad' },
  { id: 3, nombre: 'Carlos Gómez', rut: '18.111.222-3', cargo: 'Supervisor de Centro' }
]

const evaluacionesDemo = [
  { id: 1, candidato: 'Juan Pérez', psicologo: 'Dra. María González', estado: 'Completada', dictamen: 'Recomendado' },
  { id: 2, candidato: 'María Silva', psicologo: 'Dr. Roberto Tapia', estado: 'En Proceso', dictamen: 'Pendiente' },
  { id: 3, candidato: 'Carlos Gómez', psicologo: 'Dra. María González', estado: 'Completada', dictamen: 'No Recomendado' }
]

export default function Dashboard() {
  const [candidatos, setCandidatos] = useState(candidatosDemo)
  const [evaluaciones, setEvaluaciones] = useState(evaluacionesDemo)
  const [servidorActivo, setServidorActivo] = useState(false)

  useEffect(() => {
    // Consulta segura al backend
    const cargarDatos = async () => {
      try {
        const [resCand, resEval] = await Promise.all([
          fetch('http://localhost:5000/api/candidatos'),
          fetch('http://localhost:5000/api/evaluaciones')
        ])

        if (resCand.ok && resEval.ok) {
          const dataCand = await resCand.json()
          const dataEval = await resEval.json()
          if (dataCand.length > 0) setCandidatos(dataCand)
          if (dataEval.length > 0) setEvaluaciones(dataEval)
          setServidorActivo(true)
        }
      } catch (error) {
        // Modo offline / Demostración sin servidor corriendo
        setServidorActivo(false)
      }
    }

    cargarDatos()
  }, [])

  return (
    <div className="container-fluid py-2">
      {/* Banner de Estado del Servidor */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Panel de Control & Analytics</h2>
          <p className="text-muted mb-0">Gestión centralizada de postulantes y dictámenes psicolaborales.</p>
        </div>
        <div>
          {servidorActivo ? (
            <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2">
              🟢 API Node.js Conectada
            </span>
          ) : (
            <span className="badge bg-warning bg-opacity-10 text-dark border border-warning px-3 py-2">
              🟡 Modo Demostración (Datos Locales)
            </span>
          )}
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-4 bg-white border-start border-primary border-4">
            <span className="text-muted small fw-bold">CANDIDATOS REGISTRADOS</span>
            <h2 className="fw-black mb-0 mt-1">{candidatos.length}</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-4 bg-white border-start border-warning border-4">
            <span className="text-muted small fw-bold">EVALUACIONES EN PROCESO</span>
            <h2 className="fw-black mb-0 mt-1">{evaluaciones.filter(e => e.estado === 'En Proceso').length}</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-4 bg-white border-start border-success border-4">
            <span className="text-muted small fw-bold">CANDIDATOS RECOMENDADOS</span>
            <h2 className="fw-black mb-0 mt-1">{evaluaciones.filter(e => e.dictamen === 'Recomendado').length}</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-4 bg-white border-start border-info border-4">
            <span className="text-muted small fw-bold">COBERTURA DE PROCESOS</span>
            <h2 className="fw-black mb-0 mt-1">100%</h2>
          </div>
        </div>
      </div>

      {/* Tablas de Resumen */}
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">Últimas Evaluaciones</h5>
              <Link to="/empresa/evaluaciones" className="btn btn-sm btn-outline-primary fw-bold">
                Ver Todas
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Candidato</th>
                    <th>Evaluador/a</th>
                    <th>Dictamen</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluaciones.map((ev) => (
                    <tr key={ev.id}>
                      <td className="fw-bold">{ev.candidato}</td>
                      <td className="text-muted small">{ev.psicologo}</td>
                      <td>
                        <span className={`badge ${ev.dictamen === 'Recomendado' ? 'bg-success' : ev.dictamen === 'No Recomendado' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {ev.dictamen}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">Candidatos Recientes</h5>
              <Link to="/empresa/candidatos" className="btn btn-sm btn-outline-primary fw-bold">
                Ver Nómina
              </Link>
            </div>
            <ul className="list-group list-group-flush">
              {candidatos.map((c) => (
                <li key={c.id} className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                  <div>
                    <div className="fw-bold">{c.nombre}</div>
                    <small className="text-muted">{c.rut} • {c.cargo}</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}