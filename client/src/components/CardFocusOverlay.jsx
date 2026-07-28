/**
 * CardFocusOverlay.jsx
 * 
 * React component that provides the DOM container for card play presentations.
 * Works with CardPlayPresentationController for visual clone animations.
 * 
 * Usage:
 *   <CardFocusOverlay onDiscardPileSync={handleDiscardSync} />
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { cardPlayPresentation } from '../vfx/CardPlayPresentationController.js';

/**
 * CardFocusOverlay - Container for card play animations
 * 
 * @param {Object} props
 * @param {Function} props.onDiscardPileSync - Callback for hiding/showing discard pile card
 *   Signature: (actionId: string, isHidden: boolean) => void
 */
export default function CardFocusOverlay({ onDiscardPileSync }) {
    const containerRef = useRef(null);

    // Initialize controller with container reference
    useEffect(() => {
        if (containerRef.current) {
            cardPlayPresentation.init(containerRef.current, onDiscardPileSync);
        }

        return () => {
            cardPlayPresentation.clearAll();
        };
    }, [onDiscardPileSync]);

    return (
        <div
            ref={containerRef}
            className="card-focus-overlay"
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 10000,
            }}
            aria-hidden="true"
        />
    );
}

/**
 * Custom hook to access card play presentation API
 * 
 * @returns {Object} Presentation API
 *   - showPending(action): Start card play presentation
 *   - addNope(actionId, nopeAction): Add Nope to stack
 *   - resolve(actionId, result): Resolve action (RESOLVED/CANCELLED)
 *   - clear(actionId): Clear specific action
 *   - clearAll(): Clear all active presentations
 */
export function useCardPlayPresentation() {
    return {
        showPending: useCallback((action) => {
            cardPlayPresentation.showPending(action);
        }, []),
        addNope: useCallback((actionId, nopeAction) => {
            cardPlayPresentation.addNope(actionId, nopeAction);
        }, []),
        resolve: useCallback((actionId, result) => {
            cardPlayPresentation.resolve(actionId, result);
        }, []),
        clear: useCallback((actionId) => {
            cardPlayPresentation.clear(actionId);
        }, []),
        clearAll: useCallback(() => {
            cardPlayPresentation.clearAll();
        }, []),
    };
}
