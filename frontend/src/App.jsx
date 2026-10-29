import { Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import Inicio from './pages/publico/Inicio.jsx';
import Postulacion from './pages/publico/Postulacion.jsx';
import Consulta from './pages/publico/Consulta.jsx';
import Privacidad from './pages/publico/Privacidad.jsx';
import NoEncontrado from './pages/publico/NoEncontrado.jsx';
import Login from './pages/privado/Login.jsx';
import Dashboard from './pages/privado/Dashboard.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Inicio />} />
        <Route path="/postulacion" element={<Postulacion />} />
        <Route path="/consulta" element={<Consulta />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <RutaProtegida>
              <Dashboard />
            </RutaProtegida>
          }
        />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}
