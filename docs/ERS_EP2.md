# Especificación de Requisitos de Software - EP2

## Sistema de Evaluación Psicolaboral AquaChile

| Campo | Valor |
|---|---|
| Asignatura | Desarrollo Full Stack II (DSY1104) |
| Entrega | Evaluación Parcial 2 |
| Versión del documento | 1.1 |
| Fecha | 03-11-2026 |
| Rama de entrega | `main` |
| Frontend | React 18 + Vite + React Router + Bootstrap 5 |
| Backend | Node.js 24 + Express + SQLite/PostgreSQL |
| Pruebas backend | `node:test` |
| Pruebas frontend | Vitest + jsdom |

## 1. Propósito

Este documento describe los requisitos funcionales y no funcionales del sistema de evaluación psicolaboral de AquaChile para la EP2. Su objetivo es servir como referencia verificable para la implementación, las pruebas y la defensa del proyecto.

El sistema digitaliza el flujo de postulación pública y la gestión interna de candidatos, evaluaciones psicolaborales, documentos, historial de etapas y reportes.

## 2. Alcance

### 2.1 Incluido en la EP2

- Sitio público con inicio, postulación, consulta de estado por folio y RUT, política de privacidad y página 404.
- Autenticación con JWT y dos roles: evaluador (`psicologo`) y analista.
- Panel privado con métricas, filtros, búsqueda, orden, paginación y tabla de candidatos.
- Registro manual y edición de candidatos.
- Carga de CV y antecedentes en formato PDF, DOC, DOCX o XLSX.
- Visualización y descarga de documentos adjuntos desde el listado de candidatos.
- Evaluación psicolaboral de 10 preguntas, cálculo de puntaje e idoneidad.
- Asistente local de apoyo curricular y ranking por cargo.
- Historial de etapas y cambios de estado.
- Exportación CSV y ficha PDF.
- Notificaciones por correo cuando corresponde.
- Diseño responsive con Bootstrap 5 y estilos propios.
- Pruebas automatizadas de backend con `node:test` y frontend con Vitest.

### 2.2 Fuera del alcance de esta entrega

- Despliegue público en producción; corresponde al Hito 3.
- Migración de archivos binarios a Supabase Storage.
- Firma digital de documentos.
- Integración con portales externos de empleo.
- Aplicación móvil nativa.

### 2.3 Funcionalidades pendientes

| Pendiente | Motivo | Etapa prevista |
|---|---|---|
| Despliegue público | Requiere infraestructura y configuración de producción. | Hito 3 |
| Supabase Storage | Los archivos se guardan en disco local. | Hito 3 |
| Pruebas de modales | Se validan manualmente en la demo. | Mejora posterior |
| Pruebas de `Inicio` y `RutaProtegida` | La cobertura se concentra en los flujos centrales. | Mejora posterior |
| Accesibilidad avanzada | Existen etiquetas y focos, pero falta auditoría formal. | Mejora posterior |
| Observabilidad | Hay logger básico, sin métricas centralizadas. | Hito 3 |

### 2.4 Correspondencia con la problemática VcM

| Problema de AquaChile | Funcionalidad del MVP |
|---|---|
| Solicitudes dispersas en Forms | Formulario público de postulación con folio. |
| Control manual en Excel | Panel de candidatos con filtros, estados y métricas. |
| Seguimiento en Planner | Historial de etapas y consulta pública por folio. |
| CV dispersos en OneDrive | Carga y descarga asociada a cada candidato. |
| Informes enviados por correo | Exportación CSV y ficha PDF. |
| Evaluación heterogénea | Cuestionario estandarizado de 10 preguntas. |
| Falta de trazabilidad | Historial con etapa, responsable, motivo y fecha. |

## 3. Actores y roles

| Actor | Descripción | Permisos principales |
|---|---|---|
| Candidato | Persona que postula o consulta su estado. | Crear postulación, adjuntar CV, consultar estado con folio y RUT. |
| Analista | Usuario interno de apoyo. | Ver candidatos, filtrar, descargar documentos, exportar CSV y PDF. No puede editar, evaluar, cambiar estado ni eliminar. |
| Evaluador / psicólogo | Usuario interno responsable de la evaluación. | Todas las acciones del analista, más crear, editar, evaluar, cambiar estado, usar asistente y eliminar candidatos. |
| Sistema | Backend y trabajos automáticos. | Validar, persistir, calcular puntajes, registrar historial y enviar correos. |

