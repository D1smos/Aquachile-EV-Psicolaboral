import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import './AppLayout.css';

export default function AppLayout() {
  const { pathname } = useLocation();
  const privada = pathname.startsWith('/dashboard');

  return (
    <div className="app-layout">
      <Navbar privada={privada} />
      <main
        key={privada ? undefined : pathname}
        className={`layout-main${privada ? ' contenido-privado' : ''} animar-entrada`}
      >
        <Outlet />
      </main>
      <Footer compacto={privada} />
    </div>
  );
}
