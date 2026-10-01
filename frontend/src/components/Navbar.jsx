import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
      <Link className="navbar-brand" to="/">
        AquaChile
      </Link>

      <div className="navbar-nav ms-auto">
        <Link className="nav-link" to="/">
          Inicio
        </Link>

        <Link className="nav-link" to="/empresa">
          Empresa
        </Link>
      </div>
    </nav>
  )
}

export default Navbar