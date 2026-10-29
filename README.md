# AquaChile - Sistema de Evaluaci?n Psicolaboral

## Descripci?n

Proyecto acad?mico desarrollado para la asignatura **Desarrollo Full Stack II (DSY1104)**, basado en la problem?tica de gesti?n de evaluaciones psicolaborales de **AquaChile**.

El sistema centraliza en una ?nica aplicaci?n web el proceso de postulaci?n p?blica, consulta de estado por folio, gesti?n interna de candidatos, aplicaci?n de pauta psicolaboral por dimensiones, apoyo autom?tico de an?lisis curricular y generaci?n de reportes (CSV y fichas PDF).

## Requisitos Previos

- **Node.js 24 o superior** (requerido por el motor relacional nativo `node:sqlite`; probado en `v24.21.0`).
- **Git**.

## Integrantes y Responsabilidades

### Vicente Krausse - Frontend y Experiencia de Usuario (UX)

- Desarrollo de la SPA en React 18 con Vite y React Router DOM.
- Marco visual unificado (`AppLayout`, `Navbar`, `Footer`, `Marca`) y dise?o responsive corporativo (`tema-aquachile.css`).
- Componentes reutilizables (`TablaCandidatos`, `FiltrosCandidatos`, `TarjetaMetrica`, `EstadoBadge`, `CuestionarioEvaluacion` y modales).
- Vistas p?blicas (`Inicio`, `Postulacion`, `Consulta` por folio y RUT, `Privacidad`, `NoEncontrado`) y privadas (`Login`, `Dashboard`).
- Contextos globales (`AuthContext`, `ToastContext`), cliente HTTP (`services/api.js`) y validaciones del cliente (`validaciones.js`).
- Pruebas unitarias y de componentes en Frontend (14 pruebas en `node:test` + 25 pruebas con **Jasmine + Karma + Vite** en navegador real).

### David Soto - Backend, Base de Datos, L?gica y Seguridad

- Arquitectura modular del servidor en Node.js y Express (`backend/src/`).
- Modelo de datos relacional (`backend/schema.sql`: tablas `usuarios`, `candidatos`, `archivos`, `historial_etapas`) con soporte dual autom?tico para **SQLite** (`config/sqlite.js`) y **PostgreSQL / Supabase** (`config/postgres.js`).
- Endpoints REST (`/api/auth`, `/api/catalogos`, `/api/postulaciones`, `/api/postulaciones/consulta`, `/api/candidatos`).
- Autenticaci?n con **JWT** (`jsonwebtoken`), hash de contrase?as (`bcryptjs`) y control de acceso por roles (`psicologo` con gesti?n completa y `analista` de solo lectura/exportaci?n).
- Validaciones del servidor (RUT chileno M?dulo 11, tel?fono m?vil, correo, cat?logos y archivos con `multer`).
- Servicios de evaluaci?n por dimensiones, apoyo autom?tico de afinidad CV-cargo (`pdf-parse`, `mammoth`), notificaciones por correo SMTP (`nodemailer`), exportaci?n CSV/PDF (`pdfkit`) y reinicio reproducible de datos demo (`npm run demo:reset`).
- Pruebas automatizadas de Backend e integraci?n (36 pruebas con `node:test` y cobertura con `c8`).

## Instalaci?n y Ejecuci?n R?pida

```bash
# 1. Instalar dependencias de backend y frontend
npm run setup

# 2. Copiar variables de entorno (configurar JWT_SECRET y claves semilla en backend/.env)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Verificar que el entorno est? completo y reiniciar la base de datos de demostraci?n
npm run verificar
npm run demo:reset

# 4. Iniciar backend (puerto 5000) y frontend (puerto 5173) en dos terminales
npm run dev:backend
npm run dev:frontend
```

*(Consulta `SETUP.md` para instrucciones detalladas paso a paso y soluci?n de problemas en otros equipos).*

## Comandos de Pruebas (75 pruebas automatizadas)

```bash
# Ejecutar pruebas de backend (36 tests) y frontend base (14 tests)
npm test

# Ejecutar las 25 pruebas unitarias y de componentes con Jasmine + Karma en navegador headless
npm run test:karma --prefix frontend

# Generar reporte de cobertura del backend con c8
npm run test:cobertura --prefix backend
```
