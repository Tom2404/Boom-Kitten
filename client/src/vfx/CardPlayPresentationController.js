/**
 * CardPlayPresentationController.js
 * 
 * Manages card play presentation flow with state machine and Nope chain stacking.
 * Unified API for showing card actions with proper actionId tracking.
 */

import gsap from 'gsap';
import { getCardImageUrl } from '../utils/cardSkins.js';
import { soundManager } from './SoundManager.js';
import {
    CARD_PLAY_STATES,
    canTransitionPresentation,
    deferNopeUntilPending,
    deferResultUntilPending,
    getCardFanLayout,
    getCardResolutionMotion,
    getDiscardMaskCount,
} from './cardPlayPresentationState.js';

export { CARD_PLAY_STATES } from './cardPlayPresentationState.js';

// ============================================================================
// CARD COLOR MAPPING (from user spec)
// ============================================================================

const CARD_COLORS = {
    skip: '#3b82f6',           // blue
    super_skip: '#6366f1',     // indigo
    attack: '#f97316',         // orange
    attack_2x: '#dc2626',      // red
    target_attack: '#dc2626',  // red
    reverse: '#10b981',        // green
    shuffle: '#a855f7',        // purple
    shuffle_now: '#a855f7',    // purple
    favor: '#eab308',          // yellow
    nope: '#dc2626',           // red
    defuse: '#22c55e',         // bright green
    see_the_future_1: '#a855f7', // purple
    see_the_future_3: '#a855f7', // purple
    see_the_future_5: '#a855f7', // purple
    alter_the_future_3: '#ec4899', // pink
    draw_from_bottom: '#14b8a6', // teal
    bury: '#78716c',           // stone
    // Cats
    cat_taco: '#94a3b8',       // slate
    cat_watermelon: '#94a3b8', // slate
    cat_beard: '#94a3b8',      // slate
    cat_rainbow: '#94a3b8',    // slate
    cat_potato: '#94a3b8',     // slate
    feral_cat: '#059669',      // emerald
    // Special editions
    zombie_kitten: '#065f46',  // dark green
    barking_kitten: '#ca8a04', // yellow-dark
    imploding_kitten: '#7c3aed', // violet
    streaking_kitten: '#fde047', // yellow-light
    godcat: '#eab308',         // gold
    devilcat: '#991b1b',       // dark red
    armageddon: '#b45309',     // amber-dark
    attack_of_the_dead: '#166534', // green-dark
    grave_robber: '#525252',   // neutral
    feed_the_dead: '#064e3b',  // emerald-dark
    dig_deeper: '#a16207',     // yellow-dark
    garbage_collection: '#94a3b8', // slate
    mark: '#0ea5e9',           // sky
    curse_of_the_cat_butt: '#6b21a8', // purple-dark
    catomic_bomb: '#84cc16',   // lime
    clone: '#0d9488',          // teal-dark
    clairvoyance: '#06b6d4',   // cyan
    personal_attack: '#ea580c', // orange-dark
    pot_luck: '#d97706',       // amber
    raising_heck: '#b91c1c',   // red-dark
    reveal_the_future_3x: '#4f46e5', // indigo
    swap_top_and_bottom: '#3b82f6', // blue
    tower_of_power: '#7c3aed', // purple
    ill_take_that: '#6366f1',  // indigo
    // Fallback
    default: '#64748b',        // slate-500
};

/**
 * Get color for card type
 */
function getCardColor(cardType) {
    return CARD_COLORS[cardType] || CARD_COLORS.default;
}

// ============================================================================
// PRESENTATION CONTROLLER CLASS
// ============================================================================

export class CardPlayPresentationController {
    constructor() {
        this.activeActions = new Map(); // actionId → { state, timeline, elements, nopeStack }
        this.overlayContainer = null;
        this.discardPileCallback = null;
        this.resizeListening = false;
    }

    /**
     * Initialize with DOM container reference
     */
    init(container, discardPileSyncCallback) {
        this.overlayContainer = container;
        this.discardPileCallback = discardPileSyncCallback;
        if (!this.resizeListening && typeof window !== 'undefined') {
            window.addEventListener('resize', () => this._recenterHeldActions());
            this.resizeListening = true;
        }
    }

