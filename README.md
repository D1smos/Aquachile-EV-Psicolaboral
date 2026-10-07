# AquaChile - Sistema de Evaluación Psicolaboral

## Descripción

Proyecto académico desarrollado para la asignatura Desarrollo Full Stack II
(DSY1104), basado en una problemática real presentada por AquaChile.

El proyecto busca desarrollar un MVP web que permita centralizar la gestión
de candidatos, solicitudes y evaluaciones psicolaborales.

Actualmente, parte de este proceso se realiza utilizando diferentes
herramientas y registros, lo que provoca dispersión de información,
seguimiento manual y tareas repetitivas.

La aplicación busca concentrar el flujo principal dentro de una única
plataforma web.

---

## Objetivo

Desarrollar una aplicación Full Stack que permita:

- Registrar candidatos.
- Gestionar solicitudes de evaluación psicolaboral.
- Registrar cargos y familias de cargo.
- Asignar responsables.
- Gestionar estados de las solicitudes.
- Registrar evaluaciones y observaciones.
- Consultar candidatos y evaluaciones.
- Visualizar métricas mediante un Dashboard.
- Mantener los datos de forma persistente mediante una base de datos.

---

## Flujo general

Candidato
↓
Postulación
↓
Registro de candidato
↓
Solicitud de evaluación
↓
Asignación de evaluador
↓
Evaluación psicolaboral
↓
Actualización de estado
↓
Resultado / observaciones
↓
Finalización

Estados principales:

- Pendiente
- En proceso
- Finalizada

---

## Tecnologías

### Frontend

- React
- Vite
- React Router
- Bootstrap 5
- JavaScript

### Backend

- Node.js
- Express
- API REST

### Base de datos

- PostgreSQL (en implementación)

### Testing

- Jasmine
- Karma

---

## Arquitectura

Frontend React
↓
API REST
↓
Backend Node.js / Express
↓
PostgreSQL

---

## Integrantes y responsabilidades

### Vicente - Frontend y UX

Responsabilidades principales:

- Desarrollo de interfaces con React.
- Diseño responsive con Bootstrap.
- Componentes reutilizables.
- Navegación con React Router.
- Formularios y validaciones del cliente.
- Consumo de la API REST.
- Manejo de estados y feedback visual.
- Desarrollo de Dashboard.
- Vistas de candidatos, solicitudes y evaluaciones.
- Pruebas de interfaz y usabilidad.

### David - Backend, Base de Datos y lógica

Responsabilidades principales:

- Desarrollo del servidor Node.js / Express.
- Diseño del modelo de datos.
- Implementación de PostgreSQL.
- Desarrollo de endpoints REST.
- Validaciones del servidor.
- Persistencia de candidatos, solicitudes y evaluaciones.
- Sistema de autenticación.
- Manejo de usuarios y roles.
- Seguridad básica de la aplicación.
- Pruebas de endpoints.
- Integración Backend - Base de Datos.
- Apoyo en despliegue.

### Trabajo conjunto

- Levantamiento y revisión de requerimientos.
- Integración Frontend / Backend.
- Testing.
- Documentación.
- GitHub.
- Preparación de presentación y entrega.

---

## Estado actual

### Implementado

- [x] Proyecto React con Vite
- [x] Bootstrap
- [x] React Router
- [x] Página pública
- [x] Formulario de postulación
- [x] Validaciones básicas
- [x] Dashboard
- [x] Estructura inicial de Backend
- [x] Login inicial
- [x] Rutas protegidas
- [x] Datos simulados
- [x] Pruebas unitarias frontend iniciales

### En desarrollo

- [ ] Base de datos PostgreSQL
- [ ] Persistencia real
- [ ] CRUD completo de candidatos
- [ ] CRUD de solicitudes
- [ ] Gestión persistente de evaluaciones
- [ ] Autenticación conectada al Backend
- [ ] Roles de usuario
- [ ] Integración completa Frontend / API
- [ ] Manejo de errores
- [ ] Despliegue

### Futuras mejoras

- [ ] Chatbot de ayuda
- [ ] Integración opcional con IA
- [ ] Reportes
- [ ] Métricas avanzadas

---

## Ejecución del proyecto

### Frontend

```bash
cd frontend
npm install
npm run dev
