import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';

const aInputLocal = (fecha) => {
  const datos = new Date(fecha);
  if (Number.isNaN(datos.getTime())) {
    return '';
  }
  const pad = (valor) => String(valor).padStart(2, '0');
  return `${datos.getFullYear()}-${pad(datos.getMonth() + 1)}-${pad(datos.getDate())}T${pad(datos.getHours())}:${pad(datos.getMinutes())}`;
};

const enUnaHora = () => {
  const fecha = new Date();
  fecha.setMinutes(0, 0, 0);
  fecha.setHours(fecha.getHours() + 1);
  return aInputLocal(fecha);
};

const enDosHoras = (inicio) => {
  const fecha = new Date(inicio);
  if (Number.isNaN(fecha.getTime())) {
    return '';
  }
  fecha.setHours(fecha.getHours() + 1);
  return aInputLocal(fecha);
};

const inicial = (entrevista, candidatoIdInicial) => {
  const inicio = entrevista?.fechaInicio ? aInputLocal(entrevista.fechaInicio) : enUnaHora();
  return {
    candidatoId: entrevista?.candidatoId ?? candidatoIdInicial ?? '',
    titulo: entrevista?.titulo ?? '',
    fechaInicio: inicio,
    fechaFin: entrevista?.fechaFin ? aInputLocal(entrevista.fechaFin) : enDosHoras(inicio),
    lugar: entrevista?.lugar ?? '',
    notas: entrevista?.notas ?? '',
  };
};

export default function ModalEntrevista({
  candidatos = [],
  entrevista = null,
  candidatoIdInicial = '',
  onCerrar,
  onGuardar,
}) {
  const { mostrarToast } = useToast();
  const esEdicion = Boolean(entrevista);
  const [formulario, setFormulario] = useState(() => inicial(entrevista, candidatoIdInicial));
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const alPulsarTecla = (evento) => {
      if (evento.key === 'Escape') {
        onCerrar();
      }
    };
    document.addEventListener('keydown', alPulsarTecla);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alPulsarTecla);
      document.body.style.overflow = '';
    };
  }, [onCerrar]);

  const modificar = (evento) => {
    const { name, value } = evento.target;
    setFormulario((previo) => {
      if (name === 'fechaInicio') {
        const anterior = enDosHoras(previo.fechaInicio);
        return {
          ...previo,
          fechaInicio: value,
          fechaFin: previo.fechaFin === anterior || !previo.fechaFin ? enDosHoras(value) : previo.fechaFin,
        };
      }
      return { ...previo, [name]: value };
    });
  };

  const validar = () => {
    const fallos = {};
    if (!formulario.candidatoId) {
      fallos.candidatoId = 'Selecciona un candidato';
    }
    const inicio = new Date(formulario.fechaInicio);
    const fin = new Date(formulario.fechaFin);
    if (!formulario.fechaInicio || Number.isNaN(inicio.getTime())) {
      fallos.fechaInicio = 'Indica la fecha y hora de inicio';
    }
    if (!formulario.fechaFin || Number.isNaN(fin.getTime())) {
      fallos.fechaFin = 'Indica la fecha y hora de término';
    } else if (!Number.isNaN(inicio.getTime()) && fin <= inicio) {
      fallos.fechaFin = 'El término debe ser posterior al inicio';
    }
    if (String(formulario.notas).length > 2000) {
      fallos.notas = 'Máximo 2000 caracteres';
    }
    setErrores(fallos);
    return Object.keys(fallos).length === 0;
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!validar() || guardando) {
      return;
    }
    setGuardando(true);
    try {
      const datos = await onGuardar({
        candidatoId: formulario.candidatoId,
        titulo: formulario.titulo,
        fechaInicio: new Date(formulario.fechaInicio).toISOString(),
        fechaFin: new Date(formulario.fechaFin).toISOString(),
        lugar: formulario.lugar,
        notas: formulario.notas,
      });
      mostrarToast(datos?.mensaje ?? 'Entrevista guardada', 'exito');
      onCerrar();
    } catch (capturado) {
      const detalle = capturado?.detalle?.map?.((item) => item.mensaje).join(' ');
      mostrarToast(detalle || capturado.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onCerrar}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-entrevista"
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecera">
          <div>
            <span className="modal-eyebrow">Agenda</span>
            <h3 className="modal-titulo" id="titulo-modal-entrevista">
              {esEdicion ? 'Editar entrevista' : 'Nueva entrevista'}
            </h3>
            <p className="modal-subtitulo">
              Se guarda primero en la agenda local y luego se sincroniza con Google Calendar.
            </p>
          </div>
          <button type="button" className="boton-icono" onClick={onCerrar} aria-label="Cerrar">
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>

        <form className="modal-cuerpo" onSubmit={enviar} noValidate>
          <div className="rejilla-campos">
            <div>
              <label className="etiqueta-campo" htmlFor="entrevista-candidato">
                Candidato
              </label>
              <select
                id="entrevista-candidato"
                name="candidatoId"
                className="control-campo"
                value={formulario.candidatoId}
                onChange={modificar}
                disabled={guardando || esEdicion}
              >
                <option value="">Selecciona…</option>
                {candidatos.map((candidato) => (
                  <option key={candidato.id} value={candidato.id}>
                    {candidato.nombre} · {candidato.folio}
                  </option>
                ))}
              </select>
              {errores.candidatoId && <p className="error-campo">{errores.candidatoId}</p>}
            </div>
            <div>
              <label className="etiqueta-campo" htmlFor="entrevista-titulo">
                Título (opcional)
              </label>
              <input
                id="entrevista-titulo"
                name="titulo"
                type="text"
                className="control-campo"
                maxLength={140}
                value={formulario.titulo}
                onChange={modificar}
                disabled={guardando}
              />
            </div>
            <div>
              <label className="etiqueta-campo" htmlFor="entrevista-inicio">
                Inicio
              </label>
              <input
                id="entrevista-inicio"
                name="fechaInicio"
                type="datetime-local"
                className="control-campo"
                value={formulario.fechaInicio}
                onChange={modificar}
                disabled={guardando}
              />
              {errores.fechaInicio && <p className="error-campo">{errores.fechaInicio}</p>}
            </div>
            <div>
              <label className="etiqueta-campo" htmlFor="entrevista-fin">
                Término
              </label>
              <input
                id="entrevista-fin"
                name="fechaFin"
                type="datetime-local"
                className="control-campo"
                value={formulario.fechaFin}
                onChange={modificar}
                disabled={guardando}
              />
              {errores.fechaFin && <p className="error-campo">{errores.fechaFin}</p>}
            </div>
            <div>
              <label className="etiqueta-campo" htmlFor="entrevista-lugar">
                Lugar o enlace (opcional)
              </label>
              <input
                id="entrevista-lugar"
                name="lugar"
                type="text"
                className="control-campo"
                maxLength={180}
                value={formulario.lugar}
                onChange={modificar}
                disabled={guardando}
              />
            </div>
            <div>
              <label className="etiqueta-campo" htmlFor="entrevista-notas">
                Notas (opcional)
              </label>
              <textarea
                id="entrevista-notas"
                name="notas"
                className="control-campo"
                rows={3}
                maxLength={2000}
                value={formulario.notas}
                onChange={modificar}
                disabled={guardando}
              />
              {errores.notas && <p className="error-campo">{errores.notas}</p>}
            </div>
          </div>

          <footer className="modal-pie">
            <button type="button" className="boton boton-secundario" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="boton boton-primario" disabled={guardando}>
              {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Agendar entrevista'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
