export type RunStatus = 'ok' | 'retry' | 'fail';

export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: RunStatus;
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

export type NightRead = {
  rows: DigestRow[];
  badLines: number;
};

// readNight(runsDir: string, night: string): NightRead
