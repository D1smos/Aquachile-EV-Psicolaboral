const CLASES_ESTADO = {
  Pendiente: 'estado-pendiente',
  'En Proceso': 'estado-proceso',
  Aprobado: 'estado-aprobado',
  Rechazado: 'estado-rechazado',
};

const CLASES_IDONEIDAD = {
  Idóneo: 'estado-aprobado',
  'Idóneo con observaciones': 'estado-proceso',
  'No idóneo': 'estado-rechazado',
};

export default function EstadoBadge({ estado, idoneidad }) {
  if (idoneidad) {
    const clase = CLASES_IDONEIDAD[idoneidad] ?? 'estado-proceso';
    return <span className={`estado-badge ${clase}`}>{idoneidad}</span>;
  }

  const clase = CLASES_ESTADO[estado] ?? CLASES_ESTADO.Pendiente;
  return <span className={`estado-badge ${clase}`}>{estado ?? 'Pendiente'}</span>;
}
