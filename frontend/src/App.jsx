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
import FichaCandidato from './pages/privado/FichaCandidato.jsx';
import Documentos from './pages/privado/Documentos.jsx';
import Agenda from './pages/privado/Agenda.jsx';

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
        <Route
          path="/candidatos/:id/ficha"
          element={
            <RutaProtegida>
              <FichaCandidato />
            </RutaProtegida>
          }
        />
        <Route
          path="/documentos"
          element={
            <RutaProtegida>
              <Documentos />
            </RutaProtegida>
          }
        />
        <Route
          path="/agenda"
          element={
            <RutaProtegida>
              <Agenda />
            </RutaProtegida>
          }
        />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}
