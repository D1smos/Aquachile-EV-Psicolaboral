import { esCorreoValido, textoNoVacio } from '../utils/validadores.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';
import { envolver } from '../utils/envolver.js';
import { autenticar, obtenerPerfil } from '../services/auth.service.js';

const lanzarErrores = (errores) => {
  if (errores.length > 0) {
    throw new ErrorHttp('Revisa los datos de acceso', 400, errores);
  }
};

export const login = envolver(async (req, res) => {
  const { email, password } = req.body ?? {};
  const errores = [];

  if (!esCorreoValido(email)) {
    errores.push({ campo: 'email', mensaje: 'Ingresa un correo electrónico válido' });
  }
  if (!textoNoVacio(password, 6)) {
    errores.push({ campo: 'password', mensaje: 'La contraseña debe tener al menos 6 caracteres' });
  }
  lanzarErrores(errores);

  const resultado = await autenticar(email, password);
  res.json({ ok: true, ...resultado });
});

export const perfil = envolver(async (req, res) => {
  const usuario = await obtenerPerfil(req.usuario.sub);
  res.json({ ok: true, usuario });
});
