import { Test, TestingModule } from '@nestjs/testing';
import { TriageController } from './triage.controller';
import { TriageService } from './triage.service';
import { PrismaService } from '../../common/prisma.service';

describe('TriageController', () => {
  let controller: TriageController;
  let service: TriageService;

  const mockTriageResult = {
    id: 'uuid-1',
    tipo: 'Queja',
    tema: 'Infraestructura',
    subtema: 'Alumbrado público',
    urgencia: 'Alta',
    entidad: 'CODENSA S.A.',
    riesgo: 'Ninguno',
    duplicados: [],
    confianza: 0.88,
    resumen: 'Test resumen',
  };

  const mockTriageService = {
    runTriage: jest.fn().mockResolvedValue(mockTriageResult),
  };

  const mockPrismaService = {
    $connect: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TriageController],
      providers: [
        TriageService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TriageService, useValue: mockTriageService },
      ],
    }).compile();

    controller = module.get<TriageController>(TriageController);
    service = module.get<TriageService>(TriageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /triage', () => {
    it('accepts valid input and returns triaged result', async () => {
      const input = {
        texto: 'Hay cables sueltos en la calle y es peligroso',
        canal: 'web',
      };

      const result = await controller.triage(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTriageResult);
      expect(service.runTriage).toHaveBeenCalledWith(input);
    });

    it('rejects invalid canal', async () => {
      await expect(
        controller.triage({ texto: 'Un texto valido', canal: 'fax' }),
      ).rejects.toThrow();
    });

    it('rejects short texto', async () => {
      await expect(
        controller.triage({ texto: 'Hola', canal: 'web' }),
      ).rejects.toThrow();
    });

    it('rejects empty body', async () => {
      await expect(controller.triage({})).rejects.toThrow();
    });
  });
});
