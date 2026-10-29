import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/index.js';

describe('readNight', () => {
  it('reads 2026-10-28 with five jobs and one bad line', () => {
    const { rows, badLines } = readNight('runs', '2026-10-28');
    expect(badLines).toBe(1);
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    const digest = rows.find((r) => r.job === 'digest/render');
    expect(digest?.owner).toBeNull();
    expect(rows.find((r) => r.job === 'fixtures/refresh')?.retries).toBe(3);
    expect(rows.find((r) => r.job === 'notes/backup')?.lastStatus).toBe('fail');
  });
});
