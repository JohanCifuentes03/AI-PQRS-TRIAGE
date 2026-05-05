import { apiClient } from '@/lib/api-client';

export interface EvaluationReport {
  runId: string;
  createdAt: string;
  dataset: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  status: 'PASS' | 'FAIL' | 'PENDING';
  summary: EvaluationSummary;
  thresholds: Record<string, number>;
  results: EvaluationCaseResult[];
  judgeEnabled?: boolean;
  thresholdFailures?: string[];
}

export interface EvaluationSummary {
  accuracy_tipo: number;
  accuracy_tema: number;
  accuracy_subtema: number;
  accuracy_urgencia: number;
  accuracy_riesgo: number;
  accuracy_entidad: number;
  accuracy_duplicado: number;
  judge_overall_score: number | null;
  summary_score: number | null;
  privacy_score: number | null;
  ethics_score: number | null;
  traceability_score: number | null;
  judge_error_count: number;
  entity_judge_error_count: number;
  avg_latency_ms: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  max_latency_ms: number;
  avg_confidence: number;
  estimated_total_cost_usd: number;
  estimated_cost_per_case_usd: number;
}

export interface EvaluationCaseResult {
  caseId: string;
  passed: boolean;
  latencyMs: number;
  expected: Record<string, string | boolean | undefined>;
  actual: Record<string, string | number | boolean | undefined>;
  deterministicScores: Record<string, boolean>;
  judgeResult: EvaluationJudgeResult | { judge_error: true; pass: false; main_error: string } | null;
  cost: { estimatedTotalCostUsd: number };
  errors: string[];
  tags: string[];
}

export interface EvaluationJudgeResult {
  classification_score: number;
  routing_score: number;
  urgency_risk_score: number;
  summary_score: number;
  privacy_score: number;
  ethics_score: number;
  traceability_score: number;
  overall_score: number;
  pass: boolean;
  main_error: string;
  recommendation: string;
}

export async function fetchLatestEvaluation() {
  return apiClient<{ success: boolean; data: EvaluationReport }>('/evaluations/latest', {
    cache: 'no-store',
  });
}
