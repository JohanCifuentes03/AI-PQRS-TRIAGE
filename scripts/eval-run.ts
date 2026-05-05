import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ActualTriageOutput,
  EvalConfig,
  EntityJudgeResult,
  EvaluationCase,
  EvaluationReport,
  EvaluationResult,
  JudgeResult,
  buildSummary,
  compareActualToExpected,
  datasetLabel,
  ensureParentDir,
  estimateCost,
  evaluateThresholds,
  extractActualTriageOutput,
  entityJudgeResultSchema,
  judgeResultSchema,
  loadEvalConfig,
  loadJsonlDataset,
  writeEvaluationReport,
} from './eval-utils';

interface CliArgs {
  dataset?: string;
  output?: string;
  judgeModel?: string;
  noJudge: boolean;
  limit?: number;
}

interface JudgeExecutionResult {
  result: JudgeResult | { judge_error: true; pass: false; main_error: string } | null;
  prompt: string;
  rawOutput: string;
}

interface EntityJudgeExecutionResult {
  result: EntityJudgeResult | { judge_error: true; equivalent: false; reason: string } | null;
  prompt: string;
  rawOutput: string;
}

async function main(): Promise<void> {
  await loadDotEnv();
  const args = parseArgs(process.argv.slice(2));
  const config = await loadEvalConfig();
  const datasetPath = args.dataset ?? config.defaultDataset;
  const cases = await loadJsonlDataset(datasetPath, args.limit);
  const runId = `eval-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const outputBase = args.output ?? 'evals/reports';

  console.log('AI-PQRS Evaluation Run');
  console.log(`Dataset: ${datasetPath}`);
  console.log(`Cases: ${cases.length}`);
  console.log('');

  const rubric = await readRubric('evals/rubrics/pqrs-judge.md');
  const ethicsRubric = await readRubric('evals/rubrics/ethics-judge.md');
  const results: EvaluationResult[] = [];

  for (const evaluationCase of cases) {
    results.push(
      await evaluateCase({
        evaluationCase,
        config,
        judgeModel: args.judgeModel ?? config.judgeModel,
        noJudge: args.noJudge,
        rubric: evaluationCase.judge.evaluateEthics || evaluationCase.judge.evaluatePrivacy ? ethicsRubric : rubric,
      }),
    );
  }

  const summary = buildSummary(results);
  const thresholdFailures = evaluateThresholds(summary, config.thresholds, !args.noJudge);
  const status = thresholdFailures.length === 0 ? 'PASS' : 'FAIL';
  const report: EvaluationReport = {
    runId,
    createdAt: new Date().toISOString(),
    dataset: datasetLabel(datasetPath),
    totalCases: results.length,
    passedCases: results.filter((result) => result.passed).length,
    failedCases: results.filter((result) => !result.passed).length,
    status,
    summary,
    thresholds: config.thresholds,
    results,
    judgeEnabled: !args.noJudge,
    thresholdFailures,
  };

  await ensureParentDir(join(outputBase, 'latest.json'));
  await writeEvaluationReport(report, outputBase);
  printSummary(report);

  if (status === 'FAIL') process.exit(1);
}

async function loadDotEnv(path = '.env'): Promise<void> {
  try {
    const raw = await readFile(path, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      if (!key || process.env[key] !== undefined) continue;
      process.env[key] = unquoteEnvValue(rawValue);
    }
  } catch {
    // .env is optional for deterministic runs and CI.
  }
}

function unquoteEnvValue(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

async function evaluateCase(params: {
  evaluationCase: EvaluationCase;
  config: EvalConfig;
  judgeModel: string;
  noJudge: boolean;
  rubric: string;
}): Promise<EvaluationResult> {
  const startedAt = Date.now();
  let actual: ActualTriageOutput = {};
  let requestError: string | null = null;

  try {
    const response = await fetch(`${params.config.apiBaseUrl}/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-evaluation-mode': 'true' },
      body: JSON.stringify(params.evaluationCase.input),
    });
    const body: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`POST /triage failed with ${response.status}`);
    }
    actual = extractActualTriageOutput(body);
  } catch (error) {
    requestError = error instanceof Error ? error.message : String(error);
  }

  const latencyMs = Date.now() - startedAt;
  const { deterministicScores, errors } = compareActualToExpected(actual, params.evaluationCase.expected);
  if (requestError) errors.unshift(requestError);

  const entityJudgeExecution = params.noJudge || deterministicScores.entidadCorrect || requestError
    ? { result: null, prompt: '', rawOutput: '' }
    : await runEntityJudge({
        inputText: params.evaluationCase.input.texto,
        expectedEntity: params.evaluationCase.expected.entidad,
        actualEntity: actual.entidad ?? '',
        model: params.config.entityJudgeModel,
      });

  if (entityJudgeExecution.result) {
    deterministicScores.entidadCorrect = entityJudgeExecution.result.equivalent;
    const entityErrorIndex = errors.findIndex((error) => error.startsWith('Entidad esperado:'));
    if (entityJudgeExecution.result.equivalent && entityErrorIndex >= 0) {
      errors.splice(entityErrorIndex, 1);
    }
    if ('judge_error' in entityJudgeExecution.result) {
      errors.push(`Entity judge error: ${entityJudgeExecution.result.reason}`);
    }
  }

  const judgeExecution = params.noJudge
    ? { result: null, prompt: '', rawOutput: '' }
    : await runJudge({
        evaluationCase: params.evaluationCase,
        actual,
        model: params.judgeModel,
        rubric: params.rubric,
      });

  if (judgeExecution.result && 'judge_error' in judgeExecution.result) {
    errors.push(judgeExecution.result.main_error);
  }

  const allDeterministicPassed = Object.values(deterministicScores).every(Boolean);
  const judgePassed = !judgeExecution.result || judgeExecution.result.pass;
  const cost = estimateCost({
    targetInputText: JSON.stringify(params.evaluationCase.input),
    targetOutputText: JSON.stringify(actual),
    judgeInputText: `${judgeExecution.prompt}\n${entityJudgeExecution.prompt}`,
    judgeOutputText: `${judgeExecution.rawOutput}\n${entityJudgeExecution.rawOutput}`,
  });

  return {
    caseId: params.evaluationCase.id,
    passed: !requestError && allDeterministicPassed && judgePassed,
    latencyMs,
    expected: params.evaluationCase.expected,
    actual,
    deterministicScores,
    judgeResult: judgeExecution.result,
    entityJudgeResult: entityJudgeExecution.result,
    cost,
    errors,
    tags: params.evaluationCase.tags,
  };
}

