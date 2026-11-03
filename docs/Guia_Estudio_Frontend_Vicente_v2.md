# Guía de Estudio y Defensa de Frontend — Vicente

## Proyecto AquaChile — DSY1104 EP2

| Campo | Valor |
|---|---|
| Rol | Responsable de Frontend y Experiencia de Usuario |
| Stack | React 18, Vite 5, React Router 6, Bootstrap 5 |
| Testing | Vitest + jsdom |
| Estado | 56 pruebas frontend aprobadas |
| Documento | Versión 2.0 — corrige la guía PDF anterior |

## 1. Qué debes demostrar

En la defensa individual debes explicar y mostrar en código:

- Cómo está estructurada la SPA en React.
- Cómo dividiste la interfaz en componentes reutilizables.
- Cómo se comunican los componentes mediante props y contextos.
- Cómo usas `useState`, `useEffect`, `useMemo` y `useCallback`.
- Cómo validas formularios antes de llamar a la API.
- Cómo funcionan React Router y la protección de rutas.
- Cómo aplicaste responsive con Bootstrap 5 y CSS propio.
- Cómo ejecutaste y qué comprueban las 56 pruebas Vitest.

## 2. Mapa del frontend

| Archivo o carpeta | Qué hace |
|---|---|
| `src/main.jsx` | Punto de entrada; carga Bootstrap, Bootstrap Icons, estilos y providers. |
| `src/App.jsx` | Define las rutas públicas, la ruta privada y la página 404. |
| `src/layouts/AppLayout.jsx` | Renderiza Navbar, `Outlet` y Footer. |
| `src/components/Navbar.jsx` | Navegación, menú móvil, usuario y cierre de sesión. |
| `src/components/Footer.jsx` | Pie de página institucional. |
| `src/components/Marca.jsx` | Identidad visual reutilizable. |
| `src/components/RutaProtegida.jsx` | Redirige a login si no hay sesión. |
| `src/context/AuthContext.jsx` | Estado global de sesión y token. |
| `src/context/ToastContext.jsx` | Notificaciones flotantes. |
| `src/services/api.js` | Cliente HTTP con token, JSON, `FormData` y descargas. |
| `src/pages/publico/Inicio.jsx` | Landing y seguimiento de la última postulación. |
| `src/pages/publico/Postulacion.jsx` | Formulario público en cuatro bloques. |
| `src/pages/publico/Consulta.jsx` | Consulta por folio y RUT. |
| `src/pages/publico/Privacidad.jsx` | Política de privacidad. |
| `src/pages/privado/Login.jsx` | Acceso institucional. |
| `src/pages/privado/Dashboard.jsx` | Métricas, filtros, tabla, paginación y modales. |
| `src/components/TarjetaMetrica.jsx` | Tarjeta KPI reutilizable. |
| `src/components/EstadoBadge.jsx` | Badge de estado e idoneidad. |
| `src/components/FiltrosCandidatos.jsx` | Búsqueda y filtros combinados. |
| `src/components/TablaCandidatos.jsx` | Tabla `.map()` con acciones según rol. |
| `src/components/ModalEvaluacion.jsx` | Evaluación, asistente y cambio de estado. |
| `src/components/ModalHistorial.jsx` | Historial de etapas. |
| `src/components/ModalNuevoCandidato.jsx` | Alta y edición de candidatos. |
| `src/components/CuestionarioEvaluacion.jsx` | Preguntas y dimensiones. |
| `src/utils/validaciones.js` | RUT, teléfono, correo, archivos y formularios. |
| `src/utils/evaluacionUtils.js` | Puntajes, idoneidad, KPIs, filtros y orden. |

## 3. Dónde mostrar cada concepto

### Componentes reutilizables y props

Abrir `TarjetaMetrica.jsx` y `EstadoBadge.jsx`.

Explicar que `Dashboard.jsx` invoca cuatro veces `TarjetaMetrica` con distintas props:

- `titulo`
- `valor`
- `detalle`
- `tono`
- `icono`

La ventaja es evitar repetir HTML y centralizar estilos.

### Arreglos y `.map()`

Abrir `TablaCandidatos.jsx` y `CuestionarioEvaluacion.jsx`.

Mostrar:

- `candidatos.map((candidato) => <tr key={candidato.id}>...)`
- Doble `.map()` de dimensiones y preguntas.
- `key` estable para que React identifique cada elemento.

### `useState` y formularios controlados

Abrir `Postulacion.jsx`.

Mostrar:

- `const [formulario, setFormulario] = useState(FORM_INICIAL)`
- `modificar(evento)` actualiza el estado en cada cambio.
- `formatearRut` y `formatearTelefono` se aplican en vivo.
- Al cambiar `familiaCargo` se limpia `cargo`.

### Renderizado condicional

Abrir `Dashboard.jsx` y `TablaCandidatos.jsx`.

Mostrar:

- `{cargando && <Esqueleto />}`
- `{error && <ErrorCarga />}`
- Modales condicionados por `seleccion`, `historialDe`, `mostrarNuevo` y `editando`.
- `{puedeEvaluar && <button>Evaluar</button>}`.

