import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma.module';
import { TriageModule } from '../triage/triage.module';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';

@Module({
  imports: [PrismaModule, TriageModule],
  controllers: [IngestController],
  providers: [IngestService],
})
export class IngestModule {}
