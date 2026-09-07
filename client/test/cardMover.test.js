import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// ponytail: hand-rolled DOM stub because the client has no jsdom. Swap for
// jsdom/happy-dom the day a test needs layout or real event dispatch.
function installDom(sourceRect) {
    const body = { children: [], appendChild(node) { this.children.push(node); node.parentNode = body; } };
    const makeElement = () => {
        const element = {
            children: [],
            style: {},
            dataset: {},
            className: '',
            parentNode: null,
            appendChild(node) { this.children.push(node); node.parentNode = this; return node; },
            remove() {
                if (!this.parentNode) return;
                this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
                this.parentNode = null;
            },
            querySelector: () => null,
            getBoundingClientRect: () => sourceRect,
        };
        return element;
    };

    const source = makeElement();
    globalThis.document = {
        body,
        createElement: makeElement,
        getElementById: (id) => (id === 'deck-pile-element' ? source : null),
    };
    return { body, source };
}

test('createCardGhost anchors the clone on the source rect and detaches on remove', async () => {
    const rect = { left: 120, top: 40, width: 90, height: 130 };
    const { body } = installDom(rect);
    const { createCardGhost } = await import('../src/vfx/cardMover.js');

    const ghost = createCardGhost('deck-pile-element', { cardType: 'skip', faceDown: true, imageUrl: '/skip.png' });

    assert.equal(ghost.element.style.left, '120px');
    assert.equal(ghost.element.style.top, '40px');
    assert.equal(ghost.element.style.width, '90px');
    assert.equal(ghost.element.style.height, '130px');
    assert.equal(ghost.element.className, 'card-play-clone');
    assert.deepEqual(ghost.startPos, { x: 165, y: 105 });
    // Front + back faces so the flip has something to reveal.
    assert.equal(ghost.element.children.length, 2);
    assert.ok(body.children.includes(ghost.element));

    ghost.element.remove();
    assert.ok(!body.children.includes(ghost.element));

    delete globalThis.document;
});

test('exactly one system owns the draw reveal', async () => {
    const factory = fs.readFileSync(new URL('../src/vfx/VFXFactory.js', import.meta.url), 'utf8');
    const { CARD_TIMINGS } = await import('../src/vfx/config/vfxTimings.js');
    const { getDrawRevealMotion } = await import('../src/pages/Game/gameMotion.js');

    // 600-800ms at a large scale is the floor for recognising a card face.
    assert.ok(CARD_TIMINGS.revealHold >= 0.5, 'reveal hold too short to read');
    assert.ok(CARD_TIMINGS.revealScale >= 1.5, 'reveal scale too small to read');

    // DrawReveal.jsx owns the face; the GSAP flight stays face down so the two
    // never render a reveal at the same time.
    assert.doesNotMatch(factory, /revealHold|revealScale|imageUrl/);
    assert.match(factory, /faceDown: true/);
    assert.ok(getDrawRevealMotion(false).holdMs >= CARD_TIMINGS.revealHold * 1000);
});

test('the face-down draw flight finishes before the reveal modal lets go', async () => {
    const { CARD_TIMINGS } = await import('../src/vfx/config/vfxTimings.js');
    const { getDrawRevealMotion } = await import('../src/pages/Game/gameMotion.js');

    // Both start on the same draw event. If the ghost were still flying after the
    // modal exits, the player would see the card land twice.
    const flight = CARD_TIMINGS.anticipation
        + CARD_TIMINGS.travel
        + CARD_TIMINGS.settle
        + 0.12; // fade out
    assert.ok(
        flight * 1000 < getDrawRevealMotion(false).holdMs,
        `flight ${flight * 1000}ms outlives modal hold ${getDrawRevealMotion(false).holdMs}ms`,
    );

    // Reduced motion collapses the flight but must keep the card readable.
    assert.ok(getDrawRevealMotion(true).holdMs >= 1000);
    assert.equal(CARD_TIMINGS.reduced, 0.01);
});

test('flyCardTo moves ghost center onto target center with compositor-only props', () => {
    const source = fs.readFileSync(new URL('../src/vfx/cardMover.js', import.meta.url), 'utf8');

    // Center-to-center delta, applied as transforms.
    assert.match(source, /const x = currentX \+ target\.x - liveCenter\.x/);
    assert.match(source, /const y = currentY \+ target\.y - liveCenter\.y/);
    assert.match(source, /tl\.to\(element, \{ x, y, scale: endScale, rotation/);
    // Reduced motion shortens the flight, it never cancels it.
    assert.match(source, /motionDuration\(duration\)/);
    assert.doesNotMatch(source, /^\s+(?:left|top|width|height):\s*(?:target|live|arc)/m);
});
