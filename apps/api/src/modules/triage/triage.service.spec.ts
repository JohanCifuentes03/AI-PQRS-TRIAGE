import { TriageService } from './triage.service';

describe('TriageService', () => {
  const prismaMock = {
    pqrs: {
      create: jest.fn(),
    },
    $executeRaw: jest.fn(),
  };

  const orchestratorMock = {
    run: jest.fn(),
  };

  const llmMock = {
    generateEmbedding: jest.fn(),
  };

  let service: TriageService;

  beforeEach(() => {
    service = new TriageService(prismaMock as never, orchestratorMock as never, llmMock as never);
    jest.clearAllMocks();
  });

  it('runs orchestrator and stores triage result', async () => {
    orchestratorMock.run.mockResolvedValue({
      tipo: 'Queja',
      tema: 'Infraestructura',
      subtema: 'Alumbrado',
      urgencia: 'Alta',
      entidad: 'IDU',
      riesgo: 'Electrico',
      duplicados: [],
      confianza: 0.9,
      resumen: 'Resumen breve',
    });
    llmMock.generateEmbedding.mockResolvedValue(new Array(1536).fill(0.1));
    prismaMock.pqrs.create.mockResolvedValue({ id: 'abc-1' });

    const result = await service.runTriage({ texto: 'texto', canal: 'web' });

    expect(result).toEqual(expect.objectContaining({ id: 'abc-1', tipo: 'Queja' }));
    expect(prismaMock.$executeRaw).toHaveBeenCalled();
  });

  it('continues when embedding generation fails', async () => {
    orchestratorMock.run.mockResolvedValue({
      tipo: 'Peticion',
      tema: 'Salud',
      subtema: 'EPS',
      urgencia: 'Media',
      entidad: 'SDS',
      riesgo: 'Ninguno',
      duplicados: [],
      confianza: 0.7,
      resumen: 'Resumen',
    });
    llmMock.generateEmbedding.mockRejectedValue(new Error('embedding fail'));
    prismaMock.pqrs.create.mockResolvedValue({ id: 'abc-2' });

    const result = await service.runTriage({ texto: 'texto', canal: 'web' });

    expect(result).toEqual(expect.objectContaining({ id: 'abc-2', tipo: 'Peticion' }));
    expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
  });
});
