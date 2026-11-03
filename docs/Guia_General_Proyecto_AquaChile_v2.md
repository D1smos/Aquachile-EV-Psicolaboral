# Guía General del Proyecto AquaChile

## Sistema de Evaluación Psicolaboral — DSY1104

| Campo | Valor |
|---|---|
| Proyecto | MVP web para gestión de evaluaciones psicolaborales |
| Contexto | Vinculación con el Medio — AquaChile |
| Asignatura | Desarrollo Full Stack II (DSY1104) |
| Equipo | Vicente Krausse (frontend) y David Soto (backend) |
| Repositorio | `https://github.com/D1smos/Aquachile-EV-Psicolaboral` |
| Documento | Versión 2.0 — corrige la guía general anterior |

## 1. Contexto VcM

AquaChile necesitaba ordenar un proceso de evaluación psicolaboral disperso en cinco herramientas:

- Microsoft Forms para recibir solicitudes.
- Excel para controlar candidatos.
- Planner para seguir etapas.
- OneDrive para guardar CV.
- Correo para enviar informes.

El problema era la falta de una fuente única de verdad: datos duplicados, poca trazabilidad, riesgo de exponer información personal y dificultad para saber en qué etapa estaba cada candidato.

La solución es un MVP web que centraliza:

- Registro público de postulantes con CV.
- Folio único y consulta de estado.
- Gestión interna por roles.
- Evaluación psicolaboral estandarizada.
- Apoyo automático de afinidad curricular.
- Exportación CSV y ficha PDF.
- Historial de etapas.

## 2. Arquitectura en tres capas

### Capa 1 — Frontend

- React 18.3.
- Vite 5.
- React Router 6.
- Bootstrap 5 y Bootstrap Icons.
- CSS institucional.
- Context API para autenticación y notificaciones.

Responsable principal: Vicente Krausse.

### Capa 2 — Backend

- Node.js 24 con ES Modules.
- Express 4.
- JWT y bcryptjs.
- Helmet, CORS y rate limiting.
- Multer para archivos.
- `pdf-parse` y `mammoth` para leer CV.
- `pdfkit` para informes.
- Nodemailer para correo.

Responsable principal: David Soto.

### Capa 3 — Base de datos

- Esquema SQL de cuatro tablas.
- SQLite local con `node:sqlite`.
- PostgreSQL/Supabase con `pg`.
- Conmutación automática según `DATABASE_URL`.

Responsable principal: David Soto.

### Testing

- Backend: `node:test` y cobertura `c8`.
- Frontend: Vitest 2 y jsdom.
- Total actual: 94 pruebas aprobadas.

## 3. Base de datos dual

```js
const modulo = entorno.db.url
  ? await import('./postgres.js')
  : await import('./sqlite.js');
```

| Motor | Cuándo se activa | Dónde guarda |
|---|---|---|
| SQLite | `DATABASE_URL` vacía | `backend/data/aquachile.db` |
| PostgreSQL | `DATABASE_URL` con `postgresql://...` | Supabase o PostgreSQL administrado |

Tablas:

- `usuarios`
- `candidatos`
- `archivos`
- `historial_etapas`

Los archivos binarios se guardan en `backend/uploads/` y sus metadatos en la tabla `archivos`. Esta entrega no usa Supabase Storage.

## 4. Flujo público

### Inicio

- Presenta el proyecto.
- Muestra el seguimiento de la última postulación guardada en el navegador.
- Usa `PASOS.map()` para explicar el proceso.

### Postulación

Formulario en cuatro bloques:

1. Datos personales.
2. Cargo, formación y disponibilidad.
3. Experiencia y motivación.
4. Documentos y consentimiento.

Validaciones:

- RUT Módulo 11.
- Teléfono móvil chileno.
- Correo.
- Familia y cargo.
- Años de experiencia.
- CV PDF/DOC/DOCX de hasta 5 MB.
- Política de privacidad.

Al enviar:

- Se crea `FormData`.
- Se llama a `POST /api/postulaciones`.
- Se genera un folio.
- Se guarda el seguimiento en `localStorage`.

### Consulta

- `POST /api/postulaciones/consulta`.
- Exige folio y RUT.
- Devuelve solo datos públicos.
- No expone correo, teléfono, archivos ni puntajes.

## 5. Flujo privado

### Login

- `POST /api/auth/login`.
- El backend valida con bcrypt y firma un JWT.
- El token se guarda y se adjunta a las solicitudes.

### Dashboard

- Ruta protegida por `RutaProtegida`.
- Carga paralela con `Promise.all`.
- Cuatro métricas:
  - Total candidatos.
  - Postulaciones del mes.
  - Evaluaciones completadas.
  - Aprobados.
