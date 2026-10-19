export default function FiltrosCandidatos({ filtros, onCambiar, cargos = [], estados = [], total, onLimpiar }) {
  const modificar = (evento) => {
    onCambiar({ ...filtros, [evento.target.name]: evento.target.value });
  };

  const hayFiltros = Object.values(filtros).some((valor) => String(valor).trim() !== '');

  return (
    <section className="panel-filtros" aria-label="Filtros de candidatos">
      <div className="filtros-cabecera">
        <h2 className="filtros-titulo">
          <i className="bi bi-funnel" aria-hidden="true" /> Filtros
        </h2>
        <span className="filtros-total">{total} candidato{total === 1 ? '' : 's'}</span>
      </div>

      <div className="filtros-grid">
        <div className="campo-filtro">
          <label className="etiqueta-campo" htmlFor="filtro-busqueda">
            Nombre, RUT o correo
          </label>
          <div className="campo-con-icono">
            <i className="bi bi-search" aria-hidden="true" />
            <input
              id="filtro-busqueda"
              name="busqueda"
              type="search"
              className="control-campo"
              placeholder="Buscar candidato…"
              value={filtros.busqueda}
              onChange={modificar}
            />
          </div>
        </div>

        <div className="campo-filtro">
          <label className="etiqueta-campo" htmlFor="filtro-cargo">
            Cargo
          </label>
          <select
            id="filtro-cargo"
            name="cargo"
            className="control-campo"
            value={filtros.cargo}
            onChange={modificar}
          >
            <option value="">Todos los cargos</option>
            {cargos.map((cargo) => (
              <option key={cargo} value={cargo}>
                {cargo}
              </option>
            ))}
          </select>
        </div>

        <div className="campo-filtro">
          <label className="etiqueta-campo" htmlFor="filtro-estado">
            Estado del proceso
          </label>
          <select
            id="filtro-estado"
            name="estado"
            className="control-campo"
            value={filtros.estado}
            onChange={modificar}
          >
            <option value="">Todos los estados</option>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        <div className="campo-filtro">
          <label className="etiqueta-campo" htmlFor="filtro-desde">
            Postulado desde
          </label>
          <input
            id="filtro-desde"
            name="desde"
            type="date"
            className="control-campo"
            value={filtros.desde}
            onChange={modificar}
          />
        </div>

        <div className="campo-filtro">
          <label className="etiqueta-campo" htmlFor="filtro-hasta">
            Hasta
          </label>
          <input
            id="filtro-hasta"
            name="hasta"
            type="date"
            className="control-campo"
            value={filtros.hasta}
            onChange={modificar}
          />
        </div>

        <div className="campo-filtro campo-accion">
          <button
            type="button"
            className="boton boton-secundario w-100"
            onClick={onLimpiar}
            disabled={!hayFiltros}
          >
            <i className="bi bi-arrow-counterclockwise" aria-hidden="true" /> Limpiar
          </button>
        </div>
      </div>
    </section>
  );
}
