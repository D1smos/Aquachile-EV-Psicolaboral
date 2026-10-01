import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Inicio from './pages/publico/Inicio'
import Dashboard from './pages/empresa/Dashboard'

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
            path="/empresa"
            element={<Dashboard />}
          />

        </Routes>

      </main>

    </BrowserRouter>
  )
}

export default App