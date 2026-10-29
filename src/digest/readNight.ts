import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, NightRead, RunStatus } from './types.js';

type ParsedLine = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

function parseLine(raw: string): ParsedLine | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (typeof o.at !== 'string' || typeof o.job !== 'string') return null;
    if (o.status !== 'ok' && o.status !== 'retry' && o.status !== 'fail') return null;
    const owner = o.owner === null ? null : typeof o.owner === 'string' ? o.owner : null;
    const error = typeof o.error === 'string' ? o.error : undefined;
    return { at: o.at, job: o.job, status: o.status, owner, error };
  } catch {
    return null;
  }
}

export function readNightImpl(runsDir: string, night: string): NightRead {
  const path = join(runsDir, `${night}.jsonl`);
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n').filter((l) => l.length > 0);

  const byJob = new Map<string, DigestRow>();
  let badLines = 0;

  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) {
      badLines++;
      continue;
    }
    const existing = byJob.get(parsed.job);
    if (!existing) {
      byJob.set(parsed.job, {
        job: parsed.job,
        owner: parsed.owner,
        runs: 1,
        retries: parsed.status === 'retry' ? 1 : 0,
        lastStatus: parsed.status,
        lastError: parsed.error ?? null,
        firstAt: parsed.at,
        lastAt: parsed.at,
      });
      continue;
    }
    existing.runs++;
    if (parsed.status === 'retry') existing.retries++;
    if (parsed.at < existing.firstAt) existing.firstAt = parsed.at;
    if (parsed.at > existing.lastAt) {
      existing.lastAt = parsed.at;
      existing.lastStatus = parsed.status;
      existing.lastError = parsed.error ?? null;
    }
    if (parsed.owner !== null) existing.owner = parsed.owner;
  }

  const rows = [...byJob.values()].sort((a, b) => a.job.localeCompare(b.job));
  return { rows, badLines };
}
