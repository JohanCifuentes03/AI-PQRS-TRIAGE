import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { SimpleRateLimitGuard } from '../../common/simple-rate-limit.guard';
import { EvaluationsService } from './evaluations.service';

@ApiTags('Evaluations')
@Controller('evaluations')
@UseGuards(SimpleRateLimitGuard)
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Get('latest')
  @ApiOperation({ summary: 'Get the latest evaluation report' })
  async latest(): Promise<{ success: boolean; data: unknown }> {
    return { success: true, data: await this.evaluationsService.getLatest() };
  }

  @Get('runs')
  @ApiOperation({ summary: 'List generated evaluation runs' })
  async runs(): Promise<{ success: boolean; data: unknown }> {
    return { success: true, data: await this.evaluationsService.listRuns() };
  }

  @Get('runs/:runId')
  @ApiOperation({ summary: 'Get one generated evaluation run by run id' })
  @ApiParam({ name: 'runId', type: String })
  async run(@Param('runId') runId: string): Promise<{ success: boolean; data: unknown }> {
    return { success: true, data: await this.evaluationsService.getRun(runId) };
  }

  @Get('export/latest')
  @ApiOperation({ summary: 'Export the latest evaluation report as CSV' })
  async exportLatest(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="evaluation-latest.csv"');
    return this.evaluationsService.exportLatestCsv();
  }
}
