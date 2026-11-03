# AquaChile - Sistema de Evaluación Psicolaboral

## Descripción

Proyecto académico desarrollado para la asignatura **Desarrollo Full Stack II (DSY1104)**, basado en la problemática de gestión de evaluaciones psicolaborales de **AquaChile**.

El sistema centraliza en una única aplicación web el proceso de postulación pública, consulta de estado por folio, gestión interna de candidatos, aplicación de pauta psicolaboral por dimensiones, apoyo automático de análisis curricular y generación de reportes (CSV y fichas PDF).

## Requisitos Previos

- **Node.js 24 o superior** (requerido por el motor relacional nativo `node:sqlite`; probado en `v24.21.0`).
- **Git**.

## Integrantes y Responsabilidades

### Vicente Krausse - Frontend y Experiencia de Usuario (UX)

- Desarrollo de la SPA en React 18 con Vite y React Router DOM.
- Marco visual unificado (`AppLayout`, `Navbar`, `Footer`, `Marca`) y diseño responsive corporativo (`tema-aquachile.css`).
- Componentes reutilizables (`TablaCandidatos`, `FiltrosCandidatos`, `TarjetaMetrica`, `EstadoBadge`, `CuestionarioEvaluacion` y modales).
- Vistas públicas (`Inicio`, `Postulacion`, `Consulta` por folio y RUT, `Privacidad`, `NoEncontrado`) y privadas (`Login`, `Dashboard`).
- Contextos globales (`AuthContext`, `ToastContext`), cliente HTTP (`services/api.js`) y validaciones del cliente (`validaciones.js`).
- Pruebas unitarias y de componentes en Frontend (14 pruebas en `node:test` + 30 pruebas con **Jasmine + Karma + Vite** en navegador real).

### David Soto - Backend, Base de Datos, Lógica y Seguridad

- Arquitectura modular del servidor en Node.js y Express (`backend/src/`).
- Modelo de datos relacional (`backend/schema.sql`: tablas `usuarios`, `candidatos`, `archivos`, `historial_etapas`) con soporte dual automático para **SQLite** (`config/sqlite.js`) y **PostgreSQL / Supabase** (`config/postgres.js`).
- Endpoints REST (`/api/auth`, `/api/catalogos`, `/api/postulaciones`, `/api/postulaciones/consulta`, `/api/candidatos`).
- Autenticación con **JWT** (`jsonwebtoken`), hash de contraseñas (`bcryptjs`) y control de acceso por roles (`psicologo` con gestión completa y `analista` de solo lectura/exportación).
- Validaciones del servidor (RUT chileno Módulo 11, teléfono móvil, correo, catálogos y archivos con `multer`).
- Servicios de evaluación por dimensiones, apoyo automático de afinidad CV-cargo (`pdf-parse`, `mammoth`), notificaciones por correo SMTP (`nodemailer`), exportación CSV/PDF (`pdfkit`) y reinicio reproducible de datos demo (`npm run demo:reset`).
- Pruebas automatizadas de Backend e integración (37 pruebas con `node:test` y cobertura con `c8`).

## Instalación y Ejecución Rápida

```bash
# 1. Instalar dependencias de backend y frontend
npm run setup

# 2. Copiar variables de entorno (configurar JWT_SECRET y claves semilla en backend/.env)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Verificar que el entorno esté completo y reiniciar la base de datos de demostración
npm run verificar
npm run demo:reset

# 4. Iniciar backend (puerto 5000) y frontend (puerto 5173) o presionar Ctrl + Shift + B en VS Code
npm run dev:backend
npm run dev:frontend
```

*(Consulta `SETUP.md` para instrucciones detalladas paso a paso y solución de problemas en otros equipos).*

## Comandos de Pruebas (81 pruebas automatizadas)

```bash
# Ejecutar todas las pruebas (37 Backend + 14 Frontend base + 30 Jasmine/Karma)
npm test

# Generar reporte de cobertura del backend con c8
npm run test:cobertura --prefix backend
```
