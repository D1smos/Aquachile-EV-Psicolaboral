const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'aquachile_clave_secreta_2026';

// Middlewares globales
app.use(cors());
app.use(express.json());

// Servir la carpeta de subidas de forma estática
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de Multer para la carga de CVs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Base de datos temporal en memoria
let candidatos = [];
let evaluaciones = [];

// Base de datos de Usuarios para Login
// La contraseña de ambos usuarios es: admin123
const passwordHash = bcrypt.hashSync('admin123', 10);
const usuarios = [
  {
    id: 1,
    email: 'psicologo@aquachile.cl',
    password: passwordHash,
    nombre: 'Dra. María González',
    rol: 'psicologo'
  },
  {
    id: 2,
    email: 'admin@aquachile.cl',
    password: passwordHash,
    nombre: 'Administrador AquaChile',
    rol: 'admin'
  }
];

// Middleware para verificar JWT en rutas protegidas
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado. No se proporcionó token.' });
  }

  try {
    const verificado = jwt.verify(token, JWT_SECRET);
    req.usuario = verificado;
    next();
  } catch (error) {
    res.status(403).json({ mensaje: 'Token inválido o expirado.' });
  }
};

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

// Endpoint de Inicio de Sesión
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const usuario = usuarios.find(u => u.email === email);
  if (!usuario) {
    return res.status(400).json({ mensaje: 'Credenciales inválidas.' });
  }

  const passwordValido = bcrypt.compareSync(password, usuario.password);
  if (!passwordValido) {
    return res.status(400).json({ mensaje: 'Credenciales inválidas.' });
  }

  // Generar Token JWT (válido por 4 horas)
  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: '4h' }
  );

  res.json({
    token,
    usuario: {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol
    }
  });
});

// ==========================================
// RUTAS PÚBLICAS Y PROTEGIDAS
// ==========================================

// Postulación pública (Sin token)
app.post('/api/postular', upload.single('cv'), (req, res) => {
  const { nombre, rut, email, telefono, cargo, observaciones } = req.body;
  const cvPath = req.file ? req.file.filename : null;

  const nuevoCandidato = {
    id: candidatos.length + 1,
    nombre,
    rut,
    email,
    telefono,
    cargo,
    observaciones,
    cvPath,
    fecha: new Date().toISOString()
  };

  candidatos.push(nuevoCandidato);

  evaluaciones.push({
    id: evaluaciones.length + 1,
    candidatoId: nuevoCandidato.id,
    candidatoNombre: nombre,
    cargo,
    estado: 'Pendiente',
    dictamen: 'En proceso',
    fecha: new Date().toISOString()
  });

  res.status(201).json({
    mensaje: 'Postulación recibida correctamente',
    candidato: nuevoCandidato
  });
});

// Obtener candidatos (Protegido con Token)
app.get('/api/candidatos', verificarToken, (req, res) => {
  res.json(candidatos);
});

// Obtener evaluaciones (Protegido con Token)
app.get('/api/evaluaciones', verificarToken, (req, res) => {
  res.json(evaluaciones);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en http://localhost:5000`);
});