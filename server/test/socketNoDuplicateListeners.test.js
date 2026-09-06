const test = require('node:test');
const assert = require('node:assert');

const registerGameSocket = require('../sockets/gameSocket');

// Regression guard: handlers/index.js once re-registered room:create/join/leave/invite
// that gameSocket.js already owned. socket.on APPENDS, so every room action fired twice
// and the thin duplicate bypassed maintenance mode, room limits and coin checks.
test('no socket event is registered more than once per connection', () => {
    const registered = [];
    const noopTarget = { emit() { } };

    const io = {
        use() { },
        on(event, handler) {
            if (event === 'connection') this._onConnection = handler;
        },
        to: () => noopTarget,
        emit() { },
    };

    registerGameSocket(io);
    assert.ok(io._onConnection, 'registerGameSocket must attach a connection handler');

    const socket = {
        id: 'test-socket',
        handshake: { auth: { guestId: 'guest-test' } },
        join() { },
        emit() { },
        on(event) { registered.push(event); },
    };

    io._onConnection(socket);

    const duplicates = registered.filter((event, i) => registered.indexOf(event) !== i);
    assert.deepStrictEqual([...new Set(duplicates)], [], `duplicate socket listeners: ${duplicates}`);
    assert.ok(registered.length > 10, 'expected the full handler set to be registered');
});
