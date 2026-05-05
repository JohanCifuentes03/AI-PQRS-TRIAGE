import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Response } from 'express';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';

describe('EvaluationsController', () => {
  let controller: EvaluationsController;
  let service: EvaluationsService;

  const evaluationsServiceMock = {
    getLatest: jest.fn(),
    listRuns: jest.fn(),
    getRun: jest.fn(),
    exportLatestCsv: jest.fn(),
  };

  const responseMock: Partial<Response> = {
    setHeader: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluationsController],
      providers: [{ provide: EvaluationsService, useValue: evaluationsServiceMock }],
    }).compile();

    controller = module.get<EvaluationsController>(EvaluationsController);
    service = module.get<EvaluationsService>(EvaluationsService);
    jest.clearAllMocks();
  });

  it('returns latest report with success wrapper', async () => {
    evaluationsServiceMock.getLatest.mockResolvedValue({ runId: 'eval-test' });

    await expect(controller.latest()).resolves.toEqual({
      success: true,
      data: { runId: 'eval-test' },
    });
    expect(service.getLatest).toHaveBeenCalledTimes(1);
  });

  it('applies the rate-limit guard to all evaluation routes', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, EvaluationsController) as unknown[];

    expect(guards).toHaveLength(1);
  });

  it('returns run list with success wrapper', async () => {
    evaluationsServiceMock.listRuns.mockResolvedValue([{ runId: 'eval-test' }]);

    await expect(controller.runs()).resolves.toEqual({
      success: true,
      data: [{ runId: 'eval-test' }],
    });
  });

  it('returns selected run by run id', async () => {
    evaluationsServiceMock.getRun.mockResolvedValue({ runId: 'eval-test' });

    await expect(controller.run('eval-test')).resolves.toEqual({
      success: true,
      data: { runId: 'eval-test' },
    });
    expect(service.getRun).toHaveBeenCalledWith('eval-test');
  });

  it('exports latest CSV with attachment headers', async () => {
    evaluationsServiceMock.exportLatestCsv.mockResolvedValue('csv');

    const result = await controller.exportLatest(responseMock as Response);

    expect(responseMock.setHeader).toHaveBeenNthCalledWith(1, 'Content-Type', 'text/csv');
    expect(responseMock.setHeader).toHaveBeenNthCalledWith(
      2,
      'Content-Disposition',
      'attachment; filename="evaluation-latest.csv"',
    );
    expect(result).toBe('csv');
  });
});
