import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'

import Inicio from './pages/publico/Inicio'
import Postulacion from './pages/publico/Postulacion'
import Confirmacion from './pages/publico/Confirmacion'

import Dashboard from './pages/empresa/Dashboard'
import Candidatos from './pages/empresa/Candidatos'

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <main className="container py-4">

        <Routes>

          <Route
            path="/"
            element={<Inicio />}
          />

          <Route
            path="/postulacion"
            element={<Postulacion />}
          />

          <Route
            path="/confirmacion"
            element={<Confirmacion />}
          />

          <Route
            path="/empresa"
            element={<Dashboard />}
          />

          <Route
            path="/empresa/candidatos"
            element={<Candidatos />}
          />

        </Routes>

      </main>

    </BrowserRouter>
  )
}

export default App