async function runEntityJudge(params: {
  inputText: string;
  expectedEntity: string;
  actualEntity: string;
  model: string;
}): Promise<EntityJudgeExecutionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const prompt = [
    'Eres un evaluador de enrutamiento PQRS para Bogotá.',
    'Decide si la entidad esperada y la entidad predicha son administrativamente equivalentes o aceptablemente intercambiables para atender la misma PQRS.',
    'No apruebes si son entidades distintas con competencias diferentes, aunque ambas sean públicas.',
    'Usa el texto de la PQRS solo como contexto de competencia.',
    '',
    `Texto PQRS: ${params.inputText}`,
    `Entidad esperada: ${params.expectedEntity}`,
    `Entidad predicha: ${params.actualEntity}`,
    '',
    'Devuelve exclusivamente JSON válido con esta estructura:',
    '{"equivalent": boolean, "confidence": number, "reason": string}',
  ].join('\n');

  if (!apiKey) {
    return {
      result: {
        judge_error: true,
        equivalent: false,
        reason: 'OPENAI_API_KEY is not configured; entity equivalence requires the small LLM judge',
      },
      prompt,
      rawOutput: '',
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model,
        temperature: 0,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'entity_equivalence_result',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                equivalent: { type: 'boolean' },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                reason: { type: 'string' },
              },
              required: ['equivalent', 'confidence', 'reason'],
              additionalProperties: false,
            },
          },
        },
        messages: [
          { role: 'system', content: 'Devuelve únicamente JSON válido.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    const responseBody: unknown = await response.json();
    if (!response.ok) {
      return invalidEntityJudge(prompt, JSON.stringify(responseBody), `OpenAI entity judge failed with ${response.status}`);
    }
    const content = extractOpenAiContent(responseBody);
    return { result: entityJudgeResultSchema.parse(JSON.parse(content)), prompt, rawOutput: content };
  } catch {
    return invalidEntityJudge(prompt, '', 'Entity judge did not return valid JSON');
  }
}

