import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { EvaluationsService } from './evaluations.service';

describe('EvaluationsService', () => {
  const originalCwd = process.cwd();
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = join(tmpdir(), `eval-service-${Date.now()}`);
    await mkdir(join(tempRoot, 'evals', 'reports', 'runs'), { recursive: true });
    process.chdir(tempRoot);
  });

  afterEach(() => {
    process.chdir(originalCwd);
  });

  it('redacts summary and pipeline trace from latest JSON response', async () => {
    await writeFile(
      join(tempRoot, 'evals', 'reports', 'latest.json'),
      JSON.stringify({
        runId: 'eval-test',
        results: [
          {
            actual: {
              tipo: 'Queja',
              resumen: 'Contiene datos sensibles',
              pipelineTrace: { internal: true },
            },
          },
        ],
      }),
      'utf8',
    );

    const service = new EvaluationsService();
    const result = await service.getLatest();

    expect(result).toEqual({
      runId: 'eval-test',
      results: [{ actual: { tipo: 'Queja' } }],
    });
  });
});