### Búsqueda y filtros

Abrir `FiltrosCandidatos.jsx` y `evaluacionUtils.js`.

Explicar `normalizar()`:

```js
String(texto)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
```

Gracias a eso, “maria” encuentra “María”.

### React Router

Abrir `App.jsx` y `Navbar.jsx`.

Explicar:

- `Routes` y `Route` cambian la vista sin recargar el documento.
- `Link` y `NavLink` navegan en el cliente.
- `RutaProtegida` envuelve `/dashboard`.
- `MemoryRouter` se usa en pruebas.

### Responsive y Bootstrap 5

Abrir `main.jsx`, `Dashboard.jsx`, `tema-aquachile.css` y `TablaCandidatos.jsx`.

Mostrar:

- Importación de `bootstrap/dist/css/bootstrap.min.css`.
- Grid `row g-3` y columnas `col-6 col-md-4 col-xl-3`.
- Utilidades `w-100`, `text-primary`, `spinner-border`.
- Breakpoints en CSS.
- Tabla que se convierte en tarjetas en móvil.

Aclarar que Bootstrap 5 está integrado, pero el diseño corporativo se complementa con CSS propio.

## 4. Pruebas Vitest

### Comandos

```bash
npm test --prefix frontend
npm run test:coverage --prefix frontend
```

### Resultado actual

- **12 archivos de prueba.**
- **56 pruebas aprobadas.**
- **Cobertura global:** 58,59% de líneas.
- **Utilidades:** 93,72%.
- **Postulación:** 94,26%.
- **Dashboard:** 63,09%.
- **Tabla de candidatos:** 100%.

### Qué cubre cada grupo

| Archivo | Pruebas | Comportamiento |
|---|---:|---|
| `utils/evaluacionUtils.test.js` | 9 | Puntajes, dimensiones, idoneidad, métricas y filtros. |
| `utils/evaluacionUtils.spec.js` | 5 | Casos complementarios de evaluación. |
| `utils/validaciones.test.js` | 5 | RUT, correo, teléfono, archivos y formulario. |
| `utils/validaciones.spec.js` | 5 | Casos complementarios de validación. |
| `components/Navbar.test.js` | 3 | Enlaces públicos, usuario y cierre de sesión. |
| `components/TablaCandidatos.test.js` | 2 | Acciones visibles según rol. |
| `layouts/AppLayout.test.js` | 9 | Navbar, contenido y footer. |
| `pages/privado/Login.test.js` | 2 | Validación y cuentas demo. |
| `pages/privado/Dashboard.test.jsx` | 6 | Métricas, filtros, paginación, error y roles. |
| `pages/publico/Postulacion.test.jsx` | 6 | Catálogo, validaciones, formato, CV y envío. |
| `pages/publico/Consulta.test.js` | 3 | Validación y consulta sin datos sensibles. |
| `pages/publico/Privacidad.test.js` | 1 | Contenido de privacidad. |

### Por qué no se usa Karma

La rúbrica React de la EP2 exige Vitest. Karma y Jasmine fueron retirados para evitar dependencia de un navegador externo, simplificar la ejecución y mantener una sola suite reproducible con jsdom.

## 5. Preguntas probables

### ¿Por qué separaste `EstadoBadge`?

Por reutilización y responsabilidad única. Se usa en Inicio, TablaCandidatos, ModalEvaluacion y Consulta. Si cambia un color o estilo, se modifica en un solo archivo.

### ¿Cómo evitas cálculos lentos en el Dashboard?

Con `useMemo` para métricas y para la lista filtrada/ordenada. Solo se recalcula cuando cambian los candidatos o los filtros.

### ¿Qué pasa con un archivo inválido?

`Postulacion.jsx` llama a `archivoCvValido` antes de enviar. Verifica extensión y tamaño máximo de 5 MB. Si falla, limpia el input, muestra error y lanza un toast.

### ¿Cómo se protege el dashboard?

`RutaProtegida` verifica la sesión en el cliente. El backend además valida JWT y roles, por lo que ocultar un botón no es la única defensa.

### ¿Qué diferencia hay entre estado e idoneidad?

El estado es administrativo: Pendiente, En Proceso, Aprobado o Rechazado. La idoneidad es el resultado técnico del cuestionario: Idóneo, Idóneo con observaciones o No idóneo.

### ¿Qué es simulado y qué es real?

La integración con API y base de datos es real. Los datos demo son ficticios. Si no hay SMTP configurado, el correo se omite de forma controlada y la interfaz lo informa.

## 6. Checklist antes de presentar

- [ ] Tener backend y frontend corriendo.
- [ ] Ejecutar `npm run demo:reset`.
- [ ] Probar una postulación completa con CV ficticio.
- [ ] Verificar el modo móvil en DevTools.
- [ ] Ejecutar `npm test --prefix frontend`.
- [ ] Ejecutar la cobertura y saber explicar el 58,59%.
- [ ] Tener abiertos `App.jsx`, `Postulacion.jsx`, `Dashboard.jsx` y `TablaCandidatos.jsx`.
- [ ] No mostrar credenciales ni datos personales reales.