async function runJudge(params: {
  evaluationCase: EvaluationCase;
  actual: ActualTriageOutput;
  model: string;
  rubric: string;
}): Promise<JudgeExecutionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const prompt = renderRubric(params.rubric, params.evaluationCase, params.actual);
  if (!apiKey) {
    return {
      result: {
        judge_error: true,
        pass: false,
        main_error: 'OPENAI_API_KEY is not configured; rerun with --no-judge or set the key',
      },
      prompt,
      rawOutput: '',
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Devuelve únicamente JSON válido.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    const responseBody: unknown = await response.json();
    if (!response.ok) {
      return invalidJudge(prompt, JSON.stringify(responseBody), `OpenAI judge failed with ${response.status}`);
    }
    const content = extractOpenAiContent(responseBody);
    return { result: judgeResultSchema.parse(JSON.parse(content)), prompt, rawOutput: content };
  } catch {
    return invalidJudge(prompt, '', 'LLM judge did not return valid JSON');
  }
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { noJudge: false };
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];
    if (current === '--dataset' && next) {
      args.dataset = next;
      index += 1;
    } else if (current === '--output' && next) {
      args.output = next;
      index += 1;
    } else if (current === '--judge-model' && next) {
      args.judgeModel = next;
      index += 1;
    } else if (current === '--limit' && next) {
      args.limit = Number.parseInt(next, 10);
      index += 1;
    } else if (current === '--no-judge') {
      args.noJudge = true;
    }
  }
  return args;
}

function renderRubric(rubric: string, evaluationCase: EvaluationCase, actual: ActualTriageOutput): string {
  return rubric
    .replace('{{input_text}}', evaluationCase.input.texto)
    .replace('{{expected_json}}', JSON.stringify(evaluationCase.expected, null, 2))
    .replace('{{actual_json}}', JSON.stringify(actual, null, 2))
    .replace('{{pipeline_trace}}', JSON.stringify(actual.pipelineTrace ?? {}, null, 2));
}

async function readRubric(path: string): Promise<string> {
  return readFile(path, 'utf8');
}

function invalidJudge(prompt: string, rawOutput: string, mainError: string): JudgeExecutionResult {
  return {
    result: { judge_error: true, pass: false, main_error: mainError },
    prompt,
    rawOutput,
  };
}

function invalidEntityJudge(prompt: string, rawOutput: string, reason: string): EntityJudgeExecutionResult {
  return {
    result: { judge_error: true, equivalent: false, reason },
    prompt,
    rawOutput,
  };
}

function extractOpenAiContent(responseBody: unknown): string {
  if (responseBody === null || typeof responseBody !== 'object') return '';
  const body = responseBody as Record<string, unknown>;
  const choices = Array.isArray(body.choices) ? body.choices : [];
  const first = choices[0];
  if (first === null || typeof first !== 'object') return '';
  const message = (first as Record<string, unknown>).message;
  if (message === null || typeof message !== 'object') return '';
  const content = (message as Record<string, unknown>).content;
  return typeof content === 'string' ? content : '';
}

