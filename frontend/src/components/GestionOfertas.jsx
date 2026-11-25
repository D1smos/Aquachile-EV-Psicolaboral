import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import './GestionOfertas.css';

const FORM_INICIAL = {
  titulo: '',
  categoria: '',
  ubicacion: '',
  modalidad: 'Presencial',
  fechaPublicacion: new Date().toISOString().slice(0, 10),
  cupos: 1,
  descripcion: '',
  funciones: '',
  requisitos: '',
  beneficios: '',
  sueldo: '',
};

const FILTROS_ESTADO = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: 'publicadas', etiqueta: 'Publicadas' },
  { id: 'despublicadas', etiqueta: 'Despublicadas' },
];

const formatearFecha = (valor) => {
  if (!valor) return '';
  const fecha = new Date(`${valor}T00:00:00`);
  return Number.isNaN(fecha.getTime()) ? valor : fecha.toLocaleDateString('es-CL');
};

const coincideFiltro = (oferta, filtro) => {
  if (filtro === 'publicadas') return oferta.estado === 'publicada';
  if (filtro === 'despublicadas') return oferta.estado !== 'publicada';
  return true;
};

export default function GestionOfertas({ mostrarToast }) {
  const [ofertas, setOfertas] = useState([]);
  const [formulario, setFormulario] = useState(FORM_INICIAL);
  const [editando, setEditando] = useState(null);
  const [visible, setVisible] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todas');

  const cargar = useCallback(async () => {
    try {
      setOfertas((await api.get('/ofertas')).ofertas ?? []);
    } catch (error) {
      mostrarToast(error.message, 'error');
    }
  }, [mostrarToast]);
  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardar = async (evento) => {
    evento.preventDefault();
    try {
      const cuerpo = {
        ...formulario,
        cupos: Number(formulario.cupos),
        familiaCargo: formulario.categoria,
      };
      if (editando) await api.put(`/ofertas/${editando}`, cuerpo);
      else await api.post('/ofertas', cuerpo);
      mostrarToast(editando ? 'Oferta actualizada' : 'Oferta creada', 'exito');
      setFormulario(FORM_INICIAL);
      setEditando(null);
      setVisible(false);
      await cargar();
    } catch (error) {
      mostrarToast(error.message, 'error');
    }
  };

  const editar = (oferta) => {
    setEditando(oferta.id);
    setFormulario({
      ...FORM_INICIAL,
      ...oferta,
      categoria: oferta.categoria ?? oferta.familiaCargo,
      cupos: oferta.cupos ?? 1,
    });
    setVisible(true);
  };

  const estado = async (oferta, nuevoEstado) => {
    try {
      await api.patch(`/ofertas/${oferta.id}/estado`, { estado: nuevoEstado });
      await cargar();
    } catch (error) {
      mostrarToast(error.message, 'error');
    }
  };

  const eliminar = async (id) => {
    try {
      await api.eliminar(`/ofertas/${id}`);
      await cargar();
    } catch (error) {
      mostrarToast(error.message, 'error');
    }
  };

  const campos = [
    ['titulo', 'Cargo'],
    ['categoria', 'Categoría'],
    ['ubicacion', 'Ubicación'],
    ['modalidad', 'Modalidad'],
    ['fechaPublicacion', 'Fecha'],
    ['cupos', 'Cupos'],
    ['sueldo', 'Sueldo'],
    ['descripcion', 'Descripción'],
    ['funciones', 'Funciones'],
    ['requisitos', 'Requisitos'],
    ['beneficios', 'Beneficios'],
  ];

  const ofertasVisibles = ofertas.filter((oferta) => coincideFiltro(oferta, filtroEstado));

  return (
    <section className="gestion-ofertas" id="ofertas-admin" aria-labelledby="gestion-ofertas-titulo">
      <header className="gestion-ofertas-cabecera">
        <div>
          <span className="seccion-eyebrow">Selección</span>
          <h2 id="gestion-ofertas-titulo">Gestión de Ofertas</h2>
        </div>
        <button
          type="button"
          className="boton boton-primario"
          onClick={() => {
            setEditando(null);
            setFormulario(FORM_INICIAL);
            setVisible((v) => !v);
          }}
        >
          {visible ? 'Cerrar formulario' : 'Nueva oferta'}
        </button>
      </header>

      {visible && (
        <form className="oferta-form-admin" onSubmit={guardar}>
          <div className="oferta-form-grid">
            {campos.map(([campo, etiqueta]) => (
              <label key={campo}>
                {etiqueta}
                {campo === 'descripcion' ||
                campo === 'funciones' ||
                campo === 'requisitos' ||
                campo === 'beneficios' ? (
                  <textarea
                    required={['descripcion', 'funciones', 'requisitos'].includes(campo)}
                    className="control-campo"
                    rows={2}
                    value={formulario[campo]}
                    onChange={(e) => setFormulario((f) => ({ ...f, [campo]: e.target.value }))}
                  />
                ) : (
                  <input
                    required={['titulo', 'categoria', 'ubicacion', 'modalidad'].includes(campo)}
                    min={campo === 'cupos' ? 1 : undefined}
                    type={
                      campo === 'fechaPublicacion'
                        ? 'date'
                        : campo === 'cupos'
                          ? 'number'
                          : 'text'
                    }
                    className="control-campo"
                    value={formulario[campo] ?? ''}
                    onChange={(e) => setFormulario((f) => ({ ...f, [campo]: e.target.value }))}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="oferta-form-acciones">
            <button className="boton boton-primario" type="submit">
              {editando ? 'Guardar cambios' : 'Crear oferta'}
            </button>
            <button
              className="boton boton-secundario"
              type="button"
              onClick={() => setVisible(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="ofertas-admin-filtros" role="group" aria-label="Filtrar ofertas por estado">
        {FILTROS_ESTADO.map((filtro) => (
          <button
            key={filtro.id}
            type="button"
            className={`oferta-filtro${filtroEstado === filtro.id ? ' activo' : ''}`}
            aria-pressed={filtroEstado === filtro.id}
            onClick={() => setFiltroEstado(filtro.id)}
          >
            {filtro.etiqueta}
          </button>
        ))}
      </div>

      <div className="ofertas-admin-lista">
        {ofertasVisibles.map((oferta) => (
          <article className="oferta-admin-fila" key={oferta.id}>
            <div>
              <strong>{oferta.titulo}</strong>
              <small>
                {oferta.categoria} · {oferta.ubicacion} · {oferta.modalidad}
              </small>
              <small className="oferta-admin-meta">
                {oferta.cupos} {Number(oferta.cupos) === 1 ? 'cupo' : 'cupos'}
                {oferta.fechaPublicacion ? ` · ${formatearFecha(oferta.fechaPublicacion)}` : ''}
                {oferta.sueldo ? ` · ${oferta.sueldo}` : ''}
              </small>
            </div>
            <span className={`oferta-estado estado-${oferta.estado}`}>{oferta.estado}</span>
            <div className="oferta-admin-acciones">
              <button
                type="button"
                className="boton boton-secundario boton-sm"
                onClick={() => editar(oferta)}
              >
                Editar
              </button>
              <button
                type="button"
                className="boton boton-secundario boton-sm"
                onClick={() => estado(oferta, oferta.estado === 'publicada' ? 'borrador' : 'publicada')}
              >
                {oferta.estado === 'publicada' ? 'Despublicar' : 'Publicar'}
              </button>
              <button
                type="button"
                className="boton boton-secundario boton-sm boton-eliminar"
                onClick={() => eliminar(oferta.id)}
              >
                Eliminar
              </button>
            </div>
          </article>
        ))}
        {ofertas.length === 0 && <p className="sin-adjuntos">Aún no hay ofertas registradas.</p>}
        {ofertas.length > 0 && ofertasVisibles.length === 0 && (
          <p className="sin-adjuntos">No hay ofertas con este filtro.</p>
        )}
      </div>
    </section>
  );
}
