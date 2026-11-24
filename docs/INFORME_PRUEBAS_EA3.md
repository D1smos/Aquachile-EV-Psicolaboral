# Informe de pruebas EA3 — DSY1104

## Alcance

La verificación cubre por separado la API Node.js/Express y la interfaz React. Backend usa `node:test` y c8; frontend usa Vitest, jsdom, React Testing Library y `@testing-library/user-event` para interacciones de usuario.

## Comandos reproducibles

Ejecutar desde la raíz del repositorio (Node.js 24 o superior; el backend necesita `JWT_SECRET`):

```powershell
npm run test:cobertura --prefix backend
npm run test:coverage --prefix frontend
npm test --prefix backend
npm test --prefix frontend
```

La cobertura backend se genera en `backend/cobertura/`; la cobertura frontend, en `frontend/cobertura/`. El script raíz `npm test` encadena las suites de backend y frontend.

## Resultados registrados

| Proyecto | Pruebas aprobadas | Cobertura de líneas |
|---|---:|---:|
| Backend | 48/48 | 86,40 % |
| Frontend | 74/74 | 88,36 % |

Ambas coberturas superan el objetivo de 85 % de líneas. Los porcentajes corresponden al reporte de cobertura obtenido con los comandos anteriores en esta versión del proyecto; pueden variar si se modifica el código o el conjunto de pruebas.

## Casos representativos

**Backend:** pruebas de OpenAPI JSON, autenticación y control de rol, CRUD y filtros de ofertas, validación de entradas, consulta de postulaciones, envío multipart de CV, descarga protegida, path traversal, estados y evaluación psicolaboral, asistencia IA con los campos obligatorios y revisión humana, validadores y exportación.

**Frontend:** Testing Library + `user-event` ejercita inicio/cierre de sesión y rutas protegidas; portal público de ofertas con búsqueda, filtros, detalle y navegación a postulación; validación del formulario y carga multipart; CRUD y publicación/despublicación de ofertas; cuestionario y cambios de estado; descarga del CV privado; y visualización de criterios, limitaciones y advertencia IA. También existen pruebas de componentes públicos, utilidades, validaciones y Dashboard.

Las pruebas automatizadas verifican comportamiento de software. No sustituyen pruebas de aceptación del equipo, revisión de privacidad ni juicio profesional en la evaluación de personas.
