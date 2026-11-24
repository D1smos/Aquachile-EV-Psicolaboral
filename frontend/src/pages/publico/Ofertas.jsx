import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import './Ofertas.css';

const fecha = (valor) => {
  if (!valor) return 'A convenir';
  const date = new Date(`${valor.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.valueOf()) ? valor : new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(date);
};

export default function Ofertas() {
  const navegar = useNavigate();
  const [filtros, setFiltros] = useState({ q: '', categoria: '', modalidad: '' });
  const [ofertas, setOfertas] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const categorias = useMemo(() => [...new Set(ofertas.map((oferta) => oferta.categoria).filter(Boolean))].sort(), [ofertas]);
  const modalidades = useMemo(() => [...new Set(ofertas.map((oferta) => oferta.modalidad).filter(Boolean))].sort(), [ofertas]);

  useEffect(() => {
    let vigente = true;
    const temporizador = window.setTimeout(async () => {
      setCargando(true);
      setError('');
      try {
        const datos = await api.ofertasPublicas(filtros);
        if (vigente) setOfertas(datos.ofertas ?? []);
      } catch (capturado) {
        if (vigente) setError(capturado.message);
      } finally {
        if (vigente) setCargando(false);
      }
    }, 180);
    return () => { vigente = false; window.clearTimeout(temporizador); };
  }, [filtros]);

  const abrirDetalle = async (id) => {
    try {
      const datos = await api.ofertaPublica(id);
      setDetalle(datos.oferta);
    } catch (capturado) {
      setError(capturado.message);
    }
  };

  const postular = () => {
    const query = new URLSearchParams({ oferta_id: detalle.id, cargo: detalle.titulo, categoria: detalle.categoria, familiaCargo: detalle.familiaCargo ?? detalle.categoria });
    navegar(`/postulacion?${query}`);
    setDetalle(null);
  };

  return (
    <div className="portal-ofertas">
      <section className="hero-postulacion ofertas-hero">
        <div className="contenedor">
          <span className="hero-etiqueta">Oportunidades AquaChile</span>
          <h1>Encuentra tu próximo desafío</h1>
          <p>Explora las ofertas disponibles y encuentra el cargo que mejor se ajusta a tu experiencia.</p>
        </div>
      </section>
      <section className="contenedor ofertas-contenido" aria-label="Ofertas disponibles">
        <div className="ofertas-filtros">
          <label>Buscar ofertas
            <input className="control-campo" type="search" value={filtros.q} placeholder="Cargo, función o requisito" onChange={(e) => setFiltros((f) => ({ ...f, q: e.target.value }))} />
          </label>
          <label>Categoría
            <select className="control-campo" value={filtros.categoria} onChange={(e) => setFiltros((f) => ({ ...f, categoria: e.target.value }))}>
              <option value="">Todas</option>{categorias.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Modalidad
            <select className="control-campo" value={filtros.modalidad} onChange={(e) => setFiltros((f) => ({ ...f, modalidad: e.target.value }))}>
              <option value="">Todas</option>{modalidades.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        {error && <div className="alerta alerta-error" role="alert">{error}</div>}
        {cargando ? <p role="status">Cargando ofertas…</p> : ofertas.length === 0 ? (
          <div className="ofertas-vacio"><i className="bi bi-search" aria-hidden="true" /><h2>No encontramos ofertas</h2><p>Prueba con otros filtros o vuelve más tarde.</p></div>
        ) : (
          <div className="ofertas-grid">
            {ofertas.map((oferta) => (
              <article className="oferta-card" key={oferta.id}>
                <div className="oferta-card-top"><span className="oferta-categoria">{oferta.categoria}</span><span>{oferta.modalidad}</span></div>
                <h2>{oferta.titulo}</h2><p>{oferta.ubicacion}</p>
                <p className="oferta-resumen">{oferta.descripcion}</p>
                <div className="oferta-card-pie"><small>{oferta.cupos} {oferta.cupos === 1 ? 'cupo' : 'cupos'} · publicada {fecha(oferta.fechaPublicacion)}</small><button type="button" className="boton boton-secundario boton-sm" onClick={() => abrirDetalle(oferta.id)}>Ver detalles</button></div>
              </article>
            ))}
          </div>
        )}
      </section>
      {detalle && (
        <div className="modal-overlay oferta-overlay" role="presentation" onMouseDown={() => setDetalle(null)}>
          <section className="modal-panel oferta-detalle" role="dialog" aria-modal="true" aria-labelledby="oferta-detalle-titulo" onMouseDown={(evento) => evento.stopPropagation()}>
            <header className="modal-cabecera"><div><span className="modal-eyebrow">{detalle.categoria} · {detalle.modalidad}</span><h2 id="oferta-detalle-titulo" className="modal-titulo">{detalle.titulo}</h2><p>{detalle.ubicacion} · {detalle.cupos} cupos · {fecha(detalle.fechaPublicacion)}</p></div><button type="button" className="boton-icono" aria-label="Cerrar detalle" onClick={() => setDetalle(null)}><i className="bi bi-x-lg" /></button></header>
            <div className="modal-cuerpo oferta-detalle-cuerpo">
              <Bloque titulo="Descripción" valor={detalle.descripcion} /><Bloque titulo="Funciones" valor={detalle.funciones} /><Bloque titulo="Requisitos" valor={detalle.requisitos} /><Bloque titulo="Beneficios" valor={detalle.beneficios} />
              <div className="oferta-sueldo"><strong>Sueldo</strong><span>{detalle.sueldo || 'A convenir'}</span></div>
              <div className="oferta-detalle-acciones"><button type="button" className="boton boton-primario boton-lg" onClick={postular}>Postular <i className="bi bi-arrow-right" aria-hidden="true" /></button><Link className="enlace-consulta-hero" to="/postulacion" onClick={() => setDetalle(null)}>Completar postulación sin asociar oferta</Link></div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Bloque({ titulo, valor }) {
  return <section className="oferta-detalle-bloque"><h3>{titulo}</h3><p>{valor || 'Información disponible durante el proceso de selección.'}</p></section>;
}
