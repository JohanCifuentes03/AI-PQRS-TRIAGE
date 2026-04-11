import { Test, TestingModule } from '@nestjs/testing';
import { PqrsController } from './pqrs.controller';
import { PqrsService } from './pqrs.service';
import { PrismaService } from '../../common/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PqrsController', () => {
  let controller: PqrsController;
  let service: PqrsService;

  const mockPqrsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    approve: jest.fn(),
    correct: jest.fn(),
    route: jest.fn(),
  };

  const mockPrismaService = {
    $connect: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PqrsController],
      providers: [
        PqrsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PqrsService, useValue: mockPqrsService },
      ],
    }).compile();

    controller = module.get<PqrsController>(PqrsController);
    service = module.get<PqrsService>(PqrsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /pqrs', () => {
    it('returns paginated results with defaults', async () => {
      const mockResult = {
        data: [{ id: '1', texto: 'test', canal: 'web' }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      mockPqrsService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll({});
      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
    });

    it('passes estado filter', async () => {
      mockPqrsService.findAll.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });

      await controller.findAll({ estado: 'pendiente' });
      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'pendiente' }),
      );
    });

    it('passes urgencia filter', async () => {
      mockPqrsService.findAll.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });

      await controller.findAll({ urgencia: 'Alta' });
      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ urgencia: 'Alta' }),
      );
    });
  });

  describe('GET /pqrs/:id', () => {
    it('returns a single PQRS', async () => {
      const mockRecord = { data: { id: 'abc', texto: 'test' } };
      mockPqrsService.findOne.mockResolvedValue(mockRecord);

      const result = await controller.findOne('abc');
      expect(result).toEqual(mockRecord);
    });

    it('throws when not found', async () => {
      mockPqrsService.findOne.mockRejectedValue(
        new NotFoundException('PQRS xyz not found'),
      );

      await expect(controller.findOne('xyz')).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /pqrs/:id/approve', () => {
    it('approves a PQRS', async () => {
      const mockResult = { success: true, data: { id: '1', estado: 'aprobado' } };
      mockPqrsService.approve.mockResolvedValue(mockResult);

      const result = await controller.approve('1', { usuario: 'admin' });
      expect(result).toEqual(mockResult);
      expect(service.approve).toHaveBeenCalledWith('1', { usuario: 'admin' });
    });
  });

  describe('PATCH /pqrs/:id/correct', () => {
    it('corrects classification fields', async () => {
      const mockResult = { success: true, data: { id: '1', estado: 'corregido' } };
      mockPqrsService.correct.mockResolvedValue(mockResult);

      const result = await controller.correct('1', {
        usuario: 'admin',
        urgencia: 'Alta',
      });
      expect(result).toEqual(mockResult);
      expect(service.correct).toHaveBeenCalledWith('1', {
        usuario: 'admin',
        urgencia: 'Alta',
      });
    });
  });

  describe('PATCH /pqrs/:id/route', () => {
    it('routes a PQRS', async () => {
      const mockResult = { success: true, data: { id: '1', estado: 'enrutado' } };
      mockPqrsService.route.mockResolvedValue(mockResult);

      const result = await controller.route('1', { usuario: 'admin' });
      expect(result).toEqual(mockResult);
      expect(service.route).toHaveBeenCalledWith('1', { usuario: 'admin' });
    });
  });
});
