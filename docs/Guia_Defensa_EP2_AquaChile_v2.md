# Guía Consolidada de Estudio y Defensa — EP2 AquaChile

## Sistema de Evaluación Psicolaboral — DSY1104

| Campo | Valor |
|---|---|
| Asignatura | Desarrollo Full Stack II (DSY1104) |
| Evaluación | Parcial N° 2 — 30% de la asignatura |
| Distribución | 40% encargo grupal + 60% presentación individual |
| Equipo | Vicente Krausse (frontend) y David Soto (backend) |
| Rama de entrega | `main` |
| Frontend | React 18 + Vite 5 + React Router 6 + Bootstrap 5 |
| Backend | Node.js 24 + Express + SQLite/PostgreSQL |
| Testing frontend | Vitest 2 + jsdom, sin Karma ni Jasmine |
| Documento | Versión 2.0 — reemplaza las tres guías PDF anteriores |

## 1. Resumen ejecutivo

El proyecto implementa un MVP web para centralizar el proceso de evaluación psicolaboral de AquaChile. La solución separa el recorrido público del postulante y el trabajo interno del equipo de reclutamiento, con autenticación, roles, persistencia y pruebas automatizadas.

El estado actual del repositorio incluye:

- **38 pruebas de backend** con `node:test`.
- **56 pruebas de frontend** con Vitest en 12 archivos.
- **94 pruebas totales aprobadas**.
- **Cobertura frontend:** 58,59% de líneas, 80,48% de ramas y 56,61% de funciones.
- **Cobertura de utilidades:** 93,72%.
- **Cobertura de flujos centrales:** `Postulacion` 94,26%, `Dashboard` 63,09% y `TablaCandidatos` 100%.

La rúbrica se cumple con fortalezas claras en estructura React, estado, formularios, filtros, navegación y testing. El uso de Bootstrap 5 es real, aunque acotado frente al CSS institucional propio.

## 2. Problemática VcM

AquaChile desarrollaba el proceso de evaluación psicolaboral con herramientas desconectadas:

- Microsoft Forms para recibir solicitudes.
- Excel para controlar candidatos.
- Planner para seguir etapas.
- OneDrive para guardar CV.
- Correo electrónico para enviar informes.

Esa fragmentación producía duplicación de datos, pérdida de trazabilidad, poca visibilidad del estado y riesgo de exponer información personal.

El MVP responde con una plataforma única que:

- Recibe postulaciones con CV y folio.
- Permite consultar el estado sin exponer datos sensibles.
- Centraliza candidatos, documentos, estados e historial.
- Diferencia permisos de Analista y Evaluador/Psicólogo.
- Estandariza la evaluación psicolaboral y los reportes.

## 3. Arquitectura

```text
Navegador
  └── React 18 + Vite + React Router + Bootstrap 5
        ├── Vistas públicas: Inicio, Postulación, Consulta, Privacidad, 404
        ├── Vistas privadas: Login, Dashboard
        ├── Componentes: Navbar, Sidebar, TablaCandidatos, FiltrosCandidatos,
        │   TarjetaMetrica, EstadoBadge, modales y cuestionario
        ├── Contextos: AuthContext, ToastContext
        └── Servicio HTTP: api.js
              │
              ▼ HTTP / JSON / multipart
        Express + JWT + Multer
        ├── Rutas y controladores
        ├── Servicios de negocio
        ├── Validadores
        ├── SQLite local o PostgreSQL/Supabase
        └── Archivos en backend/uploads con metadatos en tabla archivos
```

### Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, Bootstrap 5, Bootstrap Icons |
| Backend | Node.js 24, Express 4, JWT, bcryptjs, Multer, Nodemailer |
| Base de datos | SQLite con `node:sqlite` o PostgreSQL/Supabase |
| Testing | `node:test` en backend y Vitest + jsdom en frontend |
| Calidad | ESLint, cobertura V8, `c8` en backend |

## 4. Flujo completo de la aplicación

### 4.1 Recorrido público

