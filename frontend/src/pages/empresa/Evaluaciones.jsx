import { useState, useEffect } from 'react'

// Datos de demostración por defecto con la estructura de Entrevista e Informe
const evaluacionesIniciales = [
  {
    id: 1,
    candidato: 'Juan Pérez',
    rut: '12.345.678-9',
    cargo: 'Operario de Planta',
    psicologo: 'Dra. María González',
    fechaEntrevista: '2026-10-01',
    estado: 'Completada',
    dictamen: 'Recomendado',
    pruebas: 'Lüscher, Persona bajo la Lluvia, IC',
    competencias: {
      adecuacionNorma: 'Alto',
      trabajoBajoPresion: 'Medio-Alto',
      trabajoEnEquipo: 'Alto'
    },
    informe: 'Candidato muestra alta orientación a normas de seguridad y buena disposición para turnos rotativos en planta.'
  },
  {
    id: 2,
    candidato: 'María Silva',
    rut: '15.987.654-3',
    cargo: 'Analista de Calidad',
    psicologo: 'Dr. Roberto Tapia',
    fechaEntrevista: '2026-10-05',
    estado: 'En Proceso',
    dictamen: 'Pendiente',
    pruebas: 'Zulliger, Entrevista por Competencias',
    competencias: {
      adecuacionNorma: 'En Evaluación',
      trabajoBajoPresion: 'En Evaluación',
      trabajoEnEquipo: 'En Evaluación'
    },
    informe: 'Entrevista agendada. Pendiente revisión de batería de pruebas de atención al detalle.'
  },
  {
    id: 3,
    candidato: 'Carlos Gómez',
    rut: '18.111.222-3',
    cargo: 'Supervisor de Centro',
    psicologo: 'Dra. María González',
    fechaEntrevista: '2026-09-25',
    estado: 'Completada',
    dictamen: 'No Recomendado',
    pruebas: 'Lüscher, Zulliger',
    competencias: {
      adecuacionNorma: 'Bajo',
      trabajoBajoPresion: 'Bajo',
      trabajoEnEquipo: 'Medio'
    },
    informe: 'Dificultades en tolerancia a la frustración e inconsistencias en la pauta de entrevista gerencial.'
  }
]