## 4. Requisitos funcionales

| ID | Requisito | Criterio de aceptación |
|---|---|---|
| RF-01 | El candidato debe poder enviar una postulación pública. | El formulario valida campos obligatorios, RUT, teléfono, correo, cargo, formación, disponibilidad y consentimiento. |
| RF-02 | El candidato debe poder adjuntar su CV. | Se aceptan PDF, DOC, DOCX y XLSX dentro del límite configurado. El archivo queda asociado a la postulación. |
| RF-03 | El sistema debe generar un folio único. | Cada postulación recibe un folio con formato `AQ-AAAA-XXXXXXXX`. |
| RF-04 | El candidato debe poder consultar su estado. | La consulta exige folio y RUT correctos; la respuesta no expone correo, teléfono, RUT ni identificadores internos. |
| RF-05 | El sistema debe evitar duplicados. | Un RUT o correo ya registrado responde con error 409 sin revelar datos del candidato existente. |
| RF-06 | El inicio debe mostrar el seguimiento de la última postulación. | Si existe una postulación local, el panel consulta el estado actual y actualiza la etapa mostrada. |
| RF-07 | Los usuarios internos deben autenticarse. | El login entrega un token JWT con vigencia y rol; sin token o con token inválido se responde 401. |
| RF-08 | El sistema debe aplicar permisos por rol. | Las acciones de edición, evaluación, cambio de estado y eliminación responden 403 para el analista. |
| RF-09 | El panel debe mostrar métricas del proceso. | Se muestran total de candidatos, postulaciones del mes, evaluaciones completadas y aprobados. |
| RF-10 | El panel debe permitir buscar, filtrar y ordenar. | Se filtra por texto, cargo, estado y rango de fechas; se ordena por fecha, nombre o puntaje. |
| RF-11 | El panel debe paginar el listado. | Se muestran 8 candidatos por página con navegación anterior/siguiente. |
| RF-12 | El listado debe incluir los documentos adjuntos. | Cada candidato del listado incluye sus archivos y permite visualizar o descargar el CV. |
| RF-13 | El evaluador debe poder registrar y editar candidatos. | Los datos se validan en frontend y backend; la edición queda registrada en el historial. |
| RF-14 | El evaluador debe poder eliminar candidatos. | La eliminación confirma la acción, borra la ficha, sus archivos físicos y su historial. |
| RF-15 | El evaluador debe poder cambiar el estado del proceso. | Se permiten los estados Pendiente, En Proceso, Aprobado y Rechazado, con registro en historial. |
| RF-16 | El evaluador debe poder aplicar el cuestionario psicolaboral. | Se responden 10 preguntas en escala 1 a 5; el sistema calcula puntaje, dimensiones e idoneidad. |
| RF-17 | El sistema debe clasificar la idoneidad. | Se aplican umbrales de puntaje y dimensiones críticas para obtener Idóneo, Idóneo con observaciones o No idóneo. |
| RF-18 | El evaluador debe poder generar apoyo automático. | El sistema analiza el CV, calcula afinidad con el cargo y genera un borrador de observaciones revisable. |
| RF-19 | El sistema debe mantener historial por candidato. | Cada cambio registra etapa anterior, etapa nueva, responsable, motivo y fecha. |
| RF-20 | El sistema debe exportar reportes. | Se genera CSV respetando filtros y una ficha PDF por candidato. |
| RF-21 | El sistema debe notificar por correo cuando corresponde. | La aprobación y la confirmación de postulación usan plantillas con datos escapados y sin exponer secretos. |

## 5. Requisitos no funcionales