1. **Inicio (`/`):** muestra la propuesta y el seguimiento de la última postulación guardada en el navegador.
2. **Postulación (`/postulacion`):** formulario en cuatro bloques con datos personales, cargo, experiencia, documentos y consentimiento.
3. **Validación:** RUT Módulo 11, teléfono móvil chileno, correo, catálogos, años de experiencia, CV y política de privacidad.
4. **Envío:** se construye un `FormData`, se envía a `POST /api/postulaciones` y se guarda el folio en `localStorage`.
5. **Confirmación:** se muestra el folio y el enlace para consultar el estado.
6. **Consulta (`/consulta`):** el postulante ingresa folio y RUT; recibe solo nombre, cargo, familia, estado y fechas.

### 4.2 Recorrido privado

1. **Login (`/login`):** autenticación con JWT; el token se guarda y se adjunta a las solicitudes.
2. **Dashboard (`/dashboard`):** ruta protegida por `RutaProtegida`.
3. **Carga paralela:** `Promise.all` obtiene candidatos, catálogos y cuestionario.
4. **Métricas:** cuatro tarjetas KPI calculadas con `useMemo`.
5. **Filtros:** búsqueda sin tildes, cargo, estado y rango de fechas.
6. **Paginación:** 8 candidatos por página.
7. **Roles:** el Analista solo consulta, filtra, descarga y exporta; el Evaluador además crea, edita, evalúa, cambia estado y elimina.
8. **Evaluación:** cuestionario de 10 preguntas, cálculo de puntaje, dimensiones e idoneidad.
9. **Cierre:** historial, exportación CSV y ficha PDF.

## 5. Mapa del frontend

| Archivo o carpeta | Responsabilidad |
|---|---|
| `frontend/src/main.jsx` | Punto de entrada; carga Bootstrap, estilos y providers. |
| `frontend/src/App.jsx` | Rutas públicas y privada; página 404. |
| `frontend/src/layouts/AppLayout.jsx` | Navbar, contenido y footer compartidos. |
| `frontend/src/context/AuthContext.jsx` | Sesión, token, login y logout. |
| `frontend/src/context/ToastContext.jsx` | Notificaciones globales. |
| `frontend/src/services/api.js` | Cliente `fetch` con token, JSON, `FormData` y descargas. |
| `frontend/src/pages/publico/Inicio.jsx` | Landing y seguimiento de la última postulación. |
| `frontend/src/pages/publico/Postulacion.jsx` | Formulario público controlado y validado. |
| `frontend/src/pages/publico/Consulta.jsx` | Consulta por folio y RUT. |
| `frontend/src/pages/publico/Privacidad.jsx` | Política de tratamiento de datos. |
| `frontend/src/pages/privado/Login.jsx` | Formulario de acceso. |
| `frontend/src/pages/privado/Dashboard.jsx` | Métricas, filtros, tabla, paginación y modales. |
| `frontend/src/components/TablaCandidatos.jsx` | Tabla `.map()` con acciones según rol. |
| `frontend/src/components/FiltrosCandidatos.jsx` | Controles de búsqueda y filtros. |
| `frontend/src/components/TarjetaMetrica.jsx` | KPI reutilizable por props. |
| `frontend/src/components/EstadoBadge.jsx` | Badge reutilizable de estado e idoneidad. |
| `frontend/src/components/ModalEvaluacion.jsx` | Evaluación, asistente y cambio de estado. |
| `frontend/src/components/ModalHistorial.jsx` | Historial de etapas. |
| `frontend/src/components/ModalNuevoCandidato.jsx` | Alta y edición de candidatos. |
| `frontend/src/utils/validaciones.js` | RUT, teléfono, correo, archivos y formularios. |
| `frontend/src/utils/evaluacionUtils.js` | Puntajes, idoneidad, KPIs, filtros y orden. |

## 6. Matriz de rúbrica

### 6.1 Encargo grupal — 40%

| Indicador | Peso | Nivel estimado | Evidencia |
|---|---:|---|---|
| IE2.1.1 Estructura React y pertinencia VcM | 10% | Muy buen desempeño | Estructura modular y flujo público/privado coherente. |
| IE2.1.2 Componentes, props y responsive | 10% | Buen desempeño | Componentes reutilizables, `.map()`, grid Bootstrap y CSS responsive. El uso de Bootstrap es acotado. |
| IE2.1.5 Estado, formularios, filtros y navegación | 10% | Muy buen desempeño | `useState`, eventos, filtros, validaciones y React Router operativos. |
| IE2.2.1 / IE2.3.1 Pruebas Vitest | 10% | Muy buen desempeño | 56 pruebas Vitest, 12 archivos, flujos centrales cubiertos y evidencia documentada. |

