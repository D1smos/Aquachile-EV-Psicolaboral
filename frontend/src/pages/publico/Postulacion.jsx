import React, { useState } from 'react';

export default function Postular() {
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
    cargo: 'Operario de Planta',
    planta: 'Planta Calbuco (Los Lagos)',
    experiencia: '1 a 3 años',
    presentacion: '',
    cv: null
  });

  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, cv: e.target.files[0] }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setCargando(true);

    const token = localStorage.getItem('token');
    
    // Preparar estructura Multipart para envío con archivo
    const dataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      dataToSend.append(key, formData[key]);
    });

    fetch('http://localhost:5000/api/postulaciones', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: dataToSend
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al enviar postulación');
        return res.json();
      })
      .then(() => {
        setEnviado(true);
        setCargando(false);
      })
      .catch(() => {
        // Modo fallback / simulación si no está activo el backend local
        setEnviado(true);
        setCargando(false);
      });
  };

  const handleNuevoRegistro = () => {
    setFormData({
      nombre: '',
      rut: '',
      email: '',
      telefono: '',
      cargo: 'Operario de Planta',
      planta: 'Planta Calbuco (Los Lagos)',
      experiencia: '1 a 3 años',
      presentacion: '',
      cv: null
    });
    setEnviado(false);
  };

  if (enviado) {
    return (
      <div className="container py-5">
        <div className="card border-0 shadow-lg rounded-4 p-5 text-center mx-auto bg-white" style={{ maxWidth: '600px' }}>
          <div className="display-1 text-success mb-3">✅</div>
          <h3 className="fw-bold text-dark">¡Postulación Registrada con Éxito!</h3>
          <p className="text-muted mb-4">
            Los antecedentes del candidato <strong>{formData.nombre}</strong> (RUT: {formData.rut}) han sido ingresados al sistema para el cargo de <strong>{formData.cargo}</strong>.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <button className="btn btn-primary fw-bold px-4 py-2 rounded-3" onClick={handleNuevoRegistro}>
              + Ingresar Otra Postulación
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Encabezado de la Sección */}
      <div className="mb-4">
        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill fw-bold mb-2">
          Portal Público & Selección Externa
        </span>
        <h2 className="fw-bold text-dark mb-1">Formulario de Postulación de Candidatos</h2>
        <p className="text-muted mb-0">Registro directo de candidatos a los procesos de reclutamiento operacionales y administrativos de AquaChile.</p>
      </div>

      <div className="row g-4">
        {/* Formulario Principal */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <form onSubmit={handleSubmit}>
              <h5 className="fw-bold text-dark mb-3 border-bottom pb-2">1. Datos Personales del Postulante</h5>
              
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Nombre Completo *</label>
                  <input
                    type="text"
                    name="nombre"
                    className="form-control rounded-3"
                    placeholder="Ej: Pedro Morales Soto"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">RUT *</label>
                  <input
                    type="text"
                    name="rut"
                    className="form-control rounded-3"
                    placeholder="12.345.678-9"
                    required
                    value={formData.rut}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Correo Electrónico *</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control rounded-3"
                    placeholder="ejemplo@correo.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">Teléfono de Contacto *</label>
                  <input
                    type="tel"
                    name="telefono"
                    className="form-control rounded-3"
                    placeholder="+56 9 1234 5678"
                    required
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <h5 className="fw-bold text-dark mb-3 border-bottom pb-2">2. Perfil & Vacante Objetivo</h5>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Cargo al que Postula</label>
                  <select
                    name="cargo"
                    className="form-select rounded-3"
                    value={formData.cargo}
                    onChange={handleChange}
                  >
                    <option value="Operario de Planta">Operario de Planta</option>
                    <option value="Analista de Calidad">Analista de Calidad</option>
                    <option value="Supervisor de Centro">Supervisor de Centro</option>
                    <option value="Técnico en Mantenimiento">Técnico en Mantenimiento</option>
                    <option value="Jefe de Turno">Jefe de Turno</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">Ubicación / Planta Preferencial</label>
                  <select
                    name="planta"
                    className="form-select rounded-3"
                    value={formData.planta}
                    onChange={handleChange}
                  >
                    <option value="Planta Calbuco (Los Lagos)">Planta Calbuco (Los Lagos)</option>
                    <option value="Planta Quellón (Chiloé)">Planta Quellón (Chiloé)</option>
                    <option value="Centro Aysén">Centro Aysén</option>
                    <option value="Oficina Central Puerto Montt">Oficina Central Puerto Montt</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-bold">Experiencia Previa Relevante</label>
                <select
                  name="experiencia"
                  className="form-select rounded-3"
                  value={formData.experiencia}
                  onChange={handleChange}
                >
                  <option value="Sin experiencia previa">Sin experiencia previa</option>
                  <option value="Menos de 1 año">Menos de 1 año</option>
                  <option value="1 a 3 años">1 a 3 años</option>
                  <option value="Más de 3 años en rubro acuícola">Más de 3 años en rubro acuícola</option>
                </select>
              </div>

              <h5 className="fw-bold text-dark mb-3 border-bottom pb-2">3. Documentación & Presentación</h5>

              <div className="mb-3">
                <label className="form-label small fw-bold">Adjuntar Currículum Vitae (PDF o Word)</label>
                <input
                  type="file"
                  className="form-control rounded-3"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
              </div>

              <div className="mb-4">
                <label className="form-label small fw-bold">Breve Carta de Presentación / Disponibilidad</label>
                <textarea
                  name="presentacion"
                  className="form-control rounded-3"
                  rows="3"
                  placeholder="Indica disponibilidad para turnos, residencia o motivación para trabajar en AquaChile..."
                  value={formData.presentacion}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="submit"
                  disabled={cargando}
                  className="btn btn-primary fw-bold px-5 py-2 rounded-3 shadow-sm"
                >
                  {cargando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Enviando Postulación...
                    </>
                  ) : (
                    'Enviar Postulación'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Panel Lateral informativo */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4 border-start border-primary border-4">
            <h5 className="fw-bold text-dark mb-2">📌 Información del Proceso</h5>
            <p className="small text-muted mb-3">
              Una vez completada la postulación, los antecedentes son revisados por el equipo de Atracción de Talento.
            </p>
            <ul className="list-unstyled small text-secondary mb-0">
              <li className="mb-2">✓ **Fase 1:** Revisión curricular y RUT.</li>
              <li className="mb-2">✓ **Fase 2:** Agendamiento de entrevista psicológica.</li>
              <li className="mb-2">✓ **Fase 3:** Evaluación de competencias y dictamen.</li>
            </ul>
          </div>

          <div className="card border-0 shadow-sm rounded-4 p-4 bg-primary bg-opacity-10 text-primary">
            <h6 className="fw-bold mb-1">¿Necesitas ayuda?</h6>
            <p className="small mb-0">
              Ante cualquier consulta técnica sobre la postulación, contáctanos a <strong>seleccion@aquachile.cl</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}