    _recenterHeldActions() {
        this.activeActions.forEach((action) => {
            if (![CARD_PLAY_STATES.PENDING, CARD_PLAY_STATES.RESOLVING].includes(action.state)) return;
            const viewportMin = Math.min(window.innerWidth, window.innerHeight);
            const count = action.cloneEntries.length;
            const focusWidth = count === 1
                ? Math.max(180, Math.min(280, viewportMin * 0.35))
                : Math.max(96, Math.min(220, viewportMin * 0.3, (window.innerWidth * 0.9) / (1 + (count - 1) * 0.24)));
            const focusHeight = focusWidth * 1.4;
            const fan = getCardFanLayout(count);
            action.focusScales = action.cloneEntries.map(({ rect }) => focusWidth / Math.max(1, rect.width));
            action.focusRotations = fan.map(({ rotation }) => rotation);
            gsap.to(action.elements.baseCards, {
                x: (index) => window.innerWidth / 2 + fan[index].x * focusWidth - action.cloneEntries[index].startPos.x,
                y: (index) => window.innerHeight / 2 + fan[index].y * focusHeight - action.cloneEntries[index].startPos.y,
                scale: (index) => action.focusScales[index],
                rotation: (index) => fan[index].rotation,
                duration: 0.15,
                overwrite: true,
            });

            const primaryIndex = Math.floor(count / 2);
            const mainCenterX = window.innerWidth / 2 + fan[primaryIndex].x * focusWidth;
            const mainCenterY = window.innerHeight / 2 + fan[primaryIndex].y * focusHeight;
            (action.nopeEntries || []).forEach((entry) => {
                gsap.to(entry.clone, {
                    x: mainCenterX + entry.pattern.x + entry.layer * 4 - entry.startPos.x,
                    y: mainCenterY + entry.pattern.y + entry.layer * 3 - entry.startPos.y,
                    scale: focusWidth / Math.max(1, entry.rect.width),
                    rotation: entry.pattern.rotation,
                    duration: 0.15,
                    overwrite: true,
                });
            });
        });
    }

    _syncDiscardMask(actionId) {
        const hiddenCount = [...this.activeActions.values()]
            .reduce((total, action) => total + getDiscardMaskCount(action), 0);
        this.discardPileCallback?.(actionId, hiddenCount);
    }

    /**
     * Validate state transition
     */
    _canTransition(currentState, nextState) {
        return canTransitionPresentation(currentState, nextState);
    }

    /**
     * Transition to new state
     */
    _transitionTo(actionId, nextState) {
        const action = this.activeActions.get(actionId);
        if (!action) {
            console.warn(`[CardPlayPresentation] Cannot transition: action ${actionId} not found`);
            return false;
        }

        if (!this._canTransition(action.state, nextState)) {
            console.warn(`[CardPlayPresentation] Invalid transition: ${action.state} → ${nextState}`);
            return false;
        }

        action.state = nextState;
        if (nextState === CARD_PLAY_STATES.PENDING) {
            this._flushDeferred(actionId);
        }
        return true;
    }

    _flushDeferred(actionId) {
        const action = this.activeActions.get(actionId);
        if (!action || action.state !== CARD_PLAY_STATES.PENDING) return;

        const deferredNopes = action.deferredNopes.splice(0);
        deferredNopes.forEach((nopeAction) => this.addNope(actionId, nopeAction));

        if (action.pendingResult) {
            const result = action.pendingResult;
            action.pendingResult = null;
            this.resolve(actionId, result);
        }
    }

