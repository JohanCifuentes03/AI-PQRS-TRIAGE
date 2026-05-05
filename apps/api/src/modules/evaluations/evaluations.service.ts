import { Injectable, NotFoundException } from '@nestjs/common';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

export interface EvaluationRunListItem {
  runId: string;
  createdAt?: string;
  dataset?: string;
  status?: string;
  totalCases?: number;
  passedCases?: number;
  failedCases?: number;
}

@Injectable()
export class EvaluationsService {
  async getLatest(): Promise<unknown> {
    return redactReport(await this.readJson('latest.json'));
  }

  async listRuns(): Promise<EvaluationRunListItem[]> {
    const runsDir = this.reportPath('runs');
    let entries: string[];
    try {
      entries = await readdir(runsDir);
    } catch {
      return [];
    }

    const jsonFiles = entries.filter((entry) => entry.endsWith('.json')).sort().reverse();
    const runs = await Promise.all(
      jsonFiles.map(async (entry) => {
        const raw = await readFile(join(runsDir, entry), 'utf8');
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        return {
          runId: stringValue(parsed.runId) ?? entry.replace(/\.json$/, ''),
          createdAt: stringValue(parsed.createdAt),
          dataset: stringValue(parsed.dataset),
          status: stringValue(parsed.status),
          totalCases: numberValue(parsed.totalCases),
          passedCases: numberValue(parsed.passedCases),
          failedCases: numberValue(parsed.failedCases),
        };
      }),
    );

    return runs;
  }

  async getRun(runId: string): Promise<unknown> {
    const safeRunId = basename(runId).replace(/\.json$/, '');
    return redactReport(await this.readJson(join('runs', `${safeRunId}.json`)));
  }

  async exportLatestCsv(): Promise<string> {
    return this.readText('latest.csv');
  }

  private async readJson(relativePath: string): Promise<unknown> {
    const raw = await this.readText(relativePath);
    return JSON.parse(raw);
  }

  private async readText(relativePath: string): Promise<string> {
    try {
      return await readFile(this.reportPath(relativePath), 'utf8');
    } catch {
      throw new NotFoundException(`Evaluation report not found: ${relativePath}`);
    }
  }

  private reportPath(relativePath: string): string {
    return join(this.resolveRepoRoot(), 'evals', 'reports', relativePath);
  }

  private resolveRepoRoot(): string {
    const cwd = resolve(process.cwd());
    if (cwd.endsWith('apps/api')) return resolve(cwd, '../..');
    return cwd;
  }
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function redactReport(report: unknown): unknown {
  if (report === null || typeof report !== 'object' || Array.isArray(report)) return report;
  const reportRecord = { ...(report as Record<string, unknown>) };
  const results = reportRecord.results;
  if (!Array.isArray(results)) return reportRecord;

  reportRecord.results = results.map((result) => {
    if (result === null || typeof result !== 'object' || Array.isArray(result)) return result;
    const resultRecord = { ...(result as Record<string, unknown>) };
    const actual = resultRecord.actual;
    if (actual !== null && typeof actual === 'object' && !Array.isArray(actual)) {
      const actualRecord = { ...(actual as Record<string, unknown>) };
      delete actualRecord.resumen;
      delete actualRecord.pipelineTrace;
      resultRecord.actual = actualRecord;
    }
    return resultRecord;
  });

  return reportRecord;
}
