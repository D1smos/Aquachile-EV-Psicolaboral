import { Navigate, Route, Routes } from 'react-router-dom';
import LayoutPublico from './components/LayoutPublico.jsx';
import LayoutPrivado from './components/LayoutPrivado.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import Inicio from './pages/publico/Inicio.jsx';
import Postulacion from './pages/publico/Postulacion.jsx';
import NoEncontrado from './pages/publico/NoEncontrado.jsx';
import Login from './pages/privado/Login.jsx';
import Dashboard from './pages/privado/Dashboard.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<LayoutPublico />}>
        <Route index element={<Inicio />} />
        <Route path="/postulacion" element={<Postulacion />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <RutaProtegida>
            <LayoutPrivado>
              <Dashboard />
            </LayoutPrivado>
          </RutaProtegida>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