function printSummary(report: EvaluationReport): void {
  const mark = (passed: boolean) => (passed ? '✅' : '❌');
  const pct = (value: number) => `${Math.round(value * 100)}%`;
  const threshold = report.thresholds;

  console.log('Quality:');
  console.log(`- Tipo accuracy: ${pct(report.summary.accuracy_tipo)} ${mark(report.summary.accuracy_tipo >= (threshold.accuracy_tipo ?? 0))}`);
  console.log(`- Tema accuracy: ${pct(report.summary.accuracy_tema)} ${mark(report.summary.accuracy_tema >= (threshold.accuracy_tema ?? 0))}`);
  console.log(`- Urgencia accuracy: ${pct(report.summary.accuracy_urgencia)} ${mark(report.summary.accuracy_urgencia >= (threshold.accuracy_urgencia ?? 0))}`);
  console.log(`- Riesgo accuracy: ${pct(report.summary.accuracy_riesgo)} ${mark(report.summary.accuracy_riesgo >= (threshold.accuracy_riesgo ?? 0))}`);
  console.log(`- Entidad accuracy: ${pct(report.summary.accuracy_entidad)} ${mark(report.summary.accuracy_entidad >= (threshold.accuracy_entidad ?? 0))}`);
  console.log(`- Duplicados accuracy: ${pct(report.summary.accuracy_duplicado)} ${mark(report.summary.accuracy_duplicado >= (threshold.accuracy_duplicado ?? 0))}`);
  console.log('');
  console.log('LLM Judge:');
  if (report.judgeEnabled === false) {
    console.log('- Judge skipped (--no-judge): N/A');
  } else {
    if (report.summary.judge_error_count > 0 || report.summary.entity_judge_error_count > 0) {
      console.log(`- Judge errors: ${report.summary.judge_error_count}`);
      console.log(`- Entity judge errors: ${report.summary.entity_judge_error_count}`);
    }
    console.log(`- Overall score: ${formatScore(report.summary.judge_overall_score)} / 5 ${scoreMark(report.summary.judge_overall_score, threshold.judge_overall_score)}`);
    console.log(`- Summary score: ${formatScore(report.summary.summary_score)} / 5 ${scoreMark(report.summary.summary_score, threshold.summary_score)}`);
    console.log(`- Privacy score: ${formatScore(report.summary.privacy_score)} / 5 ${scoreMark(report.summary.privacy_score, threshold.privacy_score)}`);
    console.log(`- Ethics score: ${formatScore(report.summary.ethics_score)} / 5 ${scoreMark(report.summary.ethics_score, threshold.ethics_score)}`);
    console.log(`- Traceability score: ${formatScore(report.summary.traceability_score)} / 5 ${scoreMark(report.summary.traceability_score, threshold.traceability_score)}`);
  }
  console.log('');
  console.log('Performance:');
  console.log(`- Avg latency: ${report.summary.avg_latency_ms} ms`);
  console.log(`- p95 latency: ${report.summary.p95_latency_ms} ms ${mark(report.summary.p95_latency_ms <= (threshold.latency_p95_ms ?? Number.POSITIVE_INFINITY))}`);
  console.log('');
  console.log('Cost:');
  console.log(`- Estimated total cost: ${report.summary.estimated_total_cost_usd} USD`);
  console.log(`- Estimated cost per case: ${report.summary.estimated_cost_per_case_usd} USD ${mark(report.summary.estimated_cost_per_case_usd <= (threshold.max_cost_per_case_usd ?? Number.POSITIVE_INFINITY))}`);
  console.log('');
  console.log(`Final status: ${report.status} ${mark(report.status === 'PASS')}`);
  if (report.thresholdFailures?.length) {
    console.log('Reason:');
    for (const failure of report.thresholdFailures) console.log(`- ${failure}`);
  }
  console.log('Report:');
  console.log('- evals/reports/latest.json');
  console.log('- evals/reports/latest.csv');
}

function formatScore(value: number | null): string {
  return value === null ? 'N/A' : String(value);
}

function scoreMark(value: number | null, threshold: number | undefined): string {
  if (value === null) return 'N/A';
  return value >= (threshold ?? 0) ? '✅' : '❌';
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
