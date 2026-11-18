import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PanelAnalisisIA from './PanelAnalisisIA.jsx';

const mocks = vi.hoisted(() => ({
  obtener: vi.fn(),
  generar: vi.fn(),
  revisar: vi.fn(),
}));

vi.mock('../../services/analisisIA.js', () => ({
  obtenerAnalisisIA: mocks.obtener,
  generarAnalisisIA: mocks.generar,
  revisarAnalisisIA: mocks.revisar,
}));

const ANALISIS = {
  id: 'a1',
  candidatoId: 'c1',
  estado: 'borrador',
  modelo: 'modelo-ia',
  resultado: {
    version: '1.0',
    resumen: 'Experiencia sólida en análisis de datos y liderazgo de equipos.',
    anosExperienciaEstimados: 5,
    palabrasClaveDetectadas: ['python', 'sql'],
    afinidad: { score: 82, nivel: 'alto', justificacion: 'Coincide con el cargo.' },
    fortalezas: [
      {
        titulo: 'Análisis de datos',
        evidencia: 'Cinco años construyendo tableros.',
        documento: 'cv.pdf',
      },
    ],
    brechas: [
      {
        titulo: 'Inglés avanzado',
        evidencia: 'No se declara nivel de inglés.',
        documento: 'cv.pdf',
      },
    ],
    competencias: [
      {
        id: 'analisis',
        nombre: 'Análisis',
        nivel: 4,
        evidencia: ['Reportes automatizados'],
        confianza: 0.8,
      },
    ],
    preguntasEntrevista: [
      {
        pregunta: '¿Cómo priorizas los requerimientos?',
        objetivo: 'Evaluar criterio analítico.',
        competenciaId: 'analisis',
      },
    ],
    recomendacion: { codigo: 'avanzar', texto: 'Continuar con la entrevista.' },
    confianza: 0.8,
    advertencias: [],
  },
};

const candidato = { id: 'c1', cargo: 'Analista de Sistemas' };

describe('PanelAnalisisIA', () => {
  beforeEach(() => {
    mocks.obtener.mockReset();
    mocks.generar.mockReset();
    mocks.revisar.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('genera el análisis y muestra el resultado con indicador de caché', async () => {
    const user = userEvent.setup();
    mocks.obtener.mockResolvedValue({ ultimo: null, historial: [] });
    mocks.generar.mockResolvedValue({ analisis: ANALISIS, cacheHit: true });

    render(<PanelAnalisisIA candidato={candidato} puedeEvaluar />);

    const generar = await screen.findByRole('button', { name: /Generar análisis IA/ });
    await user.click(generar);

    expect(await screen.findByText(ANALISIS.resultado.resumen)).toBeInTheDocument();
    expect(screen.getByText('Desde caché')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(mocks.generar).toHaveBeenCalledWith('c1', { cargo: 'Analista de Sistemas' });
  });

  it('permite marcar un análisis como revisado', async () => {
    const user = userEvent.setup();
    mocks.obtener.mockResolvedValue({ ultimo: ANALISIS, historial: [ANALISIS] });
    mocks.revisar.mockResolvedValue({
      analisis: { ...ANALISIS, estado: 'revisado' },
    });

    render(<PanelAnalisisIA candidato={candidato} puedeEvaluar />);

    expect(await screen.findByText(ANALISIS.resultado.resumen)).toBeInTheDocument();
    const aprobar = screen.getByRole('button', { name: /Aprobar \/ Marcar revisado/ });
    await user.click(aprobar);

    expect(mocks.revisar).toHaveBeenCalledWith('a1', { estado: 'revisado' });
    await waitFor(() => expect(aprobar).toBeDisabled());
  });

  it('oculta la generación cuando el usuario no es evaluador', async () => {
    mocks.obtener.mockResolvedValue({ ultimo: null, historial: [] });

    render(<PanelAnalisisIA candidato={candidato} puedeEvaluar={false} />);

    expect(
      await screen.findByText('La generación está disponible para el perfil evaluador.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Generar análisis IA/ })).not.toBeInTheDocument();
  });
});
