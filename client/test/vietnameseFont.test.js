import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const styles = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

test('retro UI loads one Vietnamese-capable display font without Pixelify fallbacks', () => {
  assert.match(styles, /family=Chakra\+Petch:wght@500;600;700/);
  assert.doesNotMatch(styles, /Pixelify Sans/);
  assert.match(styles, /\.font-pixel\s*\{[^}]*font-family:\s*'Chakra Petch'/s);
  assert.match(styles, /body\.lang-vi \.font-pixel-title\s*\{[^}]*font-family:\s*'Chakra Petch'/s);
  assert.match(styles, /body\.lang-vi \.font-pixel-body\s*\{[^}]*font-family:\s*'Chakra Petch'/s);
});

test('in-match labels use the same Vietnamese-capable game font', () => {
  for (const selector of [
    '.game-loading-state__title',
    '.game-table-core__status p',
    '.game-pile__hint',
    '.game-hand__summary > span:first-child',
    '.game-activity-drawer__header h2',
  ]) {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rules = [...styles.matchAll(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, 'g'))];
    assert.ok(rules.length > 0, `missing ${selector}`);
    assert.ok(rules.some(([, body]) => /font-family:\s*'Chakra Petch'/.test(body)), selector);
  }
});