export default function Evaluaciones() {
  const [evaluaciones, setEvaluaciones] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('')
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState(null)
  const [mostrarModal, setMostrarModal] = useState(false)

  // Obtener Token de sesión de localStorage
  const token = localStorage.getItem('token')

  // Formulario para agendar/crear evaluación y entrevista
  const [nuevoForm, setNuevoForm] = useState({
    candidato: '',
    rut: '',
    cargo: '',
    psicologo: 'Dra. María González',
    fechaEntrevista: new Date().toISOString().split('T')[0],
    pruebas: 'Entrevista Psicolaboral, Test Lüscher',
    dictamen: 'Pendiente',
    informe: ''
  })

  useEffect(() => {
    fetch('http://localhost:5000/api/evaluaciones', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setEvaluaciones(data && data.length > 0 ? data : evaluacionesIniciales))
      .catch(() => setEvaluaciones(evaluacionesIniciales))
  }, [token])

  const evaluacionesFiltradas = evaluaciones.filter(e => {
    if (!filtroEstado) return true
    if (filtroEstado === 'Completada') return e.estado === 'Completada'
    if (filtroEstado === 'En Proceso') return e.estado === 'En Proceso'
    return true
  })

  const getBadgeDictamen = (dictamen) => {
    switch (dictamen) {
      case 'Recomendado': return 'bg-success text-white'
      case 'Recomendado con Reservas': return 'bg-warning text-dark'
      case 'No Recomendado': return 'bg-danger text-white'
      default: return 'bg-secondary text-white'
    }
  }

  const handleCrearEvaluacion = (e) => {
    e.preventDefault()
    if (!nuevoForm.candidato || !nuevoForm.rut) {
      alert('Por favor ingrese el nombre y RUT del candidato.')
      return
    }

    const nueva = {
      ...nuevoForm,
      id: Date.now(),
      estado: nuevoForm.dictamen === 'Pendiente' ? 'En Proceso' : 'Completada',
      competencias: {
        adecuacionNorma: 'Medio-Alto',
        trabajoBajoPresion: 'Medio',
        trabajoEnEquipo: 'Alto'
      }
    }

    fetch('http://localhost:5000/api/evaluaciones', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(nueva)
    }).catch(() => null)

    setEvaluaciones([nueva, ...evaluaciones])
    setMostrarModal(false)
    setNuevoForm({
      candidato: '',
      rut: '',
      cargo: '',
      psicologo: 'Dra. María González',
      fechaEntrevista: new Date().toISOString().split('T')[0],
      pruebas: 'Entrevista Psicolaboral, Test Lüscher',
      dictamen: 'Pendiente',
      informe: ''
    })
  }

  return (
    <div className="container-fluid py-2">
      {/* Encabezado */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill fw-bold mb-2">
            Módulo Psicolaboral AquaChile
          </span>
          <h2 className="fw-bold text-dark mb-1">Evaluaciones & Entrevistas de Selección</h2>
          <p className="text-muted mb-0">Entrevistas estructuradas, aplicación de baterías psicológicas y dictamen de aptitud.</p>
        </div>
        <button className="btn btn-primary fw-bold px-4 shadow-sm py-2" onClick={() => setMostrarModal(true)}>
          + Agendar Entrevista / Evaluación
        </button>
      </div>

      {/* Tarjetas de Resumen Rápido */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-4 bg-white border-start border-primary border-4">
            <small className="text-muted fw-bold">TOTAL REGISTRADAS</small>
            <h3 className="fw-black mb-0 text-dark mt-1">{evaluaciones.length}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-4 bg-white border-start border-warning border-4">
            <small className="text-muted fw-bold">ENTREVISTAS EN PROCESO</small>
            <h3 className="fw-black mb-0 text-warning-emphasis mt-1">
              {evaluaciones.filter(e => e.estado === 'En Proceso').length}
            </h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-4 bg-white border-start border-success border-4">
            <small className="text-muted fw-bold">RECOMENDADOS</small>
            <h3 className="fw-black mb-0 text-success mt-1">
              {evaluaciones.filter(e => e.dictamen === 'Recomendado').length}
            </h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-4 bg-white border-start border-danger border-4">
            <small className="text-muted fw-bold">NO RECOMENDADOS</small>
            <h3 className="fw-black mb-0 text-danger mt-1">
              {evaluaciones.filter(e => e.dictamen === 'No Recomendado').length}
            </h3>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Tabla Principal de Evaluaciones */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
              <h5 className="fw-bold mb-0">Nómina de Evaluaciones</h5>
              <div className="btn-group btn-group-sm">
                <button
                  className={`btn ${filtroEstado === '' ? 'btn-dark' : 'btn-outline-dark'}`}
                  onClick={() => setFiltroEstado('')}
                >
                  Todas
                </button>
                <button
                  className={`btn ${filtroEstado === 'En Proceso' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'}`}
                  onClick={() => setFiltroEstado('En Proceso')}
                >
                  En Proceso
                </button>
                <button
                  className={`btn ${filtroEstado === 'Completada' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => setFiltroEstado('Completada')}
                >
                  Completadas
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Candidato / Cargo</th>
                    <th>Psicólogo/a</th>
                    <th>Fecha Entrevista</th>
                    <th>Dictamen Final</th>
                    <th className="text-end">Informe</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluacionesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        No hay evaluaciones registradas en esta categoría.
                      </td>
                    </tr>
                  ) : (
                    evaluacionesFiltradas.map((ev) => (
                      <tr key={ev.id} className={evaluacionSeleccionada?.id === ev.id ? 'table-active' : ''}>
                        <td>
                          <div className="fw-bold text-dark">{ev.candidato}</div>
                          <small className="text-muted">{ev.rut} • {ev.cargo}</small>
                        </td>
                        <td className="small text-secondary">{ev.psicologo}</td>
                        <td className="small">{ev.fechaEntrevista || 'Por definir'}</td>
                        <td>
                          <span className={`badge px-3 py-2 rounded-pill ${getBadgeDictamen(ev.dictamen)}`}>
                            {ev.dictamen}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary fw-semibold"
                            onClick={() => setEvaluacionSeleccionada(ev)}
                          >
                            Ver Pauta / Ficha
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel Lateral: Ficha Detallada de Entrevista e Informe */}
        <div className="col-lg-4">
          {evaluacionSeleccionada ? (
            <div className="card border-0 shadow-sm rounded-4 p-4 border-top border-primary border-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="badge bg-primary text-white">Informe Psicolaboral</span>
                <button
                  className="btn-close"
                  onClick={() => setEvaluacionSeleccionada(null)}
                ></button>
              </div>

              <h4 className="fw-bold mb-1">{evaluacionSeleccionada.candidato}</h4>
              <p className="text-muted small mb-3">
                {evaluacionSeleccionada.cargo} | RUT: {evaluacionSeleccionada.rut}
              </p>

              <hr />

              <div className="mb-3">
                <label className="text-uppercase small text-muted fw-bold">Evaluador/a Responsable</label>
                <div className="fw-semibold text-dark">{evaluacionSeleccionada.psicologo}</div>
              </div>

              <div className="mb-3">
                <label className="text-uppercase small text-muted fw-bold">Batería de Pruebas Aplicadas</label>
                <div className="badge bg-light text-dark border w-100 text-start p-2 mt-1">
                  {evaluacionSeleccionada.pruebas || 'Entrevista Estructurada por Competencias'}
                </div>
              </div>

              <div className="mb-3">
                <label className="text-uppercase small text-muted fw-bold">Evaluación por Competencias</label>
                <div className="mt-2">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Adecuación a la Norma y Seguridad:</span>
                    <strong className="text-primary">{evaluacionSeleccionada.competencias?.adecuacionNorma || 'N/A'}</strong>
                  </div>
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Tolerancia a la Presión:</span>
                    <strong className="text-primary">{evaluacionSeleccionada.competencias?.trabajoBajoPresion || 'N/A'}</strong>
                  </div>
                  <div className="d-flex justify-content-between small">
                    <span>Trabajo en Equipo:</span>
                    <strong className="text-primary">{evaluacionSeleccionada.competencias?.trabajoEnEquipo || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="text-uppercase small text-muted fw-bold">Conclusión de Entrevista & Observaciones</label>
                <p className="p-3 bg-light rounded-3 small text-secondary mt-1 mb-0 border">
                  "{evaluacionSeleccionada.informe || 'Sin observaciones registradas.'}"
                </p>
              </div>

              <div className="text-center pt-2">
                <span className={`badge px-4 py-2 w-100 fs-6 ${getBadgeDictamen(evaluacionSeleccionada.dictamen)}`}>
                  Dictamen: {evaluacionSeleccionada.dictamen}
                </span>
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm rounded-4 p-4 text-center text-muted py-5">
              <div className="fs-1 mb-2 opacity-50">📝</div>
              <h5>Ficha de Entrevista</h5>
              <p className="small mb-0">
                Selecciona una evaluación de la tabla para revisar la pauta de entrevista, pruebas psicológicas y el informe conclusivo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Agendar / Registrar Entrevista */}
      {mostrarModal && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Agendar / Registrar Entrevista Psicolaboral</h5>
                <button type="button" className="btn-close" onClick={() => setMostrarModal(false)}></button>
              </div>

              <form onSubmit={handleCrearEvaluacion}>
                <div className="modal-body">
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Nombre Candidato *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: Pedro Morales"
                        required
                        value={nuevoForm.candidato}
                        onChange={e => setNuevoForm({ ...nuevoForm, candidato: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">RUT Candidato *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="12.345.678-9"
                        required
                        value={nuevoForm.rut}
                        onChange={e => setNuevoForm({ ...nuevoForm, rut: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Cargo al que Postula</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: Operario de Procesos"
                        value={nuevoForm.cargo}
                        onChange={e => setNuevoForm({ ...nuevoForm, cargo: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Psicólogo/a Evaluador/a</label>
                      <select
                        className="form-select"
                        value={nuevoForm.psicologo}
                        onChange={e => setNuevoForm({ ...nuevoForm, psicologo: e.target.value })}
                      >
                        <option value="Dra. María González">Dra. María González</option>
                        <option value="Dr. Roberto Tapia">Dr. Roberto Tapia</option>
                        <option value="Lic. Andrea Rojas">Lic. Andrea Rojas</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Fecha de Entrevista</label>
                      <input
                        type="date"
                        className="form-control"
                        value={nuevoForm.fechaEntrevista}
                        onChange={e => setNuevoForm({ ...nuevoForm, fechaEntrevista: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Dictamen Inicial / Resultado</label>
                      <select
                        className="form-select"
                        value={nuevoForm.dictamen}
                        onChange={e => setNuevoForm({ ...nuevoForm, dictamen: e.target.value })}
                      >
                        <option value="Pendiente">Pendiente (En Proceso)</option>
                        <option value="Recomendado">Recomendado</option>
                        <option value="Recomendado con Reservas">Recomendado con Reservas</option>
                        <option value="No Recomendado">No Recomendado</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Pruebas Psicológicas a Aplicar</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: Test Lüscher, Zulliger, Persona bajo la lluvia"
                      value={nuevoForm.pruebas}
                      onChange={e => setNuevoForm({ ...nuevoForm, pruebas: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Observaciones / Conclusión Psicolaboral</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Resumen del desempeño en entrevista y ajuste al perfil..."
                      value={nuevoForm.informe}
                      onChange={e => setNuevoForm({ ...nuevoForm, informe: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setMostrarModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold">
                    Guardar Registro de Entrevista
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}