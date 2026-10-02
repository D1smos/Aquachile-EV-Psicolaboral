export function EstadoBadge({ estado }) {
  const getBadgeClass = (est) => {
    switch (est?.toLowerCase()) {
      case 'aprobado':
        return 'bg-success'
      case 'rechazado':
        return 'bg-danger'
      case 'pendiente':
      default:
        return 'bg-warning text-dark'
    }
  }

  return (
    <span className={`badge ${getBadgeClass(estado)}`}>
      {estado || 'Pendiente'}
    </span>
  )
}

export default EstadoBadge