export default function TarjetaMetrica({ titulo, valor, detalle, tono = 'azul', icono }) {
  return (
    <article className={`tarjeta-kpi kpi-${tono}`}>
      <div className="kpi-cabecera">
        <span className="kpi-icono" aria-hidden="true">
          <i className={`bi ${icono}`} />
        </span>
        <h6 className="kpi-titulo">{titulo}</h6>
      </div>
      <p className="kpi-valor">{valor}</p>
      {detalle && <p className="kpi-detalle">{detalle}</p>}
    </article>
  );
}