Estimación del encargo: **sobre 90%**. La presentación individual es el 60% restante y depende de la explicación en vivo.

### 6.2 Presentación individual — 60%

| Indicador | Peso | Qué debes demostrar |
|---|---:|---|
| IE2.1.3 Problema y diseño frontend | 15% | Explicar la fragmentación de AquaChile y cómo el MVP la resuelve. |
| IE2.1.4 Dominio de componentes y responsividad | 15% | Abrir componentes, explicar props, `.map()` y Bootstrap; mostrar vista móvil. |
| IE2.1.6 Flujo interactivo y coherencia | 15% | Recorrer postulación, consulta, login, dashboard, filtros, evaluación y estados. |
| IE2.2.2 / IE2.3.2 Evidencia y explicación de testing | 15% | Ejecutar Vitest, explicar casos y justificar escenarios y cobertura. |

## 7. Chuleta de código para la defensa

### Componentes y props

Abrir `frontend/src/components/TarjetaMetrica.jsx` y `EstadoBadge.jsx`. Explicar que reciben datos por props y se reutilizan en `Dashboard.jsx`, `Inicio.jsx`, `TablaCandidatos.jsx` y `Consulta.jsx`.

### Arreglos y `.map()`

Abrir `TablaCandidatos.jsx` y `CuestionarioEvaluacion.jsx`. Mostrar `candidatos.map(...)`, el doble `.map()` de dimensiones/preguntas y explicar `key={candidato.id}`.

### `useState` y formularios controlados

Abrir `Postulacion.jsx`. Mostrar `useState(FORM_INICIAL)`, la función `modificar`, el formateo de RUT/teléfono y la limpieza del cargo al cambiar de familia.

### Renderizado condicional

Abrir `Dashboard.jsx` y `TablaCandidatos.jsx`. Mostrar `cargando`, `error`, modales y `puedeEvaluar && <button>`.

### Búsqueda y filtros

Abrir `FiltrosCandidatos.jsx` y `evaluacionUtils.js`. Explicar `normalizar()` con `NFD` para buscar “maria” y encontrar “María”.

### React Router

Abrir `App.jsx` y `Navbar.jsx`. Explicar `Routes`, `Route`, `Link`, `NavLink` y `RutaProtegida`.

### Responsive

Abrir `tema-aquachile.css`, `AppLayout.css` y `TablaCandidatos.jsx`. Mostrar breakpoints, menú móvil y tabla convertida en tarjetas.

### Bootstrap 5

Abrir `Dashboard.jsx` y `main.jsx`. Mostrar la importación de Bootstrap, el grid `row g-3` y las columnas `col-6 col-md-4 col-xl-3`. Aclarar que el diseño corporativo se complementa con CSS propio.

## 8. Testing real

### Comandos

```bash
npm test
npm test --prefix backend
npm test --prefix frontend
npm run test:coverage --prefix frontend
npm run test:cobertura --prefix backend
```

### Resultados actuales

| Suite | Herramienta | Archivos | Pruebas | Estado |
|---|---|---:|---:|---|
| Backend | `node:test` | 6 | 38 | 38/38 |
| Frontend | Vitest + jsdom | 12 | 56 | 56/56 |
| Total | — | 18 | 94 | 94/94 |

### Cobertura frontend

| Archivo o grupo | Líneas |
|---|---:|
| Global | 58,59% |
| Utilidades | 93,72% |
| `Postulacion.jsx` | 94,26% |
| `Dashboard.jsx` | 63,09% |
| `TablaCandidatos.jsx` | 100% |
| `Consulta.jsx` | 94,30% |
| `Login.jsx` | 82,18% |

La cobertura global no es 100% porque varios modales y pantallas secundarias se validan de forma manual. Los flujos principales solicitados por la rúbrica sí están cubiertos.

### Escenarios justificados

