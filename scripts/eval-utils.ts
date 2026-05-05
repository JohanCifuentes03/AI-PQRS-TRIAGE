import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { z } from 'zod';

const evaluationInputSchema = z.object({
  texto: z.string().min(1),
  canal: z.string().min(1),
  remitente: z.string().optional(),
  asunto: z.string().optional(),
});

const expectedSchema = z.object({
  tipo: z.string(),
  tema: z.string(),
  subtema: z.string().optional(),
  urgencia: z.string(),
  riesgo: z.string(),
  entidad: z.string(),
  duplicado: z.boolean(),
});

const judgeFlagsSchema = z.object({
  evaluateSummary: z.boolean().default(true),
  evaluateEthics: z.boolean().default(false),
  evaluatePrivacy: z.boolean().default(false),
});

export const evaluationCaseSchema = z.object({
  id: z.string().min(1),
  input: evaluationInputSchema,
  expected: expectedSchema,
  tags: z.array(z.string()).default([]),
  judge: judgeFlagsSchema.default({
    evaluateSummary: true,
    evaluateEthics: false,
    evaluatePrivacy: false,
  }),
});

export const evalConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  defaultDataset: z.string().min(1),
  judgeProvider: z.string().default('openai'),
  judgeModel: z.string().default('gpt-4o-mini'),
  entityJudgeModel: z.string().default('gpt-4o-mini'),
  targetModelName: z.string().default('system-under-test'),
  thresholds: z.record(z.number()),
});

export const judgeResultSchema = z.object({
  classification_score: z.number().min(1).max(5),
  routing_score: z.number().min(1).max(5),
  urgency_risk_score: z.number().min(1).max(5),
  summary_score: z.number().min(1).max(5),
  privacy_score: z.number().min(1).max(5),
  ethics_score: z.number().min(1).max(5),
  traceability_score: z.number().min(1).max(5),
  overall_score: z.number().min(1).max(5),
  pass: z.boolean(),
  main_error: z.string(),
  recommendation: z.string(),
});

export const entityJudgeResultSchema = z.object({
  equivalent: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});

export type EvaluationCase = z.infer<typeof evaluationCaseSchema>;
export type EvalConfig = z.infer<typeof evalConfigSchema>;
export type JudgeResult = z.infer<typeof judgeResultSchema>;
export type EntityJudgeResult = z.infer<typeof entityJudgeResultSchema>;

export interface ActualTriageOutput {
  tipo?: string;
  tema?: string;
  subtema?: string;
  urgencia?: string;
  riesgo?: string;
  entidad?: string;
  resumen?: string;
  confianza?: number;
  pipelineTrace?: unknown;
  duplicado?: boolean;
}

export interface DeterministicScores {
  tipoCorrect: boolean;
  temaCorrect: boolean;
  subtemaCorrect: boolean;
  urgenciaCorrect: boolean;
  riesgoCorrect: boolean;
  entidadCorrect: boolean;
  duplicadoCorrect: boolean;
}

export interface CostEstimate {
  targetInputTokens: number;
  targetOutputTokens: number;
  judgeInputTokens: number;
  judgeOutputTokens: number;
  estimatedTargetCostUsd: number;
  estimatedJudgeCostUsd: number;
  estimatedTotalCostUsd: number;
}

export interface EvaluationResult {
  caseId: string;
  passed: boolean;
  latencyMs: number;
  expected: EvaluationCase['expected'];
  actual: ActualTriageOutput;
  deterministicScores: DeterministicScores;
  judgeResult: JudgeResult | { judge_error: true; pass: false; main_error: string } | null;
  entityJudgeResult?: EntityJudgeResult | { judge_error: true; equivalent: false; reason: string } | null;
  cost: CostEstimate;
  errors: string[];
  tags: string[];
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
  results: EvaluationResult[];
  judgeEnabled?: boolean;
  thresholdFailures?: string[];
}

