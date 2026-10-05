import { Link } from 'react-router-dom'

function Confirmacion() {

  return (
    <div className="text-center py-5">

      <h1>
        Postulación enviada
      </h1>

      <p className="mt-3">
        Tus datos fueron registrados correctamente.
      </p>

      <Link
        to="/"
        className="btn btn-primary mt-3"
      >
        Volver al inicio
      </Link>

    </div>
  )
}

export default Confirmacion