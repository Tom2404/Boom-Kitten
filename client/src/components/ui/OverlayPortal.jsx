import { createPortal } from 'react-dom';

/**
 * Render transient game overlays outside the room stacking context.
 * The game room intentionally uses positioned/z-indexed panels; mounting
 * modals at body level prevents those panels from clipping or covering them.
 */
export function OverlayPortal({ children }) {
  if (typeof document === 'undefined') return children;
  return createPortal(children, document.body);
}