const emptySummary: EvaluationSummary = {
  accuracy_tipo: 0,
  accuracy_tema: 0,
  accuracy_subtema: 0,
  accuracy_urgencia: 0,
  accuracy_riesgo: 0,
  accuracy_entidad: 0,
  accuracy_duplicado: 0,
  judge_overall_score: null,
  summary_score: null,
  privacy_score: null,
  ethics_score: null,
  traceability_score: null,
  judge_error_count: 0,
  entity_judge_error_count: 0,
  avg_latency_ms: 0,
  p50_latency_ms: 0,
  p95_latency_ms: 0,
  max_latency_ms: 0,
  avg_confidence: 0,
  estimated_total_cost_usd: 0,
  estimated_cost_per_case_usd: 0,
};

export async function loadEvalConfig(path = 'evals/eval.config.json'): Promise<EvalConfig> {
  const raw = await readFile(path, 'utf8');
  return evalConfigSchema.parse(JSON.parse(raw));
}

export async function loadJsonlDataset(path: string, limit?: number): Promise<EvaluationCase[]> {
  const raw = await readFile(path, 'utf8');
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const selected = typeof limit === 'number' ? lines.slice(0, limit) : lines;
  return selected.map((line, index) => {
    try {
      return evaluationCaseSchema.parse(JSON.parse(line));
    } catch (error) {
      throw new Error(`Invalid JSONL case at ${path}:${index + 1}: ${String(error)}`);
    }
  });
}

export function normalizeComparable(value: string | undefined): string {
  const stopwords = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e']);
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .split('_')
    .filter((token) => token.length > 0 && !stopwords.has(token))
    .join('_');
}

export function labelsMatch(actual: string | undefined, expected: string | undefined): boolean {
  const normalizedActual = normalizeComparable(actual);
  const normalizedExpected = normalizeComparable(expected);
  if (normalizedActual === normalizedExpected) return true;
  if (!normalizedActual || !normalizedExpected) return false;

  const actualTokens = new Set(normalizedActual.split('_'));
  const expectedTokens = new Set(normalizedExpected.split('_'));
  const intersection = [...expectedTokens].filter((token) => actualTokens.has(token)).length;
  const coverage = intersection / Math.max(expectedTokens.size, actualTokens.size);

  return coverage >= 0.8;
}

export function compareActualToExpected(
  actual: ActualTriageOutput,
  expected: EvaluationCase['expected'],
): { deterministicScores: DeterministicScores; errors: string[] } {
  const deterministicScores: DeterministicScores = {
    tipoCorrect: labelsMatch(actual.tipo, expected.tipo),
    temaCorrect: labelsMatch(actual.tema, expected.tema),
    subtemaCorrect: labelsMatch(actual.subtema, expected.subtema),
    urgenciaCorrect: labelsMatch(actual.urgencia, expected.urgencia),
    riesgoCorrect: labelsMatch(actual.riesgo, expected.riesgo),
    entidadCorrect: labelsMatch(actual.entidad, expected.entidad),
    duplicadoCorrect: Boolean(actual.duplicado) === expected.duplicado,
  };

  const checks: Array<[keyof DeterministicScores, string, string | boolean | undefined, string | boolean | undefined]> = [
    ['tipoCorrect', 'Tipo', expected.tipo, actual.tipo],
    ['temaCorrect', 'Tema', expected.tema, actual.tema],
    ['subtemaCorrect', 'Subtema', expected.subtema, actual.subtema],
    ['urgenciaCorrect', 'Urgencia', expected.urgencia, actual.urgencia],
    ['riesgoCorrect', 'Riesgo', expected.riesgo, actual.riesgo],
    ['entidadCorrect', 'Entidad', expected.entidad, actual.entidad],
    ['duplicadoCorrect', 'Duplicado', expected.duplicado, actual.duplicado],
  ];

  const errors = checks
    .filter(([key]) => !deterministicScores[key])
    .map(([, label, expectedValue, actualValue]) => `${label} esperado: ${String(expectedValue)}; ${label.toLowerCase()} predicho: ${String(actualValue ?? '-')}`);

  return { deterministicScores, errors };
}

