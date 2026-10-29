import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const baseConfig = {
  adapter: 'shim',
  installed: '2026-10-29T14:06:00+01:00',
  beatEverySeconds: 60,
  runsDir: 'runs',
};

describe('digest routes', () => {
  it('renders /digest/2026-10-28', async () => {
    process.env.LANE_MARKER = 'TEST-MARKER';
    const res = await createApp(baseConfig).request('/digest/2026-10-28');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('fixtures/refresh');
    expect(html).toContain('TEST-MARKER');
  });

  it('json matches page job order', async () => {
    const app = createApp(baseConfig);
    const page = await app.request('/digest/2026-10-28');
    const json = await (await app.request('/api/digest/2026-10-28')).json() as { rows: { job: string }[] };
    const html = await page.text();
    for (const row of json.rows) {
      expect(html).toContain(row.job);
    }
    expect(json.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
  });

  it('404 when night file missing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    const config = { ...baseConfig, runsDir: dir };
    const res = await createApp(config).request('/digest/2099-01-01');
    expect(res.status).toBe(404);
    expect((await createApp(config).request('/api/digest/2099-01-01')).status).toBe(404);
  });

  it('empty night renders nothing ran', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    writeFileSync(join(dir, '2099-06-01.jsonl'), '');
    const config = { ...baseConfig, runsDir: dir };
    const html = await (await createApp(config).request('/digest/2099-06-01')).text();
    expect(html).toContain('nothing ran');
    const json = await (await createApp(config).request('/api/digest/2099-06-01')).json() as { rows: unknown[] };
    expect(json.rows).toEqual([]);
  });

  it('bad line still returns 200', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, '2099-07-01.jsonl'),
      '{"at":"2026-10-28T23:00:02+01:00","job":"a/job","status":"ok","owner":"lane-07"}\n{broken\n',
    );
    const config = { ...baseConfig, runsDir: dir };
    expect((await createApp(config).request('/digest/2099-07-01')).status).toBe(200);
  });
});

describe('status board digest links', () => {
  it('links both nights with counts', async () => {
    const res = await createApp(baseConfig).request('/');
    const html = await res.text();
    expect(html).toContain('/digest/2026-10-28');
    expect(html).toContain('/digest/2026-10-27');
    expect(html).toMatch(/ok \d+ · retry \d+ · fail \d+/);
  });
});
