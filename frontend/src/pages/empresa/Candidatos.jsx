import mockCandidatos from '../../data/mockCandidatos'
import EstadoBadge from '../../components/EstadoBadge'

function Candidatos() {
  return (
    <div>
      <div className="mb-4">
        <h1>Candidatos</h1>
        <p className="text-muted">
          Listado de candidatos registrados en el proceso.
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Cargo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {mockCandidatos && mockCandidatos.map((candidato) => (
                  <tr key={candidato.id}>
                    <td>{candidato.nombre}</td>
                    <td>{candidato.correo}</td>
                    <td>{candidato.telefono}</td>
                    <td>{candidato.cargo}</td>
                    <td>
                      <EstadoBadge estado={candidato.estado} />
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

export default Candidatos