export default function CuestionarioEvaluacion({ cuestionario, respuestas, onRespuesta, invalidas }) {
  return (
    <div className="cuestionario">
      {cuestionario.dimensiones.map((dimension) => {
        const preguntas = cuestionario.preguntas.filter(
          (pregunta) => pregunta.dimension === dimension.id,
        );

        return (
          <fieldset className="dimension-bloque" key={dimension.id}>
            <legend className="dimension-titulo">{dimension.nombre}</legend>

            {preguntas.map((pregunta) => (
              <div className={`pregunta ${invalidas?.includes(pregunta.id) ? 'pregunta-incompleta' : ''}`} key={pregunta.id}>
                <p className="pregunta-texto">{pregunta.texto}</p>
                <div className="escala-respuesta" role="radiogroup" aria-label={pregunta.texto}>
                  {cuestionario.opciones.map((opcion) => {
                    const activa = respuestas[pregunta.id] === opcion.valor;
                    return (
                      <label
                        key={opcion.valor}
                        className={`escala-opcion ${activa ? 'escala-activa' : ''}`}
                        title={opcion.etiqueta}
                      >
                        <input
                          type="radio"
                          name={`resp-${pregunta.id}`}
                          value={opcion.valor}
                          checked={activa}
                          onChange={() => onRespuesta(pregunta.id, opcion.valor)}
                        />
                        <span className="escala-valor">{opcion.valor}</span>
                        <span className="escala-etiqueta">{opcion.etiqueta}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </fieldset>
        );
      })}
    </div>
  );
}
