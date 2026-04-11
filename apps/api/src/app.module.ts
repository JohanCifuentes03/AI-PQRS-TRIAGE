import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma.module';
import { TriageModule } from './modules/triage/triage.module';
import { PqrsModule } from './modules/pqrs/pqrs.module';

@Module({
  imports: [PrismaModule, TriageModule, PqrsModule],
})
export class AppModule {}