- Filtros por texto, cargo, estado y fechas.
- Orden por fecha.
- Paginación de 8 registros.
- Tabla responsive.

### Roles

| Acción | Analista | Evaluador |
|---|---|---|
| Ver y filtrar | Sí | Sí |
| Descargar CV e informe | Sí | Sí |
| Ver historial | Sí | Sí |
| Crear o editar | No | Sí |
| Evaluar | No | Sí |
| Cambiar estado | No | Sí |
| Eliminar | No | Sí |

El frontend oculta acciones. El backend responde 403 cuando corresponde.

### Evaluación

- Cuestionario de 10 preguntas.
- Cuatro dimensiones.
- Escala 1 a 5.
- Cálculo de puntaje y dimensiones.
- Clasificación: Idóneo, Idóneo con observaciones o No idóneo.
- Apoyo automático con afinidad curricular.
- Historial de etapas.

## 6. Estado del proceso vs. idoneidad

| Dimensión | Campo | Valores |
|---|---|---|
| Estado administrativo | `candidatos.estado` | Pendiente, En Proceso, Aprobado, Rechazado |
| Dictamen técnico | `candidatos.idoneidad` | Idóneo, Idóneo con observaciones, No idóneo |

No se deben mezclar. El estado indica la etapa administrativa; la idoneidad es el resultado del cuestionario.

## 7. Seguridad y privacidad

- Contraseñas con bcrypt.
- JWT con vigencia.
- Helmet, CORS y rate limiting.
- Validación de archivos.
- Consulta pública con datos mínimos.
- `.env`, `backend/data/` y `backend/uploads/` fuera de Git.
- Datos demo ficticios.
- No se deben subir CV reales.

## 8. Estructura del repositorio

```text
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── domain/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   └── test/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── layouts/
│       ├── pages/
│       ├── services/
│       ├── styles/
│       ├── test/
│       └── utils/
├── docs/
├── scripts/
├── SETUP.md
└── README.md
```

## 9. Scripts principales

```bash
npm run setup
npm run dev:backend
npm run dev:frontend
npm run build
npm start
npm run lint
npm test
npm run test:coverage
npm run verificar
npm run demo:reset
```

## 10. Testing

| Suite | Herramienta | Archivos | Pruebas |
|---|---|---:|---:|
| Backend | `node:test` | 6 | 38 |
| Frontend | Vitest + jsdom | 12 | 56 |
| Total | — | 18 | 94 |

Cobertura frontend:

- Global: 58,59%.
- Utilidades: 93,72%.
- Postulación: 94,26%.
- Dashboard: 63,09%.
- Tabla de candidatos: 100%.

## 11. Trabajo colaborativo en GitHub

Ramas principales:

- `Vicente/Frontend`: frontend, componentes, validaciones y pruebas.
- `David/Backend`: backend, persistencia, autenticación y scripts.
- `main`: integración final y entrega.

Flujo recomendado:

1. Trabajar en una rama.
2. Ejecutar tests y lint.
3. Hacer commit con mensaje claro.
4. Integrar a `main`.
5. Subir a GitHub.

## 12. Puesta en marcha

La guía detallada está en [`SETUP.md`](../SETUP.md). Resumen:

```bash
npm run setup
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run verificar
npm run dev:backend
npm run dev:frontend
```

Las contraseñas demo se configuran en `backend/.env` y no se versionan.

## 13. Documentación relacionada

- [`README.md`](../README.md): presentación y ejecución.
- [`SETUP.md`](../SETUP.md): instalación y problemas.
- [`ERS_EP2.md`](ERS_EP2.md): requisitos.
- [`Evidencia_Vitest_EP2.md`](Evidencia_Vitest_EP2.md): pruebas y cobertura.
- [`Guia_Defensa_EP2_AquaChile_v2.md`](Guia_Defensa_EP2_AquaChile_v2.md): guía consolidada.
- [`Guia_Estudio_Frontend_Vicente_v2.md`](Guia_Estudio_Frontend_Vicente_v2.md): frontend.
- [`Verificacion_Rubrica_EP2_Defensa_v2.md`](Verificacion_Rubrica_EP2_Defensa_v2.md): rúbrica y defensa.

## 14. Pendientes para la etapa final

- Despliegue público.
- Migración de archivos a Supabase Storage.
- Pruebas de modales y pantallas secundarias.
- Mejoras de accesibilidad.
- Observabilidad y monitoreo.
- Ampliación de cobertura de `api.js` y `AuthContext`.
