# Verificación de Rúbrica EP2 y Guía de Defensa

## Proyecto AquaChile — DSY1104

| Campo | Valor |
|---|---|
| Rúbrica base | `DSY1104_Evaluacion_Parcial_2_Rubrica_VcM_React.pdf` |
| Ponderación | 30% de la asignatura |
| Distribución | 40% encargo grupal + 60% presentación individual |
| Documento | Versión 2.0 — reemplaza la auditoría PDF anterior |
| Estado del repositorio | Rama `main` con frontend, backend y pruebas integradas |

## 1. Veredicto general

El proyecto está preparado para un **Muy buen desempeño** en la mayoría de los indicadores. No se declara un 100% automático: la evaluación final depende de la demostración individual y de la explicación del código.

Fortalezas:

- Estructura React clara y funcional.
- Flujo público y privado coherente.
- Componentes reutilizables con props.
- Estado, eventos, filtros, formularios y rutas operativos.
- 94 pruebas automatizadas aprobadas.
- Flujos centrales de Postulación y Dashboard cubiertos por Vitest.
- ERS, README y evidencia de pruebas actualizados.

Punto débil principal:

- Bootstrap 5 está integrado y se usa en el grid de KPIs y utilidades, pero el diseño se apoya fuertemente en CSS propio. Esto puede ubicar el indicador de responsividad en **Buen desempeño** en lugar de Muy buen desempeño.

## 2. Matriz del encargo grupal — 40%

| Indicador | Peso | Nivel estimado | Evidencia |
|---|---:|---|---|
| IE2.1.1 Estructura React y pertinencia VcM | 10% | Muy buen desempeño | `frontend/src` organizado en layouts, components, pages, context, services y utils. El flujo responde a la problemática de AquaChile. |
| IE2.1.2 Componentes, props y responsive | 10% | Buen desempeño | Componentes reutilizables y `.map()`; Bootstrap 5 en grid y utilidades; responsive con CSS y tabla en tarjetas. |
| IE2.1.5 Estado, formularios, filtros y navegación | 10% | Muy buen desempeño | `useState`, formularios controlados, validaciones, filtros combinados y React Router. |
| IE2.2.1 / IE2.3.1 Pruebas Vitest | 10% | Muy buen desempeño | 56 pruebas Vitest en 12 archivos; Dashboard, Postulación, utilidades y componentes cubiertos. |

Estimación del encargo: **superior a 90%**. La brecha principal es el uso acotado de Bootstrap.

## 3. Matriz de la presentación individual — 60%

| Indicador | Peso | Qué debes demostrar | Evidencia recomendada |
|---|---:|---|---|
| IE2.1.3 Problema y diseño frontend | 15% | Explicar la fragmentación de AquaChile y el valor del MVP. | Inicio, diapositiva del problema y flujo público/privado. |
| IE2.1.4 Dominio de componentes y responsividad | 15% | Explicar props, `.map()`, estructura y Bootstrap en código propio. | `TarjetaMetrica.jsx`, `TablaCandidatos.jsx`, `Dashboard.jsx` y DevTools móvil. |
| IE2.1.6 Flujo interactivo y coherencia | 15% | Recorrer postulación, consulta, login, dashboard, filtros, evaluación y estado. | Demo en vivo con datos ficticios. |
| IE2.2.2 / IE2.3.2 Evidencia y explicación de testing | 15% | Ejecutar Vitest, interpretar resultados y justificar escenarios. | `npm test` y `docs/Evidencia_Vitest_EP2.md`. |

## 4. Verificación de las Clases 1 a 9

| Clase | Evidencia mínima | Archivo o recurso |
|---|---|---|
| 1 | Proyecto React con Vite y estructura comprensible | `frontend/vite.config.js`, `src/main.jsx`, `src/App.jsx` |
| 2 | Bootstrap 5 para estilos y componentes visuales | `src/main.jsx`, `Dashboard.jsx`, `tema-aquachile.css` |
| 3 y 4 | Componentes, props, arreglos y `.map()` | `TarjetaMetrica.jsx`, `EstadoBadge.jsx`, `TablaCandidatos.jsx`, `CuestionarioEvaluacion.jsx` |
| 5 | Maquetación responsive | `Navbar.jsx`, `AppLayout.css`, `tema-aquachile.css`, `TablaCandidatos.jsx` |
| 6 | `useState`, eventos, filtros, búsqueda y condicionales | `Dashboard.jsx`, `FiltrosCandidatos.jsx`, `Postulacion.jsx` |
| 7 | Formularios validados y React Router | `Postulacion.jsx`, `Consulta.jsx`, `Login.jsx`, `App.jsx` |
| 8 | Integración de vistas y recorrido coherente | `Inicio.jsx`, `Consulta.jsx`, `Dashboard.jsx`, `api.js` |
| 9 | Pruebas ejecutadas y resultados demostrables | Vitest, `node:test` y `docs/Evidencia_Vitest_EP2.md` |

## 5. Entregables de la rúbrica

| Entregable | Estado | Evidencia |
|---|---|---|
| Repositorio GitHub actualizado | Cumplido | Rama `main` en `https://github.com/D1smos/Aquachile-EV-Psicolaboral` |
| Código fuente frontend | Cumplido | `frontend/src` |
| README de ejecución | Cumplido | `README.md` y `SETUP.md` |
| ERS actualizado | Cumplido | `docs/ERS_EP2.md` |
| Evidencia Vitest | Cumplido | `docs/Evidencia_Vitest_EP2.md` |
| Datos ficticios | Cumplido | Seed y pruebas con correos `@correo.cl` |
| Frontend responsive | Cumplido con observación | Bootstrap 5 + CSS propio |
| Pruebas ejecutables | Cumplido | 38 backend + 56 frontend |

