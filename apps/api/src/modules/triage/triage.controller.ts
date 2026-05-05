import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Logger, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { triageInputSchema } from '@ai-pqrs-triage/shared';
import { TriageService } from './triage.service';
import { SimpleRateLimitGuard } from '../../common/simple-rate-limit.guard';

@ApiTags('Triage')
@Controller('triage')
export class TriageController {
  private readonly logger = new Logger(TriageController.name);

  constructor(private readonly triageService: TriageService) {}

  @Post()
  @UseGuards(SimpleRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run AI triage on a PQRS text' })
  async triage(@Body() body: unknown, @Headers('x-evaluation-mode') evaluationMode?: string) {
    const input = triageInputSchema.parse(body);
    this.logger.log(`Triage request received canal=${input.canal}`);
    const result = await this.triageService.runTriage({
      ...input,
      persist: evaluationMode !== 'true',
    });
    return { success: true, data: result };
  }
}
