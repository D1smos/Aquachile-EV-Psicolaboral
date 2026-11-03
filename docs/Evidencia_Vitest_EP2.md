# Evidencia de Pruebas Automatizadas — EP2

## Proyecto AquaChile — DSY1104

| Campo | Valor |
|---|---|
| Fecha de ejecución | 03-11-2026 |
| Backend | `node:test` |
| Frontend | Vitest 2.1.9 + jsdom |
| Resultado backend | 38/38 |
| Resultado frontend | 56/56 |
| Total | 94/94 |
| Cobertura frontend | 58,59% líneas · 80,48% ramas · 56,61% funciones |

## 1. Comandos ejecutados

```bash
npm test --prefix backend
npm test --prefix frontend
npm run test:coverage --prefix frontend
```

## 2. Resultado general

```text
Backend:
tests 38
pass 38
fail 0

Frontend:
Test Files  12 passed (12)
Tests       56 passed (56)
```

El frontend no utiliza Karma ni Jasmine. La suite se ejecuta con Vitest sobre jsdom y no requiere abrir un navegador externo.

## 3. Inventario de pruebas frontend

| Archivo | Pruebas | Comportamiento verificado |
|---|---:|---|
| `src/utils/evaluacionUtils.test.js` | 9 | Puntajes, dimensiones, idoneidad, métricas, filtros y orden. |
| `src/utils/evaluacionUtils.spec.js` | 5 | Casos complementarios de evaluación y clasificación. |
| `src/utils/validaciones.test.js` | 5 | RUT, correo, teléfono, archivos y formulario. |
| `src/utils/validaciones.spec.js` | 5 | Casos complementarios de validación. |
| `src/components/Navbar.test.js` | 3 | Enlaces públicos, usuario autenticado y cierre de sesión. |
| `src/components/TablaCandidatos.test.js` | 2 | Acciones visibles según rol. |
| `src/layouts/AppLayout.test.js` | 9 | Navbar, contenido y footer. |
| `src/pages/privado/Login.test.js` | 2 | Validación y cuentas de demostración. |
| `src/pages/privado/Dashboard.test.jsx` | 6 | Métricas, filtros, paginación, error, reintento y roles. |
| `src/pages/publico/Postulacion.test.jsx` | 6 | Catálogo, validaciones, formato, CV, envío y errores de API. |
| `src/pages/publico/Consulta.test.js` | 3 | Validación y consulta sin datos sensibles. |
| `src/pages/publico/Privacidad.test.js` | 1 | Contenido de privacidad. |
| **Total** | **56** | |

## 4. Inventario de pruebas backend

| Archivo | Cobertura funcional |
|---|---|
| `backend/test/api.integration.test.js` | Flujo de postulación, permisos, consulta pública, duplicados y descarga de CV. |
| `backend/test/asistente.service.test.js` | Afinidad curricular, brechas, semáforo y borrador. |
| `backend/test/correo.service.test.js` | Plantillas, escape HTML, asunto y condiciones de envío. |
| `backend/test/evaluacion.service.test.js` | Puntajes, dimensiones, idoneidad y respuestas inválidas. |
| `backend/test/seed.service.test.js` | RUT válidos, correos únicos y datos ficticios. |
| `backend/test/validadores.test.js` | Correo, teléfono, RUT, enteros y postulación. |

## 5. Cobertura frontend

| Archivo o grupo | Líneas |
|---|---:|
| Global | 58,59% |
| `src/utils/evaluacionUtils.js` | 97,64% |
| `src/utils/validaciones.js` | 88,72% |
| `src/pages/publico/Postulacion.jsx` | 94,26% |
| `src/pages/publico/Consulta.jsx` | 94,30% |
| `src/pages/privado/Dashboard.jsx` | 63,09% |
| `src/pages/privado/Login.jsx` | 82,18% |
| `src/components/TablaCandidatos.jsx` | 100% |
| `src/components/TarjetaMetrica.jsx` | 100% |
| `src/layouts/AppLayout.jsx` | 95,18% |

El reporte HTML se genera en `frontend/cobertura/`.

## 6. Justificación de los escenarios

### Validaciones

Se prueban RUT, teléfono, correo y archivos porque son los puntos de entrada de datos con mayor riesgo. Un error aquí contamina la base y afecta la consulta pública.

### Postulación

Se prueban catálogos, formato de RUT/teléfono, CV inválido, consentimiento, envío exitoso, folio y errores de API porque es el flujo principal del postulante.

### Dashboard

Se prueban métricas, filtros sin tildes, paginación, error de carga, reintento y permisos por rol porque es el flujo principal del equipo interno.

### Componentes

Se prueban Navbar, AppLayout, TablaCandidatos, Login, Consulta y Privacidad para verificar renderizado, navegación y protección de datos.

### Backend

Se prueban autenticación, permisos, duplicados, consulta pública, evaluación, correo y descarga de CV porque son los comportamientos críticos de la API.

## 7. Limitaciones

- La cobertura global no es 100% porque los modales y algunas pantallas secundarias se validan manualmente.
- `Api.js` y `AuthContext` tienen cobertura parcial.
- Las pruebas de correo usan mocks y no dependen de un servidor SMTP real.
- Las pruebas de interfaz usan jsdom; no reemplazan una prueba visual en navegador.

## 8. Cómo demostrar la evidencia en la defensa

1. Ejecutar `npm test`.
2. Mostrar 38 pruebas backend y 56 frontend.
3. Ejecutar `npm run test:coverage --prefix frontend`.
4. Abrir el reporte HTML en `frontend/cobertura/`.
5. Explicar por qué Postulación y Dashboard son los flujos con mayor cobertura.
6. Explicar por qué los modales quedan como prueba manual o pendiente.