    /**
     * Create visual clone of card from hand
     */
    _createCardClone(sourceElementId, cardType, skinIndex = 0) {
        const sourceElement = document.getElementById(sourceElementId);
        let rect = null;
        let cardImageUrl = null;

        const isCardElement = sourceElementId && String(sourceElementId).startsWith('hand-card-');

        if (sourceElement) {
            rect = sourceElement.getBoundingClientRect();
            if (isCardElement) {
                const imgEl = sourceElement.querySelector('img');
                if (imgEl && imgEl.src) {
                    cardImageUrl = imgEl.src;
                }
            }
        }

        if (!rect) {
            const fallbackEl = document.getElementById('player-hand-container') || document.body;
            rect = fallbackEl.getBoundingClientRect();
        }

        if (!cardImageUrl) {
            cardImageUrl = getCardImageUrl(cardType, skinIndex);
        }

        // Create clone container
        const clone = document.createElement('div');
        clone.className = 'card-play-clone';
        clone.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
      z-index: 10000;
      transform-origin: center center;
    `;

        // Create card image
        const img = document.createElement('img');
        img.src = cardImageUrl;
        img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;

        clone.appendChild(img);
        return {
            clone,
            rect,
            startPos: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        };
    }

    /**
     * Show card in pending state (flying up → center → hold)
     */
    showPending(action) {
        const {
            actionId,
            cardType,
            displayCardType,
            displayCards,
            skinIndex = 0,
            sourceElementId,
            restoreAtCenter = false,
            title = cardType.replace(/_/g, ' ').toUpperCase(),
            description = '',
        } = action;

        // Check if already active
        if (this.activeActions.has(actionId)) {
            console.warn(`[CardPlayPresentation] Action ${actionId} already active`);
            return;
        }

        // Create one clone per played card. Regular actions still use one card.
        const displayType = displayCardType || (cardType?.startsWith('combo_') ? 'cat_taco' : cardType);
        const cardsToDisplay = Array.isArray(displayCards) && displayCards.length > 0
            ? displayCards
            : [{ type: displayType, skinIndex, sourceElementId }];
        const cloneEntries = cardsToDisplay.map((card) => this._createCardClone(
            card.sourceElementId || sourceElementId || 'player-hand-container',
            card.type || displayType,
            card.skinIndex ?? skinIndex,
        ));
        const baseCards = cloneEntries.map(({ clone }) => clone);
        const primaryIndex = Math.floor(baseCards.length / 2);
        const clone = baseCards[primaryIndex];
        const startPos = cloneEntries[primaryIndex].startPos;
        baseCards.forEach((cardClone, index) => {
            cardClone.style.zIndex = String(10000 + baseCards.length - Math.abs(index - primaryIndex));
            this.overlayContainer.appendChild(cardClone);
        });

        // Initialize action state
        const actionState = {
            state: CARD_PLAY_STATES.IDLE,
            timeline: gsap.timeline(),
            elements: { clone, baseCards },
            cloneEntries,
            nopeEntries: [],
            nopeStack: [],
            deferredNopes: [],
            pendingResult: null,
            cardType,
            cardCount: baseCards.length,
            skinIndex,
            startPos,
        };

        this.activeActions.set(actionId, actionState);
        this._syncDiscardMask(actionId);

        // Transition: IDLE → FLYING_UP
        this._transitionTo(actionId, CARD_PLAY_STATES.FLYING_UP);
        if (!restoreAtCenter) soundManager.play('sfx_card_whoosh');

        // Calculate center position (responsive)
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Calculate focus size (responsive with clamp)
        const viewportMin = Math.min(window.innerWidth, window.innerHeight);
        const focusWidth = baseCards.length === 1
            ? Math.max(180, Math.min(280, viewportMin * 0.35))
            : Math.max(96, Math.min(
                220,
                viewportMin * 0.3,
                (window.innerWidth * 0.9) / (1 + (baseCards.length - 1) * 0.24),
            ));
        const focusHeight = focusWidth * 1.4; // Card aspect ratio
        const fan = getCardFanLayout(baseCards.length);
        const targetX = (index) => centerX + fan[index].x * focusWidth - cloneEntries[index].startPos.x;
        const targetY = (index) => centerY + fan[index].y * focusHeight - cloneEntries[index].startPos.y;
        const focusScales = cloneEntries.map(({ rect }) => focusWidth / Math.max(1, rect.width));
        actionState.focusScales = focusScales;
        actionState.focusRotations = fan.map(({ rotation }) => rotation);

        // Check reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (restoreAtCenter) {
            gsap.set(baseCards, {
                x: (index) => targetX(index),
                y: (index) => targetY(index),
                scale: (index) => focusScales[index],
                rotation: (index) => fan[index].rotation,
                opacity: 1,
            });
            this._transitionTo(actionId, CARD_PLAY_STATES.PENDING);
        } else if (prefersReducedMotion) {
            // REDUCED MOTION: Fade-based flow
            gsap.set(baseCards, {
                x: (index) => targetX(index),
                y: (index) => targetY(index),
                scale: (index) => focusScales[index],
                rotation: 0,
                opacity: 0,
            });
            actionState.timeline
                .to(baseCards, {
                    opacity: 1,
                    scale: (index) => focusScales[index],
                    stagger: 0.02,
                    duration: 0.2,
                    ease: 'power2.out',
                    onComplete: () => {
                        this._transitionTo(actionId, CARD_PLAY_STATES.PENDING);
                    },
                });
        } else {
            // NORMAL: Fly-based flow with curved path
            actionState.timeline
                .to(baseCards, {
                    x: (index) => targetX(index),
                    y: (index) => targetY(index),
                    scale: (index) => focusScales[index],
                    rotation: (index) => fan[index].rotation,
                    stagger: 0.035,
                    duration: 0.3,
                    ease: 'power2.out',
                    onComplete: () => {
                        this._transitionTo(actionId, CARD_PLAY_STATES.PENDING);
                    },
                })
                .to(baseCards, {
                    scale: (index) => focusScales[index] * 1.08,
                    duration: 0.18,
                    ease: 'power1.inOut',
                }, '-=0.1');
        }

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'card-play-backdrop';
        backdrop.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.25);
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
    `;
        this.overlayContainer.appendChild(backdrop);
        actionState.elements.backdrop = backdrop;

        actionState.timeline.to(backdrop, {
            opacity: 1,
            duration: 0.2,
        }, 0);

        const copy = document.createElement('div');
        copy.className = 'card-play-copy';
        copy.style.cssText = `
      position: absolute;
      left: 50%;
      bottom: -76px;
      width: min(84vw, 320px);
      transform: translateX(-50%);
      color: white;
      text-align: center;
      text-shadow: 0 2px 8px rgba(0,0,0,0.9);
      opacity: 0;
    `;

        const heading = document.createElement('strong');
        heading.textContent = title;
        heading.style.cssText = `
      display: block;
      color: ${getCardColor(cardType)};
      font-family: var(--font-headline), sans-serif;
            font-size: clamp(15px, 3vw, 22px);
      font-weight: 900;
      letter-spacing: 0.06em;
      line-height: 1.1;
      text-transform: uppercase;
    `;
        copy.appendChild(heading);

        if (description) {
            const summary = document.createElement('span');
            summary.textContent = description;
            summary.style.cssText = `
        display: block;
        margin-top: 6px;
        font-family: var(--font-body), sans-serif;
        font-size: clamp(11px, 2vw, 14px);
        font-weight: 700;
        line-height: 1.35;
      `;
            copy.appendChild(summary);
        }

        clone.appendChild(copy);
        actionState.elements.copy = copy;
        actionState.timeline.to(copy, {
            opacity: 1,
            duration: 0.18,
            ease: 'power2.out',
        }, 0.2);
    }

