import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { triageInputSchema } from '@ai-pqrs-triage/shared';
import { TriageService } from './triage.service';

@ApiTags('Triage')
@Controller('triage')
export class TriageController {
  constructor(private readonly triageService: TriageService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run AI triage on a PQRS text' })
  async triage(@Body() body: unknown) {
    const input = triageInputSchema.parse(body);
    const result = await this.triageService.runTriage(input);
    return { success: true, data: result };
  }
}
