export default function Marca({ compacta = false }) {
  return (
    <span className={`marca ${compacta ? 'marca-compacta' : ''}`}>
      <span className="marca-logo" aria-hidden="true">
        <svg viewBox="0 0 40 40" width="38" height="38" focusable="false">
          <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.15" />
          <path
            d="M7 25c3.6-4.6 7.2-4.6 10.8 0s7.2 4.6 10.8 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M7 16c3.6-4.6 7.2-4.6 10.8 0s7.2 4.6 10.8 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      </span>
      <span className="marca-texto">
        <strong>AquaChile</strong>
        {!compacta && <small>Evaluaciones Psicolaborales</small>}
      </span>
    </span>
  );
}
