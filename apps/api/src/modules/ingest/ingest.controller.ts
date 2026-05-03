import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SimpleRateLimitGuard } from '../../common/simple-rate-limit.guard';
import { emailIngestSchema } from './dto/email-ingest.dto';
import { webhookIngestSchema } from './dto/webhook-ingest.dto';
import { IngestService } from './ingest.service';

@ApiTags('Ingest')
@Controller('ingest')
export class IngestController {
  private readonly logger = new Logger(IngestController.name);

  constructor(private readonly ingestService: IngestService) {}

  @Post('email')
  @UseGuards(SimpleRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive PQRS emails from webhook providers' })
  async ingestEmail(@Body() body: unknown) {
    const input = emailIngestSchema.parse(body);
    this.logger.log(`Email ingest request received from=${input.from}`);
    const result = await this.ingestService.processEmail(input);
    return { success: true, data: result };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive PQRS payloads from external APIs' })
  async ingestWebhook(@Req() request: Request, @Body() body: unknown) {
    try {
      const apiKeyHeader = this.getHeaderValue(request.headers['x-api-key']);
      await this.ingestService.validateApiKey(apiKeyHeader);
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_API_KEY') {
        throw new UnauthorizedException('Invalid API key');
      }

      throw error;
    }

    const input = webhookIngestSchema.parse(body);
    this.logger.log(`External webhook ingest request received from=${input.remitente ?? 'unknown'}`);
    const result = await this.ingestService.processWebhook(input);
    return { success: true, data: result };
  }

  @Get('api-info')
  @ApiOperation({ summary: 'Get external webhook integration configuration' })
  async getApiInfo(@Req() request: Request) {
    const data = await this.ingestService.getApiInfo(this.resolveBaseUrl(request));
    return { success: true, data };
  }

  @Post('regenerate-api-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate API key for external webhook ingest' })
  async regenerateApiKey(@Req() request: Request) {
    const data = await this.ingestService.regenerateApiKey(this.resolveBaseUrl(request));
    return { success: true, data };
  }

  private resolveBaseUrl(request: Request) {
    if (process.env.API_PUBLIC_URL) {
      return process.env.API_PUBLIC_URL.replace(/\/$/, '');
    }

    return `${request.protocol}://${request.get('host')}`;
  }

  private getHeaderValue(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  }
}
