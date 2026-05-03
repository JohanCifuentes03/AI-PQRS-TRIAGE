import { Module } from '@nestjs/common';
import { TriageController } from './triage.controller';
import { TriageService } from './triage.service';
import { LlmProvider } from '../../llm/llm.provider';
import { ClassifierAgent } from '../../agents/classifier.agent';
import { RiskDetectorAgent } from '../../agents/risk-detector.agent';
import { RouterAgent } from '../../agents/router.agent';
import { DeduplicatorAgent } from '../../agents/deduplicator.agent';
import { OrchestratorAgent } from '../../agents/orchestrator.agent';

@Module({
  controllers: [TriageController],
  providers: [
    LlmProvider,
    ClassifierAgent,
    RiskDetectorAgent,
    RouterAgent,
    DeduplicatorAgent,
    OrchestratorAgent,
    TriageService,
  ],
  exports: [TriageService],
})
export class TriageModule {}
