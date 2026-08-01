import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('authenticated room creation forwards every room option unchanged', () => {
  const source = fs.readFileSync(new URL('../src/pages/Game.jsx', import.meta.url), 'utf8');
  const wrapper = source.slice(
    source.indexOf('createRoom:', source.indexOf('const lobbyViewProps')),
    source.indexOf('createRoomIcon,', source.indexOf('const lobbyViewProps')),
  );

  assert.match(wrapper, /createRoom:\s*\(\.\.\.args\)\s*=>/);
  assert.match(wrapper, /createRoom\(\.\.\.args\)/);
});

test('custom field background overrides the final game-stage table background', () => {
  const source = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  const baseBackgroundIndex = source.indexOf('radial-gradient(ellipse at 50% 42%');
  const baseRuleIndex = source.lastIndexOf('.game-stage .game-table-core {', baseBackgroundIndex);
  const customRuleIndex = source.lastIndexOf('.game-stage.game-board--custom-field .game-table-core {');

  assert.ok(baseBackgroundIndex >= 0 && baseRuleIndex >= 0, 'expected the game-stage table background rule');
  assert.ok(customRuleIndex > baseRuleIndex, 'custom field rule must follow the final table background rule');
  assert.match(source.slice(customRuleIndex, source.indexOf('}', customRuleIndex)), /var\(--game-field-image\)/);
});

test('free rooms display a zero bet instead of the paid-room fallback', () => {
  const waitingRoom = fs.readFileSync(
    new URL('../src/pages/Game/views/WaitingRoomView.jsx', import.meta.url),
    'utf8',
  );
  const publicRooms = fs.readFileSync(
    new URL('../src/pages/Game/components/PublicRoomList.jsx', import.meta.url),
    'utf8',
  );

  assert.match(waitingRoom, /\{roomState\.betAmount \?\? 50\}<\/strong>/);
  assert.match(publicRooms, /\{room\.betAmount \?\? 50\}/);
});
