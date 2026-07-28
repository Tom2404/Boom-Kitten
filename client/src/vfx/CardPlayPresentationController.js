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
    }

    /**
     * Initialize with DOM container reference
     */
    init(container, discardPileSyncCallback) {
        this.overlayContainer = container;
        this.discardPileCallback = discardPileSyncCallback;
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
        return { clone, startPos: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } };
    }

    /**
     * Show card in pending state (flying up → center → hold)
     */
    showPending(action) {
        const {
            actionId,
            cardType,
            displayCardType,
            skinIndex = 0,
            sourceElementId,
            title = cardType.replace(/_/g, ' ').toUpperCase(),
            description = '',
        } = action;

        // Check if already active
        if (this.activeActions.has(actionId)) {
            console.warn(`[CardPlayPresentation] Action ${actionId} already active`);
            return;
        }

        // Create visual clone
        const displayType = displayCardType || (cardType?.startsWith('combo_') ? 'cat_taco' : cardType);
        const cloneData = this._createCardClone(sourceElementId || 'player-hand-container', displayType, skinIndex);
        if (!cloneData) return;

        const { clone, startPos } = cloneData;
        this.overlayContainer.appendChild(clone);

        // Initialize action state
        const actionState = {
            state: CARD_PLAY_STATES.IDLE,
            timeline: gsap.timeline(),
            elements: { clone },
            nopeStack: [],
            deferredNopes: [],
            pendingResult: null,
            cardType,
            skinIndex,
            startPos,
        };

        this.activeActions.set(actionId, actionState);
        this._syncDiscardMask(actionId);

        // Transition: IDLE → FLYING_UP
        this._transitionTo(actionId, CARD_PLAY_STATES.FLYING_UP);
        soundManager.play('sfx_card_whoosh');

        // Calculate center position (responsive)
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Calculate focus size (responsive with clamp)
        const viewportMin = Math.min(window.innerWidth, window.innerHeight);
        const focusWidth = Math.max(180, Math.min(280, viewportMin * 0.35));
        const focusHeight = focusWidth * 1.4; // Card aspect ratio

        // Check reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            // REDUCED MOTION: Fade-based flow
            actionState.timeline
                .to(clone, {
                    opacity: 0.3,
                    duration: 0.2,
                    ease: 'power1.out',
                })
                .to(clone, {
                    left: centerX - focusWidth / 2,
                    top: centerY - focusHeight / 2,
                    width: focusWidth,
                    height: focusHeight,
                    opacity: 1,
                    duration: 0.2,
                    ease: 'power2.out',
                    onComplete: () => {
                        this._transitionTo(actionId, CARD_PLAY_STATES.PENDING);
                    },
                });
        } else {
            // NORMAL: Fly-based flow with curved path
            actionState.timeline
                .to(clone, {
                    left: centerX - focusWidth / 2,
                    top: centerY - focusHeight / 2,
                    width: focusWidth,
                    height: focusHeight,
                    scale: 1.0,
                    rotation: 0,
                    duration: 0.3,
                    ease: 'power2.out',
                    onComplete: () => {
                        this._transitionTo(actionId, CARD_PLAY_STATES.PENDING);
                    },
                })
                .to(clone, {
                    scale: 1.1,
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
        const pattern = NOPE_STACK_PATTERN[(nopeIndex - 1) % NOPE_STACK_PATTERN.length];
        const layer = Math.floor((nopeIndex - 1) / NOPE_STACK_PATTERN.length);

        const targetX = mainRect.left + pattern.x + (layer * 4);
        const targetY = mainRect.top + pattern.y + (layer * 3);
        const rotationAngle = pattern.rotation;

        // Animate Nope card flying on top
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            // Fade in
            gsap.fromTo(nopeCard, {
                opacity: 0,
                left: targetX,
                top: targetY - 15,
                width: mainRect.width,
                height: mainRect.height,
            }, {
                opacity: 1,
                left: targetX,
                top: targetY,
                duration: 0.3,
            });
        } else {
            // Fly in with rotation
            gsap.fromTo(nopeCard, {
                left: nopeClone.startPos.x - mainRect.width / 2,
                top: nopeClone.startPos.y - mainRect.height / 2,
                width: mainRect.width * 0.8,
                height: mainRect.height * 0.8,
                rotation: -25,
                opacity: 0,
            }, {
                left: targetX,
                top: targetY,
                width: mainRect.width,
                height: mainRect.height,
                rotation: rotationAngle,
                opacity: 1,
                duration: 0.4,
                ease: 'back.out(1.4)',
            });
        }

        // Store Nope element
        if (!action.elements.nopes) action.elements.nopes = [];
        action.elements.nopes.push(nopeCard);
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

        const holdDuration = nopeCount > 0 ? 0.65 : 0.25;
        const { clone } = action.elements;

        // Show Retro Badge for Action Result (Odd vs Even Chain Nope)
        if (nopeCount > 0) {
            this._triggerScreenRedBorderFlash();
            const badge = document.createElement('div');
            badge.className = 'card-play-nope-stamp';
            const isNoped = !isResolved;
            badge.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-6deg);
        background: ${isNoped ? '#dc2626' : '#059669'};
        color: #ffffff;
        padding: 8px 16px;
        border: 3px solid #0e1211;
        box-shadow: 4px 4px 0px 0px #0e1211;
        font-family: var(--font-headline), 'Space Mono', monospace;
        font-weight: 900;
        font-size: clamp(14px, 2.5vw, 20px);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        white-space: nowrap;
        opacity: 0;
        z-index: 10001;
      `;
            badge.textContent = isNoped ? 'ĐÃ BỊ VÔ HIỆU HÓA!' : 'HÀNH ĐỘNG TIẾP TỤC!';
            clone.appendChild(badge);
            action.elements.nopeStamp = badge;

            gsap.to(badge, {
                opacity: 1,
                scale: 1.05,
                duration: 0.25,
                ease: 'back.out(2)',
            });
        }

        // After hold duration, fly to discard
        action.exitTimer = setTimeout(() => {
            this._flyToDiscard(actionId);
        }, holdDuration * 1000);
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

        const { clone, backdrop, nopes } = action.elements;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Collect all cards to animate (main + nopes)
        const allCards = [clone, ...(nopes || [])];

        if (prefersReducedMotion) {
            // Fade out
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
            const currentRect = clone.getBoundingClientRect();
            const targetLeft = discardX - discardRect.width / 2;
            const targetTop = discardY - discardRect.height / 2;
            const arcLeft = (currentRect.left + targetLeft) / 2 + 56;
            const arcTop = Math.min(currentRect.top, targetTop) - 64;
            const landing = gsap.timeline({
                onComplete: () => {
                    this._cleanup(actionId);
                },
            });

            landing.to(allCards, {
                keyframes: [
                    {
                        left: arcLeft,
                        top: arcTop,
                        rotation: 8,
                        duration: 0.16,
                        ease: 'power1.out',
                    },
                    {
                        left: targetLeft,
                        top: targetTop,
                        width: discardRect.width,
                        height: discardRect.height,
                        rotation: -6,
                        duration: 0.19,
                        ease: 'power2.in',
                    },
                ],
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