    _triggerScreenRedBorderFlash() {
        const flashEl = document.getElementById('nope-screen-warning-flash');
        if (flashEl) {
            flashEl.classList.remove('is-active');
            void flashEl.offsetWidth; // Force reflow
            flashEl.classList.add('is-active');
        }
    }

    /**
     * Add Nope card to the stack (overlay on top of pending card)
     */
    addNope(actionId, nopeAction) {
        const action = this.activeActions.get(actionId);
        if (!action) {
            console.warn(`[CardPlayPresentation] Cannot add Nope: action ${actionId} not found`);
            return;
        }

        if (deferNopeUntilPending(action, nopeAction)) return;

        if (action.state !== CARD_PLAY_STATES.PENDING) {
            console.warn(`[CardPlayPresentation] Cannot add Nope: action ${actionId} not in PENDING state`);
            return;
        }

        // Deduplication using nopeActionId
        const nopeActionId = nopeAction.nopeActionId || `nope-act-${Date.now()}-${Math.random()}`;
        if (!action.nopeActionIds) action.nopeActionIds = new Set();
        if (action.nopeActionIds.has(nopeActionId)) {
            return; // Already rendered this Nope
        }
        action.nopeActionIds.add(nopeActionId);

        // Add to Nope stack
        action.nopeStack.push(nopeAction);
        this._syncDiscardMask(actionId);

        // Trigger Retro Pixel Screen Red Warning Flash
        this._triggerScreenRedBorderFlash();

        // Create Nope card overlay
        const { clone: mainClone } = action.elements;
        const mainRect = mainClone.getBoundingClientRect();

        const nopeClone = this._createCardClone(
            nopeAction.sourceElementId || 'player-hand-container',
            'nope',
            nopeAction.skinIndex || 0
        );

        if (!nopeClone) return;

        const { clone: nopeCard } = nopeClone;
        this.overlayContainer.appendChild(nopeCard);

        // Calculate bounded stack offset using NOPE_STACK_PATTERN
        const NOPE_STACK_PATTERN = [
            { x: 18, y: 14, rotation: 10 },
            { x: -14, y: 22, rotation: -8 },
            { x: 24, y: -8, rotation: 6 },
            { x: -20, y: -14, rotation: -6 }
        ];

        const nopeIndex = action.nopeStack.length; // 1, 2, 3...
        nopeCard.style.zIndex = String(10100 + nopeIndex);
        const pattern = NOPE_STACK_PATTERN[(nopeIndex - 1) % NOPE_STACK_PATTERN.length];
        const layer = Math.floor((nopeIndex - 1) / NOPE_STACK_PATTERN.length);

        const targetCenterX = mainRect.left + mainRect.width / 2 + pattern.x + (layer * 4);
        const targetCenterY = mainRect.top + mainRect.height / 2 + pattern.y + (layer * 3);
        const targetX = targetCenterX - nopeClone.startPos.x;
        const targetY = targetCenterY - nopeClone.startPos.y;
        const targetScale = mainRect.width / Math.max(1, nopeClone.rect.width);
        const rotationAngle = pattern.rotation;

        // Animate Nope card flying on top
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            // Fade in
            gsap.set(nopeCard, {
                x: targetX,
                y: targetY,
                rotation: 0,
            });
            gsap.fromTo(nopeCard, {
                opacity: 0,
                scale: targetScale * 0.96,
            }, {
                opacity: 1,
                scale: targetScale,
                duration: 0.3,
            });
        } else {
            // Fly in with rotation
            gsap.fromTo(nopeCard, {
                x: 0,
                y: 0,
                scale: targetScale * 0.8,
                rotation: -25,
                opacity: 0,
            }, {
                x: targetX,
                y: targetY,
                scale: targetScale,
                rotation: rotationAngle,
                opacity: 1,
                duration: 0.4,
                ease: 'back.out(1.4)',
            });
        }