| ID | Requisito | Implementación verificable |
|---|---|---|
| RNF-01 | Interfaz responsive. | Bootstrap 5 se usa en grid y utilidades; el Dashboard usa `row`, columnas `col-6 col-md-4 col-xl-3` y tarjetas `h-100`. |
| RNF-02 | Compatibilidad de navegadores modernos. | La SPA se construye con Vite y se prueba en jsdom; el diseño usa CSS estándar y media queries. |
| RNF-03 | Seguridad de acceso. | Contraseñas con bcrypt, JWT, Helmet, CORS y limitadores de tasa en login, consulta y postulación. |
| RNF-04 | Protección de datos personales. | La consulta pública devuelve datos mínimos; la política de privacidad informa responsable, conservación y apoyo automatizado. |
| RNF-05 | Validación en dos capas. | Frontend y backend validan RUT, teléfono, correo, catálogos, archivos y respuestas. |
| RNF-06 | Persistencia configurable. | SQLite local o PostgreSQL/Supabase mediante `DATABASE_URL`, sin cambiar la lógica de negocio. |
| RNF-07 | Mantenibilidad. | Separación en rutas, controladores, servicios, validadores, config y dominio. |
| RNF-08 | Observabilidad básica. | Registro de eventos y errores con logger propio. |
| RNF-09 | Accesibilidad. | Etiquetas, focos visibles, atributos ARIA, navegación por teclado y respeto a movimiento reducido. |
| RNF-10 | Pruebas automatizadas. | 38 pruebas de backend con `node:test` y 56 pruebas de frontend con Vitest. |
| RNF-11 | Documentación de ejecución. | `SETUP.md` describe instalación, variables de entorno y solución de problemas. |
| RNF-12 | Datos de demostración ficticios. | El seed usa nombres, RUT y correos de ejemplo; no contiene datos personales reales. |

## 6. Arquitectura

```text
Navegador
  └── React 18 + Vite + React Router + Bootstrap 5
        ├── Vistas públicas: Inicio, Postulación, Consulta, Privacidad, 404
        ├── Vistas privadas: Login, Dashboard
        ├── Componentes: Navbar, Sidebar, TablaCandidatos, FiltrosCandidatos,
        │   TarjetaMetrica, EstadoBadge, modales y cuestionario
        ├── Contextos: AuthContext, ToastContext
        └── Servicios: api.js
              │
              ▼ HTTP / JSON / multipart
        Express + JWT + Multer
        ├── Rutas y controladores
        ├── Servicios de negocio
        ├── Validadores
        ├── SQLite local o PostgreSQL/Supabase
        └── Archivos en backend/uploads (metadatos en tabla archivos)
```

## 7. Modelo de datos

| Tabla | Clave primaria | Contenido | Relaciones |
|---|---|---|---|
| `usuarios` | `id` | Nombre, correo único, hash de contraseña y rol. | Un usuario puede evaluar muchos candidatos. |
| `candidatos` | `id` | Folio único, datos personales, cargo, estado, respuestas, puntaje, idoneidad, IA y fechas. | Tiene muchos archivos y muchos eventos. |
| `archivos` | `id` | Tipo (`cv` o `antecedentes`), nombres, ruta, mimetype, tamaño y fecha. | Pertenece a un candidato. |
| `historial_etapas` | `id` | Etapa anterior, etapa nueva, responsable, motivo y fecha. | Pertenece a un candidato. |

Los archivos binarios se almacenan en disco y sus metadatos en la tabla `archivos`. Esta entrega no usa Supabase Storage.

## 8. API principal

| Método | Ruta | Acceso | Propósito |
|---|---|---|---|
| POST | `/api/auth/login` | Público | Iniciar sesión. |
| GET | `/api/auth/perfil` | Autenticado | Obtener perfil. |
| GET | `/api/catalogos` | Público | Obtener catálogos de cargos, formaciones y estados. |
| GET | `/api/catalogos/evaluacion` | Autenticado | Obtener cuestionario. |
| POST | `/api/postulaciones` | Público | Crear postulación con archivos. |
| POST | `/api/postulaciones/consulta` | Público | Consultar estado por folio y RUT. |
| GET | `/api/candidatos` | Autenticado | Listar candidatos con archivos. |
| GET | `/api/candidatos/exportar.csv` | Autenticado | Exportar CSV. |
| GET | `/api/candidatos/comparar` | Autenticado | Ranking por cargo. |
| POST | `/api/candidatos` | Evaluador | Crear candidato manualmente. |
| GET | `/api/candidatos/:id` | Autenticado | Obtener ficha. |
| PUT | `/api/candidatos/:id` | Evaluador | Editar ficha. |
| DELETE | `/api/candidatos/:id` | Evaluador | Eliminar ficha. |
| PATCH | `/api/candidatos/:id/estado` | Evaluador | Cambiar estado. |
| POST | `/api/candidatos/:id/evaluacion` | Evaluador | Registrar evaluación. |
| POST | `/api/candidatos/:id/asistente` | Evaluador | Generar apoyo automático. |
| GET | `/api/candidatos/:id/informe.pdf` | Autenticado | Descargar ficha PDF. |
| GET | `/api/candidatos/:id/historial` | Autenticado | Obtener historial. |
| GET | `/api/candidatos/:id/archivos/:archivoId` | Autenticado | Descargar archivo. |

