import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma.module';
import { TriageModule } from '../triage/triage.module';
import { EmailReaderController } from './email-reader.controller';
import { EmailReaderService } from './email-reader.service';

@Module({
  imports: [PrismaModule, TriageModule],
  controllers: [EmailReaderController],
  providers: [EmailReaderService],
  exports: [EmailReaderService],
})
export class EmailReaderModule {}
