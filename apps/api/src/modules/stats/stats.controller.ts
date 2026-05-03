import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Canal, TipoPqrs } from '@ai-pqrs-triage/shared';
import { SimpleRateLimitGuard } from '../../common/simple-rate-limit.guard';
import { StatsService } from './stats.service';
import { statsQuerySchema } from './dto/stats-query.dto';

@ApiTags('Stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  @UseGuards(SimpleRateLimitGuard)
  @ApiOperation({ summary: 'Get dashboard overview KPIs' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'canal', required: false, enum: Canal })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoPqrs })
  @ApiQuery({ name: 'entidad', required: false, type: String })
  async getOverview(@Query() query: unknown) {
    return this.statsService.getOverview(statsQuerySchema.parse(query));
  }

  @Get('by-channel')
  @UseGuards(SimpleRateLimitGuard)
  @ApiOperation({ summary: 'Get PQRS distribution by channel' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'canal', required: false, enum: Canal })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoPqrs })
  @ApiQuery({ name: 'entidad', required: false, type: String })
  async getByChannel(@Query() query: unknown) {
    return this.statsService.getByChannel(statsQuerySchema.parse(query));
  }

  @Get('by-type')
  @UseGuards(SimpleRateLimitGuard)
  @ApiOperation({ summary: 'Get PQRS distribution by type' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'canal', required: false, enum: Canal })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoPqrs })
  @ApiQuery({ name: 'entidad', required: false, type: String })
  async getByType(@Query() query: unknown) {
    return this.statsService.getByType(statsQuerySchema.parse(query));
  }

  @Get('by-urgency')
  @UseGuards(SimpleRateLimitGuard)
  @ApiOperation({ summary: 'Get PQRS distribution by urgency' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'canal', required: false, enum: Canal })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoPqrs })
  @ApiQuery({ name: 'entidad', required: false, type: String })
  async getByUrgency(@Query() query: unknown) {
    return this.statsService.getByUrgency(statsQuerySchema.parse(query));
  }

  @Get('by-entity')
  @UseGuards(SimpleRateLimitGuard)
  @ApiOperation({ summary: 'Get PQRS distribution by entity' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'canal', required: false, enum: Canal })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoPqrs })
  @ApiQuery({ name: 'entidad', required: false, type: String })
  async getByEntity(@Query() query: unknown) {
    return this.statsService.getByEntity(statsQuerySchema.parse(query));
  }

  @Get('by-topic')
  @UseGuards(SimpleRateLimitGuard)
  @ApiOperation({ summary: 'Get PQRS distribution by tema (topic)' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'canal', required: false, enum: Canal })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoPqrs })
  @ApiQuery({ name: 'entidad', required: false, type: String })
  async getByTopic(@Query() query: unknown) {
    return this.statsService.getByTopic(statsQuerySchema.parse(query));
  }

  @Get('trends')
  @UseGuards(SimpleRateLimitGuard)
  @ApiOperation({ summary: 'Get PQRS daily trends for the last 30 days' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'canal', required: false, enum: Canal })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoPqrs })
  @ApiQuery({ name: 'entidad', required: false, type: String })
  async getTrends(@Query() query: unknown) {
    return this.statsService.getTrends(statsQuerySchema.parse(query));
  }
}