        // Store Nope element
        if (!action.elements.nopes) action.elements.nopes = [];
        action.elements.nopes.push(nopeCard);
        action.nopeEntries.push({ ...nopeClone, pattern, layer });
    }

    /**
     * Resolve action (server confirmed RESOLVED)
     */
    resolve(actionId, result) {
        const action = this.activeActions.get(actionId);
        if (!action) {
            console.warn(`[CardPlayPresentation] Cannot resolve: action ${actionId} not found`);
            return;
        }

        if (deferResultUntilPending(action, result)) return;

        if (action.state !== CARD_PLAY_STATES.PENDING) {
            console.warn(`[CardPlayPresentation] Cannot resolve: action ${actionId} not in PENDING state`);
            return;
        }

        const nopeCount = action.nopeStack?.length || 0;
        const isCancelled = result === 'CANCELLED' || (! (result === 'RESOLVED') && nopeCount % 2 === 1);
        const isResolved = result === 'RESOLVED' || (!isCancelled && nopeCount % 2 === 0);
        const nextState = isResolved ? CARD_PLAY_STATES.RESOLVING : CARD_PLAY_STATES.CANCELLED;

        this._transitionTo(actionId, nextState);

        const { clone, baseCards } = action.elements;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const resolutionMotion = getCardResolutionMotion({
            cardType: action.cardType,
            isResolved,
            nopeCount,
            reducedMotion: prefersReducedMotion,
        });

        // Give every resolved action a readable activation beat. Nope chains keep
        // their stronger warning flash while regular cards get a compact stamp.
        if (nopeCount > 0) {
            this._triggerScreenRedBorderFlash();
        }
        const badge = document.createElement('div');
        badge.className = 'card-play-nope-stamp';
        badge.style.cssText = `
	        position: absolute;
	        top: 50%;
	        left: 50%;
	        transform: translate(-50%, -50%) rotate(-6deg);
	        background: ${resolutionMotion.accent};
	        color: #ffffff;
	        padding: 8px 16px;
        border: 3px solid #0e1211;
        box-shadow: 4px 4px 0px 0px #0e1211;
        font-family: var(--font-headline), 'Space Mono', monospace;
        font-weight: 900;
        font-size: clamp(16px, 3vw, 24px);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        white-space: nowrap;
	        opacity: 0;
	        z-index: 10001;
	      `;
        badge.textContent = resolutionMotion.label;
        clone.appendChild(badge);
        action.elements.nopeStamp = badge;

        gsap.timeline()
            .to(baseCards || clone, {
                scale: (index) => (action.focusScales?.[index] || 1) * resolutionMotion.scale,
                rotation: (index) => (action.focusRotations?.[index] || 0) + resolutionMotion.rotation,
                duration: prefersReducedMotion ? 0.01 : 0.18,
                ease: 'back.out(2)',
            }, 0)
            .to(badge, {
                opacity: 1,
                scale: 1.05,
                duration: prefersReducedMotion ? 0.01 : 0.2,
                ease: 'back.out(2)',
            }, 0);

        // After hold duration, fly to discard
        action.exitTimer = setTimeout(() => {
            this._flyToDiscard(actionId);
        }, resolutionMotion.holdSeconds * 1000);
    }

    /**
     * Fly card(s) to discard pile
     */
    _flyToDiscard(actionId) {
        const action = this.activeActions.get(actionId);
        if (!action) return;

        this._transitionTo(actionId, CARD_PLAY_STATES.FLYING_DOWN);

        // Get discard pile position
        const discardElement = document.getElementById('discard-pile-element');
        if (!discardElement) {
            console.warn('[CardPlayPresentation] Discard pile element not found');
            this._cleanup(actionId);
            return;
        }

        const discardRect = discardElement.getBoundingClientRect();
        const discardX = discardRect.left + discardRect.width / 2;
        const discardY = discardRect.top + discardRect.height / 2;

        const { clone, baseCards, backdrop, nopes } = action.elements;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Collect all cards to animate (main + nopes)
        const allCards = [...(baseCards || [clone]), ...(nopes || [])];
        const landingTargets = allCards.map((card, index) => {
            const currentRect = card.getBoundingClientRect();
            const currentScale = Number(gsap.getProperty(card, 'scale')) || 1;
            return {
                x: (Number(gsap.getProperty(card, 'x')) || 0)
                    + discardX - (currentRect.left + currentRect.width / 2),
                y: (Number(gsap.getProperty(card, 'y')) || 0)
                    + discardY - (currentRect.top + currentRect.height / 2),
                scale: currentScale * (discardRect.width / Math.max(1, currentRect.width)),
                rotation: -6 + Math.min(index, 4) * 2,
            };
        });

        if (prefersReducedMotion) {
            gsap.set(allCards, {
                x: (index) => landingTargets[index].x,
                y: (index) => landingTargets[index].y,
                scale: (index) => landingTargets[index].scale,
                rotation: 0,
            });
            gsap.to(allCards, {
                opacity: 0,
                duration: 0.2,
                onComplete: () => {
                    soundManager.play('sfx_card_drop');
                    this._cleanup(actionId);
                },
            });

            gsap.to(backdrop, {
                opacity: 0,
                duration: 0.3,
            });
        } else {
            const landing = gsap.timeline({
                onComplete: () => {
                    this._cleanup(actionId);
                },
            });

            landing.to(allCards, {
                x: (index) => landingTargets[index].x,
                y: (index) => landingTargets[index].y,
                scale: (index) => landingTargets[index].scale,
                rotation: (index) => landingTargets[index].rotation,
                duration: 0.35,
                ease: 'power2.inOut',
                stagger: 0.035,
            }, 0);
            landing.call(() => soundManager.play('sfx_card_drop'), [], 0.35);
            landing.fromTo(discardElement, {
                scale: 1,
            }, {
                scale: 1.08,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: 'power1.out',
            }, 0.35);
            landing.to(allCards, {
                opacity: 0,
                duration: 0.08,
            }, 0.43);

            gsap.to(backdrop, {
                opacity: 0,
                duration: 0.35,
            });
        }
    }

    /**
     * Clean up action (remove DOM elements, clear state)
     */
    _cleanup(actionId) {
        const action = this.activeActions.get(actionId);
        if (!action) return;

        // Kill timeline
        if (action.timeline) {
            action.timeline.kill();
        }
        if (action.exitTimer) clearTimeout(action.exitTimer);

        // Remove all DOM elements
        Object.values(action.elements).forEach((element) => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            } else if (Array.isArray(element)) {
                element.forEach((el) => {
                    if (el && el.parentNode) {
                        el.parentNode.removeChild(el);
                    }
                });
            }
        });

        // Remove from active actions
        this.activeActions.delete(actionId);
        this._syncDiscardMask(actionId);
    }

    /**
     * Clear specific action
     */
    has(actionId) {
        return this.activeActions.has(actionId);
    }

    clear(actionId) {
        this._cleanup(actionId);
    }

    snapActive() {
        [...this.activeActions.entries()].forEach(([actionId, action]) => {
            if (action.state === CARD_PLAY_STATES.FLYING_DOWN) {
                this._cleanup(actionId);
                return;
            }
            action.timeline?.progress(1);
        });
    }

    /**
     * Clear all actions
     */
    clearAll() {
        const actionIds = Array.from(this.activeActions.keys());
        actionIds.forEach((actionId) => this._cleanup(actionId));
    }
}

// Export singleton instance
export const cardPlayPresentation = new CardPlayPresentationController();
