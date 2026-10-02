import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const catalogoCargos = {
  "Profesional A": [
    "Líder Desarrollo Producción"
  ],

  "Profesional B/C": [
    "Analista de Sistemas",
    "Coordinador Servicios Generales"
  ],

  "Técnico B/C": [
    "Asistente Bodega Planta",
    "Operador Sala Control",
    "Monitor Producción"
  ],

  "Operario Calificado": [
    "Gruero"
  ]
}

function Postulacion() {

  const navigate = useNavigate()

  const [formulario, setFormulario] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    familiaCargo: '',
    cargo: ''
  })

  const [cv, setCv] = useState(null)

  const manejarCambio = (event) => {

    const { name, value } = event.target

    // Validación especial para teléfono
    if (name === "telefono") {

      // Elimina todo lo que no sea un número
      let telefono = value.replace(/\D/g, "")

      // El teléfono debe comenzar por 9
      if (telefono.length > 0 && telefono[0] !== "9") {
        return
      }

      // Máximo 9 dígitos
      telefono = telefono.slice(0, 9)

      setFormulario({
        ...formulario,
        telefono: telefono
      })

      return
    }

    // Si cambia la familia de cargo,
    // se reinicia el cargo seleccionado
    if (name === "familiaCargo") {

      setFormulario({
        ...formulario,
        familiaCargo: value,
        cargo: ""
      })

      return
    }

    // Cambio normal para los demás campos
    setFormulario({
      ...formulario,
      [name]: value
    })
  }

  const manejarEnvio = (event) => {

    event.preventDefault()

    console.log("Datos del formulario:", formulario)
    console.log("CV:", cv)

    navigate('/confirmacion')
  }

  return (
    <div className="row justify-content-center">

      <div className="col-md-7">

        <h1 className="mb-4">
          Formulario de Postulación
        </h1>

        <form onSubmit={manejarEnvio}>

          {/* Nombre */}
          <div className="mb-3">

            <label className="form-label">
              Nombre completo
            </label>

            <input
              type="text"
              className="form-control"
              name="nombre"
              value={formulario.nombre}
              onChange={manejarCambio}
              required
            />

          </div>

          {/* Correo */}
          <div className="mb-3">

            <label className="form-label">
              Correo electrónico
            </label>

            <input
              type="email"
              className="form-control"
              name="correo"
              value={formulario.correo}
              onChange={manejarCambio}
              required
            />

          </div>

          {/* Teléfono */}
          <div className="mb-3">

            <label className="form-label">
              Teléfono
            </label>

            <input
              type="tel"
              className="form-control"
              name="telefono"
              value={formulario.telefono}
              onChange={manejarCambio}
              placeholder="9XXXXXXXX"
              inputMode="numeric"
              pattern="9[0-9]{8}"
              maxLength="9"
              required
            />

            <div className="form-text">
              Ingrese 9 dígitos comenzando por 9.
            </div>

          </div>

          {/* Familia de cargo */}
          <div className="mb-3">

            <label className="form-label">
              Familia de cargo
            </label>

            <select
              className="form-select"
              name="familiaCargo"
              value={formulario.familiaCargo}
              onChange={manejarCambio}
              required
            >

              <option value="">
                Seleccione una familia de cargo
              </option>

              <option value="Profesional A">
                Profesional A
              </option>

              <option value="Profesional B/C">
                Profesional B/C
              </option>

              <option value="Técnico B/C">
                Técnico B/C
              </option>

              <option value="Operario Calificado">
                Operario Calificado
              </option>

            </select>

          </div>

          {/* Cargo */}
          <div className="mb-3">

            <label className="form-label">
              Cargo
            </label>

            <select
              className="form-select"
              name="cargo"
              value={formulario.cargo}
              onChange={manejarCambio}
              disabled={!formulario.familiaCargo}
              required
            >

              <option value="">
                Seleccione un cargo
              </option>

              {formulario.familiaCargo &&
                catalogoCargos[formulario.familiaCargo]?.map((cargo) => (
                  <option
                    key={cargo}
                    value={cargo}
                  >
                    {cargo}
                  </option>
                ))
              }

            </select>

          </div>

          {/* Currículum */}
          <div className="mb-4">

            <label className="form-label">
              Currículum Vitae
            </label>

            <input
              type="file"
              className="form-control"
              accept=".pdf,.doc,.docx"
              onChange={(event) => setCv(event.target.files[0])}
              required
            />

          </div>

          {/* Botón */}
          <button
            type="submit"
            className="btn btn-primary"
          >
            Enviar postulación
          </button>

        </form>

      </div>

    </div>
  )
}

export default Postulacion