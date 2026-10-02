import mockEvaluaciones from '../../data/mockEvaluaciones'
import mockCandidatos from '../../data/mockCandidatos'
import { EstadoBadge } from '../../components/EstadoBadge'

function Dashboard() {
  const listaEvaluaciones = mockEvaluaciones || []
  const listaCandidatos = mockCandidatos || []

  const totalCandidatos = listaCandidatos.length
  const totalEvaluaciones = listaEvaluaciones.length
  const pendientes = listaEvaluaciones.filter(
    (e) => e.estado === 'En Proceso' || e.resultado === 'Pendiente'
  ).length
  const recomendados = listaEvaluaciones.filter(
    (e) => e.resultado === 'Recomendado'
  ).length

  return (
    <div>
      <div className="mb-4">
        <h1 className="h2 font-weight-bold">Dashboard</h1>
        <p className="text-muted">
          Panel de gestión, métricas y seguimiento de evaluaciones psicolaborales de AquaChile.
        </p>
      </div>

      {/* Tarjetas KPI */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-4 border-primary">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Total Candidatos</h6>
              <h3 className="card-title mb-0 fw-bold">{totalCandidatos}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-4 border-info">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Evaluaciones Totales</h6>
              <h3 className="card-title mb-0 fw-bold">{totalEvaluaciones}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-4 border-warning">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">En Proceso / Pendientes</h6>
              <h3 className="card-title mb-0 fw-bold">{pendientes}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-4 border-success">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Recomendados</h6>
              <h3 className="card-title mb-0 fw-bold">{recomendados}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Evaluaciones */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3">
          <h5 className="card-title mb-0 fw-bold">Evaluaciones Recientes</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Candidato</th>
                  <th>Cargo</th>
                  <th>Psicólogo Evaluador</th>
                  <th>Fecha</th>
                  <th>Resultado</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {listaEvaluaciones.map((evaluacion) => (
                  <tr key={evaluacion.id}>
                    <td className="fw-semibold">{evaluacion.candidatoNombre}</td>
                    <td>{evaluacion.cargo}</td>
                    <td>{evaluacion.psicologo}</td>
                    <td>{evaluacion.fechaEvaluacion}</td>
                    <td>
                      <span className={`badge ${
                        evaluacion.resultado === 'Recomendado' ? 'bg-success' :
                        evaluacion.resultado === 'No Recomendado' ? 'bg-danger' :
                        'bg-warning text-dark'
                      }`}>
                        {evaluacion.resultado}
                      </span>
                    </td>
                    <td>
                      <EstadoBadge estado={evaluacion.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard