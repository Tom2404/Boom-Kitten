const test = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

test('server startup catches an occupied port instead of emitting an unhandled error', async () => {
  const source = await readFile(path.join(__dirname, '..', 'index.js'), 'utf8');

  assert.match(source, /await new Promise\(\(resolve, reject\) =>/);
  assert.match(source, /server\.once\('error', reject\)/);
  assert.match(source, /error\.code === 'EADDRINUSE'/);
});