## 6. Resultados de testing

### Backend

- Herramienta: `node:test`.
- Archivos: 6.
- Pruebas: 38.
- Resultado: 38/38.
- Comando: `npm test --prefix backend`.

### Frontend

- Herramienta: Vitest 2 + jsdom.
- Archivos: 12.
- Pruebas: 56.
- Resultado: 56/56.
- Comando: `npm test --prefix frontend`.
- Cobertura: `npm run test:coverage --prefix frontend`.

### Cobertura frontend

| Archivo o grupo | Líneas |
|---|---:|
| Global | 58,59% |
| Utilidades | 93,72% |
| Postulación | 94,26% |
| Dashboard | 63,09% |
| Tabla de candidatos | 100% |
| Consulta | 94,30% |
| Login | 82,18% |

La cobertura global no llega al 100% por los modales y pantallas secundarias. Los flujos centrales de la rúbrica están cubiertos.

## 7. Brechas y cómo explicarlas

### Bootstrap 5

Está importado y utilizado en el grid de KPIs, utilidades y spinner. El diseño corporativo se implementa con CSS propio para mantener la identidad visual. Si el profesor pide más Bootstrap, se puede mostrar el grid responsive y explicar que Bootstrap no exige reemplazar todo el CSS.

### Cobertura global

No es necesario ocultarla. La suite prioriza validaciones, postulación, dashboard, permisos, consulta y evaluación. Los modales se validan manualmente en la demo.

### Correo

Si no hay SMTP configurado, el sistema guarda el cambio de estado y avisa que el correo no se envió. Esto es una degradación controlada, no un fallo.

### Datos

Los datos de demostración son ficticios. La integración con API y base de datos es real. No se deben mostrar CV reales.

## 8. Guion de defensa

### Preparación

1. Ejecutar `npm run demo:reset`.
2. Iniciar backend y frontend.
3. Abrir el navegador en `http://localhost:5173`.
4. Abrir VS Code en `App.jsx`, `Postulacion.jsx`, `Dashboard.jsx` y `TablaCandidatos.jsx`.
5. Tener lista la terminal para `npm test`.

### Minuto 0 a 2 — Problema

Explicar que AquaChile usaba Forms, Excel, Planner, OneDrive y correo. El MVP centraliza el flujo y separa zona pública y privada.

### Minuto 2 a 5 — Flujo público

1. Mostrar Inicio con “Sin iniciar”.
2. Intentar enviar una postulación vacía.
3. Completar una postulación ficticia con CV PDF.
4. Mostrar el folio.
5. Consultar por folio y RUT.
6. Volver a Inicio y mostrar el avance.

### Minuto 5 a 8 — Panel interno

1. Entrar como Analista.
2. Mostrar filtros, tabla, historial y exportación.
3. Verificar que no aparecen acciones de edición ni evaluación.
4. Entrar como Evaluador.
5. Descargar CV, generar asistencia, responder cuestionario, cambiar estado.
6. Mostrar historial y PDF.

### Minuto 8 a 11 — Código y pruebas

Mostrar:

- `App.jsx`: rutas y `RutaProtegida`.
- `TablaCandidatos.jsx`: `.map()`, props y acciones por rol.
- `Postulacion.jsx`: `useState`, validaciones y `FormData`.
- `Dashboard.jsx`: `useMemo`, filtros, paginación y condicionales.
- `validaciones.js`: RUT Módulo 11 y archivos.

Luego ejecutar:

```bash
npm test
npm run test:coverage --prefix frontend
```

Explicar 38 pruebas backend + 56 Vitest y la cobertura.

### Minuto 11 a 12 — Cierre

Mencionar pendientes: despliegue, Supabase Storage y pruebas de modales. Diferenciar simulación y operación real.

## 9. Preguntas frecuentes del docente

### ¿Por qué Vitest y no Jasmine/Karma?

La rúbrica React exige Vitest. La suite con jsdom es más simple, rápida y no depende de un navegador externo. Karma fue retirado.

### ¿Dónde está el uso de Bootstrap?

En `main.jsx` se importa Bootstrap 5. En `Dashboard.jsx` se usa `row g-3` y `col-6 col-md-4 col-xl-3`; también se usan utilidades y Bootstrap Icons. El resto se complementa con CSS propio.

### ¿Cómo funciona la seguridad?

El backend valida JWT y roles. El frontend oculta acciones, pero el servidor responde 403 si el Analista intenta editar, evaluar, cambiar estado o eliminar.

### ¿Qué pasa si no hay SMTP?

El cambio de estado se guarda igual. La interfaz informa que el correo no se envió. No se pierde la operación principal.

### ¿Qué falta para producción?

Despliegue, almacenamiento de archivos en Supabase Storage, pruebas de modales y mejoras de accesibilidad y observabilidad.

## 10. Checklist final

- [x] `main` actualizado.
- [x] README de ejecución.
- [x] ERS actualizado.
- [x] Evidencia Vitest.
- [x] 94 pruebas aprobadas.
- [x] Datos ficticios.
- [ ] Ensayo completo de la presentación.
- [ ] Verificar la demo en el equipo donde se presentará.
- [ ] Tener respaldo de la base demo.
