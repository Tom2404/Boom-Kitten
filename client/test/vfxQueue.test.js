import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { VFXQueue } from '../src/vfx/VFXQueue.js';
import { VFX_PRIORITY } from '../src/vfx/VFXEventAdapter.js';

const flush = () => new Promise((resolve) => setImmediate(resolve));

test('HIGH VFX run sequentially while LOW VFX may run in parallel', async () => {
  const started = [];
  const releases = new Map();
  const queue = new VFXQueue((task) => new Promise((resolve) => {
    started.push(task.animId);
    releases.set(task.animId, resolve);
  }));

  queue.enqueue({ animId: 'high-1', priority: VFX_PRIORITY.HIGH });
  queue.enqueue({ animId: 'high-2', priority: VFX_PRIORITY.HIGH });
  queue.enqueue({ animId: 'low-1', priority: VFX_PRIORITY.LOW });
  await flush();
  assert.deepEqual(started, ['high-1', 'low-1']);

  releases.get('high-1')();
  await flush();
  assert.deepEqual(started, ['high-1', 'low-1', 'high-2']);
  releases.get('high-2')();
  releases.get('low-1')();
});

test('INTERRUPT VFX jumps ahead of queued HIGH VFX', async () => {
  const started = [];
  let releaseFirst;
  const queue = new VFXQueue((task) => {
    started.push(task.animId);
    if (task.animId === 'high-1') return new Promise((resolve) => { releaseFirst = resolve; });
    return Promise.resolve();
  });

  queue.enqueue({ animId: 'high-1', priority: VFX_PRIORITY.HIGH });
  queue.enqueue({ animId: 'high-2', priority: VFX_PRIORITY.HIGH });
  queue.enqueue({ animId: 'terminal', priority: VFX_PRIORITY.INTERRUPT });
  releaseFirst();
  await flush();
  await flush();

  assert.deepEqual(started, ['high-1', 'terminal', 'high-2']);
});

test('a failed VFX releases the queue', async () => {
  const started = [];
  const queue = new VFXQueue(async (task) => {
    started.push(task.animId);
    if (task.animId === 'broken') throw new Error('broken');
  });

  queue.enqueue({ animId: 'broken', priority: VFX_PRIORITY.HIGH });
  queue.enqueue({ animId: 'next', priority: VFX_PRIORITY.HIGH });
  await flush();
  await flush();

  assert.deepEqual(started, ['broken', 'next']);
});

test('animation manager interrupts decorative VFX and has a four-second failsafe', () => {
  const source = fs.readFileSync(new URL('../src/vfx/AnimationManager.js', import.meta.url), 'utf8');

  assert.match(source, /priority === VFX_PRIORITY\.INTERRUPT[\s\S]*cancelDecorativeAnimations/);
  assert.match(source, /setTimeout\([\s\S]*cancel\(\);[\s\S]*4000/);
});