export function extractActualTriageOutput(response: unknown): ActualTriageOutput {
  const root = asRecord(response);
  const data = asRecord(root.data) ?? root;
  const trace = data.trace ?? data.pipelineTrace;
  const duplicateValue = data.duplicado ?? data.duplicados ?? data.isDuplicate ?? data.duplicate;

  return {
    tipo: stringField(data.tipo),
    tema: stringField(data.tema),
    subtema: stringField(data.subtema),
    urgencia: stringField(data.urgencia),
    riesgo: stringField(data.riesgo),
    entidad: stringField(data.entidad),
    resumen: stringField(data.resumen),
    confianza: numberField(data.confianza),
    pipelineTrace: trace,
    duplicado: booleanField(duplicateValue),
  };
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateCost(params: {
  targetInputText: string;
  targetOutputText: string;
  judgeInputText: string;
  judgeOutputText: string;
}): CostEstimate {
  const targetInputTokens = estimateTokens(params.targetInputText);
  const targetOutputTokens = estimateTokens(params.targetOutputText);
  const judgeInputTokens = estimateTokens(params.judgeInputText);
  const judgeOutputTokens = estimateTokens(params.judgeOutputText);
  const estimatedTargetCostUsd = (targetInputTokens * 0.00000015) + (targetOutputTokens * 0.0000006);
  const estimatedJudgeCostUsd = (judgeInputTokens * 0.00000015) + (judgeOutputTokens * 0.0000006);

  return {
    targetInputTokens,
    targetOutputTokens,
    judgeInputTokens,
    judgeOutputTokens,
    estimatedTargetCostUsd: roundMoney(estimatedTargetCostUsd),
    estimatedJudgeCostUsd: roundMoney(estimatedJudgeCostUsd),
    estimatedTotalCostUsd: roundMoney(estimatedTargetCostUsd + estimatedJudgeCostUsd),
  };
}

export function buildSummary(results: EvaluationResult[]): EvaluationSummary {
  if (results.length === 0) return { ...emptySummary };

  const total = results.length;
  const latencies = results.map((result) => result.latencyMs).sort((a, b) => a - b);
  const judgeResults = results
    .map((result) => result.judgeResult)
    .filter((result): result is JudgeResult => Boolean(result && !('judge_error' in result)));
  const confidences = results
    .map((result) => result.actual.confianza)
    .filter((value): value is number => typeof value === 'number');
  const totalCost = results.reduce((sum, result) => sum + result.cost.estimatedTotalCostUsd, 0);

  return {
    accuracy_tipo: ratio(results.filter((result) => result.deterministicScores.tipoCorrect).length, total),
    accuracy_tema: ratio(results.filter((result) => result.deterministicScores.temaCorrect).length, total),
    accuracy_subtema: ratio(results.filter((result) => result.deterministicScores.subtemaCorrect).length, total),
    accuracy_urgencia: ratio(results.filter((result) => result.deterministicScores.urgenciaCorrect).length, total),
    accuracy_riesgo: ratio(results.filter((result) => result.deterministicScores.riesgoCorrect).length, total),
    accuracy_entidad: ratio(results.filter((result) => result.deterministicScores.entidadCorrect).length, total),
    accuracy_duplicado: ratio(results.filter((result) => result.deterministicScores.duplicadoCorrect).length, total),
    judge_overall_score: nullableAvg(judgeResults.map((result) => result.overall_score)),
    summary_score: nullableAvg(judgeResults.map((result) => result.summary_score)),
    privacy_score: nullableAvg(judgeResults.map((result) => result.privacy_score)),
    ethics_score: nullableAvg(judgeResults.map((result) => result.ethics_score)),
    traceability_score: nullableAvg(judgeResults.map((result) => result.traceability_score)),
    judge_error_count: results.filter((result) => Boolean(result.judgeResult && 'judge_error' in result.judgeResult)).length,
    entity_judge_error_count: results.filter((result) => Boolean(result.entityJudgeResult && 'judge_error' in result.entityJudgeResult)).length,
    avg_latency_ms: Math.round(avg(latencies)),
    p50_latency_ms: percentile(latencies, 0.5),
    p95_latency_ms: percentile(latencies, 0.95),
    max_latency_ms: Math.max(...latencies),
    avg_confidence: avg(confidences),
    estimated_total_cost_usd: roundMoney(totalCost),
    estimated_cost_per_case_usd: roundMoney(totalCost / total),
  };
}

export function evaluateThresholds(
  summary: EvaluationSummary,
  thresholds: Record<string, number>,
  includeJudge: boolean,
): string[] {
  const failures: string[] = [];
  const summaryRecord = summary as unknown as Record<string, number>;

  for (const [key, threshold] of Object.entries(thresholds)) {
    if (!includeJudge && isJudgeThreshold(key)) continue;

    if (key === 'latency_p95_ms') {
      if (summary.p95_latency_ms > threshold) failures.push('p95_latency_ms above threshold');
      continue;
    }

    if (key === 'max_cost_per_case_usd') {
      if (summary.estimated_cost_per_case_usd > threshold) failures.push('estimated_cost_per_case_usd above threshold');
      continue;
    }

    const value = summaryRecord[key];
    if (typeof value === 'number' && value < threshold) {
      failures.push(`${key} below threshold`);
    }
  }

  return failures;
}

export function toCsv(report: EvaluationReport): string {
  const headers = [
    'run_id',
    'case_id',
    'passed',
    'tipo_expected',
    'tipo_actual',
    'tipo_correct',
    'tema_expected',
    'tema_actual',
    'tema_correct',
    'urgencia_expected',
    'urgencia_actual',
    'urgencia_correct',
    'riesgo_expected',
    'riesgo_actual',
    'riesgo_correct',
    'entidad_expected',
    'entidad_actual',
    'entidad_correct',
    'judge_overall_score',
    'summary_score',
    'privacy_score',
    'ethics_score',
    'traceability_score',
    'latency_ms',
    'estimated_cost_usd',
    'main_error',
    'recommendation',
  ];

  const rows = report.results.map((result) => {
    const judge = result.judgeResult && !('judge_error' in result.judgeResult) ? result.judgeResult : null;
    const mainError = judge?.main_error ?? result.errors[0] ?? '';
    return [
      report.runId,
      result.caseId,
      result.passed,
      result.expected.tipo,
      result.actual.tipo ?? '',
      result.deterministicScores.tipoCorrect,
      result.expected.tema,
      result.actual.tema ?? '',
      result.deterministicScores.temaCorrect,
      result.expected.urgencia,
      result.actual.urgencia ?? '',
      result.deterministicScores.urgenciaCorrect,
      result.expected.riesgo,
      result.actual.riesgo ?? '',
      result.deterministicScores.riesgoCorrect,
      result.expected.entidad,
      result.actual.entidad ?? '',
      result.deterministicScores.entidadCorrect,
      judge?.overall_score ?? '',
      judge?.summary_score ?? '',
      judge?.privacy_score ?? '',
      judge?.ethics_score ?? '',
      judge?.traceability_score ?? '',
      result.latencyMs,
      result.cost.estimatedTotalCostUsd,
      mainError,
      judge?.recommendation ?? '',
    ];
  });

  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n') + '\n';
}

export async function writeEvaluationReport(report: EvaluationReport, outputBase = 'evals/reports'): Promise<void> {
  await mkdir(join(outputBase, 'runs'), { recursive: true });
  const json = JSON.stringify(report, null, 2);
  await writeFile(join(outputBase, 'latest.json'), json, 'utf8');
  await writeFile(join(outputBase, 'latest.csv'), toCsv(report), 'utf8');
  await writeFile(join(outputBase, 'runs', `${report.runId}.json`), json, 'utf8');
}

export function datasetLabel(path: string): string {
  return basename(path);
}

export async function ensureParentDir(path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringField(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function numberField(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function booleanField(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

function ratio(count: number, total: number): number {
  return total === 0 ? 0 : Number((count / total).toFixed(4));
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(4));
}

function nullableAvg(values: number[]): number | null {
  if (values.length === 0) return null;
  return avg(values);
}

function percentile(sortedValues: number[], percentileValue: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil(percentileValue * sortedValues.length) - 1;
  return sortedValues[Math.min(Math.max(index, 0), sortedValues.length - 1)];
}

function roundMoney(value: number): number {
  return Number(value.toFixed(6));
}

function csvEscape(value: string | number | boolean): string {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function isJudgeThreshold(key: string): boolean {
  return [
    'judge_overall_score',
    'summary_score',
    'privacy_score',
    'ethics_score',
    'traceability_score',
  ].includes(key);
}
