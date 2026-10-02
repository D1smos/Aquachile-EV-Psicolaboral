import { Link } from 'react-router-dom'

function Inicio() {
  return (
    <div>

      <h1>
        Evaluaciones Psicolaborales
      </h1>

      <p>
        Plataforma de gestión de procesos de evaluación psicolaboral.
      </p>

      <Link
        to="/postulacion"
        className="btn btn-primary"
      >
        Iniciar evaluación
      </Link>

    </div>
  )
}

export default Inicio