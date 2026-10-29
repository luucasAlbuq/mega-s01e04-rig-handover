import { Hono } from 'hono';
import { loadConfig, type RigConfig } from './config.js';
import { countStatuses, isEmptyNight, nightExists, readNight } from './digest/index.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { DigestPage } from './views/digest.js';
import { Layout } from './views/layout.js';
import { StatusBoard } from './views/status.js';

function digestForConfig(config: RigConfig, night: string) {
  if (!nightExists(config.runsDir, night)) return { kind: 'missing' as const };
  if (isEmptyNight(config.runsDir, night)) return { kind: 'empty' as const, rows: [] as ReturnType<typeof readNight>['rows'] };
  const { rows } = readNight(config.runsDir, night);
  return { kind: 'ok' as const, rows };
}

export function createApp(config: RigConfig = loadConfig()) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/', (c) => {
    const status = readStatus(config);
    const nightStats = status.nights.map((night) => ({
      night,
      counts: countStatuses(config.runsDir, night),
    }));
    return c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={status} nightStats={nightStats} />
      </Layout>,
    );
  });

  app.get('/digest/:night', (c) => {
    const night = c.req.param('night');
    const result = digestForConfig(config, night);
    if (result.kind === 'missing') return c.notFound();
    const rows = result.kind === 'empty' ? [] : result.rows;
    const empty = result.kind === 'empty';
    return c.html(
      <Layout title={`digest · ${night}`} lane={lane()}>
        <DigestPage night={night} rows={rows} empty={empty} />
      </Layout>,
    );
  });

  app.get('/api/digest/:night', (c) => {
    const night = c.req.param('night');
    const result = digestForConfig(config, night);
    if (result.kind === 'missing') return c.notFound();
    if (result.kind === 'empty') return c.json({ night, rows: [] });
    return c.json({ night, rows: result.rows });
  });

  return app;
}
