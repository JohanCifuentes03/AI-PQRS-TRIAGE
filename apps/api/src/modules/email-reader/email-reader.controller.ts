import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { emailReaderConfigInputSchema } from './email-reader.service';
import { EmailReaderService } from './email-reader.service';

@ApiTags('Email Reader')
@Controller('email-reader')
export class EmailReaderController {
  constructor(private readonly emailReaderService: EmailReaderService) {}

  @Post('config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save IMAP polling configuration' })
  async saveConfig(@Body() body: unknown) {
    const input = emailReaderConfigInputSchema.parse(body);
    const data = await this.emailReaderService.saveConfig(input);
    return { success: true, data };
  }

  @Get('config')
  @ApiOperation({ summary: 'Get current IMAP configuration' })
  async getConfig() {
    const data = await this.emailReaderService.getConfig();
    return { success: true, data };
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test IMAP connection with current or provided config' })
  async testConnection(@Body() body: unknown) {
    const input = emailReaderConfigInputSchema.parse(body);
    const data = await this.emailReaderService.testConnection(input);
    return { success: data.success, data };
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger manual IMAP synchronization' })
  async syncNow() {
    const data = await this.emailReaderService.syncEmails();
    return { success: true, data };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get polling status and last sync information' })
  async getStatus() {
    const data = await this.emailReaderService.getStatus();
    return { success: true, data };
  }
}
