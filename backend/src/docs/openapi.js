const secured = [{ bearerAuth: [] }];
const error = (message) => ({ description: message, content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { ok: false, mensaje: message } } } });
const ok = (description) => ({ description, content: { 'application/json': { schema: { type: 'object' } } } });
const paramsId = [{ name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'cand_abc123' } }];
const errors = { 400: error('Solicitud inválida'), 401: error('Autenticación requerida'), 403: error('Permisos insuficientes'), 404: error('Recurso no encontrado'), 500: error('Error interno del servidor') };
const body = (properties, required = []) => ({ required: true, content: { 'application/json': { schema: { type: 'object', required, properties } } } });
const multipart = (properties, required = []) => ({ required: true, content: { 'multipart/form-data': { schema: { type: 'object', required, properties } } } });
const path = (tag, summary, method, extra = {}) => ({ [method]: { tags: [tag], summary, responses: { ...errors, 200: ok(summary), ...extra } } });

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'AquaChile Evaluaciones Psicolaborales API',
    version: '1.0.0',
    description: 'API de postulaciones, candidatos y evaluaciones. Los resultados automatizados son apoyo y requieren revisión humana.',
  },
  servers: [{ url: '/api', description: 'API local' }],
  tags: [{ name: 'Auth' }, { name: 'Ofertas' }, { name: 'Postulaciones' }, { name: 'Candidatos' }, { name: 'Evaluaciones e IA' }, { name: 'Catálogos' }],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Iniciar sesión',
        requestBody: body({ email: { type: 'string', format: 'email', example: 'evaluador@aquachile.cl' }, password: { type: 'string', example: 'ClaveSegura123!' } }, ['email', 'password']),
        responses: { 200: ok('Sesión iniciada'), 400: error('Credenciales inválidas'), 401: error('Correo o contraseña incorrectos'), 500: error('Error interno del servidor') },
      },
    },
    '/auth/perfil': { get: { tags: ['Auth'], summary: 'Obtener perfil autenticado', security: secured, responses: { ...errors, 200: ok('Perfil del usuario') } } },
    '/ofertas/publicas': {
      get: { tags: ['Ofertas'], summary: 'Listar ofertas publicadas', parameters: ['q', 'categoria', 'modalidad'].map((name) => ({ name, in: 'query', schema: { type: 'string', example: name === 'q' ? 'operador' : name === 'modalidad' ? 'Presencial' : 'Operaciones' } })), responses: { 200: ok('Ofertas filtradas'), 500: errors[500] } },
    },
    '/ofertas/publicas/{id}': { parameters: paramsId, get: { tags: ['Ofertas'], summary: 'Ver oferta publicada', responses: { 200: ok('Detalle de oferta'), 404: errors[404], 500: errors[500] } } },
    '/ofertas': {
      get: { tags: ['Ofertas'], summary: 'Listar ofertas (privado)', security: secured, responses: { ...errors, 200: ok('Lista de ofertas') } },
      post: {
        tags: ['Ofertas'], summary: 'Crear oferta (privado)', description: 'Requiere rol evaluador; estado inicial borrador.', security: secured,
        requestBody: body({ titulo: { type: 'string', example: 'Operador de Planta' }, descripcion: { type: 'string', example: 'Operación segura de línea de proceso.' }, ubicacion: { type: 'string', example: 'Puerto Montt' }, familiaCargo: { type: 'string', example: 'Operaciones' }, categoria: { type: 'string', example: 'Operaciones' }, modalidad: { type: 'string', example: 'Presencial' }, fechaPublicacion: { type: 'string', format: 'date', example: '2026-11-23' }, cupos: { type: 'integer', example: 2 }, funciones: { type: 'string', example: 'Operar y monitorear la línea.' }, requisitos: { type: 'string', example: 'Experiencia en planta.' }, beneficios: { type: 'string', example: 'Capacitación.' }, sueldo: { type: 'string', example: 'A convenir' }, estado: { type: 'string', enum: ['borrador', 'publicada', 'cerrada'], example: 'publicada' } }, ['titulo', 'descripcion', 'ubicacion', 'categoria', 'modalidad']),
        responses: { ...errors, 201: ok('Oferta creada') },
      },
    },
    '/ofertas/{id}': {
      parameters: paramsId,
      put: { ...path('Ofertas', 'Actualizar oferta (evaluador)', 'put'), security: secured, requestBody: body({ titulo: { type: 'string' }, descripcion: { type: 'string' }, ubicacion: { type: 'string' }, categoria: { type: 'string' }, modalidad: { type: 'string' }, fechaPublicacion: { type: 'string', format: 'date' }, cupos: { type: 'integer' }, funciones: { type: 'string' }, requisitos: { type: 'string' }, beneficios: { type: 'string' }, sueldo: { type: 'string' }, estado: { type: 'string', enum: ['borrador', 'publicada', 'cerrada'] } }) },
      delete: { ...path('Ofertas', 'Eliminar oferta (evaluador)', 'delete'), security: secured },
    },
    '/ofertas/{id}/estado': { parameters: paramsId, patch: { tags: ['Ofertas'], summary: 'Publicar, despublicar o cerrar oferta', security: secured, requestBody: body({ estado: { type: 'string', enum: ['borrador', 'publicada', 'cerrada'] } }, ['estado']), responses: { ...errors, 200: ok('Estado actualizado') } } },
    '/postulaciones': {
      post: {
        tags: ['Postulaciones'], summary: 'Enviar postulación pública',
        requestBody: multipart({
          oferta_id: { type: 'string', example: 'oferta-demo-operador' }, nombre: { type: 'string', example: 'Ana Pérez' }, rut: { type: 'string', example: '12.345.678-5' }, correo: { type: 'string', format: 'email', example: 'ana@example.com' }, telefono: { type: 'string', example: '912345678' }, familiaCargo: { type: 'string', example: 'Técnico B/C' }, cargo: { type: 'string', example: 'Monitor Producción' }, formacion: { type: 'string', example: 'Técnico' }, disponibilidad: { type: 'string', example: 'Inmediata' }, aniosExperiencia: { type: 'integer', example: 4 }, motivacion: { type: 'string', example: 'Busco desarrollarme en producción.' }, aceptaPrivacidad: { type: 'boolean', example: true }, cv: { type: 'string', format: 'binary', description: 'PDF, DOC o DOCX' }, antecedentes: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Hasta 4 archivos PDF, DOC, DOCX o XLSX' },
        }, ['nombre', 'rut', 'correo', 'telefono', 'familiaCargo', 'cargo', 'formacion', 'disponibilidad', 'aniosExperiencia', 'motivacion', 'aceptaPrivacidad', 'cv']),
        responses: { ...errors, 201: ok('Postulación registrada') },
      },
    },
    '/postulaciones/consulta': {
      post: { tags: ['Postulaciones'], summary: 'Consultar estado con folio y RUT', requestBody: body({ folio: { type: 'string', example: 'AQ-2026-A1B2C3D4' }, rut: { type: 'string', example: '12.345.678-5' } }, ['folio', 'rut']), responses: { ...errors, 200: ok('Estado de postulación') } },
    },
    '/candidatos': {
      get: { tags: ['Candidatos'], summary: 'Listar candidatos', security: secured, responses: { ...errors, 200: ok('Lista de candidatos') } },
      post: { tags: ['Candidatos'], summary: 'Crear candidato manualmente (evaluador)', security: secured, requestBody: multipart({ nombre: { type: 'string', example: 'Ana Pérez' }, rut: { type: 'string', example: '12.345.678-5' }, correo: { type: 'string', example: 'ana@example.com' }, cargo: { type: 'string', example: 'Monitor Producción' }, cv: { type: 'string', format: 'binary' } }), responses: { ...errors, 201: ok('Candidato creado') } },
    },
    '/candidatos/exportar.csv': { get: { tags: ['Candidatos'], summary: 'Exportar candidatos a CSV', security: secured, responses: { 200: { description: 'Archivo CSV', content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } } }, 401: errors[401], 403: errors[403], 500: errors[500] } } },
    '/candidatos/comparar': { get: { tags: ['Evaluaciones e IA'], summary: 'Comparar afinidad por cargo', security: secured, parameters: [{ name: 'cargo', in: 'query', required: true, schema: { type: 'string', example: 'Monitor Producción' } }, { name: 'candidatoId', in: 'query', schema: { type: 'string', example: 'cand_abc123' } }], responses: { ...errors, 200: ok('Ranking por cargo') } } },
    '/candidatos/{id}': {
      parameters: paramsId,
      get: { tags: ['Candidatos'], summary: 'Obtener candidato', security: secured, responses: { ...errors, 200: ok('Ficha del candidato') } },
      put: { tags: ['Candidatos'], summary: 'Actualizar candidato (evaluador)', security: secured, requestBody: body({ nombre: { type: 'string', example: 'Ana Pérez' }, cargo: { type: 'string', example: 'Monitor Producción' } }), responses: { ...errors, 200: ok('Candidato actualizado') } },
      delete: { tags: ['Candidatos'], summary: 'Eliminar candidato (evaluador)', security: secured, responses: { ...errors, 200: ok('Candidato eliminado') } },
    },
    '/candidatos/{id}/cv': { get: { tags: ['Candidatos'], summary: 'Descargar CV del candidato', security: secured, responses: { 200: { description: 'Archivo CV', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } }, 'application/msword': { schema: { type: 'string', format: 'binary' } }, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { schema: { type: 'string', format: 'binary' } } } }, 401: errors[401], 403: errors[403], 404: error('Candidato o CV no encontrado'), 500: errors[500] } } },
    '/candidatos/{id}/estado': { parameters: paramsId, patch: { tags: ['Candidatos'], summary: 'Actualizar estado de proceso', security: secured, requestBody: body({ estado: { type: 'string', example: 'En Proceso' }, motivo: { type: 'string', example: 'Revisión curricular' } }, ['estado']), responses: { ...errors, 200: ok('Estado actualizado') } } },
    '/candidatos/{id}/evaluacion': { parameters: paramsId, post: { tags: ['Evaluaciones e IA'], summary: 'Registrar evaluación psicolaboral', security: secured, requestBody: body({ respuestas: { type: 'object', example: { comunicacion: 4, trabajoEquipo: 5 } }, observaciones: { type: 'string', example: 'Buena colaboración en ejemplos conductuales.' }, estado: { type: 'string', example: 'En Proceso' } }, ['respuestas']), responses: { ...errors, 200: ok('Evaluación registrada') } } },
    '/candidatos/{id}/asistente': { parameters: paramsId, post: { tags: ['Evaluaciones e IA'], summary: 'Generar análisis asistido', description: 'Solo apoyo. Incluye criterios evaluados y limitaciones; no descarta candidatos automáticamente y requiere revisión humana.', security: secured, responses: { ...errors, 200: ok('Análisis asistido') } } },
    '/candidatos/{id}/informe.pdf': { parameters: paramsId, get: { tags: ['Evaluaciones e IA'], summary: 'Descargar informe PDF', security: secured, responses: { 200: { description: 'Informe PDF', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } }, 401: errors[401], 403: errors[403], 404: errors[404], 500: errors[500] } } },
    '/candidatos/{id}/historial': { parameters: paramsId, get: { tags: ['Candidatos'], summary: 'Ver historial del candidato', security: secured, responses: { ...errors, 200: ok('Historial') } } },
    '/catalogos': { get: { tags: ['Catálogos'], summary: 'Obtener catálogos públicos', responses: { 200: ok('Familias de cargo, disponibilidades, formaciones y estados'), 500: errors[500] } } },
    '/catalogos/evaluacion': { get: { tags: ['Evaluaciones e IA'], summary: 'Obtener cuestionario de evaluación', security: secured, responses: { ...errors, 200: ok('Cuestionario') } } },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'JWT devuelto por POST /auth/login' } },
    schemas: { Error: { type: 'object', required: ['ok', 'mensaje'], properties: { ok: { type: 'boolean', example: false }, mensaje: { type: 'string', example: 'Solicitud inválida' }, detalle: { type: 'array', items: { type: 'object', properties: { campo: { type: 'string', example: 'correo' }, mensaje: { type: 'string', example: 'Ingresa un correo válido' } } } } } } },
  },
};
