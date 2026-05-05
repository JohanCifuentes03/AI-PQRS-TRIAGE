import { readFile } from 'node:fs/promises';
import { EvaluationReport } from './eval-utils';

async function main(): Promise<void> {
  const raw = await readFile('evals/reports/latest.json', 'utf8');
  const report = JSON.parse(raw) as EvaluationReport;
  console.log(`Run: ${report.runId}`);
  console.log(`Status: ${report.status}`);
  console.log(`Cases: ${report.passedCases}/${report.totalCases} passed`);
  console.log(`Tipo accuracy: ${Math.round(report.summary.accuracy_tipo * 100)}%`);
  console.log(`Judge overall: ${report.summary.judge_overall_score ?? 'N/A'}/5`);
  console.log(`p95 latency: ${report.summary.p95_latency_ms} ms`);
  console.log(`Estimated total cost: ${report.summary.estimated_total_cost_usd} USD`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
