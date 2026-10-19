import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/">
          AquaChile
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active fw-bold' : ''}`} to="/">
                Inicio
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active fw-bold' : ''}`} to="/postulacion">
                Postular
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active fw-bold' : ''}`} to="/empresa">
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active fw-bold' : ''}`} to="/empresa/candidatos">
                Candidatos
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active fw-bold' : ''}`} to="/empresa/evaluaciones">
                Evaluaciones
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}