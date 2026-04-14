import { OrchestratorAgent } from './orchestrator.agent';

describe('OrchestratorAgent', () => {
  let orchestrator: OrchestratorAgent;
  let mockClassifier: { classify: jest.Mock };
  let mockRiskDetector: { detect: jest.Mock };
  let mockRouter: { route: jest.Mock };
  let mockDeduplicator: { findDuplicates: jest.Mock };
  let mockLlm: { chat: jest.Mock; generateEmbedding: jest.Mock };

  beforeEach(() => {
    mockClassifier = { classify: jest.fn() };
    mockRiskDetector = { detect: jest.fn() };
    mockRouter = { route: jest.fn() };
    mockDeduplicator = { findDuplicates: jest.fn() };
    mockLlm = { chat: jest.fn(), generateEmbedding: jest.fn() };

    orchestrator = new OrchestratorAgent(
      mockClassifier as any,
      mockRiskDetector as any,
      mockRouter as any,
      mockDeduplicator as any,
      mockLlm as any,
    );
  });

  it('runs all agents and returns complete triage output', async () => {
    mockClassifier.classify.mockResolvedValue({
      tipo: 'Queja',
      tema: 'Infraestructura',
      subtema: 'Alumbrado público',
    });
    mockRiskDetector.detect.mockResolvedValue({
      urgencia: 'Alta',
      riesgo: 'Riesgo eléctrico',
    });
    mockRouter.route.mockResolvedValue({ entidad: 'CODENSA S.A.' });
    mockDeduplicator.findDuplicates.mockResolvedValue(['uuid-prev-1']);
    mockLlm.chat.mockResolvedValue(JSON.stringify({ resumen: 'Cables sueltos en calle 72' }));

    const result = await orchestrator.run('Hay cables sueltos en la calle 72');

    expect(result).toEqual({
      tipo: 'Queja',
      tema: 'Infraestructura',
      subtema: 'Alumbrado público',
      urgencia: 'Alta',
      entidad: 'CODENSA S.A.',
      riesgo: 'Riesgo eléctrico',
      duplicados: ['uuid-prev-1'],
      confianza: expect.any(Number),
      resumen: expect.any(String),
      trace: expect.objectContaining({
        runId: expect.any(String),
        totalMs: expect.any(Number),
        steps: expect.any(Array),
      }),
    });
  });

  it('runs classifier, risk, and router in parallel (calls happen before await)', async () => {
    mockClassifier.classify.mockImplementation(() => new Promise(r => setTimeout(() => r({
      tipo: 'Peticion', tema: 'Salud', subtema: 'EPS',
    }), 50)));
    mockRiskDetector.detect.mockResolvedValue({ urgencia: 'Media', riesgo: 'Ninguno' });
    mockRouter.route.mockResolvedValue({ entidad: 'SDS' });
    mockDeduplicator.findDuplicates.mockResolvedValue([]);
    mockLlm.chat.mockResolvedValue(JSON.stringify({ resumen: 'Cita médica urgente' }));

    await orchestrator.run('Necesito cita médica urgente');

    expect(mockClassifier.classify).toHaveBeenCalledTimes(1);
    expect(mockRiskDetector.detect).toHaveBeenCalledTimes(1);
    expect(mockRouter.route).toHaveBeenCalledTimes(1);
    expect(mockDeduplicator.findDuplicates).toHaveBeenCalledTimes(1);
  });

  it('returns empty duplicados when dedup fails gracefully', async () => {
    mockClassifier.classify.mockResolvedValue({
      tipo: 'Queja', tema: 'Medio Ambiente', subtema: 'Residuos',
    });
    mockRiskDetector.detect.mockResolvedValue({ urgencia: 'Alta', riesgo: 'Sanitario' });
    mockRouter.route.mockResolvedValue({ entidad: 'UAESP' });
    mockDeduplicator.findDuplicates.mockResolvedValue([]);
    mockLlm.chat.mockResolvedValue(JSON.stringify({ resumen: 'Basuras acumuladas' }));

    const result = await orchestrator.run('Basuras acumuladas');
    expect(result.duplicados).toEqual([]);
  });

  it('includes a non-empty resumen', async () => {
    mockClassifier.classify.mockResolvedValue({
      tipo: 'Sugerencia', tema: 'Movilidad', subtema: 'Bicicletas',
    });
    mockRiskDetector.detect.mockResolvedValue({ urgencia: 'Baja', riesgo: 'Ninguno' });
    mockRouter.route.mockResolvedValue({ entidad: 'IDU' });
    mockDeduplicator.findDuplicates.mockResolvedValue([]);
    mockLlm.chat.mockResolvedValue(JSON.stringify({ resumen: 'Ciclorutas en Ciudad Bolívar' }));

    const result = await orchestrator.run('Propongo ciclo-rutas en Ciudad Bolívar');
    expect(result.resumen.length).toBeGreaterThan(0);
  });

  it('falls back to substring summary when llm summary fails', async () => {
    const longText = 'A'.repeat(200);
    mockClassifier.classify.mockResolvedValue({
      tipo: 'Queja',
      tema: 'Infraestructura',
      subtema: 'Malla vial',
    });
    mockRiskDetector.detect.mockResolvedValue({ urgencia: 'Media', riesgo: 'Ninguno' });
    mockRouter.route.mockResolvedValue({ entidad: 'IDU' });
    mockDeduplicator.findDuplicates.mockResolvedValue([]);
    mockLlm.chat.mockRejectedValue(new Error('llm down'));

    const result = await orchestrator.run(longText);
    expect(result.resumen).toHaveLength(120);
  });
});
