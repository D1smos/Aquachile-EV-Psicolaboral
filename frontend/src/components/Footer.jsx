import Marca from './Marca.jsx';

export default function Footer({ compacto = false }) {
  if (compacto) {
    return (
      <footer className="pie-pagina pie-compacto">
        <div className="contenedor pie-interno">
          <p className="pie-legal">
            © {new Date().getFullYear()} AquaChile · Gestión de Evaluaciones Psicolaborales
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="pie-pagina">
      <div className="contenedor pie-interno">
        <Marca compacta />
        <p className="pie-texto">
          Plataforma interna de gestión de evaluaciones psicolaborales · Proceso de selección
          AquaChile
        </p>
        <p className="pie-legal">
          © {new Date().getFullYear()} AquaChile. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
