import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('admin overview requests a supported range and renders decision context', async () => {
  const overview = await read('../src/pages/admin/OverviewPanel.jsx');

  assert.match(overview, /overview\?range=/);
  assert.match(overview, /generatedAt/);
  assert.match(overview, /gamesByDay/);
  assert.match(overview, /resources/);
  assert.match(overview, /attention/);
});

test('admin overview chart has an accessible table fallback without a chart dependency', async () => {
  const overview = await read('../src/pages/admin/OverviewPanel.jsx');

  assert.match(overview, /<svg/);
  assert.match(overview, /role="img"/);
  assert.match(overview, /<table/);
  assert.match(overview, /<details/);
  assert.match(overview, /const peak = Math\.max\(0/);
  assert.match(overview, /const scaleMax = Math\.max\(1, peak\)/);
});

test('overview quick navigation receives and checks current permissions', async () => {
  const [shell, overview] = await Promise.all([
    read('../src/pages/admin/AdminPage.jsx'),
    read('../src/pages/admin/OverviewPanel.jsx'),
  ]);

  assert.match(shell, /<OverviewPanel[^>]*permissions=\{permissions\}/);
  assert.match(overview, /permissions\.includes/);
});
