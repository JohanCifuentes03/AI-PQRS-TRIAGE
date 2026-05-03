import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma.module';
import { TriageModule } from './modules/triage/triage.module';
import { PqrsModule } from './modules/pqrs/pqrs.module';
import { IngestModule } from './modules/ingest/ingest.module';
import { StatsModule } from './modules/stats/stats.module';
import { ReportsModule } from './modules/reports/reports.module';
import { EmailReaderModule } from './modules/email-reader/email-reader.module';

@Module({
  imports: [
    PrismaModule,
    TriageModule,
    PqrsModule,
    IngestModule,
    StatsModule,
    ReportsModule,
    EmailReaderModule,
  ],
})
export class AppModule {}
