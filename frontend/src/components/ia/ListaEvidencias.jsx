export default function ListaEvidencias({ evidencias = [], vacio = 'Sin evidencia registrada.' }) {
  const lista = (Array.isArray(evidencias) ? evidencias : [evidencias])
    .map((evidencia) => String(evidencia ?? '').trim())
    .filter(Boolean);

  if (lista.length === 0) {
    return <p className="analisis-ia-vacio">{vacio}</p>;
  }

  return (
    <ul className="analisis-ia-evidencias">
      {lista.map((evidencia, indice) => (
        <li key={`${evidencia.slice(0, 32)}-${indice}`}>
          <i className="bi bi-check2" aria-hidden="true" /> {evidencia}
        </li>
      ))}
    </ul>
  );
}
