import { Module } from '@nestjs/common';
import { PrismaService } from './common/prisma.service';
import { TriageModule } from './modules/triage/triage.module';
import { PqrsModule } from './modules/pqrs/pqrs.module';

@Module({
  imports: [TriageModule, PqrsModule],
  providers: [PrismaService],
})
export class AppModule {}