## 9. Estrategia de pruebas

### 9.1 Backend

- Herramienta: `node:test` con `node:assert/strict`.
- Total: 38 pruebas.
- Cobertura funcional: autenticación, permisos, postulación, consulta pública, duplicados, evaluación, asistente, correo, validadores, datos ficticios del seed y descarga de CV.
- Comando: `npm test --prefix backend`.
- Cobertura: `npm run test:cobertura --prefix backend`.

### 9.2 Frontend

- Herramienta: Vitest con entorno jsdom.
- Total: 56 pruebas en 12 archivos.
- Cobertura funcional: utilidades de evaluación, validaciones, Navbar, AppLayout, Login, Consulta, Privacidad, tabla de candidatos, Dashboard y Postulación.
- Cobertura global: 58,59% de líneas, 80,48% de ramas y 56,61% de funciones.
- Cobertura destacada: utilidades 93,72%, Postulación 94,26%, Dashboard 63,09% y TablaCandidatos 100%.
- Comandos:
  - `npm test --prefix frontend`
  - `npm run test:coverage --prefix frontend`
- Configuración: `frontend/vitest.config.js`.
- Evidencia esperada: salida de consola, reporte HTML en `frontend/cobertura/` y captura del comando.

### 9.3 Prueba manual mínima

1. Iniciar backend y frontend.
2. Enviar una postulación con CV ficticio.
3. Consultar el estado con folio y RUT.
4. Ingresar como evaluador y abrir el dashboard.
5. Verificar que el CV aparece en el listado y que se puede descargar.
6. Cambiar estado y revisar el historial.
7. Ingresar como analista y verificar que no puede evaluar, editar ni eliminar.
8. Revisar el dashboard en escritorio y móvil.

## 10. Trazabilidad con la rúbrica EP2

| Criterio de la rúbrica | Evidencia |
|---|---|
| Aplicación React con componentes y props | `frontend/src/components`, `frontend/src/pages`, `frontend/src/layouts`. |
| Estado, eventos, filtros y rutas | `useState`, `useEffect`, `useMemo`, React Router y `FiltrosCandidatos`. |
| Bootstrap 5 responsive | Importación de Bootstrap, grid de KPIs y utilidades responsive. |
| Pruebas con Vitest | 56 pruebas Vitest, configuración y reporte de cobertura. |
| Documento ERS | Este documento. |
| Repositorio GitHub | Rama `main` actualizada. |
| README de ejecución | `README.md` con instalación, ejecución y pruebas; detalle extendido en `SETUP.md`. |
| Evidencia de pruebas | `docs/Evidencia_Vitest_EP2.md`. |

## 11. Datos de demostración y privacidad

- El lote demo contiene 10 candidatos ficticios con nombres, RUT, teléfonos y correos de ejemplo.
- No se deben usar CV reales en capturas, presentaciones ni repositorio.
- Los archivos subidos localmente están excluidos por `.gitignore`.
- La consulta pública solo devuelve folio, cargo, familia de cargo, estado y fechas.
- El asistente automático es un apoyo y no reemplaza la revisión profesional.

## 12. Riesgos y limitaciones

| Riesgo o limitación | Impacto | Mitigación |
|---|---|---|
| Cobertura frontend global de 58,59%. | Los modales y pantallas secundarias no tienen pruebas directas. | Se cubren los flujos centrales y se documenta la cobertura real. |
| Archivos en disco local. | No apto para despliegue multiinstancia. | Migración futura a Supabase Storage si el Hito 3 lo requiere. |
| Dependencia de SMTP para correos. | Sin SMTP, el envío se omite y se informa. | Variables de entorno documentadas y degradación controlada. |
| Datos demo en localStorage. | El seguimiento es local al navegador. | La consulta pública permite recuperar el estado con folio y RUT. |
| Fecha de entrega ajustada. | Menor tiempo para pruebas exploratorias. | Suite automatizada y prueba manual mínima documentada. |

## 13. Control de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 03-11-2026 | Documento ERS EP2 con alcance, requisitos, arquitectura, pruebas y trazabilidad. |
| 1.1 | 03-11-2026 | Actualiza cifras de pruebas, agrega pendientes y correspondencia con la problemática VcM. |
