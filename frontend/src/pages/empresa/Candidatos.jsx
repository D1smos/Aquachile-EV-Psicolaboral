import { useState, useEffect } from 'react'

const candidatosIniciales = [
  { id: 1, nombre: 'Juan Pérez', rut: '12.345.678-9', email: 'juan@aquachile.cl', telefono: '+56 9 8765 4321', cargo: 'Operario de Planta' },
  { id: 2, nombre: 'María Silva', rut: '15.987.654-3', email: 'maria@aquachile.cl', telefono: '+56 9 1234 5678', cargo: 'Analista de Calidad' },
  { id: 3, nombre: 'Carlos Gómez', rut: '18.111.222-3', email: 'carlos@aquachile.cl', telefono: '+56 9 5555 4444', cargo: 'Supervisor de Centro' }
]

export default function Candidatos() {
  const [candidatos, setCandidatos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [nuevoCand, setNuevoCand] = useState({ nombre: '', rut: '', email: '', telefono: '', cargo: '' })
  const [mostrarModal, setMostrarModal] = useState(false)

  // Obtener Token de sesión de localStorage
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetch('http://localhost:5000/api/candidatos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setCandidatos(data && data.length > 0 ? data : candidatosIniciales))
      .catch(() => setCandidatos(candidatosIniciales))
  }, [token])

  const candidatosFiltrados = candidatos.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.rut.includes(busqueda) ||
    (c.cargo && c.cargo.toLowerCase().includes(busqueda.toLowerCase()))
  )

  const handleGuardar = (e) => {
    e.preventDefault()
    if (!nuevoCand.nombre || !nuevoCand.rut) return alert('Por favor complete Nombre y RUT')

    const creado = { ...nuevoCand, id: Date.now() }
    
    fetch('http://localhost:5000/api/candidatos', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(creado)
    })
    .catch(() => null)

    setCandidatos([creado, ...candidatos])
    setNuevoCand({ nombre: '', rut: '', email: '', telefono: '', cargo: '' })
    setMostrarModal(false)
  }

  const handleEliminar = (id) => {
    if (confirm('¿Desea eliminar este candidato del registro?')) {
      fetch(`http://localhost:5000/api/candidatos/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).catch(() => null)

      setCandidatos(candidatos.filter(c => c.id !== id))
    }
  }

  return (
    <div className="container-fluid py-2">
      {/* Header y Acción Principal */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Nómina de Candidatos</h2>
          <p className="text-muted mb-0">Gestión de datos personales y cargos postulados.</p>
        </div>
        <button className="btn btn-primary fw-bold shadow-sm px-4" onClick={() => setMostrarModal(true)}>
          + Registrar Nuevo Candidato
        </button>
      </div>

      {/* Buscador */}
      <div className="card border-0 shadow-sm p-3 mb-4 rounded-4">
        <div className="row g-2">
          <div className="col-md-8">
            <input
              type="text"
              className="form-control form-control-lg fs-6"
              placeholder="🔍 Buscar por nombre, RUT o cargo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="col-md-4 text-md-end d-flex align-items-center justify-content-end">
            <span className="badge bg-light text-dark border px-3 py-2 fs-6">
              Total: <strong>{candidatosFiltrados.length}</strong> registros
            </span>
          </div>
        </div>
      </div>

      {/* Tabla de Candidatos */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th className="py-3 px-4">RUT</th>
                <th className="py-3">Nombre Completo</th>
                <th className="py-3">Correo Electrónico</th>
                <th className="py-3">Teléfono</th>
                <th className="py-3">Cargo Postulado</th>
                <th className="py-3">Documento (CV)</th>
                <th className="py-3 text-end px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {candidatosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No se encontraron candidatos registrados.
                  </td>
                </tr>
              ) : (
                candidatosFiltrados.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 fw-mono text-secondary">{c.rut}</td>
                    <td className="fw-bold text-dark">{c.nombre}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.telefono || '—'}</td>
                    <td>
                      <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">
                        {c.cargo}
                      </span>
                    </td>
                    <td>
                      {c.cvPath ? (
                        <a
                          href={`http://localhost:5000/uploads/${c.cvPath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          📄 Ver CV
                        </a>
                      ) : (
                        <span className="text-muted small">Sin adjunto</span>
                      )}
                    </td>
                    <td className="text-end px-4">
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleEliminar(c.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación */}
      {mostrarModal && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Registrar Candidato</h5>
                <button type="button" className="btn-close" onClick={() => setMostrarModal(false)}></button>
              </div>
              <form onSubmit={handleGuardar}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Nombre Completo</label>
                    <input type="text" className="form-control" required value={nuevoCand.nombre} onChange={e => setNuevoCand({...nuevoCand, nombre: e.target.value})} />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold">RUT</label>
                      <input type="text" className="form-control" placeholder="12.345.678-9" required value={nuevoCand.rut} onChange={e => setNuevoCand({...nuevoCand, rut: e.target.value})} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Teléfono</label>
                      <input type="text" className="form-control" placeholder="9XXXXXXXX" value={nuevoCand.telefono} onChange={e => setNuevoCand({...nuevoCand, telefono: e.target.value})} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Correo Electrónico</label>
                    <input type="email" className="form-control" value={nuevoCand.email} onChange={e => setNuevoCand({...nuevoCand, email: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Cargo</label>
                    <input type="text" className="form-control" placeholder="Ej: Operario de Planta" value={nuevoCand.cargo} onChange={e => setNuevoCand({...nuevoCand, cargo: e.target.value})} />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setMostrarModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary fw-bold">Guardar Candidato</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}