- **Validaciones puras:** evitan enviar RUT, teléfono, correo o CV inválidos.
- **Postulación:** comprueba catálogos, formato de datos, CV, consentimiento, envío, folio y errores de API.
- **Dashboard:** comprueba métricas, filtros sin tildes, paginación, error de carga y permisos por rol.
- **Componentes:** comprueban renderizado de navegación, tabla, login, consulta y privacidad.
- **Backend:** comprueba autenticación, permisos, duplicados, consulta pública, evaluación, correo y descarga de CV.

## 9. Guion de defensa — 10 a 12 minutos

### Minuto 0 a 2 — Problema y propuesta

Explicar la fragmentación de herramientas en AquaChile y cómo el MVP centraliza el flujo en una plataforma con zona pública y privada.

### Minuto 2 a 5 — Flujo público

1. Mostrar Inicio y el seguimiento “Sin iniciar”.
2. Intentar enviar una postulación incompleta.
3. Completar una postulación ficticia con CV PDF.
4. Mostrar el folio generado.
5. Consultar el estado por folio y RUT.
6. Volver a Inicio y mostrar el seguimiento actualizado.

### Minuto 5 a 8 — Panel interno y roles

1. Ingresar como Analista.
2. Mostrar filtros, tabla, historial y exportación.
3. Comprobar que no aparecen acciones de edición ni evaluación.
4. Ingresar como Evaluador.
5. Descargar el CV, generar apoyo automático, responder el cuestionario y cambiar estado.
6. Mostrar el historial y la ficha PDF.

### Minuto 8 a 11 — Código y pruebas

1. Abrir `App.jsx`, `TablaCandidatos.jsx`, `Postulacion.jsx` y `validaciones.js`.
2. Explicar props, `.map()`, `useState`, filtros, rutas y Bootstrap.
3. Ejecutar `npm test`.
4. Mostrar 38 pruebas backend + 56 Vitest.
5. Ejecutar `npm run test:coverage --prefix frontend` y explicar la cobertura.

### Minuto 11 a 12 — Cierre

Distinguir lo implementado de lo pendiente: despliegue, Supabase Storage y ampliación de pruebas de modales.

## 10. Preguntas probables

### ¿Por qué usaron Vitest y no Karma?

Porque la rúbrica React de la EP2 exige Vitest y porque jsdom permite probar componentes y lógica sin depender de un navegador externo. La migración eliminó la configuración de Karma y dejó una suite única, más rápida y reproducible.

### ¿Por qué la cobertura global no es más alta?

Porque los modales y algunas pantallas secundarias se validan manualmente. La suite prioriza los comportamientos con mayor riesgo: validaciones, postulación, dashboard, permisos, consulta y evaluación.

### ¿Dónde se usa Bootstrap 5?

Se importa en `main.jsx` y se usa en el grid de KPIs del Dashboard, utilidades como `w-100`, `text-primary` y `spinner-border`, además de Bootstrap Icons. El resto del diseño se complementa con el tema institucional propio.

### ¿Cómo se protege el acceso?

El backend valida JWT y roles. El frontend oculta acciones, pero la seguridad real está en el servidor, que responde 403 cuando el Analista intenta editar, evaluar, cambiar estado o eliminar.

### ¿Qué datos son reales y qué es simulado?

Los datos de demostración son ficticios. La integración con backend y base de datos es real; el correo se omite de forma controlada si no hay SMTP configurado.

## 11. Pendientes y hoja de ruta

- Despliegue público en producción.
- Migración de archivos binarios a Supabase Storage.
- Pruebas de `ModalEvaluacion`, `ModalHistorial` y `ModalNuevoCandidato`.
- Pruebas de `Inicio` y `RutaProtegida`.
- Mejoras de accesibilidad y observabilidad.
- Ampliación de la cobertura de `api.js` y `AuthContext`.

## 12. Checklist de entrega

- [x] Repositorio GitHub actualizado.
- [x] Rama `main` con el avance EP2.
- [x] README de ejecución.
- [x] ERS actualizado.
- [x] Evidencia Vitest.
- [x] Datos ficticios.
- [x] Componentes, props, `.map()`, estado, formularios, filtros y rutas.
- [x] Bootstrap 5 y responsive.
- [x] Pruebas de backend y frontend ejecutables.
- [x] Guion de defensa.
