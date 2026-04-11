import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  pqrsApproveSchema,
  pqrsCorrectSchema,
  pqrsRouteSchema,
  pqrsQuerySchema,
} from '@ai-pqrs-triage/shared';
import { PqrsService } from './pqrs.service';
import { SimpleRateLimitGuard } from '../../common/simple-rate-limit.guard';

@ApiTags('PQRS')
@Controller('pqrs')
export class PqrsController {
  private readonly logger = new Logger(PqrsController.name);

  constructor(private readonly pqrsService: PqrsService) {}

  @Get()
  @ApiOperation({ summary: 'List PQRS with filters and pagination' })
  async findAll(@Query() query: unknown) {
    const filters = pqrsQuerySchema.parse(query);
    return this.pqrsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single PQRS by ID' })
  async findOne(@Param('id') id: string) {
    return this.pqrsService.findOne(id);
  }

  @Patch(':id/approve')
  @UseGuards(SimpleRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve AI classification' })
  async approve(@Param('id') id: string, @Body() body: unknown) {
    const input = pqrsApproveSchema.parse(body);
    this.logger.log(`PQRS approved id=${id} usuario=${input.usuario}`);
    return this.pqrsService.approve(id, input);
  }

  @Patch(':id/correct')
  @UseGuards(SimpleRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Correct AI classification manually' })
  async correct(@Param('id') id: string, @Body() body: unknown) {
    const input = pqrsCorrectSchema.parse(body);
    this.logger.log(`PQRS corrected id=${id} usuario=${input.usuario}`);
    return this.pqrsService.correct(id, input);
  }

  @Patch(':id/route')
  @UseGuards(SimpleRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Route PQRS to assigned department' })
  async route(@Param('id') id: string, @Body() body: unknown) {
    const input = pqrsRouteSchema.parse(body);
    this.logger.log(`PQRS routed id=${id} usuario=${input.usuario}`);
    return this.pqrsService.route(id, input);
  }
}
