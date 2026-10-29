import type { DigestRow } from '../digest/types.js';

function displayOwner(owner: string | null): string {
  return owner ?? '—';
}

function rowClass(row: DigestRow): string | undefined {
  if (row.lastStatus === 'fail' || row.retries >= 3) return 'warn';
  return undefined;
}

export function DigestPage({ night, rows, empty }: { night: string; rows: DigestRow[]; empty: boolean }) {
  return (
    <>
      <h1>digest · {night}</h1>
      {empty ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last</th>
              <th>error</th>
              <th>first</th>
              <th>last at</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr class={rowClass(row)}>
                <td>{row.job}</td>
                <td>{displayOwner(row.owner)}</td>
                <td>{row.runs}</td>
                <td>{row.retries}</td>
                <td>{row.lastStatus}</td>
                <td>{row.lastError ?? '—'}</td>
                <td>{row.firstAt}</td>
                <td>{row.lastAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
