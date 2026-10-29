import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readNightImpl } from './readNight.js';
import type { NightRead } from './types.js';

export type { DigestRow, NightRead, RunStatus } from './types.js';
export { readNightImpl };

export function nightFilePath(runsDir: string, night: string): string {
  return join(runsDir, `${night}.jsonl`);
}

export function nightExists(runsDir: string, night: string): boolean {
  return existsSync(nightFilePath(runsDir, night));
}

export function readNight(runsDir: string, night: string): NightRead {
  return readNightImpl(runsDir, night);
}

export type StatusCounts = { ok: number; retry: number; fail: number };

export function countStatuses(runsDir: string, night: string): StatusCounts {
  const counts: StatusCounts = { ok: 0, retry: 0, fail: 0 };
  const text = readFileSync(nightFilePath(runsDir, night), 'utf8');
  for (const line of text.split('\n').filter((l) => l.length > 0)) {
    try {
      const o = JSON.parse(line) as { status?: string };
      if (o.status === 'ok') counts.ok++;
      else if (o.status === 'retry') counts.retry++;
      else if (o.status === 'fail') counts.fail++;
    } catch {
      /* bad line */
    }
  }
  return counts;
}

export function isEmptyNight(runsDir: string, night: string): boolean {
  const text = readFileSync(nightFilePath(runsDir, night), 'utf8');
  return text.trim().length === 0;
}
