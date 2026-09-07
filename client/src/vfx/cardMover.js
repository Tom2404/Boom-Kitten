/**
 * cardMover.js — the single FLIP primitive every card flight is built on.
 *
 * Two exports only: make a ghost that sits exactly on top of a real element,
 * then fly it to a target rect. Draw, play, Nope and discard are all this
 * primitive with different parameters.
 */

import gsap from 'gsap';
import { CARD_TIMINGS, isReducedMotion, motionDuration } from './config/vfxTimings.js';

const rectOf = (element) => element?.getBoundingClientRect?.() || null;

const fallbackRect = () => {
    const host = document.getElementById('player-hand-container') || document.body;
    return rectOf(host) || { left: 0, top: 0, width: 0, height: 0 };
};

/**
 * Clone a card into a fixed-position ghost anchored on its source element.
 *
 * ponytail: the caller resolves `imageUrl` (cardSkins.js is a Vite-only module
 * that cannot be imported outside the bundler). Move the lookup in here when
 * card art resolution stops depending on import.meta.glob.
 */
export function createCardGhost(sourceElementId, {
    cardType = '',
    skinIndex = 0,
    faceDown = false,
    imageUrl = null,
    container = null,
} = {}) {
    const sourceElement = sourceElementId ? document.getElementById(sourceElementId) : null;
    const rect = rectOf(sourceElement) || fallbackRect();
    const sourceImage = sourceElement?.querySelector?.('img');
    const frontUrl = imageUrl || sourceImage?.src || null;

    const element = document.createElement('div');
    element.className = 'card-play-clone';
    element.dataset.cardType = cardType;
    element.dataset.skinIndex = String(skinIndex);
    element.style.left = `${rect.left}px`;
    element.style.top = `${rect.top}px`;
    element.style.width = `${rect.width}px`;
    element.style.height = `${rect.height}px`;

    const front = document.createElement('img');
    front.className = 'card-play-clone__face card-play-clone__face--front';
    if (frontUrl) front.src = frontUrl;
    front.alt = '';
    element.appendChild(front);

    let back = null;
    if (faceDown) {
        back = document.createElement('div');
        back.className = 'card-play-clone__face card-play-clone__face--back';
        element.appendChild(back);
    }

    (container || document.body).appendChild(element);

    return {
        element,
        // Legacy alias: existing call sites destructure `clone`.
        clone: element,
        rect,
        faces: { front, back },
        faceDown,
        startPos: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
    };
}

/**
 * Fly a ghost so its center lands on `targetRect`'s center, scaled to fit.
 * Returns a timeline the caller can nest with a position parameter.
 */
export function flyCardTo(ghost, targetRect, {
    duration = CARD_TIMINGS.travel,
    ease = 'power2.out',
    rotation = 0,
    scale = null,
    arc = 0,
    remove = false,
} = {}) {
    const tl = gsap.timeline();
    const element = ghost?.element || ghost;
    if (!element || !targetRect) return tl;

    const currentX = Number(gsap.getProperty(element, 'x')) || 0;
    const currentY = Number(gsap.getProperty(element, 'y')) || 0;
    const currentScale = Number(gsap.getProperty(element, 'scale')) || 1;
    const live = rectOf(element) || ghost.rect;
    const liveCenter = {
        x: live.left + live.width / 2,
        y: live.top + live.height / 2,
    };
    const target = {
        x: targetRect.left + targetRect.width / 2,
        y: targetRect.top + targetRect.height / 2,
    };

    const x = currentX + target.x - liveCenter.x;
    const y = currentY + target.y - liveCenter.y;
    const endScale = scale ?? (targetRect.width && live.width
        ? currentScale * (targetRect.width / live.width)
        : currentScale);

    // An arc reads as a thrown card; a straight line reads as a file manager.
    if (arc && !isReducedMotion()) {
        const half = motionDuration(duration) / 2;
        tl.to(element, {
            x: currentX + (x - currentX) / 2,
            y: currentY + (y - currentY) / 2 - arc,
            scale: (currentScale + endScale) / 2,
            rotation: rotation / 2,
            duration: half,
            ease: 'power1.out',
        }).to(element, {
            x, y, scale: endScale, rotation, duration: half, ease: 'power1.in',
        });
    } else {
        tl.to(element, { x, y, scale: endScale, rotation, duration: motionDuration(duration), ease });
    }
    if (remove) tl.call(() => element.remove());
    return tl;
}
