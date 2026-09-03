import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('admin foundation uses a scoped minimal design system instead of retro primitives', async () => {
  const [styles, app, navbar, shell, ui] = await Promise.all([
    read('../src/styles.css'),
    read('../src/App.jsx'),
    read('../src/components/Navbar.jsx'),
    read('../src/pages/admin/AdminPage.jsx'),
    read('../src/pages/admin/ui.jsx'),
  ]);
  const foundation = `${shell}\n${ui}`;

  assert.match(styles, /\.admin-console\s*\{/);
  assert.match(styles, /--admin-canvas:/);
  assert.match(shell, /className="admin-console/);
  assert.match(app, /const isAdminPage = page === 'Admin'/);
  assert.match(navbar, /className="admin-topbar/);
  assert.doesNotMatch(
    foundation,
    /font-pop-display|border-\[(?:3|4)px\]|shadow-\[[^\]]*var\(--pop-black\)|bg-\[linear-gradient/,
  );
});

test('every admin panel stays inside the minimal visual language', async () => {
  const directory = new URL('../src/pages/admin/', import.meta.url);
  const files = (await readdir(directory)).filter((file) => file.endsWith('.jsx'));
  const sources = await Promise.all(files.map(async (file) => `${file}\n${await readFile(new URL(file, directory), 'utf8')}`));

  assert.doesNotMatch(
    sources.join('\n'),
    /font-pop-display|font-black|border-(?:[2-4]|black)|border-[btlr]-(?:[2-4]|black)|border-\[(?:3|4)px\]|shadow-\[[^\]]*(?:var\(--pop-black\)|_0_#111)|var\(--pop-(?:black|cream|amber|red|green|orange)\)|z-\[9999\]/,
  );
});

test('shared admin confirmation dialog traps and restores keyboard focus', async () => {
  const ui = await read('../src/pages/admin/ui.jsx');

  assert.match(ui, /const previousFocus = document\.activeElement/);
  assert.match(ui, /event\.key !== 'Tab'/);
  assert.match(ui, /previousFocus\?\.focus\?\.\(\)/);
  assert.match(ui, /aria-describedby="admin-confirm-description"/);
});

test('overview pilot avoids saturated cards and heavy retro typography', async () => {
  const overview = await read('../src/pages/admin/OverviewPanel.jsx');

  assert.doesNotMatch(overview, /font-black|border-2|bg-\[#/);
  assert.match(overview, /var\(--admin-accent\)/);
});

test('players pilot uses the shared admin visual language at every breakpoint', async () => {
  const players = await read('../src/pages/admin/PlayersPanel.jsx');

  assert.doesNotMatch(players, /font-black|border-2|bg-\[#|text-\[#|z-\[9999\]/);
  assert.match(players, /rounded-xl/);
});

test('admin overlays expose accessible names, descriptions, and a consistent layer', async () => {
  const [players, userCrud, drawer, ui] = await Promise.all([
    read('../src/pages/admin/PlayersPanel.jsx'),
    read('../src/pages/admin/UserCrudDialog.jsx'),
    read('../src/pages/admin/PlayerDetailDrawer.jsx'),
    read('../src/pages/admin/ui.jsx'),
  ]);
  const overlays = `${players}\n${userCrud}\n${drawer}\n${ui}`;

  assert.doesNotMatch(overlays, /z-\[999\d\]/);
  assert.equal((overlays.match(/aria-describedby=/g) || []).length, 3);
  assert.match(userCrud, /confirmDisabled=/);
});
