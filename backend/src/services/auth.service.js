import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbUsuarios } from '../config/baseDatos.js';
import { entorno } from '../config/entorno.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';

export const ROL_EVALUADOR = 'psicologo';
export const ROL_ANALISTA = 'analista';
const RONDAS_HASH = 10;

const aUsuarioPublico = ({ id, nombre, email, rol }) => ({ id, nombre, email, rol });

export const autenticar = async (email, password) => {
  const credencialesInvalidas = new ErrorHttp('Correo o contraseña incorrectos', 401);
  const usuario = await dbUsuarios.buscarPorEmail(email);

  if (!usuario) {
    throw credencialesInvalidas;
  }

  const coincide = await bcrypt.compare(String(password ?? ''), usuario.passwordHash);
  if (!coincide) {
    throw credencialesInvalidas;
  }

  const token = jwt.sign(
    { sub: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    entorno.jwt.secreto,
    { expiresIn: entorno.jwt.expiracion },
  );

  return { token, usuario: aUsuarioPublico(usuario) };
};

export const buscarPorEmail = async (email) => dbUsuarios.buscarPorEmail(email);

export const obtenerPerfil = async (id) => {
  const usuario = await dbUsuarios.obtenerPorId(id);
  if (!usuario) {
    throw new ErrorHttp('Usuario no encontrado', 404);
  }
  return aUsuarioPublico(usuario);
};

export const crearEvaluador = async ({ nombre, email, password }) => {
  const passwordHash = await bcrypt.hash(password, RONDAS_HASH);
  return dbUsuarios.insertar({
    id: crypto.randomUUID(),
    nombre,
    email: email.trim().toLowerCase(),
    rol: ROL_EVALUADOR,
    passwordHash,
    creadoEn: new Date().toISOString(),
  });
};

export const crearAnalista = async ({ nombre, email, password }) => {
  const passwordHash = await bcrypt.hash(password, RONDAS_HASH);
  return dbUsuarios.insertar({
    id: crypto.randomUUID(),
    nombre,
    email: email.trim().toLowerCase(),
    rol: ROL_ANALISTA,
    passwordHash,
    creadoEn: new Date().toISOString(),
  });
};

export const contarUsuarios = () => dbUsuarios.contar();
