import { existsSync, readFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const resultados = [];

const ok = (mensaje) => resultados.push({ nivel: 'OK', mensaje });
const aviso = (mensaje, arreglo) => resultados.push({ nivel: 'AVISO', mensaje, arreglo });
const falla = (mensaje, arreglo) => resultados.push({ nivel: 'FALLA', mensaje, arreglo });

const leerEnv = (ruta) => {
  if (!existsSync(ruta)) {
    return null;
  }
  const valores = {};
  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) {
      continue;
    }
    const separador = limpia.indexOf('=');
    if (separador === -1) {
      continue;
    }
    const clave = limpia.slice(0, separador).trim();
    let valor = limpia.slice(separador + 1).trim();
    const entreComillas =
      (valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"));
    if (entreComillas && valor.length >= 2) {
      valor = valor.slice(1, -1);
    }
    valores[clave] = valor;
  }
  return valores;
};

const puertoOcupado = (puerto) =>
  new Promise((resolver) => {
    const socket = net.connect({ host: '127.0.0.1', port: puerto });
    const terminar = (ocupado) => {
      socket.destroy();
      resolver(ocupado);
    };
    socket.setTimeout(400);
    socket.once('connect', () => terminar(true));
    socket.once('timeout', () => terminar(false));
    socket.once('error', () => terminar(false));
  });

const verificarNode = () => {
  const [mayor, menor] = process.version.replace(/^v/, '').split('.').map(Number);
  if (mayor < 23 || (mayor === 23 && menor < 4)) {
    falla(
      `Node ${process.version} es demasiado antiguo para el backend.`,
      'Instala Node 24 o superior: el backend usa el modulo node:sqlite.',
    );
    return;
  }
  if (mayor < 24) {
    aviso(`Node ${process.version} funciona, pero el proyecto se probo con Node 24.`, 'Actualiza si aparece algun problema.');
    return;
  }
  ok(`Node ${process.version}`);
};

const verificarBackend = () => {
  const ruta = path.join(RAIZ, 'backend', '.env');
  const entorno = leerEnv(ruta);
  if (!entorno) {
    falla(
      'Falta backend/.env.',
      'Copia backend/.env.example como backend/.env y completa las variables obligatorias.',
    );
    return { puerto: 5000, motor: null };
  }
  if (!entorno.JWT_SECRET) {
    falla('JWT_SECRET esta vacia en backend/.env.', 'Genera una con: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  } else {
    ok('JWT_SECRET configurada.');
  }
  if (!entorno.EVALUADOR_PASSWORD) {
    aviso(
      'EVALUADOR_PASSWORD esta vacia: la cuenta evaluadora no se creara.',
      'Definela en backend/.env antes del primer arranque.',
    );
  } else {
    ok('Contrasena del evaluador configurada.');
  }
  if (!entorno.ANALISTA_PASSWORD) {
    aviso(
      'ANALISTA_PASSWORD esta vacia: la cuenta analista no se creara.',
      'Definela en backend/.env antes del primer arranque.',
    );
  } else {
    ok('Contrasena del analista configurada.');
  }
  const motor = entorno.DATABASE_URL ? 'postgresql' : 'sqlite';
  if (motor === 'postgresql') {
    ok('Base de datos: PostgreSQL (DATABASE_URL definida).');
  } else {
    const archivo = path.join(RAIZ, 'backend', 'data', 'aquachile.db');
    if (existsSync(archivo)) {
      ok('Base de datos: SQLite local (backend/data/aquachile.db ya existe).');
    } else {
      aviso(
        'Base de datos: SQLite local (se creara vacia al primer arranque).',
        'Para ver datos de ejemplo deja SEED_DEMO=true en backend/.env.',
      );
    }
  }
  const puerto = Number(entorno.PORT) || 5000;
  return { puerto, motor };
};

const verificarFrontend = () => {
  const ruta = path.join(RAIZ, 'frontend', '.env');
  const entorno = leerEnv(ruta);
  if (!entorno) {
    aviso(
      'Falta frontend/.env: sin proxy, las llamadas a /api responden 404.',
      'Copia frontend/.env.example como frontend/.env.',
    );
    return;
  }
  if (!entorno.VITE_API_PROXY_TARGET) {
    aviso(
      'VITE_API_PROXY_TARGET esta vacia en frontend/.env: no habra proxy hacia el backend.',
      'Define VITE_API_PROXY_TARGET=http://127.0.0.1:5000.',
    );
    return;
  }
  ok(`Proxy del frontend hacia ${entorno.VITE_API_PROXY_TARGET}.`);
};

const verificarDependencias = () => {
  for (const carpeta of ['backend', 'frontend']) {
    const ruta = path.join(RAIZ, carpeta, 'node_modules');
    if (existsSync(ruta)) {
      ok(`Dependencias instaladas en ${carpeta}/.`);
    } else {
      falla(`Faltan las dependencias de ${carpeta}/.`, 'Ejecuta npm run setup desde la raiz del proyecto.');
    }
  }
};

const ejecutar = async () => {
  console.log('Verificacion del entorno\n');
  verificarNode();
  const { puerto, motor } = verificarBackend();
  verificarFrontend();
  verificarDependencias();

  if (motor === 'sqlite') {
    const carpeta = path.join(RAIZ, 'backend', 'data');
    if (existsSync(carpeta)) {
      ok('Carpeta backend/data disponible.');
    } else {
      aviso('La carpeta backend/data no existe: se creara al arrancar.');
    }
  }

  if (await puertoOcupado(puerto)) {
    aviso(
      `El puerto ${puerto} esta ocupado por otro proceso.`,
      'Cierra ese proceso o cambia PORT en backend/.env.',
    );
  } else {
    ok(`Puerto ${puerto} libre.`);
  }

  console.log('');
  for (const { nivel, mensaje, arreglo } of resultados) {
    console.log(`[${nivel}] ${mensaje}`);
    if (arreglo) {
      console.log(`        -> ${arreglo}`);
    }
  }

  const fallas = resultados.filter((resultado) => resultado.nivel === 'FALLA').length;
  const avisos = resultados.filter((resultado) => resultado.nivel === 'AVISO').length;
  console.log(`\nResumen: ${resultados.length - fallas - avisos} OK, ${avisos} aviso(s), ${fallas} falla(s).`);

  if (fallas > 0) {
    console.log('Corrige las fallas antes de arrancar el proyecto.');
    process.exit(1);
  }
  console.log('Entorno listo para arrancar.');
};

ejecutar().catch((error) => {
  console.error(`No fue posible completar la verificacion: ${error.message}`);
  process.exit(1);
});
